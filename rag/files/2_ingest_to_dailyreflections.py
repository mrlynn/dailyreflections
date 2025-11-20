"""
Ingest AA Big Book chunks with OpenAI embeddings into the Daily Reflections MongoDB database
Uses the same MongoDB database as the main application
"""

import os
from pymongo import MongoClient
import json
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Connect to MongoDB
MONGODB_URI = os.getenv("MONGODB_URI")
client = MongoClient(MONGODB_URI)

# Select database and collection - use the same DB as the Daily Reflections app
db = client['dailyreflections']
collection = db['text_chunks']  # Collection for AA Big Book chunks

# Load chunks with embeddings
with open('aa_chunks_with_openai_embeddings.json', 'r') as f:
    chunks = json.load(f)

print(f"Inserting {len(chunks)} AA Big Book chunks into MongoDB...")

# Check if chunks already exist - clean up if needed
existing_chunks = collection.count_documents({"source": "AA Big Book 4th Edition"})
if existing_chunks > 0:
    print(f"Found {existing_chunks} existing AA Big Book chunks. Removing them before insertion...")
    collection.delete_many({"source": "AA Big Book 4th Edition"})

# Insert into MongoDB
result = collection.insert_many(chunks)
print(f"Inserted {len(result.inserted_ids)} documents!")

# Create indexes for better performance
collection.create_index("page_number")
collection.create_index("chunk_id")

print("Collection ready!")

print("""
Next steps:
1. Create a vector search index in MongoDB Atlas:
   - Go to your MongoDB Atlas cluster
   - Navigate to "Search" tab
   - Click "Create Search Index"
   - Use the JSON Editor
   - Paste the contents from the 3_vector_search_index_modified.json file
   - Name it 'text_vector_index'
2. Test the chatbot functionality with questions about the AA Big Book
""")