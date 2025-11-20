# AA Twelve Steps and Twelve Traditions RAG Integration

This directory contains scripts to integrate the "Twelve Steps and Twelve Traditions" book into the Daily Reflections RAG (Retrieval Augmented Generation) chatbot system.

## Files Overview

1. `1_extract_pdf_text.py` - Extract text from the PDF and create structured text and JSON files
2. `2_chunk_text.py` - Create token-based and paragraph-based chunks from the extracted text
3. `3_generate_embeddings.py` - Generate OpenAI text-embedding-3-small embeddings for the chunks
4. `4_ingest_to_mongodb.py` - Ingest the chunks with embeddings into MongoDB

## Steps to Run

1. **Extract text from PDF**
   ```bash
   python 1_extract_pdf_text.py
   ```
   This will create:
   - `12_12_text.txt` - Full extracted text
   - `12_12_pages.json` - Text organized by page with metadata

2. **Create text chunks**
   ```bash
   python 2_chunk_text.py
   ```
   This will create:
   - `12_12_chunks_token_based.json` - Chunks based on token size (512 tokens)
   - `12_12_chunks_paragraph.json` - Chunks based on natural paragraphs

3. **Generate embeddings**
   ```bash
   python 3_generate_embeddings.py
   ```
   This will create:
   - `12_12_chunks_with_embeddings.json` - Chunks with OpenAI embeddings

4. **Ingest into MongoDB**
   ```bash
   python 4_ingest_to_mongodb.py
   ```
   This will upload the chunks to the MongoDB database used by the chatbot.

## MongoDB and Vector Search Integration

The chunks are stored in the same `text_chunks` collection as the Big Book content. This allows the existing RAG system to search across both sources without modification.

The existing vector search index should continue to work, but you may need to verify that it correctly indexes the new embeddings. If needed, update the vector search index in MongoDB Atlas.

## Testing the Integration

After completing these steps, the chatbot should be able to answer questions about both the Big Book and the Twelve Steps and Twelve Traditions. Test with questions like:

- "What are the Twelve Steps?"
- "Can you explain the Third Tradition?"
- "What is the spiritual principle behind the Seventh Step?"

## Requirements

- Python 3.8+
- OpenAI API key in `.env.local`
- MongoDB connection string in `.env.local`
- PyPDF for PDF text extraction
- NLTK for sentence tokenization
- pymongo for MongoDB connection
- dotenv for environment variable loading