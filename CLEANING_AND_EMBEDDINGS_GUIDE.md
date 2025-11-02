# Reflection Cleaning & Embeddings Guide

## Overview

This guide explains how to clean HTML from reflections, normalize text, and generate embeddings for vector search capabilities.

## Quick Start

### 1. Add OpenAI API Key

Add to `.env.local`:
```env
OPENAI_API_KEY=sk-your-api-key-here
```

### 2. Run the Cleaning Script

Test first with dry run:
```bash
npm run clean-reflections:dry
```

Then run for real:
```bash
npm run clean-reflections
```

### 3. Create Vector Search Index

Run the helper script to get the index definition:
```bash
node scripts/create-vector-index.js
```

Then create the index in MongoDB Atlas UI:
1. Go to **Atlas** → **Search** → **Create Search Index**
2. Select **JSON Editor**
3. Paste the configuration from the script
4. Create the index

## What Gets Updated

Each reflection document will have:
- `comment`: Cleaned text (HTML removed, normalized)
- `commentCleaned`: Boolean flag (`true`)
- `embedding`: Array of 1536 numbers (vector for semantic search)
- `cleanedAt`: Timestamp

## Using Vector Search

### API Endpoint

```bash
POST /api/reflections/search
Content-Type: application/json

{
  "query": "powerlessness over alcohol",
  "limit": 10
}
```

### Example Usage

```javascript
const response = await fetch('/api/reflections/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'how to find hope in recovery',
    limit: 5
  })
});

const { results } = await response.json();
// results contains semantically similar reflections
```

## Features

✅ **HTML Cleaning**: Removes all HTML tags while preserving content
✅ **Text Normalization**: Fixes broken symbols, whitespace, formatting
✅ **Meaning Preservation**: Does NOT rewrite or paraphrase - keeps original meaning
✅ **Embedding Generation**: Creates vectors for semantic search
✅ **Backward Compatible**: Component handles both cleaned and legacy HTML content

## Cost

Estimated cost for 365 reflections:
- Text cleaning: ~$0.20-0.50
- Embeddings: ~$0.01-0.02
- **Total: ~$0.25-0.55**

## Documentation

- **Detailed Guide**: `scripts/README_CLEANING.md`
- **Script**: `scripts/clean-and-embed-reflections.js`
- **Vector Index Helper**: `scripts/create-vector-index.js`
- **Search API**: `src/app/api/reflections/search/route.js`

