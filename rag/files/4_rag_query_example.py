
from sentence_transformers import SentenceTransformer
from pymongo import MongoClient

# Initialize
model = SentenceTransformer('all-MiniLM-L6-v2')
client = MongoClient("your_mongodb_uri")
collection = client['aa_rag_database']['text_chunks']

def query_rag(user_question: str, num_results: int = 5):
    """
    Query the RAG system and return relevant chunks.
    """
    # 1. Generate embedding for the question
    query_embedding = model.encode(user_question).tolist()
    
    # 2. Perform vector search
    pipeline = [
        {
            "$vectorSearch": {
                "index": "vector_index",
                "path": "embedding",
                "queryVector": query_embedding,
                "numCandidates": 100,  # Number of candidates to consider
                "limit": num_results    # Top results to return
            }
        },
        {
            "$project": {
                "_id": 0,
                "text": 1,
                "page_number": 1,
                "chunk_id": 1,
                "score": { "$meta": "vectorSearchScore" }
            }
        }
    ]
    
    results = list(collection.aggregate(pipeline))
    return results

def generate_answer(question: str, context_chunks: List[Dict]):
    """
    Generate answer using retrieved context.
    You would typically send this to an LLM like GPT-4 or Claude.
    """
    # Combine context
    context = "\n\n".join([
        f"[Page {chunk['page_number']}] {chunk['text']}"
        for chunk in context_chunks
    ])
    
    # Create prompt for LLM
    prompt = f"""Based on the following excerpts from the AA Big Book, please answer the question.

Context:
{context}

Question: {question}

Answer:"""
    
    return prompt

# Example usage
question = "What are the 12 steps of Alcoholics Anonymous?"
print(f"Question: {question}\n")

# Retrieve relevant chunks
relevant_chunks = query_rag(question, num_results=5)

print(f"Found {len(relevant_chunks)} relevant chunks:\n")
for i, chunk in enumerate(relevant_chunks, 1):
    print(f"{i}. [Page {chunk['page_number']}] Score: {chunk['score']:.4f}")
    print(f"   {chunk['text'][:200]}...\n")

# Generate prompt for LLM
prompt = generate_answer(question, relevant_chunks)
print("\nPrompt ready to send to LLM!")
