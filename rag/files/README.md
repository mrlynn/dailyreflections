# AA Big Book RAG Chatbot - Setup Guide

## Overview
This package contains everything you need to create a RAG (Retrieval Augmented Generation) chatbot for the AA Big Book 4th Edition.

## Files Included

1. **aa_big_book_text.txt** - Full extracted text from the PDF
2. **aa_big_book_pages.json** - Text organized by page with metadata
3. **aa_chunks_token_based.json** - 378 chunks (512 tokens each)
4. **aa_chunks_large.json** - 193 chunks (1024 tokens each)
5. **aa_chunks_paragraph.json** - 193 paragraph-based chunks

## Setup Steps

### Step 1: Install Required Packages
```bash
pip install pymongo sentence-transformers torch
```

### Step 2: Generate Embeddings
Run the script to add embeddings to your chunks:
```bash
python 1_generate_embeddings.py
```

This uses the `all-MiniLM-L6-v2` model (384 dimensions) which is:
- Fast and efficient
- Good for semantic search
- Runs on CPU or GPU

### Step 3: Set Up MongoDB Atlas
1. Create a free MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Get your connection string
4. Create a database called `aa_rag_database`
5. Create a collection called `text_chunks`

### Step 4: Ingest Data
Update the MongoDB URI in `2_ingest_to_mongodb.py` and run:
```bash
python 2_ingest_to_mongodb.py
```

### Step 5: Create Vector Search Index
In MongoDB Atlas:
1. Go to your cluster → Search → Create Search Index
2. Choose "JSON Editor"
3. Copy the contents of `3_vector_search_index.json`
4. Name it "vector_index"
5. Create the index

### Step 6: Query Your RAG System
Use the example in `4_rag_query_example.py` to:
1. Convert user questions to embeddings
2. Search for relevant chunks
3. Pass context to an LLM (GPT-4, Claude, etc.)

## Chunking Strategies

### Token-Based (512 tokens, 50 overlap)
- **Best for**: General purpose, balanced context
- **Chunks**: 378
- **Use when**: Building a general-purpose chatbot

### Large Chunks (1024 tokens, 100 overlap)
- **Best for**: Preserving more context, longer passages
- **Chunks**: 193
- **Use when**: Answers need broader context

### Paragraph-Based
- **Best for**: Maintaining natural text boundaries
- **Chunks**: 193
- **Use when**: Text structure is important

## Model Recommendations

### Embedding Models
- **all-MiniLM-L6-v2** (384 dim) - Fast, good quality
- **all-mpnet-base-v2** (768 dim) - Higher quality, slower
- **multi-qa-MiniLM-L6-cos-v1** (384 dim) - Optimized for Q&A

### LLM for Generation
- **OpenAI GPT-4** - Highest quality
- **Claude 3** - Excellent reasoning
- **GPT-3.5-turbo** - Fast and cost-effective

## Example Queries

```python
# Simple semantic search
query_rag("What are the 12 steps?")

# Specific topics
query_rag("How to make amends to people I've harmed?")

# Philosophical questions
query_rag("What is the spiritual foundation of AA?")
```

## Performance Tips

1. **Adjust numCandidates**: Higher = more accurate but slower
2. **Tune chunk size**: Larger chunks = more context but less precise
3. **Use filters**: Filter by page_number or source for targeted search
4. **Cache embeddings**: Store query embeddings for common questions
5. **Batch processing**: Generate embeddings in batches for speed

## Cost Estimates

- **MongoDB Atlas**: Free tier (512MB storage) is sufficient
- **Embeddings**: Free (local model)
- **LLM API**: ~$0.01-0.05 per query (depends on model)

## Next Steps

1. Test different chunking strategies
2. Experiment with different embedding models
3. Fine-tune retrieval parameters (numCandidates, limit)
4. Add conversation history for multi-turn chat
5. Implement caching for common queries
6. Add metadata filtering (e.g., specific chapters)

## Support

For MongoDB Atlas help: https://www.mongodb.com/docs/atlas/
For embedding models: https://www.sbert.net/

---
Created with extracted text from AA Big Book 4th Edition
