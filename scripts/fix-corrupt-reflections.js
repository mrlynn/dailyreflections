#!/usr/bin/env node
/**
 * Fix Corrupt Reflections Script
 * 
 * This script identifies and fixes reflections where the comment field
 * contains cleaning instructions instead of the actual reflection content.
 * 
 * Usage:
 *   node scripts/fix-corrupt-reflections.js [options]
 * 
 * Options:
 *   --dry-run              Show what would be fixed without making changes
 *   --date MM-DD           Fix a specific date only
 *   --all                  Fix all corrupt reflections
 *   --list                 List corrupt reflections without fixing
 */

import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import { Command } from 'commander';

// Load environment variables
dotenv.config({ path: '.env.local' });

const program = new Command();

program
  .name('fix-corrupt-reflections')
  .description('Fix corrupt reflections in the database')
  .option('-d, --date <dateKey>', 'Fix specific date (MM-DD format)')
  .option('-a, --all', 'Fix all corrupt reflections')
  .option('-l, --list', 'List corrupt reflections without fixing')
  .option('--dry-run', 'Show what would be fixed without making changes')
  .version('1.0.0');

program.parse(process.argv);
const options = program.opts();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'dailyreflections';
const COLLECTION_NAME = 'reflections';

/**
 * Check if a reflection is corrupt
 * Corrupt reflections have the comment field containing cleaning instructions
 */
function isCorrupt(reflection) {
  const comment = reflection.comment || '';
  
  // Check for common patterns that indicate corruption
  const corruptPatterns = [
    /^INSTRUCTIONS:/i,
    /Remove ALL HTML tags/i,
    /Fix broken symbols or corrupted characters/i,
    /PRESERVE the original meaning/i,
    /Return ONLY the cleaned text/i,
    /You are a text cleaning assistant/i,
  ];
  
  return corruptPatterns.some(pattern => pattern.test(comment));
}

/**
 * Get correct content for a specific reflection
 * This can be expanded with a data file or API call
 */
function getCorrectContent(dateKey) {
  // Manual fixes - can be expanded with a JSON file
  const manualFixes = {
    '03-03': {
      title: 'OVERCOMING SELF-WILL',
      quote: 'So our troubles, we think, are basically of our own making. They arise out of ourselves, and the alcoholic is an extreme example of self-will run riot, though he usually doesn\'t think so. Above everything, we alcoholics must be rid of this selfishness. We must, or it kills us!',
      reference: 'ALCOHOLICS ANONYMOUS, p. 62',
      comment: 'For so many years my life revolved solely around myself. I was consumed with self in all forms—self-centeredness, self-pity, self-seeking, all of which stemmed from pride. Today I have been given the gift, through the Fellowship of Alcoholics Anonymous, of practicing the Steps and Traditions in my daily life, of my group and sponsor, and the capacity—if I so choose—to put my pride aside in all situations which arise in my life. Until I could honestly look at myself and see that I was the problem in many situations and react appropriately inside and out; until I could discard my expectations and understand that my serenity was directly proportional to them, I could not experience serenity and sound sobriety.'
    }
  };
  
  return manualFixes[dateKey] || null;
}

/**
 * Fix a corrupt reflection
 */
async function fixReflection(reflection, client, dryRun = false) {
  const { _id, month, day } = reflection;
  const dateKey = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  
  console.log(chalk.blue(`\n🔧 Fixing: ${dateKey} - ${reflection.title}`));
  
  // Try to get correct content
  const correctContent = getCorrectContent(dateKey);
  
  if (!correctContent) {
    console.log(chalk.yellow(`  ⚠️  No manual fix available for ${dateKey}`));
    console.log(chalk.yellow(`  Please add correct content to the manualFixes object in the script`));
    return { success: false, dateKey, reason: 'No manual fix available' };
  }
  
  // Show what will be fixed
  console.log(chalk.gray(`  Current comment (first 100 chars): ${(reflection.comment || '').substring(0, 100)}...`));
  console.log(chalk.green(`  Correct comment (first 100 chars): ${correctContent.comment.substring(0, 100)}...`));
  
  if (!dryRun) {
    try {
      const db = client.db(DB_NAME);
      
      // Update the reflection with correct content
      const updateData = {
        comment: correctContent.comment,
        quote: correctContent.quote || reflection.quote,
        reference: correctContent.reference || reflection.reference,
        title: correctContent.title || reflection.title,
        commentCleaned: true,
        fixedAt: new Date(),
        fixedFromCorrupt: true
      };
      
      await db.collection(COLLECTION_NAME).updateOne(
        { _id },
        { $set: updateData }
      );
      
      console.log(chalk.green(`  ✅ Fixed in database`));
      
      // Regenerate embedding if needed
      if (reflection.embedding) {
        console.log(chalk.yellow(`  ⚠️  Note: Embedding may need regeneration. Run clean-and-embed-reflections.js`));
      }
      
      return { success: true, dateKey };
    } catch (error) {
      console.error(chalk.red(`  ❌ Error fixing reflection: ${error.message}`));
      return { success: false, dateKey, error: error.message };
    }
  } else {
    console.log(chalk.yellow(`  ⚠️  DRY RUN - Would fix in database`));
    return { success: true, dateKey, dryRun: true };
  }
}

/**
 * Main function
 */
async function main() {
  if (!MONGODB_URI) {
    console.error(chalk.red('❌ Error: MONGODB_URI not found in .env.local'));
    process.exit(1);
  }
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log(chalk.blue('🔌 Connecting to MongoDB...'));
    await client.connect();
    const db = client.db(DB_NAME);
    
    let query = {};
    
    // Build query based on options
    if (options.date) {
      if (!options.date.match(/^\d{2}-\d{2}$/)) {
        console.error(chalk.red('Error: Date must be in MM-DD format'));
        process.exit(1);
      }
      const [month, day] = options.date.split('-').map(Number);
      query = { month, day };
    }
    
    // Fetch reflections
    console.log(chalk.blue('📚 Fetching reflections...'));
    const reflections = await db.collection(COLLECTION_NAME).find(query).toArray();
    
    // Identify corrupt reflections
    const corruptReflections = reflections.filter(isCorrupt);
    
    console.log(chalk.blue(`\n📊 Found ${reflections.length} total reflection(s)`));
    console.log(chalk.yellow(`⚠️  Found ${corruptReflections.length} corrupt reflection(s)\n`));
    
    if (corruptReflections.length === 0) {
      console.log(chalk.green('✅ No corrupt reflections found!'));
      await client.close();
      process.exit(0);
    }
    
    // List corrupt reflections
    console.log(chalk.yellow('Corrupt reflections:'));
    corruptReflections.forEach(reflection => {
      const dateKey = `${String(reflection.month).padStart(2, '0')}-${String(reflection.day).padStart(2, '0')}`;
      const commentPreview = (reflection.comment || '').substring(0, 80);
      console.log(chalk.red(`  - ${dateKey}: ${reflection.title || 'No title'}`));
      console.log(chalk.gray(`    Comment: ${commentPreview}...`));
    });
    
    if (options.list) {
      console.log(chalk.blue('\n📋 List mode - no fixes applied'));
      await client.close();
      process.exit(0);
    }
    
    if (!options.all && !options.date) {
      console.log(chalk.yellow('\n⚠️  Use --all to fix all corrupt reflections, or --date MM-DD to fix a specific one'));
      await client.close();
      process.exit(0);
    }
    
    if (options.dryRun) {
      console.log(chalk.yellow('\n⚠️  DRY RUN MODE - No changes will be saved\n'));
    }
    
    // Fix corrupt reflections
    const results = {
      success: [],
      failed: [],
      skipped: []
    };
    
    for (const reflection of corruptReflections) {
      const result = await fixReflection(reflection, client, options.dryRun);
      
      if (result.success) {
        results.success.push(result);
      } else if (result.reason === 'No manual fix available') {
        results.skipped.push(result);
      } else {
        results.failed.push(result);
      }
    }
    
    // Summary
    console.log(chalk.blue('\n' + '='.repeat(60)));
    console.log(chalk.blue('📊 FIX SUMMARY'));
    console.log(chalk.blue('='.repeat(60)));
    console.log(chalk.green(`✅ Successfully fixed: ${results.success.length}`));
    console.log(chalk.yellow(`⏭️  Skipped (no manual fix): ${results.skipped.length}`));
    console.log(chalk.red(`❌ Failed: ${results.failed.length}`));
    
    if (results.skipped.length > 0) {
      console.log(chalk.yellow('\n⏭️  Skipped reflections (add manual fixes):'));
      results.skipped.forEach(({ dateKey }) => {
        console.log(chalk.yellow(`  - ${dateKey}`));
      });
    }
    
    if (results.failed.length > 0) {
      console.log(chalk.red('\n❌ Failed reflections:'));
      results.failed.forEach(({ dateKey, error }) => {
        console.log(chalk.red(`  - ${dateKey}: ${error}`));
      });
    }
    
    if (options.dryRun) {
      console.log(chalk.yellow('\n⚠️  DRY RUN MODE - No changes were saved'));
      console.log(chalk.yellow('Run without --dry-run to apply fixes'));
    } else if (results.success.length > 0) {
      console.log(chalk.green('\n✅ Fixes have been saved to the database'));
      console.log(chalk.yellow('💡 Consider running clean-and-embed-reflections.js to regenerate embeddings'));
    }
    
    await client.close();
    process.exit(0);
  } catch (error) {
    console.error(chalk.red('\n❌ Fatal error:'), error);
    await client.close();
    process.exit(1);
  }
}

// Run the script
main();

