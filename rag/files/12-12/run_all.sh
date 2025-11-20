#!/bin/bash

# Run all scripts in sequence to process and ingest the Twelve Steps and Twelve Traditions content

# Change to the script directory
cd "$(dirname "$0")"

echo "=============================================================="
echo "🚀 Starting Twelve Steps and Twelve Traditions RAG Integration"
echo "=============================================================="

# Step 1: Extract text from PDF
echo -e "\n📄 Step 1: Extracting text from PDF..."
python3 1_extract_pdf_text.py
if [ $? -ne 0 ]; then
    echo "❌ Error extracting text from PDF. Aborting."
    exit 1
fi

# Step 2: Create text chunks
echo -e "\n📋 Step 2: Creating text chunks..."
python3 2_chunk_text.py
if [ $? -ne 0 ]; then
    echo "❌ Error creating text chunks. Aborting."
    exit 1
fi

# Step 3: Generate embeddings
echo -e "\n🧠 Step 3: Generating embeddings..."
python3 3_generate_embeddings.py
if [ $? -ne 0 ]; then
    echo "❌ Error generating embeddings. Aborting."
    exit 1
fi

# Step 4: Ingest into MongoDB
echo -e "\n💾 Step 4: Ingesting into MongoDB..."
python3 4_ingest_to_mongodb.py
if [ $? -ne 0 ]; then
    echo "❌ Error ingesting into MongoDB. Aborting."
    exit 1
fi

# Step 5: Test the RAG search
echo -e "\n🔍 Step 5: Testing RAG search..."
python3 5_test_rag_search.py
if [ $? -ne 0 ]; then
    echo "❌ Error testing RAG search. Aborting."
    exit 1
fi

echo -e "\n=============================================================="
echo "✅ Twelve Steps and Twelve Traditions RAG Integration Complete"
echo "=============================================================="
echo -e "\nThe chatbot now has access to both the Big Book and the Twelve Steps and Twelve Traditions content!"
echo "You can test it by asking questions about the Twelve Steps and Traditions in the chatbot interface."