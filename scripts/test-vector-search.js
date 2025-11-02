/**
 * Script to test the vector search functionality
 *
 * Run with: node scripts/test-vector-search.js
 */

const { MongoClient } = require('mongodb');
const { OpenAI } = require('openai');
require('dotenv').config({ path: '.env.local' });

// Configuration
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'dailyreflections';
const indexName = 'reflection_vector_index';
const openaiApiKey = process.env.OPENAI_API_KEY;

// Test queries
const TEST_QUERIES = [
  "Surrendering to a higher power",
  "Finding strength in the fellowship",
  "Dealing with resentment",
  "Living one day at a time",
  "Character defects and humility"
];

// Connect to MongoDB and test vector search
async function testVectorSearch() {
  if (!uri) {
    console.error('❌ MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  if (!openaiApiKey) {
    console.error('❌ OPENAI_API_KEY environment variable is not set');
    process.exit(1);
  }

  console.log('🔍 Testing Vector Search');
  console.log('='.repeat(60));

  try {
    // Initialize MongoDB client
    const client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    // Initialize OpenAI client
    const openai = new OpenAI({ apiKey: openaiApiKey });
    console.log('✅ OpenAI client initialized');

    // Get database and collection
    const db = client.db(dbName);
    const collection = db.collection('reflections');

    // Verify collection has documents
    const docCount = await collection.countDocuments();
    console.log(`📚 Found ${docCount} reflections in the collection`);

    if (docCount === 0) {
      console.error('❌ No reflections found in the collection');
      await client.close();
      process.exit(1);
    }

    // Check for vector index
    const indexes = await db.command({ listSearchIndexes: collection.collectionName });
    const vectorIndex = indexes.cursor.firstBatch.find(idx => idx.name === indexName);

    if (!vectorIndex) {
      console.warn(`⚠️ No search index named '${indexName}' found`);
      console.log('Available search indexes:');
      indexes.cursor.firstBatch.forEach(idx => console.log(`- ${idx.name}`));
    } else {
      console.log(`✅ Found vector index '${indexName}'`);
    }

    // Run test queries
    console.log('\n🧪 Running test queries:');
    console.log('='.repeat(60));

    for (const query of TEST_QUERIES) {
      console.log(`\n📝 Query: "${query}"`);

      try {
        // Generate embedding
        const embeddingResponse = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: query,
        });
        const embedding = embeddingResponse.data[0].embedding;
        console.log(`✅ Generated embedding with ${embedding.length} dimensions`);

        // Search using embedding
        const pipeline = [
          {
            $vectorSearch: {
              index: indexName,
              path: 'embedding',
              queryVector: embedding,
              numCandidates: 100,
              limit: 3,
              score: { $meta: "vectorSearchScore" }
            },
          },
          {
            $project: {
              _id: 0,
              title: 1,
              month: 1,
              day: 1,
              score: { $meta: "vectorSearchScore" }
            },
          },
        ];

        const results = await collection.aggregate(pipeline).toArray();

        if (results.length === 0) {
          console.warn('⚠️ No results found for this query');
        } else {
          console.log(`✅ Found ${results.length} results:`);

          results.forEach((result, i) => {
            const dateFormatted = `${result.month.toString().padStart(2, '0')}-${result.day.toString().padStart(2, '0')}`;
            console.log(`   ${i+1}. ${result.title} (${dateFormatted}) - Score: ${result.score.toFixed(4)}`);
          });
        }
      } catch (error) {
        console.error(`❌ Error searching for "${query}":`, error.message);
      }
    }

    // Test finding similar reflections
    console.log('\n🧩 Testing similar reflection search:');
    console.log('='.repeat(60));

    // Get a random reflection
    const sample = await collection.aggregate([{ $sample: { size: 1 } }]).toArray();
    if (sample.length > 0) {
      const sourceReflection = sample[0];
      const dateKey = `${sourceReflection.month.toString().padStart(2, '0')}-${sourceReflection.day.toString().padStart(2, '0')}`;

      console.log(`\n📅 Source: "${sourceReflection.title}" (${dateKey})`);

      if (!sourceReflection.embedding) {
        console.warn('⚠️ Source reflection has no embedding');
      } else {
        try {
          // Search for similar reflections
          const pipeline = [
            {
              $vectorSearch: {
                index: indexName,
                path: 'embedding',
                queryVector: sourceReflection.embedding,
                numCandidates: 100,
                limit: 5,
                score: { $meta: "vectorSearchScore" }
              },
            },
            {
              $match: {
                $expr: {
                  $and: [
                    { $ne: ["$month", sourceReflection.month] },
                    { $ne: ["$day", sourceReflection.day] }
                  ]
                }
              }
            },
            {
              $project: {
                _id: 0,
                title: 1,
                month: 1,
                day: 1,
                score: { $meta: "vectorSearchScore" }
              },
            },
            {
              $limit: 3
            }
          ];

          const similarResults = await collection.aggregate(pipeline).toArray();

          if (similarResults.length === 0) {
            console.warn('⚠️ No similar reflections found');
          } else {
            console.log(`✅ Found ${similarResults.length} similar reflections:`);

            similarResults.forEach((result, i) => {
              const dateFormatted = `${result.month.toString().padStart(2, '0')}-${result.day.toString().padStart(2, '0')}`;
              console.log(`   ${i+1}. ${result.title} (${dateFormatted}) - Score: ${result.score.toFixed(4)}`);
            });
          }
        } catch (error) {
          console.error('❌ Error finding similar reflections:', error.message);
        }
      }
    }

    await client.close();
    console.log('\n✅ Test completed successfully');
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

// Execute if run directly
if (require.main === module) {
  testVectorSearch().catch(console.error);
}

module.exports = { testVectorSearch };