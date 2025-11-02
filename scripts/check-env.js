/**
 * Quick script to check if required environment variables are set
 * Run with: node scripts/check-env.js
 */

require('dotenv').config({ path: '.env.local' });

const required = {
  'MONGODB_URI': process.env.MONGODB_URI,
  'NEXTAUTH_URL': process.env.NEXTAUTH_URL,
  'NEXTAUTH_SECRET': process.env.NEXTAUTH_SECRET,
};

const optional = {
  'GOOGLE_CLIENT_ID': process.env.GOOGLE_CLIENT_ID,
  'GOOGLE_CLIENT_SECRET': process.env.GOOGLE_CLIENT_SECRET,
  'OPENAI_API_KEY': process.env.OPENAI_API_KEY,
};

console.log('🔍 Environment Variables Check\n');
console.log('='.repeat(60));

let missingRequired = false;

console.log('\n✅ Required Variables:');
Object.entries(required).forEach(([key, value]) => {
  if (value) {
    console.log(`  ✅ ${key}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`  ❌ ${key}: MISSING`);
    missingRequired = true;
  }
});

console.log('\n📋 Optional Variables:');
Object.entries(optional).forEach(([key, value]) => {
  if (value) {
    console.log(`  ✅ ${key}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`  ⚠️  ${key}: Not set (optional)`);
  }
});

if (missingRequired) {
  console.log('\n❌ MISSING REQUIRED VARIABLES');
  console.log('\nAdd these to your .env.local file:');
  
  if (!process.env.NEXTAUTH_URL) {
    console.log('\nNEXTAUTH_URL=http://localhost:3001  # Change port if different');
  }
  
  if (!process.env.NEXTAUTH_SECRET) {
    console.log('\nNEXTAUTH_SECRET=your-generated-secret-here');
    console.log('\nGenerate a secret with:');
    console.log('  openssl rand -base64 32');
  }
  
  if (!process.env.MONGODB_URI) {
    console.log('\nMONGODB_URI=mongodb+srv://...');
  }
  
  process.exit(1);
} else {
  console.log('\n✅ All required variables are set!');
  process.exit(0);
}

