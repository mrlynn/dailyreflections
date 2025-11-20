"""
Generate OpenAI embeddings for AA Big Book chunks
Uses the same embedding model as the Daily Reflections app
"""

import os
import json
import time
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# Load your chunks - use token-based chunks (preferred based on README)
with open('aa_chunks_token_based.json', 'r') as f:
    chunks = json.load(f)

print(f"Generating embeddings for {len(chunks)} chunks...")

# Add embeddings to each chunk
for i, chunk in enumerate(chunks):
    try:
        # Generate embeddings using OpenAI's text-embedding-3-small model (same as Daily Reflections)
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=chunk['text']
        )

        # Extract the embedding from the response
        chunk['embedding'] = response.data[0].embedding

        # Add source field for consistency with the search function
        chunk['source'] = 'AA Big Book 4th Edition'

        # Log progress and add delay to avoid rate limiting
        if (i + 1) % 25 == 0:
            print(f"  Processed {i + 1}/{len(chunks)} chunks...")
            time.sleep(0.5)  # Small delay to avoid hitting rate limits

    except Exception as e:
        print(f"Error generating embedding for chunk {i}: {e}")
        # Wait longer if we hit a rate limit
        if "rate_limit" in str(e).lower():
            print("Rate limit hit, waiting 60 seconds...")
            time.sleep(60)
            # Retry this chunk
            i -= 1

print("Embeddings generated!")

# Save chunks with embeddings
with open('aa_chunks_with_openai_embeddings.json', 'w') as f:
    json.dump(chunks, f, indent=2)

print("Saved chunks with OpenAI embeddings!")