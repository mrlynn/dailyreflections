#!/usr/bin/env python
"""
Generate embeddings for Twelve Steps and Twelve Traditions chunks
Uses OpenAI's text-embedding-3-small model (same as the Big Book)
"""

import os
import json
import time
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Input and output paths
INPUT_CHUNKS_PATH = "12_12_chunks_token_based.json"
OUTPUT_EMBEDDINGS_PATH = "12_12_chunks_with_embeddings.json"

def generate_embeddings():
    """
    Generate embeddings for chunks and save them
    """
    print("🔍 Generating embeddings for Twelve Steps and Twelve Traditions chunks...")

    # Ensure OpenAI API key is available
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print("❌ Error: OPENAI_API_KEY not found in environment variables")
        return False

    # Ensure input file exists
    if not os.path.exists(INPUT_CHUNKS_PATH):
        print(f"❌ Error: Input file not found at {INPUT_CHUNKS_PATH}")
        return False

    try:
        # Load chunks
        with open(INPUT_CHUNKS_PATH, 'r', encoding='utf-8') as f:
            chunks = json.load(f)

        print(f"📚 Loaded {len(chunks)} chunks")

        # Initialize OpenAI client
        client = OpenAI(api_key=api_key)

        # Add embeddings to each chunk
        for i, chunk in enumerate(chunks):
            try:
                # Generate embeddings using OpenAI's text-embedding-3-small model (same as Big Book)
                response = client.embeddings.create(
                    model="text-embedding-3-small",
                    input=chunk['text']
                )

                # Extract the embedding from the response
                chunk['embedding'] = response.data[0].embedding
                chunk['embedding_model'] = 'text-embedding-3-small'
                chunk['dimensions'] = len(response.data[0].embedding)
                chunk['created_at'] = time.strftime('%Y-%m-%d %H:%M:%S')

                # Log progress
                if (i + 1) % 10 == 0 or i == 0 or i == len(chunks) - 1:
                    print(f"✅ Processed chunk {i + 1}/{len(chunks)}")

                # Add a small delay to avoid hitting API rate limits
                time.sleep(0.2)

            except Exception as e:
                print(f"❌ Error generating embedding for chunk {i}: {str(e)}")
                # Add longer delay if we hit rate limits
                if "rate_limit" in str(e).lower():
                    print("⏱ Rate limit hit, waiting 60 seconds...")
                    time.sleep(60)
                    # Retry this chunk
                    i -= 1
                    continue

        # Save chunks with embeddings
        with open(OUTPUT_EMBEDDINGS_PATH, 'w', encoding='utf-8') as f:
            json.dump(chunks, f, indent=2)

        print(f"✅ Saved {len(chunks)} chunks with embeddings to {OUTPUT_EMBEDDINGS_PATH}")

        return True

    except Exception as e:
        print(f"❌ Error generating embeddings: {str(e)}")
        return False

if __name__ == "__main__":
    generate_embeddings()