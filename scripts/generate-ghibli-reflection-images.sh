#!/bin/bash
# Script to generate Studio Ghibli style images for daily reflections

# Set environment variables
export NODE_ENV=development

# Check if OpenAI API key is set
if [ -z "$OPENAI_API_KEY" ]; then
  echo "Error: OPENAI_API_KEY environment variable is not set."
  echo "Please set your OpenAI API key using:"
  echo "export OPENAI_API_KEY=your_api_key_here"
  exit 1
fi

# Parse command line arguments
FORCE=false
ALL=false
DATE=""

print_usage() {
  echo "Usage: $0 [OPTIONS]"
  echo "Generate Studio Ghibli style images for daily reflections."
  echo ""
  echo "Options:"
  echo "  -d, --date MM-DD    Generate image for a specific date (MM-DD format)"
  echo "  -a, --all           Generate images for all reflections"
  echo "  -f, --force         Force regeneration even if images exist"
  echo "  -h, --help          Show this help message"
  echo ""
  echo "Examples:"
  echo "  $0 -d 01-01         Generate image for January 1st"
  echo "  $0 -a -f            Generate all images, overwriting existing ones"
  echo "  $0                  Generate image for today's reflection"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -d|--date)
      DATE="$2"
      shift 2
      ;;
    -a|--all)
      ALL=true
      shift
      ;;
    -f|--force)
      FORCE=true
      shift
      ;;
    -h|--help)
      print_usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      print_usage
      exit 1
      ;;
  esac
done

# Build command
CMD="node generate-reflection-images.js"

if $ALL; then
  CMD="$CMD --all"
fi

if $FORCE; then
  CMD="$CMD --force"
fi

if [ -n "$DATE" ]; then
  CMD="$CMD --date $DATE"
fi

# Execute the command
echo "Generating Ghibli-style reflection images..."
echo "Command: $CMD"
eval $CMD

exit_code=$?
if [ $exit_code -eq 0 ]; then
  echo "Image generation completed successfully!"
else
  echo "Error: Image generation failed with exit code $exit_code"
  exit $exit_code
fi