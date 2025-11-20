#!/usr/bin/env python
"""
Chunk the extracted text from Twelve Steps and Twelve Traditions PDF
This script creates chunks in different formats:
1. Token-based chunks (like in the Big Book example)
2. Paragraph-based chunks
"""

import json
import re
import os
import nltk
from nltk.tokenize import sent_tokenize

# Download NLTK data if not already available
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

# Input and output paths
INPUT_PAGES_JSON_PATH = "12_12_pages.json"
OUTPUT_TOKEN_CHUNKS_PATH = "12_12_chunks_token_based.json"
OUTPUT_PARAGRAPH_CHUNKS_PATH = "12_12_chunks_paragraph.json"

# Chunking parameters
TOKEN_CHUNK_SIZE = 512  # Target size for token-based chunks
TOKEN_CHUNK_OVERLAP = 50  # Overlap between token-based chunks

def chunk_text():
    """
    Create token and paragraph-based chunks from the text
    """
    print("🔍 Creating chunks from Twelve Steps and Twelve Traditions text...")

    # Ensure input file exists
    if not os.path.exists(INPUT_PAGES_JSON_PATH):
        print(f"❌ Error: Input file not found at {INPUT_PAGES_JSON_PATH}")
        return False

    try:
        # Load page data
        with open(INPUT_PAGES_JSON_PATH, 'r', encoding='utf-8') as f:
            pages = json.load(f)

        print(f"📚 Loaded {len(pages)} pages")

        # Create token-based chunks
        token_chunks = create_token_chunks(pages)
        with open(OUTPUT_TOKEN_CHUNKS_PATH, 'w', encoding='utf-8') as f:
            json.dump(token_chunks, f, indent=2)
        print(f"✅ Created {len(token_chunks)} token-based chunks, saved to {OUTPUT_TOKEN_CHUNKS_PATH}")

        # Create paragraph-based chunks
        paragraph_chunks = create_paragraph_chunks(pages)
        with open(OUTPUT_PARAGRAPH_CHUNKS_PATH, 'w', encoding='utf-8') as f:
            json.dump(paragraph_chunks, f, indent=2)
        print(f"✅ Created {len(paragraph_chunks)} paragraph-based chunks, saved to {OUTPUT_PARAGRAPH_CHUNKS_PATH}")

        return True

    except Exception as e:
        print(f"❌ Error creating chunks: {str(e)}")
        return False

def create_token_chunks(pages):
    """
    Create chunks based on a target token size with overlap
    """
    chunks = []
    chunk_id = 0
    current_chunk = ""
    current_chunk_tokens = 0
    current_pages = set()

    for page in pages:
        page_number = page["page_number"]
        text = page["text"]

        # Split into sentences to avoid cutting in the middle of a sentence
        sentences = sent_tokenize(text)

        for sentence in sentences:
            # Rough token count (words + punctuation)
            sentence_tokens = len(re.findall(r'\b\w+\b|[^\w\s]', sentence))

            if current_chunk_tokens + sentence_tokens > TOKEN_CHUNK_SIZE and current_chunk:
                # Save the current chunk if it's getting too big
                chunks.append({
                    "chunk_id": f"12-12-{chunk_id:03d}",
                    "text": current_chunk.strip(),
                    "token_count": current_chunk_tokens,
                    "page_number": min(current_pages),  # Use the first page number
                    "page_range": f"{min(current_pages)}-{max(current_pages)}",
                    "source": "AA Twelve Steps and Twelve Traditions"
                })
                chunk_id += 1

                # Start a new chunk with overlap
                overlap_tokens = current_chunk.split()[-TOKEN_CHUNK_OVERLAP:]
                current_chunk = " ".join(overlap_tokens) + " " + sentence
                current_chunk_tokens = len(overlap_tokens) + sentence_tokens
                current_pages = {page_number}
            else:
                # Add to the current chunk
                current_chunk += " " + sentence
                current_chunk_tokens += sentence_tokens
                current_pages.add(page_number)

    # Don't forget the last chunk
    if current_chunk:
        chunks.append({
            "chunk_id": f"12-12-{chunk_id:03d}",
            "text": current_chunk.strip(),
            "token_count": current_chunk_tokens,
            "page_number": min(current_pages),  # Use the first page number
            "page_range": f"{min(current_pages)}-{max(current_pages)}",
            "source": "AA Twelve Steps and Twelve Traditions"
        })

    return chunks

def create_paragraph_chunks(pages):
    """
    Create chunks based on paragraphs
    """
    chunks = []
    chunk_id = 0

    for page in pages:
        page_number = page["page_number"]
        text = page["text"]

        # Split into paragraphs
        paragraphs = re.split(r'\n\s*\n|\n{2,}', text)

        for paragraph in paragraphs:
            paragraph = paragraph.strip()

            # Skip empty paragraphs
            if not paragraph:
                continue

            # If the paragraph is very short, it might be a heading - combine with next paragraph
            if len(paragraph) < 50 and chunk_id < len(paragraphs) - 1:
                next_paragraph = paragraphs[chunk_id + 1].strip() if chunk_id + 1 < len(paragraphs) else ""
                if next_paragraph:
                    paragraph = f"{paragraph}\n\n{next_paragraph}"

            # Add the paragraph as a chunk
            token_count = len(re.findall(r'\b\w+\b|[^\w\s]', paragraph))
            chunks.append({
                "chunk_id": f"12-12-p-{chunk_id:03d}",
                "text": paragraph,
                "token_count": token_count,
                "page_number": page_number,
                "source": "AA Twelve Steps and Twelve Traditions"
            })
            chunk_id += 1

    return chunks

if __name__ == "__main__":
    chunk_text()