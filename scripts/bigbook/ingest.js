/**
 * Ingest the consolidated AA Big Book PDF into MongoDB.
 *
 * Usage:
 *   node scripts/bigbook/ingest.js
 *   node scripts/bigbook/ingest.js --skip-embeddings
 *   node scripts/bigbook/ingest.js --limit 50      # parse only first 50 printed pages (debug)
 *   node scripts/bigbook/ingest.js --dry-run       # parse without touching MongoDB
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import ora from 'ora';
import chalk from 'chalk';
import crypto from 'crypto';
import { MongoClient } from 'mongodb';
import { OpenAI } from 'openai';

import {
  BIG_BOOK_CHAPTERS,
  BIG_BOOK_COPYRIGHT_NOTICE,
  BIG_BOOK_EDITION_ID,
  BIG_BOOK_EDITION_LABEL,
  BIG_BOOK_VECTOR_INDEX,
} from '../../src/lib/bigbook/config.js';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const args = process.argv.slice(2);
const skipEmbeddings = args.includes('--skip-embeddings');
const dryRun = args.includes('--dry-run');
const limitArgIndex = args.indexOf('--limit');
const limit = limitArgIndex > -1 ? Number.parseInt(args[limitArgIndex + 1], 10) : undefined;
const forceReembed = args.includes('--force-embeddings');

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'dailyreflections';
const openaiApiKey = process.env.OPENAI_API_KEY;

if (!uri) {
  console.error(chalk.red('❌ MONGODB_URI is not set. Add it to your .env.local file.'));
  process.exit(1);
}

if (!openaiApiKey && !skipEmbeddings) {
  console.error(chalk.red('❌ OPENAI_API_KEY is not set. Add it to .env.local or pass --skip-embeddings.'));
  process.exit(1);
}

const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const MAX_CHARS_PER_CHUNK = 1200;
const MAX_PARAGRAPHS_PER_CHUNK = 6;

const layoutJsonPath = path.resolve(
  projectRoot,
  'scripts/bigbook/output/bigbook_pages.json',
);
const IMAGE_PUBLIC_PATH = '/bigbook/4th';

function hashText(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function getChapterForPage(pageNumber) {
  return BIG_BOOK_CHAPTERS.find(
    (chapter) => pageNumber >= chapter.startPage && pageNumber <= chapter.endPage,
  );
}

function splitParagraphs(fullText = '') {
  return fullText
    .split(/\n\s*\n/g)
    .map((para) => para.trim())
    .filter(Boolean);
}

function chunkPageContent(paragraphs = []) {
  const paraList = Array.isArray(paragraphs) ? paragraphs : [];
  const chunks = [];
  let currentParas = [];
  let charCount = 0;
  paraList.forEach((paragraph) => {
    const cleanParagraph = paragraph.trim();
    if (!cleanParagraph) {
      return;
    }

    const tentative = charCount + cleanParagraph.length;
    if (
      currentParas.length &&
      (tentative > MAX_CHARS_PER_CHUNK || currentParas.length >= MAX_PARAGRAPHS_PER_CHUNK)
    ) {
      chunks.push(currentParas.join('\n\n'));
      currentParas = [];
      charCount = 0;
    }

    currentParas.push(cleanParagraph);
    charCount += cleanParagraph.length;
  });

  if (currentParas.length) {
    chunks.push(currentParas.join('\n\n'));
  }

  return chunks;
}

async function ensureIndexes(db) {
  const chapters = db.collection('bigbook_chapters');
  const pages = db.collection('bigbook_pages');
  const vectors = db.collection('bigbook_page_vectors');
  const bookmarks = db.collection('user_bigbook_bookmarks');
  const notes = db.collection('user_bigbook_notes');

  await Promise.all([
    chapters.createIndex(
      { editionId: 1, slug: 1 },
      { unique: true, name: 'chapter_by_slug' },
    ),
    pages.createIndex(
      { editionId: 1, pageNumber: 1 },
      { unique: true, name: 'page_by_number' },
    ),
    vectors.createIndex(
      { editionId: 1, pageId: 1, chunkIndex: 1 },
      { unique: true, name: 'vector_chunk_unique' },
    ),
    bookmarks.createIndex(
      { userId: 1, editionId: 1, pageNumber: 1 },
      { unique: true, name: 'bookmark_per_page' },
    ),
    notes.createIndex(
      { userId: 1, editionId: 1, pageNumber: 1, createdAt: -1 },
      { name: 'notes_by_user_page' },
    ),
    notes.createIndex(
      { editionId: 1, pageNumber: 1, createdAt: -1 },
      { name: 'notes_by_page' },
    ),
  ]);

  try {
    await pages.createIndex(
      { fullText: 'text' },
      { name: 'page_text_search' },
    );
  } catch (error) {
    if (error?.code === 85 || error?.codeName === 'IndexOptionsConflict') {
      console.log(chalk.yellow('ℹ️  Rebuilding text index on bigbook_pages.fullText'));
      try {
        await pages.dropIndex('page_text_search');
      } catch (dropError) {
        console.warn('⚠️  Unable to drop existing text index:', dropError.message);
      }
      await pages.createIndex(
        { fullText: 'text' },
        { name: 'page_text_search' },
      );
    } else {
      throw error;
    }
  }
}

async function ensureVectorSearchIndex(db) {
  try {
    const command = {
      createSearchIndex: 'bigbook_page_vectors',
      definition: {
        name: BIG_BOOK_VECTOR_INDEX,
        type: 'vectorSearch',
        definition: {
          fields: [
            {
              type: 'vector',
              path: 'embedding',
              similarity: 'cosine',
              numDimensions: EMBEDDING_DIMENSIONS,
            },
            { type: 'filter', path: 'editionId' },
            { type: 'filter', path: 'pageId' },
            { type: 'filter', path: 'pageNumber' },
          ],
        },
      },
    };

    await db.command(command);
    console.log(chalk.green(`✅ Ensured vector search index "${BIG_BOOK_VECTOR_INDEX}"`));
  } catch (error) {
    if (error?.code === 59 || error?.codeName === 'CommandNotFound') {
      console.warn(
        chalk.yellow(
          'ℹ️  Vector search command not available on this cluster. Ensure the index exists in Atlas if vector search is required.',
        ),
      );
      return;
    }
    if (error.codeName === 'IndexAlreadyExists') {
      console.log(chalk.yellow(`ℹ️  Vector index "${BIG_BOOK_VECTOR_INDEX}" already exists.`));
    } else if (error.message?.includes('already exists')) {
      console.log(chalk.yellow(`ℹ️  Vector index "${BIG_BOOK_VECTOR_INDEX}" already exists.`));
    } else {
      console.warn(
        chalk.yellow(
          `⚠️  Could not create vector search index automatically. Create "${BIG_BOOK_VECTOR_INDEX}" manually in Atlas.`,
        ),
      );
      console.warn(error);
    }
    // Continue even if vector index creation fails (manual setup required for older clusters)
  }
}

async function ingest() {
  console.log(chalk.cyan(`\nAA Big Book Ingestion — ${BIG_BOOK_EDITION_LABEL}\n`));
  console.log(chalk.gray(`Edition ID: ${BIG_BOOK_EDITION_ID}`));
  console.log(chalk.gray(`Layout JSON: ${layoutJsonPath}`));
  console.log(chalk.gray(`Chapters:   ${BIG_BOOK_CHAPTERS.length}`));
  console.log();

  const parseSpinner = ora('Loading layout JSON...').start();
  const layoutRaw = await fs.readFile(layoutJsonPath, 'utf-8');
  const layoutData = JSON.parse(layoutRaw);
  let pages = Array.isArray(layoutData.pages) ? layoutData.pages : [];
  if (limit) {
    pages = pages.slice(0, limit);
  }
  parseSpinner.succeed(`Loaded ${pages.length} printed pages from layout JSON.`);

  if (dryRun) {
    console.log(chalk.yellow('Dry run enabled — skipping database writes.'));
    return;
  }

  const client = new MongoClient(uri, { maxPoolSize: 5 });
  await client.connect();
  const db = client.db(dbName);

  try {
    await ensureIndexes(db);
    await ensureVectorSearchIndex(db);

    const chaptersCollection = db.collection('bigbook_chapters');
    const pagesCollection = db.collection('bigbook_pages');
    const vectorsCollection = db.collection('bigbook_page_vectors');

    const now = new Date();
    const chapterSpinner = ora('Upserting chapter metadata...').start();
    const chapterIdMap = new Map();

    for (const chapter of BIG_BOOK_CHAPTERS) {
      const update = await chaptersCollection.findOneAndUpdate(
        { editionId: BIG_BOOK_EDITION_ID, slug: chapter.slug },
        {
          $set: {
            title: chapter.title,
            order: chapter.order,
            startPage: chapter.startPage,
            endPage: chapter.endPage,
            editionId: BIG_BOOK_EDITION_ID,
            editionLabel: BIG_BOOK_EDITION_LABEL,
            updatedAt: now,
          },
          $setOnInsert: {
            createdAt: now,
          },
        },
        { upsert: true, returnDocument: 'after' },
      );

      let chapterDoc = update.value;
      if (!chapterDoc) {
        chapterDoc = await chaptersCollection.findOne({
          editionId: BIG_BOOK_EDITION_ID,
          slug: chapter.slug,
        });
      }

      if (!chapterDoc?._id) {
        throw new Error(`Failed to upsert chapter "${chapter.slug}"`);
      }

      chapterIdMap.set(chapter.slug, chapterDoc._id);
    }
    // Remove chapters no longer in config
    const configSlugs = BIG_BOOK_CHAPTERS.map((chap) => chap.slug);
    const removeResult = await chaptersCollection.deleteMany({
      editionId: BIG_BOOK_EDITION_ID,
      slug: { $nin: configSlugs },
    });
    if (removeResult.deletedCount) {
      console.log(chalk.yellow(`ℹ️  Removed ${removeResult.deletedCount} stale chapter records.`));
    }
    chapterSpinner.succeed(`Upserted ${chapterIdMap.size} chapter records.`);

    const pagesSpinner = ora('Upserting page content...').start();
    const pagesNeedingEmbeddings = [];
    let updatedPages = 0;

    for (const page of pages) {
      const chapter = getChapterForPage(page.pageNumber);
      const chapterId = chapter ? chapterIdMap.get(chapter.slug) : null;
      const pageHash = hashText(page.fullText || '');
      const paragraphs = splitParagraphs(page.fullText);

      const existing = await pagesCollection.findOne({
        editionId: BIG_BOOK_EDITION_ID,
        pageNumber: page.pageNumber,
      });

      const pageUpdate = await pagesCollection.findOneAndUpdate(
        { editionId: BIG_BOOK_EDITION_ID, pageNumber: page.pageNumber },
        {
          $set: {
            chapterId,
            chapterTitle: chapter?.title ?? null,
            pdfPageIndex: page.pageNumber - 1,
            text: page.fullText,
            fullText: page.fullText,
            html: '',
            anchors: [],
            spans: Array.isArray(page.spans) ? page.spans : [],
            lines: Array.isArray(page.lines) ? page.lines : [],
            pageWidth: page.width || null,
            pageHeight: page.height || null,
            imageUrl: `${IMAGE_PUBLIC_PATH}/${page.image}`,
            layoutSource: page.sourceFile || null,
            contentHash: pageHash,
            editionLabel: BIG_BOOK_EDITION_LABEL,
            copyrightNotice: BIG_BOOK_COPYRIGHT_NOTICE,
            updatedAt: now,
          },
          $setOnInsert: {
            editionId: BIG_BOOK_EDITION_ID,
            pageNumber: page.pageNumber,
            createdAt: now,
          },
        },
        { upsert: true, returnDocument: 'after' },
      );

      updatedPages += 1;

      let storedPage = pageUpdate.value;
      if (!storedPage) {
        storedPage = await pagesCollection.findOne({
          editionId: BIG_BOOK_EDITION_ID,
          pageNumber: page.pageNumber,
        });
      }

      if (!storedPage?._id) {
        throw new Error(`Failed to upsert page ${page.pageNumber}`);
      }

      const contentChanged = existing?.contentHash !== pageHash || forceReembed || !existing;
      pagesNeedingEmbeddings.push({
        pageId: storedPage._id,
        pageNumber: page.pageNumber,
        chapterTitle: storedPage.chapterTitle,
        fullText: page.fullText,
        paragraphs,
        contentChanged,
      });
    }

    pagesSpinner.succeed(`Upserted ${updatedPages} page records.`);

    if (skipEmbeddings) {
      console.log(chalk.yellow('Skipping embeddings per --skip-embeddings flag.'));
    } else {
      const openai = new OpenAI({ apiKey: openaiApiKey });
      const embedSpinner = ora('Generating embeddings...').start();
      let embeddedChunks = 0;

      for (const page of pagesNeedingEmbeddings) {
        const existingVectors = await vectorsCollection
          .find({
            editionId: BIG_BOOK_EDITION_ID,
            pageId: page.pageId,
          })
          .toArray();

        const existingMap = new Map(existingVectors.map((doc) => [doc.chunkIndex, doc]));
        const chunks = chunkPageContent(page.paragraphs);
        const chunkIndexes = new Set();

        for (let index = 0; index < chunks.length; index += 1) {
          const chunkText = chunks[index];
          if (!chunkText.trim()) continue;

          const textHash = hashText(chunkText);
          const existingVector = existingMap.get(index);

          if (
            !forceReembed &&
            existingVector &&
            existingVector.textHash === textHash &&
            !page.contentChanged
          ) {
            chunkIndexes.add(index);
            continue;
          }

          let embedding;
          try {
            const response = await openai.embeddings.create({
              model: EMBEDDING_MODEL,
              input: chunkText,
            });
            embedding = response.data[0].embedding;
          } catch (error) {
            embedSpinner.fail('Embedding generation failed.');
            console.error(error);
            throw error;
          }

          await vectorsCollection.updateOne(
            {
              editionId: BIG_BOOK_EDITION_ID,
              pageId: page.pageId,
              chunkIndex: index,
            },
            {
              $set: {
                pageNumber: page.pageNumber,
                chapterTitle: page.chapterTitle,
                text: chunkText,
                textHash,
                embedding,
                embeddingModel: EMBEDDING_MODEL,
                updatedAt: now,
              },
              $setOnInsert: {
                createdAt: now,
              },
            },
            { upsert: true },
          );

          embeddedChunks += 1;
          chunkIndexes.add(index);
        }

        const indexesToRemove = existingVectors
          .map((doc) => doc.chunkIndex)
          .filter((idx) => !chunkIndexes.has(idx));

        if (indexesToRemove.length) {
          await vectorsCollection.deleteMany({
            editionId: BIG_BOOK_EDITION_ID,
            pageId: page.pageId,
            chunkIndex: { $in: indexesToRemove },
          });
        }
      }

      embedSpinner.succeed(
        embeddedChunks
          ? `Generated embeddings for ${embeddedChunks} chunks.`
          : 'Embeddings already up to date.',
      );
    }

    console.log(chalk.green('\n✅ Big Book ingestion complete.'));
    console.log(chalk.gray(`Edition: ${BIG_BOOK_EDITION_LABEL}`));
    console.log(chalk.gray(`Pages stored: ${pages.length}`));
    console.log(chalk.gray(`Chapters stored: ${BIG_BOOK_CHAPTERS.length}`));
  } finally {
    await client.close();
  }
}

ingest().catch((error) => {
  console.error(chalk.red('\n❌ Ingestion failed.'));
  console.error(error);
  process.exit(1);
});


