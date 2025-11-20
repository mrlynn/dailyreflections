#!/bin/bash
# Setup script for the integrated RAG system

# Display welcome message
echo "======================================================"
echo "Integrated RAG System Setup: Daily Reflections + AA Big Book"
echo "======================================================"
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "Error: Node.js is required but not installed."
    echo "Please install Node.js and npm before running this script."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null
then
    echo "Error: Python 3 is required but not installed."
    echo "Please install Python 3 before running this script."
    exit 1
fi

# Check for .env file
if [ ! -f ../.env ]; then
    echo "Error: .env file not found in the parent directory."
    echo "Please create a .env file with your MongoDB and OpenAI credentials."
    echo "Required variables: MONGODB_URI, OPENAI_API_KEY"
    exit 1
fi

echo "Step 1: Installing Python dependencies..."
pip install openai pymongo python-dotenv

echo "Step 2: Generating OpenAI embeddings for AA Big Book chunks..."
cd files
python3 1_generate_openai_embeddings.py

echo "Step 3: Ingesting data into MongoDB..."
python3 2_ingest_to_dailyreflections.py

echo "Step 4: Integration setup complete!"
echo
echo "Next steps:"
echo "1. Create the vector search index in MongoDB Atlas using the configuration in:"
echo "   files/3_vector_search_index_modified.json"
echo "2. Implement the enhanced prompt engineering in your application"
echo "3. Run the test script to verify functionality: node files/test_combined_rag.js"
echo
echo "For detailed instructions, see the README.md file."
echo "======================================================"