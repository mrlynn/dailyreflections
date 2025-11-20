#!/bin/bash
# Wrapper script for running the Ghibli image generator

# Check if OpenAI API key is set
if [ -z "$OPENAI_API_KEY" ]; then
  echo "Error: OPENAI_API_KEY environment variable is not set."
  echo "Please set your OpenAI API key using:"
  echo "export OPENAI_API_KEY=your_api_key_here"
  exit 1
fi

# Run the Node.js script with all provided arguments
node "$(dirname "$0")/generate-ghibli-images-direct-esm.js" "$@"