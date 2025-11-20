# Integrated RAG System: Daily Reflections + AA Big Book

This directory contains tools and scripts to integrate the AA Big Book content with the existing Daily Reflections RAG (Retrieval Augmented Generation) system. The integration enables the chatbot to search and reference both sources when answering user queries.

## Overview

The integrated system:
- Searches across both the Daily Reflections and AA Big Book content
- Uses OpenAI embeddings for consistency across both sources
- Intelligently routes queries to the appropriate source based on content
- Provides enhanced prompts for different query types
- Cites sources properly in responses

## Directory Structure

- `/rag/files/`: Contains the AA Big Book content and processing scripts
  - `aa_chunks_token_based.json`: 512-token chunks of the AA Big Book
  - `aa_chunks_large.json`: 1024-token chunks for broader context
  - `aa_chunks_paragraph.json`: Paragraph-based chunks for natural boundaries
  - `1_generate_openai_embeddings.py`: Script to generate OpenAI embeddings
  - `2_ingest_to_dailyreflections.py`: Script to ingest chunks into MongoDB
  - `3_vector_search_index_modified.json`: Vector search index configuration
  - `test_combined_rag.js`: Test script for the integrated system

## Integration Steps

### 1. Generate OpenAI Embeddings

First, generate OpenAI embeddings for the AA Big Book chunks:

```bash
cd rag/files
python 1_generate_openai_embeddings.py
```

This script:
- Loads chunks from `aa_chunks_token_based.json`
- Generates embeddings using OpenAI's `text-embedding-3-small` model
- Adds a source field set to `'AA Big Book 4th Edition'`
- Saves the result to `aa_chunks_with_openai_embeddings.json`

### 2. Ingest Data into MongoDB

Next, ingest the chunks into the Daily Reflections MongoDB database:

```bash
python 2_ingest_to_dailyreflections.py
```

This script:
- Connects to the existing `dailyreflections` database
- Removes any existing AA Big Book chunks
- Inserts the new chunks into the `text_chunks` collection
- Creates indexes for improved query performance

### 3. Create Vector Search Index

In MongoDB Atlas:

1. Go to your cluster → Search → Create Search Index
2. Choose "JSON Editor"
3. Paste the contents of `3_vector_search_index_modified.json`
4. Name it "text_vector_index"
5. Create the index

The index configuration is set to:
- Use the embedding field (1536 dimensions)
- Enable filtering by page_number, source, and chunk_id
- Use cosine similarity for semantic search

### 4. Enhance Prompt Engineering

The enhanced prompt system in `chatbotSearch_enhanced.js`:

- Categorizes search results by source
- Formats context differently for Big Book vs. Daily Reflection content
- Detects different query intents:
  - Requests about today's reflection
  - Requests for meaning/explanation
  - Queries about the Big Book specifically
  - Queries about specific Steps or Traditions
- Provides tailored instructions based on query intent

### 5. Test the System

Run the test script to verify the integrated system:

```bash
node rag/files/test_combined_rag.js
```

This script tests:
- Various query types targeting different content sources
- Both standard and enhanced prompting strategies
- Response quality and citation accuracy

## Query Types

The integrated system handles several query types:

1. **Daily Reflection queries**:
   - "What does today's reflection mean?"
   - "Explain yesterday's reflection"
   - "What is the reflection for January 1?"

2. **AA Big Book queries**:
   - "What are the 12 steps?"
   - "How does the Big Book define alcoholism?"
   - "What does Step 3 mean?"

3. **General recovery queries**:
   - "How do I deal with resentment?"
   - "What is a spiritual awakening?"
   - "How can I make amends?"

4. **Mixed content queries**:
   - "What do the reflections and Big Book say about humility?"
   - "Compare the first step with today's reflection"

## Performance Considerations

- MongoDB Vector Search uses the same index for both collections
- Embedding generation adds a one-time processing overhead
- Response generation time is similar to the existing system
- MongoDB Atlas free tier (512MB) can handle the combined data

## Maintenance

To update the AA Big Book content:
1. Replace the chunk files with updated versions
2. Run the embedding generation script
3. Run the ingestion script
4. Verify the vector search index is working properly

## Future Improvements

Potential enhancements:
1. Add filtering options to focus on specific sources
2. Create a unified embedding generation pipeline
3. Add step-specific and tradition-specific indexes
4. Implement caching for common queries
5. Create a feedback mechanism to improve results

## Integration with UI

The existing UI already supports citations from multiple sources. The integrated system will provide additional citation types for AA Big Book content that will appear in the citation panel.