
from pymongo import MongoClient
import json

# Connect to MongoDB
MONGODB_URI = "your_mongodb_connection_string_here"
client = MongoClient(MONGODB_URI)

# Select database and collection
db = client['aa_rag_database']
collection = db['text_chunks']

# Load chunks with embeddings
with open('/mnt/user-data/outputs/aa_chunks_with_embeddings.json', 'r') as f:
    chunks = json.load(f)

# Insert into MongoDB
print(f"Inserting {len(chunks)} chunks into MongoDB...")
result = collection.insert_many(chunks)
print(f"Inserted {len(result.inserted_ids)} documents!")

# Create indexes for better performance
collection.create_index("page_number")
collection.create_index("chunk_id")

print("Collection ready!")
