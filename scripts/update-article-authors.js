import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';

dotenv.config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB || 'dailyreflections';

if (!uri) {
  console.error('❌ MONGODB_URI is not defined. Please set it in .env.local');
  process.exit(1);
}

const AUTHOR_NAME = 'Michael Lynn';
const AUTHOR_ID = '69076ac87b1fc698109f7c64';

async function updateArticleAuthors() {
  console.log('🔄 Starting article author update...');
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('🔌 Connected to MongoDB');

    const db = client.db(databaseName);
    const collection = db.collection('resources');

    // Find all articles
    const articles = await collection.find({
      resourceType: 'article',
    }).toArray();

    console.log(`📚 Found ${articles.length} articles to update`);

    if (articles.length === 0) {
      console.log('ℹ️  No articles found. Nothing to update.');
      await client.close();
      process.exit(0);
    }

    let updatedCount = 0;
    let skippedCount = 0;

    for (const article of articles) {
      const currentMetadata = article.metadata || {};
      const currentAuthorName = currentMetadata.authorName;

      // Skip if already has the correct author name
      if (currentAuthorName === AUTHOR_NAME) {
        skippedCount++;
        console.log(`⏭️  Skipped "${article.title}" - already has correct author`);
        continue;
      }

      // Prepare metadata update - preserve existing metadata
      const updatedMetadata = {
        ...currentMetadata,
        authorName: AUTHOR_NAME,
        authorId: AUTHOR_ID,
      };

      // Update the article
      const result = await collection.updateOne(
        { _id: article._id },
        {
          $set: {
            metadata: updatedMetadata,
            updatedAt: new Date(),
            updatedBy: new ObjectId(AUTHOR_ID),
          },
        }
      );

      if (result.modifiedCount > 0) {
        updatedCount++;
        console.log(`✅ Updated "${article.title}"`);
        if (currentAuthorName) {
          console.log(`   Changed author from "${currentAuthorName}" to "${AUTHOR_NAME}"`);
        } else {
          console.log(`   Set author to "${AUTHOR_NAME}"`);
        }
      }
    }

    console.log('\n📊 Update Summary:');
    console.log(`   ✅ Updated: ${updatedCount} articles`);
    console.log(`   ⏭️  Skipped: ${skippedCount} articles (already correct)`);
    console.log(`   📝 Total: ${articles.length} articles`);

    if (updatedCount > 0) {
      console.log(`\n✨ Successfully updated ${updatedCount} article(s) with author "${AUTHOR_NAME}"`);
    } else {
      console.log('\n✨ All articles already have the correct author information');
    }
  } catch (error) {
    console.error('❌ Error updating article authors:', error);
    process.exitCode = 1;
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the update
updateArticleAuthors()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

