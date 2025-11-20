# Direct Ghibli Image Generator for Daily Reflections

This script directly connects to MongoDB to generate Studio Ghibli-style landscape banner images for daily reflections. It addresses connectivity issues with the previous implementation and provides a more streamlined approach.

## Features

- **Direct MongoDB Connection**: Connects directly to the MongoDB database without relying on the app's connection logic
- **Ghibli-Style Images**: Generates images with Studio Ghibli's distinctive artistic style
- **Theme Detection**: Automatically extracts themes from reflection text to customize the image style
- **Landscape Format**: Creates perfectly sized (1792x1024) header images for the reflection cards
- **MongoDB Integration**: Updates the reflection documents with image metadata

## Requirements

- Node.js (v14+)
- MongoDB connection
- OpenAI API key with DALL-E 3 access

## Setup

1. Make sure the OpenAI API key is set in your environment:

```bash
export OPENAI_API_KEY=your_api_key_here
```

2. Install required Node.js dependencies:

```bash
npm install openai axios mongodb commander
```

## Usage

### Using the Shell Wrapper

The easiest way to use the script is through the shell wrapper:

```bash
# Generate image for today's reflection
./scripts/generate-ghibli-images.sh

# Generate image for a specific date (MM-DD format)
./scripts/generate-ghibli-images.sh --date 11-13

# Generate images for all reflections
./scripts/generate-ghibli-images.sh --all

# Force regeneration of existing images
./scripts/generate-ghibli-images.sh --date 11-13 --force

# Dry run (show what would be done without making changes)
./scripts/generate-ghibli-images.sh --all --dry-run
```

### Direct Node.js Usage

You can also run the Node.js script directly:

```bash
# Generate image for today's reflection
node scripts/generate-ghibli-images-direct.js

# Generate image for a specific date
node scripts/generate-ghibli-images-direct.js --date 11-13

# Generate images for all reflections
node scripts/generate-ghibli-images-direct.js --all
```

## Command-Line Options

- `-d, --date <date>`: Generate image for a specific date (MM-DD format)
- `-a, --all`: Generate images for all reflections
- `-f, --force`: Force regeneration even if images exist
- `--dry-run`: Show what would be done without making changes
- `-h, --help`: Show help information

## Ghibli Style Characteristics

The generator creates images with these Studio Ghibli style elements:

1. **Sweeping Landscapes**: Panoramic views with layered depths
2. **Distinctive Lighting**: Luminous quality with soft, diffused lighting
3. **Vibrant Natural Colors**: Rich greens, soft blues, warm earth tones
4. **Characteristic Clouds**: Plump, dimensional clouds with soft edges
5. **Dynamic Elements**: Subtle motion in foliage and grass
6. **Reflective Water**: Quintessential Ghibli water rendering
7. **Hand-Painted Look**: Visible but gentle brushwork

## Image Storage

Generated images are stored in:
- File path: `/public/reflections/MM-DD.jpg`
- URL path: `/reflections/MM-DD.jpg`

## MongoDB Updates

For each reflection, the script:
1. Sets `image.status` to "pending" when starting
2. Updates with full image metadata when complete:
   - URL path
   - File path
   - Image hash
   - File size
   - Generation date
   - Status ("completed" or "failed")

## Troubleshooting

If you encounter issues:

1. **MongoDB Connection**: Ensure the MongoDB connection string is correct
2. **API Key**: Verify your OpenAI API key is valid and has access to DALL-E 3
3. **Image Directory**: Make sure the `/public/reflections/` directory exists and is writable
4. **Permissions**: Ensure the script has execution permissions (`chmod +x`)

For errors, the script will update the reflection document with an error status and message.