#!/usr/bin/env python
"""
Ingest Twelve Steps and Twelve Traditions chunks with embeddings into MongoDB
Uses the same MongoDB database as the main application
"""

import os
from pymongo import MongoClient
import json
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# MongoDB configuration
MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = 'dailyreflections'
COLLECTION_NAME = 'text_chunks'  # Use the same collection as the Big Book

# Input file
INPUT_EMBEDDINGS_PATH = "12_12_chunks_with_embeddings.json"

def ingest_to_mongodb():
    """
    Ingest chunks with embeddings into MongoDB
    """
    print("🔍 Ingesting Twelve Steps and Twelve Traditions chunks into MongoDB...")

    # Ensure MongoDB URI is available
    if not MONGODB_URI:
        print("❌ Error: MONGODB_URI not found in environment variables")
        return False

    # Ensure input file exists
    if not os.path.exists(INPUT_EMBEDDINGS_PATH):
        print(f"❌ Error: Input file not found at {INPUT_EMBEDDINGS_PATH}")
        return False

    try:
        # Load chunks with embeddings
        with open(INPUT_EMBEDDINGS_PATH, 'r', encoding='utf-8') as f:
            chunks = json.load(f)

        print(f"📚 Loaded {len(chunks)} chunks with embeddings")

        # Connect to MongoDB
        client = MongoClient(MONGODB_URI)
        db = client[DB_NAME]
        collection = db[COLLECTION_NAME]

        # Check if chunks already exist
        existing_count = collection.count_documents({"source": "AA Twelve Steps and Twelve Traditions"})
        if existing_count > 0:
            print(f"⚠️ Found {existing_count} existing 12&12 chunks in MongoDB")
            user_input = input("Delete existing chunks and reimport? (y/n): ").strip().lower()

            if user_input == 'y' or user_input == 'yes':
                print("🗑️ Deleting existing chunks...")
                collection.delete_many({"source": "AA Twelve Steps and Twelve Traditions"})
                print("✅ Existing chunks deleted")
            else:
                print("⚠️ Aborting import process")
                return False

        # Insert chunks into MongoDB
        result = collection.insert_many(chunks)
        print(f"✅ Inserted {len(result.inserted_ids)} documents into MongoDB")

        # Create indexes for better performance
        collection.create_index("page_number")
        collection.create_index("chunk_id")
        collection.create_index("source")

        print("""
✅ Twelve Steps and Twelve Traditions chunks successfully imported!

Next steps:
1. Ensure the vector search index is set up:
   - Go to MongoDB Atlas
   - Navigate to "Search" tab
   - Check if the 'text_vector_index' already includes embeddings for all sources
   - If not, you may need to update the index or create a new one
2. Test the RAG chatbot with questions about the 12 Steps and 12 Traditions
""")

        return True

    except Exception as e:
        print(f"❌ Error ingesting to MongoDB: {str(e)}")
        return False

if __name__ == "__main__":
    ingest_to_mongodb()