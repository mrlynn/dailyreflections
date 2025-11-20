
from sentence_transformers import SentenceTransformer
import json

# Load the model (only do this once)
print("Loading embedding model...")
model = SentenceTransformer('all-MiniLM-L6-v2')  # 384 dimensions
# Alternative models:
# - 'all-mpnet-base-v2' (768 dim, more accurate but slower)
# - 'multi-qa-MiniLM-L6-cos-v1' (384 dim, optimized for Q&A)

# Load your chunks
with open('/mnt/user-data/outputs/aa_chunks_token_based.json', 'r') as f:
    chunks = json.load(f)

print(f"Generating embeddings for {len(chunks)} chunks...")

# Add embeddings to each chunk
for i, chunk in enumerate(chunks):
    chunk['embedding'] = model.encode(chunk['text']).tolist()
    
    if (i + 1) % 50 == 0:
        print(f"  Processed {i + 1}/{len(chunks)} chunks...")

print("Embeddings generated!")

# Save chunks with embeddings
with open('/mnt/user-data/outputs/aa_chunks_with_embeddings.json', 'w') as f:
    json.dump(chunks, f, indent=2)

print("Saved chunks with embeddings!")
