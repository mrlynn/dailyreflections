/**
 * Diagnostic script to check vector search setup and test a search
 * 
 * This script will:
 * 1. Check if embeddings exist in the database
 * 2. Verify embedding dimensions
 * 3. Check the index status
 * 4. Test a vector search query
 * 
 * Run with: node scripts/diagnose-vector-search.js
 */

require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');
const { OpenAI } = require('openai');

const MONGODB_URI = process.env.MONGODB_URI;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DB_NAME = 'dailyreflections';
const COLLECTION_NAME = 'reflections';
const INDEX_NAME = 'reflections_vector_index';

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function diagnoseVectorSearch() {
  console.log('🔍 Vector Search Diagnostic Tool');
  console.log('='.repeat(60));
  
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in .env.local');
    process.exit(1);
  }
  
  if (!OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in .env.local');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // 1. Check if reflections exist
    const totalCount = await collection.countDocuments();
    console.log(`\n📊 Total reflections: ${totalCount}`);

    // 2. Check if reflections have embeddings
    const withEmbeddings = await collection.countDocuments({ embedding: { $exists: true } });
    console.log(`📊 Reflections with embeddings: ${withEmbeddings}`);

    if (withEmbeddings === 0) {
      console.error('\n❌ No reflections have embeddings!');
      console.log('Run: npm run clean-reflections');
      process.exit(1);
    }

    // 3. Check embedding dimensions
    const sample = await collection.findOne(
      { embedding: { $exists: true } },
      { projection: { embedding: 1, title: 1, month: 1, day: 1 } }
    );

    if (sample && sample.embedding) {
      const dimensions = Array.isArray(sample.embedding) ? sample.embedding.length : 0;
      console.log(`\n📐 Sample embedding dimensions: ${dimensions}`);
      
      if (dimensions !== 1536) {
        console.warn(`⚠️  Expected 1536 dimensions (text-embedding-3-small), but found ${dimensions}`);
      } else {
        console.log('✅ Embedding dimensions are correct');
      }
      
      // Check if embedding is an array of numbers
      if (Array.isArray(sample.embedding)) {
        const isValid = sample.embedding.every(val => typeof val === 'number');
        console.log(`✅ Embedding format is valid: ${isValid ? 'Yes' : 'No'}`);
      }
    }

    // 4. Try to list indexes (this may not work for Atlas Search indexes)
    console.log('\n📑 Checking indexes...');
    try {
      const indexes = await collection.indexes();
      console.log(`Found ${indexes.length} regular indexes`);
      indexes.forEach(idx => {
        console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
      });
      
      // Note: Vector search indexes are managed separately in Atlas
      console.log('\n⚠️  Vector search indexes are managed in MongoDB Atlas UI');
      console.log('   Index name should be:', INDEX_NAME);
    } catch (err) {
      console.log('Could not list indexes (normal for Atlas Search)');
    }

    // 5. Test generating an embedding
    console.log('\n🧠 Testing embedding generation...');
    const testQuery = 'acceptance and surrender';
    try {
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: testQuery,
      });
      const testEmbedding = embeddingResponse.data[0].embedding;
      console.log(`✅ Generated embedding: ${testEmbedding.length} dimensions`);
      
      // 6. Test vector search pipeline
      console.log('\n🔍 Testing vector search pipeline...');
      console.log(`Query: "${testQuery}"`);
      
      const pipeline = [
        {
          $vectorSearch: {
            index: INDEX_NAME,
            path: 'embedding',
            queryVector: testEmbedding,
            numCandidates: 100,
            limit: 10,
          },
        },
        {
          $project: {
            _id: 1,
            title: 1,
            month: 1,
            day: 1,
            score: { $meta: 'vectorSearchScore' },
          },
        },
        {
          $limit: 5,
        },
      ];

      console.log('Executing pipeline...');
      const results = await collection.aggregate(pipeline).toArray();
      
      console.log(`\n✅ Vector search completed`);
      console.log(`Results found: ${results.length}`);
      
      if (results.length > 0) {
        console.log('\n📋 Top Results:');
        results.forEach((result, i) => {
          console.log(`\n[${i + 1}] ${result.title}`);
          console.log(`   Date: ${String(result.month).padStart(2, '0')}-${String(result.day).padStart(2, '0')}`);
          console.log(`   Score: ${result.score?.toFixed(4) || 'N/A'}`);
        });
        
        // Check if scores are reasonable (between 0 and 1 for cosine similarity)
        const scores = results.map(r => r.score).filter(s => s != null);
        if (scores.length > 0) {
          const minScore = Math.min(...scores);
          const maxScore = Math.max(...scores);
          console.log(`\n📊 Score range: ${minScore.toFixed(4)} - ${maxScore.toFixed(4)}`);
          
          if (minScore < 0 || maxScore > 1) {
            console.warn('⚠️  Scores are outside expected range (0-1 for cosine similarity)');
          }
        }
      } else {
        console.warn('\n⚠️  No results returned - possible issues:');
        console.warn('   1. Vector search index might not be built yet');
        console.warn('   2. Index name might be incorrect');
        console.warn('   3. Embedding dimensions might not match index definition');
        console.warn('   4. minScore filter might be too high');
        
        // Try without score filter to see if we get any results
        console.log('\n🔍 Testing without score filter...');
        const noFilterPipeline = [
          {
            $vectorSearch: {
              index: INDEX_NAME,
              path: 'embedding',
              queryVector: testEmbedding,
              numCandidates: 100,
              limit: 10,
            },
          },
          {
            $project: {
              _id: 1,
              title: 1,
              score: { $meta: 'vectorSearchScore' },
            },
          },
        ];
        
        const noFilterResults = await collection.aggregate(noFilterPipeline).toArray();
        console.log(`Results without filter: ${noFilterResults.length}`);
        
        if (noFilterResults.length > 0) {
          console.log('✅ Vector search works! The issue is likely with the score filter.');
          console.log('Top result score:', noFilterResults[0].score);
        }
      }
    } catch (embedError) {
      console.error('❌ Error testing embeddings:', embedError.message);
      if (embedError.message.includes('index')) {
        console.error('\n💡 Possible solutions:');
        console.error('   1. Check if index name is correct:', INDEX_NAME);
        console.error('   2. Verify index is built in MongoDB Atlas');
        console.error('   3. Check index definition matches embedding dimensions');
      }
      throw embedError;
    }

    console.log('\n✅ Diagnostic completed');
    
  } catch (error) {
    console.error('\n❌ Diagnostic failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.close();
  }
}

diagnoseVectorSearch().catch(console.error);

