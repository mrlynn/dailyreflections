#!/usr/bin/env python
"""
Test the RAG system with questions about the Twelve Steps and Twelve Traditions
"""

import os
import json
from openai import OpenAI
from pymongo import MongoClient
from dotenv import load_dotenv
import time

# Load environment variables
load_dotenv()

# Initialize OpenAI client for embeddings
openai = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# Connect to MongoDB
client = MongoClient(os.getenv('MONGODB_URI'))
db = client['dailyreflections']
collection = db['text_chunks']

# Test queries
TEST_QUERIES = [
    "What are the Twelve Steps?",
    "Explain the Third Tradition",
    "What is the spiritual principle behind the Seventh Step?",
    "How does the Big Book differ from the 12&12?",
    "What does the 12&12 say about the Fourth Step inventory?",
    "How should amends be made according to Step Nine?",
    "What's the difference between humility and humiliation?",
    "How are the Traditions different from the Steps?",
    "What is the primary purpose of an AA group?",
]

def search_text_chunks(query, limit=5, min_score=0.65):
    """
    Search for relevant text chunks using vector search
    """
    # Generate embedding for the query
    response = openai.embeddings.create(
        model='text-embedding-3-small',
        input=query,
    )
    query_embedding = response.data[0].embedding

    # Search for relevant chunks using vector search
    pipeline = [
        {
            "$vectorSearch": {
                "index": "text_vector_index",
                "path": "embedding",
                "queryVector": query_embedding,
                "numCandidates": 100,
                "limit": limit * 2,
            },
        },
        # Project fields including the vector search score
        {
            "$project": {
                "_id": 0,
                "text": 1,
                "page_number": 1,
                "chunk_id": 1,
                "source": 1,
                "score": { "$meta": "vectorSearchScore" },
            },
        },
        # Filter results above minimum score
        {
            "$match": {
                "score": { "$gte": min_score }
            },
        },
        # Sort by similarity score
        {
            "$sort": {
                "score": -1,
            },
        },
        # Limit results
        {
            "$limit": limit,
        },
    ]

    results = list(collection.aggregate(pipeline))
    return results

def test_rag():
    """
    Test the RAG system with sample questions
    """
    print("🔍 Testing RAG system with Twelve Steps and Twelve Traditions questions...\n")

    for i, query in enumerate(TEST_QUERIES, 1):
        print(f"\n{i}. Query: \"{query}\"")
        print("-" * 80)

        start_time = time.time()
        try:
            # Search for relevant chunks
            results = search_text_chunks(query, limit=3)
            elapsed = time.time() - start_time

            print(f"Found {len(results)} relevant chunks in {elapsed:.2f} seconds\n")

            # Display results
            for j, result in enumerate(results, 1):
                source_name = result['source']
                page_info = f"Page {result['page_number']}" if 'page_number' in result else ""
                score_percent = f"{result['score'] * 100:.1f}%"

                print(f"{j}. {source_name} {page_info} (Relevance: {score_percent})")

                # Show excerpt (first 150 characters)
                excerpt = result['text'][:150].replace("\n", " ")
                if len(result['text']) > 150:
                    excerpt += "..."
                print(f"   \"{excerpt}\"\n")

        except Exception as e:
            print(f"❌ Error searching for query: {str(e)}")

    print("\n✅ Testing complete!")

if __name__ == "__main__":
    test_rag()