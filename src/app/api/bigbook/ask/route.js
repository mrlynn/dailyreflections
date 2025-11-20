import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import {
  getBigBookCollections,
  BIG_BOOK_EDITION_ID,
  BIG_BOOK_EDITION_LABEL,
  BIG_BOOK_VECTOR_INDEX,
  createSearchSnippet,
  dedupeSources,
  getChapterForPageNumber,
  normalizeVectorResult,
} from '@/lib/bigbook/service';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
const RESPONSE_MODEL = process.env.OPENAI_RESPONSE_MODEL || 'gpt-4o-mini';
const MAX_CONTEXT_CHUNKS = 6;
const MIN_RESULTS_THRESHOLD = 2;

const SUICIDE_KEYWORDS = [
  'suicide',
  'kill myself',
  'kill ourselves',
  'end my life',
  'want to die',
  'hurt myself',
  'self harm',
  'overdose',
  'take my life',
];

const CRISIS_TEMPLATE = `I’m really sorry you’re facing this. You’re not alone, and there’s immediate help available right now.

If you’re in the United States, you can call or text 988 to reach the Suicide & Crisis Lifeline any time.

If you’re outside the U.S., visit https://findahelpline.com to locate the closest support in your country.

If you can, reach out to someone you trust—your sponsor, a fellow member, or a loved one. You deserve help and care right away.`;

function parsePageNumber(value) {
  if (value === undefined || value === null) return null;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return null;
  return parsed;
}

function containsCrisisLanguage(text) {
  if (!text) return false;
  const normalized = text.toLowerCase();
  return SUICIDE_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

async function generateEmbedding(question) {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: question,
  });
  return response.data[0].embedding;
}

async function runVectorSearch(vectors, embedding, options = {}) {
  const { pageNumber, limit = MAX_CONTEXT_CHUNKS } = options;

  const baseFilter = { editionId: BIG_BOOK_EDITION_ID };
  if (pageNumber) {
    baseFilter.pageNumber = pageNumber;
  }

  const pipeline = [
    {
      $vectorSearch: {
        index: BIG_BOOK_VECTOR_INDEX,
        path: 'embedding',
        queryVector: embedding,
        numCandidates: pageNumber ? 40 : 200,
        limit,
        filter: baseFilter,
      },
    },
    {
      $project: {
        pageId: 1,
        pageNumber: 1,
        chapterTitle: 1,
        text: 1,
        score: { $meta: 'vectorSearchScore' },
      },
    },
  ];

  try {
    const docs = await vectors.aggregate(pipeline).toArray();
    return docs.map(normalizeVectorResult);
  } catch (error) {
    console.error('Big Book vector search failed:', error);
    return [];
  }
}

function buildSystemPrompt() {
  return [
    'You are an Alcoholics Anonymous Big Book companion.',
    'Only use the provided Big Book context to guide your answer; never invent content.',
    'Explain ideas in the Big Book clearly and respectfully without rewriting or altering the original meaning.',
    'Reference the specific page numbers you draw from (e.g., "On page 84...").',
    'Encourage the reader to connect with their sponsor, attend meetings, and seek professional help when relevant.',
    'Do not provide medical, legal, or diagnostic advice.',
    'If the context does not contain the answer, say so and invite the user to read the referenced sections.',
  ].join(' ');
}

function buildUserPrompt(question, contextEntries, pageNumber) {
  const editionHeader = `Edition: ${BIG_BOOK_EDITION_LABEL} (ID: ${BIG_BOOK_EDITION_ID})`;
  const focusHint = pageNumber
    ? `Focus first on helping with printed page ${pageNumber}.`
    : 'Use the most relevant passages to answer.';

  const contextText = contextEntries
    .map(
      (entry, idx) =>
        `Context ${idx + 1} — Page ${entry.pageNumber}${entry.chapterTitle ? ` (${entry.chapterTitle})` : ''}:\n${entry.text}`,
    )
    .join('\n\n');

  return [
    editionHeader,
    focusHint,
    'Context passages:',
    contextText || '[No context was retrieved]',
    '\nUser question:',
    question.trim(),
  ].join('\n\n');
}

function buildSources(contextEntries) {
  return dedupeSources(
    contextEntries
      .map((entry) => ({
        pageNumber: entry.pageNumber,
        chapterTitle: entry.chapterTitle || getChapterForPageNumber(entry.pageNumber)?.title || null,
        snippet: createSearchSnippet(entry.text, ''),
      }))
      .filter((entry) => entry.pageNumber),
  ).map((entry) => ({
    pageNumber: entry.pageNumber,
    chapterTitle: entry.chapterTitle,
  }));
}

export async function POST(request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured.' },
        { status: 500 },
      );
    }

    const body = await request.json();
    const question = (body?.question || '').toString().trim();
    const pageNumber = parsePageNumber(body?.pageNumber);

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required.' },
        { status: 400 },
      );
    }

    if (containsCrisisLanguage(question)) {
      return NextResponse.json({
        answer: CRISIS_TEMPLATE,
        sources: [],
        crisis: true,
      });
    }

    const embedding = await generateEmbedding(question);
    const { vectors, pages } = await getBigBookCollections();

    let vectorResults = await runVectorSearch(vectors, embedding, {
      pageNumber,
      limit: MAX_CONTEXT_CHUNKS,
    });

    if (vectorResults.length < MIN_RESULTS_THRESHOLD) {
      const fallbackResults = await runVectorSearch(vectors, embedding, {
        limit: MAX_CONTEXT_CHUNKS,
      });

      const combined = [...vectorResults, ...fallbackResults];
      vectorResults = dedupeSources(combined);
    }

    if (!vectorResults.length) {
      return NextResponse.json({
        answer:
          'I could not find a relevant passage in the Big Book for that question. You may want to consult the table of contents or discuss it with your sponsor.',
        sources: [],
      });
    }

    const pageNumbers = Array.from(
      new Set(vectorResults.map((result) => result.pageNumber)),
    );

    const pageDocs = await pages
      .find({
        editionId: BIG_BOOK_EDITION_ID,
        pageNumber: { $in: pageNumbers },
      },
      {
        projection: {
          pageNumber: 1,
          chapterTitle: 1,
        },
      })
      .toArray();

    const chapterMap = new Map(
      pageDocs.map((doc) => [doc.pageNumber, doc.chapterTitle]),
    );

    const contextForPrompt = vectorResults.slice(0, MAX_CONTEXT_CHUNKS).map((result) => ({
      ...result,
      chapterTitle: result.chapterTitle || chapterMap.get(result.pageNumber) || null,
    }));

    const completion = await openai.chat.completions.create({
      model: RESPONSE_MODEL,
      temperature: 0.4,
      max_tokens: 600,
      messages: [
        {
          role: 'system',
          content: buildSystemPrompt(),
        },
        {
          role: 'user',
          content: buildUserPrompt(question, contextForPrompt, pageNumber),
        },
      ],
    });

    const answer = completion.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      return NextResponse.json({
        answer:
          'I’m not able to form an answer right now. Please try again or consult the text directly.',
        sources: buildSources(contextForPrompt),
      });
    }

    return NextResponse.json({
      answer,
      sources: buildSources(contextForPrompt),
      crisis: false,
    });
  } catch (error) {
    console.error('Error handling Big Book ask request:', error);
    return NextResponse.json(
      { error: 'Failed to process your question.' },
      { status: 500 },
    );
  }
}


