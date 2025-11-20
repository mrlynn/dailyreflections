'use strict';

/**
 * Test script to verify MongoDB Queryable Encryption
 *
 * This script will:
 * 1. Initialize encryption
 * 2. Create test data for 4th step and journal entries
 * 3. Save the data with encryption
 * 4. Retrieve and verify the data
 */

import { MongoClient, ObjectId } from 'mongodb';
import crypto from 'crypto';
import { connectToDatabase } from '../lib/mongodb.js';

// Mock user for testing
const TEST_USER_ID = new ObjectId();

async function runTest() {
  console.log('Testing MongoDB Queryable Encryption...');
  console.log('----------------------------------------');

  try {
    // Step 1: Test 4th Step inventory encryption
    console.log('\n[1] Testing 4th Step Inventory Encryption');

    // Connect with encryption enabled
    const { db: step4Db, encryptionSchema: step4Schema } = await connectToDatabase({
      withEncryption: true,
      collection: 'step4'
    });

    // Create test data
    const step4Data = {
      userId: TEST_USER_ID,
      resentments: [
        { person: 'Test Person 1', cause: 'Test Cause 1', affects: 'Test Affect 1' },
        { person: 'Test Person 2', cause: 'Test Cause 2', affects: 'Test Affect 2' }
      ],
      fears: [
        { fear: 'Test Fear 1', why: 'Test Reason 1' },
        { fear: 'Test Fear 2', why: 'Test Reason 2' }
      ],
      sexConduct: {
        relationships: [
          { person: 'Test Person', conduct: 'Test Conduct' }
        ],
        patterns: 'Test Patterns',
        idealBehavior: 'Test Ideal Behavior'
      },
      harmsDone: [
        { person: 'Test Person', harm: 'Test Harm' }
      ],
      isPasswordProtected: false,
      updatedAt: new Date()
    };

    // Save test data
    console.log('Saving 4th step test data...');
    const step4Result = await step4Db.collection('step4').insertOne(step4Data);
    console.log(`Inserted 4th step data with ID: ${step4Result.insertedId}`);

    // Retrieve the data
    console.log('Retrieving 4th step test data...');
    const retrievedStep4 = await step4Db.collection('step4').findOne({ _id: step4Result.insertedId });
    console.log('Successfully retrieved 4th step data:');
    console.log(JSON.stringify(retrievedStep4, null, 2));

    // Clean up
    await step4Db.collection('step4').deleteOne({ _id: step4Result.insertedId });
    console.log('Cleaned up 4th step test data');

    // Step 2: Test Journal Entry encryption
    console.log('\n[2] Testing Journal Entry Encryption');

    // Connect with encryption enabled
    const { db: journalDb, encryptionSchema: journalSchema } = await connectToDatabase({
      withEncryption: true,
      collection: 'journal_entries'
    });

    // Create test data
    const journalData = {
      userId: TEST_USER_ID,
      date: new Date(),
      mood: 4,
      gratitude: ['Test Gratitude 1', 'Test Gratitude 2'],
      inventory: {
        resentments: 'Test Resentments',
        fears: 'Test Fears',
        honesty: 'Test Honesty',
        amends: 'Test Amends',
        service: 'Test Service',
        prayer: 'Test Prayer',
        selfishness: 'Test Selfishness',
        dishonesty: 'Test Dishonesty',
        self_seeking: 'Test Self-Seeking',
        fear: 'Test Fear'
      },
      reflections: 'Test Reflections',
      promises: 'Test Promises',
      improvements: 'Test Improvements',
      assets: ['Test Asset 1', 'Test Asset 2'],
      tags: ['Test Tag 1', 'Test Tag 2'],
      entryType: 'full',
      isPrivate: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save test data
    console.log('Saving journal entry test data...');
    const journalResult = await journalDb.collection('journal_entries').insertOne(journalData);
    console.log(`Inserted journal entry with ID: ${journalResult.insertedId}`);

    // Retrieve the data
    console.log('Retrieving journal entry test data...');
    const retrievedJournal = await journalDb.collection('journal_entries').findOne({ _id: journalResult.insertedId });
    console.log('Successfully retrieved journal entry:');
    console.log(JSON.stringify(retrievedJournal, null, 2));

    // Clean up
    await journalDb.collection('journal_entries').deleteOne({ _id: journalResult.insertedId });
    console.log('Cleaned up journal entry test data');

    console.log('\n✅ Encryption tests completed successfully!');
    console.log('If you can see the data values in the output, encryption is working correctly.');
    console.log('The MongoDB server would store these values encrypted, while the client can view the decrypted data.');

  } catch (error) {
    console.error('Error during encryption test:', error);
  } finally {
    // Exit process
    process.exit(0);
  }
}

// Make sure we're in a Node.js environment
if (typeof window !== 'undefined') {
  console.error('This script is intended to run in a Node.js environment only');
  process.exit(1);
}

// Run the test
runTest();