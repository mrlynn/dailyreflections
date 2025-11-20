// Test script for Step 9 feature
import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Convert ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dailyreflections';
const COMPONENTS_PATH = path.join(__dirname, '..', 'src', 'components', 'Step9');
const API_PATH = path.join(__dirname, '..', 'src', 'app', 'api', 'step9');
const MODEL_PATH = path.join(__dirname, '..', 'src', 'lib', 'models', 'Step9.js');

// Main function
async function testStep9Feature() {
  console.log('Starting Step 9 feature test...');

  // Test 1: Check if all required files exist
  console.log('\n--- Testing File Structure ---');
  const requiredFiles = [
    { path: MODEL_PATH, name: 'Step9 Model' },
    { path: path.join(API_PATH, 'route.js'), name: 'Main API Endpoint' },
    { path: path.join(API_PATH, 'entries', 'route.js'), name: 'Entries API' },
    { path: path.join(API_PATH, 'entries', '[entryId]', 'route.js'), name: 'Individual Entry API' },
    { path: path.join(API_PATH, 'stats', 'route.js'), name: 'Stats API' },
    { path: path.join(COMPONENTS_PATH, 'Step9Header.js'), name: 'Step9Header Component' },
    { path: path.join(COMPONENTS_PATH, 'AmendsMakingForm.js'), name: 'AmendsMakingForm Component' },
    { path: path.join(COMPONENTS_PATH, 'AmendsList.js'), name: 'AmendsList Component' },
    { path: path.join(COMPONENTS_PATH, 'AmendsStats.js'), name: 'AmendsStats Component' },
    { path: path.join(COMPONENTS_PATH, 'Step9Guide.js'), name: 'Step9Guide Component' },
    { path: path.join(__dirname, '..', 'src', 'app', 'step9', 'page.js'), name: 'Step9 Page' }
  ];

  let allFilesExist = true;

  for (const file of requiredFiles) {
    const exists = fs.existsSync(file.path);
    console.log(`${exists ? '✅' : '❌'} ${file.name} ${exists ? 'exists' : 'is missing'}`);
    if (!exists) {
      allFilesExist = false;
    }
  }

  if (!allFilesExist) {
    console.error('❌ Some files are missing. Please check the implementation.');
  } else {
    console.log('✅ All required files exist');
  }

  // Test 2: Validate database model
  console.log('\n--- Testing Database Model ---');
  try {
    // Load the model
    const Step9Model = (await import(MODEL_PATH)).default;

    console.log('✅ Step9 model successfully loaded');

    // Check schema structure
    const schemaKeys = Object.keys(Step9Model.schema.paths);
    const requiredFields = ['userId', 'startedAt', 'status', 'amendsEntries', 'progress'];

    const missingFields = requiredFields.filter(field => !schemaKeys.includes(field));

    if (missingFields.length > 0) {
      console.error(`❌ Schema is missing required fields: ${missingFields.join(', ')}`);
    } else {
      console.log('✅ Schema has all required fields');
    }

    // Check if amendsEntries is an array with the right structure
    if (Step9Model.schema.paths.amendsEntries && Step9Model.schema.paths.amendsEntries.schema) {
      const entrySchemaKeys = Object.keys(Step9Model.schema.paths.amendsEntries.schema.paths);
      const requiredEntryFields = ['person', 'harmDone', 'amendStatus', 'priority'];

      const missingEntryFields = requiredEntryFields.filter(field => !entrySchemaKeys.includes(field));

      if (missingEntryFields.length > 0) {
        console.error(`❌ Entry schema is missing required fields: ${missingEntryFields.join(', ')}`);
      } else {
        console.log('✅ Entry schema has all required fields');
      }
    } else {
      console.error('❌ amendsEntries is not properly defined as an array with schema');
    }
  } catch (error) {
    console.error('❌ Failed to validate database model:', error);
  }

  // Test 3: Check navigation integration
  console.log('\n--- Testing Navigation Integration ---');
  try {
    const navConfigPath = path.join(__dirname, '..', 'src', 'components', 'Navigation', 'navConfig.js');
    const navConfigContent = fs.readFileSync(navConfigPath, 'utf8');

    if (navConfigContent.includes('9th Step Making Amends') &&
        navConfigContent.includes('href: \'/step9\'')) {
      console.log('✅ Step9 is correctly integrated into navigation');
    } else {
      console.error('❌ Step9 is not properly added to navigation');
    }
  } catch (error) {
    console.error('❌ Failed to check navigation integration:', error);
  }

  console.log('\n--- Test Summary ---');
  console.log('Step 9 feature implementation test completed.');
  console.log('Please manually test the functionality in the browser to ensure everything works correctly.');
  console.log('Visit http://localhost:3000/step9 to see the Step 9 page');
}

// Run the test
testStep9Feature().catch(console.error);