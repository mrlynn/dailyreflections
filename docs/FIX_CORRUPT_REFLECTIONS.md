# Fix Corrupt Reflections

## Overview

This script identifies and fixes reflections where the `comment` field contains cleaning instructions instead of the actual reflection content. This corruption can occur if the cleaning script accidentally saves the prompt instead of the cleaned result.

## Usage

### List Corrupt Reflections

```bash
npm run fix-corrupt:list
```

Lists all corrupt reflections without making any changes.

### Fix a Specific Date

```bash
npm run fix-corrupt:date -- --date 03-03
```

Fixes the reflection for a specific date (MM-DD format).

### Fix All Corrupt Reflections

```bash
npm run fix-corrupt:all
```

Fixes all corrupt reflections that have manual fixes available.

### Dry Run

Add `--dry-run` to any command to see what would be fixed without making changes:

```bash
npm run fix-corrupt -- --date 03-03 --dry-run
```

## How It Works

1. **Identifies Corrupt Reflections**: Looks for patterns like "INSTRUCTIONS:", "Remove ALL HTML tags", etc. in the comment field
2. **Checks for Manual Fixes**: Looks up correct content from the `manualFixes` object in the script
3. **Updates Database**: Replaces corrupt content with correct content
4. **Flags the Fix**: Adds `fixedFromCorrupt: true` and `fixedAt` timestamp

## Adding Manual Fixes

To add fixes for more corrupt reflections, edit `scripts/fix-corrupt-reflections.js` and add entries to the `manualFixes` object:

```javascript
const manualFixes = {
  '03-03': {
    title: 'OVERCOMING SELF-WILL',
    quote: 'So our troubles, we think, are basically of our own making...',
    reference: 'ALCOHOLICS ANONYMOUS, p. 62',
    comment: 'For so many years my life revolved solely around myself...'
  },
  'MM-DD': {
    // Add more fixes here
  }
};
```

## After Fixing

After fixing corrupt reflections, you should:

1. **Regenerate Embeddings**: Run the cleaning script to regenerate embeddings for fixed reflections:
   ```bash
   npm run clean-reflections
   ```

2. **Verify**: Check the reflection in the app to ensure it displays correctly

## Example Output

```
🔌 Connecting to MongoDB...
📚 Fetching reflections...

📊 Found 379 total reflection(s)
⚠️  Found 1 corrupt reflection(s)

Corrupt reflections:
  - 03-03: OVERCOMING SELF-WILL 
    Comment: INSTRUCTIONS: 1. Remove ALL HTML tags...

🔧 Fixing: 03-03 - OVERCOMING SELF-WILL 
  Current comment (first 100 chars): INSTRUCTIONS: 1. Remove ALL HTML tags...
  Correct comment (first 100 chars): For so many years my life revolved...
  ✅ Fixed in database

============================================================
📊 FIX SUMMARY
============================================================
✅ Successfully fixed: 1
⏭️  Skipped (no manual fix): 0
❌ Failed: 0
```

## Detection Patterns

The script identifies corrupt reflections by checking for these patterns in the comment field:

- `INSTRUCTIONS:`
- `Remove ALL HTML tags`
- `Fix broken symbols or corrupted characters`
- `PRESERVE the original meaning`
- `Return ONLY the cleaned text`
- `You are a text cleaning assistant`

## Future Enhancements

Potential improvements:
- Load manual fixes from a JSON file
- Use OpenAI to regenerate content from title/quote/reference if available
- Backup corrupt content before fixing
- Batch import fixes from a CSV or JSON file

