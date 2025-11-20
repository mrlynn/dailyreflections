# Reflection Cleaning & Embedding Script

This script processes all daily reflections to:
1. **Clean HTML tags** from the comment field while preserving meaning
2. **Normalize text** (fix broken symbols, whitespace, formatting)
3. **Generate embeddings** for vector search capabilities
4. **Update MongoDB** with cleaned content and embeddings

## Prerequisites

1. **OpenAI API Key**: Required for text cleaning and embedding generation
   - Sign up at https://platform.openai.com/
   - Create an API key
   - Add to `.env.local`: `OPENAI_API_KEY=sk-...`

2. **MongoDB Connection**: Already configured via `MONGODB_URI`

## Setup

Add your OpenAI API key to `.env.local`:

```env
MONGODB_URI=mongodb+srv://...
OPENAI_API_KEY=sk-your-openai-api-key-here
```

## Usage

### Basic Usage

Process all reflections:
```bash
npm run clean-reflections
```

### Dry Run (Test Mode)

Test the script without saving changes:
```bash
npm run clean-reflections:dry
```

### Command Line Options

```bash
# Dry run (no database changes)
node scripts/clean-and-embed-reflections.js --dry-run

# Only process reflections that haven't been cleaned yet
node scripts/clean-and-embed-reflections.js --only-uncleaned

# Limit to first N reflections (useful for testing)
node scripts/clean-and-embed-reflections.js --limit=5

# Combine options
node scripts/clean-and-embed-reflections.js --dry-run --limit=10
```

## What the Script Does

### 1. Text Cleaning
- **Removes HTML tags** (`<p>`, `</p>`, `<br>`, etc.)
- **Fixes broken symbols**: 
  - `&quot;` → `"`
  - `&amp;` → `&`
  - `â€™` → `'`
  - Other corrupted Unicode characters
- **Normalizes whitespace**: Removes extra spaces, fixes line breaks
- **Fixes broken words**: Corrects formatting issues
- **Preserves meaning**: Does NOT rewrite or paraphrase

### 2. Embedding Generation
- Creates vector embeddings using OpenAI's `text-embedding-3-small` model
- Combines: `title + quote + comment + reference` for comprehensive search
- Embedding dimension: 1536
- Stored in `embedding` field in MongoDB

### 3. Database Updates
Each reflection is updated with:
- `comment`: Cleaned text (HTML removed)
- `commentCleaned`: Boolean flag (`true`)
- `embedding`: Array of 1536 numbers (vector embedding)
- `cleanedAt`: Timestamp of when cleaning occurred

## Example Output

```
🧹 Daily Reflections Cleaning & Embedding Script
============================================================
🔌 Connecting to MongoDB...
📚 Fetching reflections...
📊 Found 365 reflections to process

[1/365] Processing reflection 1 of 365...

📖 Processing: 01-08 - DO I HAVE A CHOICE?
  🔄 Cleaning HTML and normalizing text...
  🧠 Generating embedding...
  ✅ Updated in database

[2/365] Processing reflection 2 of 365...
...

📊 PROCESSING COMPLETE
============================================================
✅ Successfully processed: 365
❌ Failed: 0
📝 Total: 365

✅ All changes have been saved to the database
```

## Cost Estimation

### Text Cleaning (GPT-4o-mini)
- Cost: ~$0.15 per 1M input tokens, $0.60 per 1M output tokens
- Average reflection: ~200-500 tokens
- 365 reflections: ~$0.20-0.50

### Embeddings (text-embedding-3-small)
- Cost: $0.02 per 1M tokens
- Average reflection: ~200-500 tokens
- 365 reflections: ~$0.01-0.02

**Total estimated cost: ~$0.25-0.55 for 365 reflections**

## Rate Limiting

The script includes 200ms delays between API calls to respect rate limits:
- OpenAI allows high throughput, but delays prevent overwhelming the API
- If you encounter rate limit errors, increase delays in the script

## Error Handling

- Individual reflection failures don't stop the script
- Failed reflections are logged at the end
- You can re-run with `--only-uncleaned` to process failures

## After Running

### 1. Verify Results

Check a few reflections in MongoDB:
```javascript
db.reflections.findOne({ commentCleaned: true })
```

### 2. Create Vector Search Index

In MongoDB Atlas, create a vector search index:

```json
{
  "mappings": {
    "dynamic": true,
    "fields": {
      "embedding": {
        "type": "knnVector",
        "dimensions": 1536,
        "similarity": "cosine"
      }
    }
  }
}
```

Or use the MongoDB Atlas UI:
1. Go to **Search** → **Create Search Index**
2. Select **JSON Editor**
3. Paste the configuration above
4. Name it: `vector_index`

### 3. Update Your Code

Update `ReflectionCard.js` to use cleaned text instead of HTML:
```javascript
// Before: dangerouslySetInnerHTML
<Box dangerouslySetInnerHTML={{ __html: sanitizedComment }} />

// After: Plain text
<Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
  {reflection.comment}
</Typography>
```

## Troubleshooting

### "OPENAI_API_KEY not found"
- Add `OPENAI_API_KEY=sk-...` to `.env.local`

### "Rate limit exceeded"
- Increase delay between API calls in the script
- Or process in smaller batches with `--limit`

### "Collection not found"
- Make sure you've seeded the database first: `npm run seed`

### Embeddings not working
- Verify the embedding field exists: `db.reflections.findOne({ embedding: { $exists: true } })`
- Ensure vector search index is created in Atlas
- Check embedding dimensions match (1536)

## Vector Search Usage (Future)

Once embeddings are generated and indexed, you can perform semantic search:

```javascript
// Example: Find reflections similar to a query
const query = "powerlessness over alcohol";
const queryEmbedding = await generateEmbedding(query, "", "", "");

const results = await db.collection('reflections').aggregate([
  {
    $vectorSearch: {
      index: 'vector_index',
      path: 'embedding',
      queryVector: queryEmbedding,
      numCandidates: 100,
      limit: 10
    }
  }
]).toArray();
```

