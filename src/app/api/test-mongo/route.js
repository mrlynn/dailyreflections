/**
 * Test endpoint to check MongoDB connection
 */
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Testing MongoDB connection');

    // Test basic connection
    const client = await clientPromise;
    console.log('Client connected successfully');

    // Test database connection
    const db = client.db('dailyreflections');
    console.log('Database connection successful');

    // Test listing collections
    const collections = await db.listCollections().toArray();
    console.log(`Found ${collections.length} collections`);

    // Test simple read operations on key collections
    const results = await Promise.allSettled([
      db.collection('users').countDocuments(),
      db.collection('reflections').countDocuments(),
      db.collection('user_bigbook_bookmarks').countDocuments(),
      db.collection('bigbook_pages').countDocuments()
    ]);

    const counts = {
      users: results[0].status === 'fulfilled' ? results[0].value : 'Failed',
      reflections: results[1].status === 'fulfilled' ? results[1].value : 'Failed',
      bookmarks: results[2].status === 'fulfilled' ? results[2].value : 'Failed',
      bigbook_pages: results[3].status === 'fulfilled' ? results[3].value : 'Failed'
    };

    console.log('Collection counts:', counts);

    // Test creating a temporary document
    const testId = new ObjectId();
    const testResult = await db.collection('_temp_tests').insertOne({
      _id: testId,
      message: 'Test document',
      timestamp: new Date()
    });
    console.log('Test document created:', testResult.acknowledged);

    // Clean up test document
    if (testResult.acknowledged) {
      const deleteResult = await db.collection('_temp_tests').deleteOne({ _id: testId });
      console.log('Test document deleted:', deleteResult.deletedCount === 1);
    }

    return NextResponse.json({
      success: true,
      message: 'MongoDB connection test successful',
      collections: collections.map(c => c.name),
      counts
    });

  } catch (error) {
    console.error('MongoDB connection test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}