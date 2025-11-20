# Ghibli-Style Reflection Images Generator

This utility generates Studio Ghibli-style landscape banner images for daily reflections. The images are sized appropriately to serve as header images in the daily reflection card.

## Features

- Connects to MongoDB to read the daily reflections content
- Uses OpenAI's DALL-E 3 model to generate high-quality Studio Ghibli-style images
- Creates images in landscape format (1792x1024) perfect for header banners
- Automatically extracts themes from reflection text to customize the image style
- Saves optimized JPG images to `/public/reflections/MM-DD.jpg`
- Updates the MongoDB document with image metadata

## Requirements

- Node.js 16+
- MongoDB connection to the daily reflections database
- OpenAI API key with DALL-E 3 access

## Setup

1. Make sure you have set your OpenAI API key:

```bash
export OPENAI_API_KEY=your_api_key_here
```

2. If not already installed, install the required dependencies:

```bash
npm install openai axios sharp
```

## Usage

### Generate an image for today's reflection

```bash
./scripts/generate-ghibli-reflection-images.sh
```

### Generate an image for a specific date

```bash
./scripts/generate-ghibli-reflection-images.sh -d MM-DD
```

For example, to generate an image for January 1st:

```bash
./scripts/generate-ghibli-reflection-images.sh -d 01-01
```

### Generate images for all reflections

```bash
./scripts/generate-ghibli-reflection-images.sh -a
```

### Force regeneration of existing images

Add the `-f` flag to regenerate images even if they already exist:

```bash
./scripts/generate-ghibli-reflection-images.sh -d 01-01 -f
```

### Show help

```bash
./scripts/generate-ghibli-reflection-images.sh -h
```

## Understanding the Ghibli Style

The generator creates images with classic Studio Ghibli characteristics:

- Sweeping panoramic landscapes with layered depth
- Luminous lighting quality with atmospheric perspective
- Vibrant yet natural color palette
- Distinctive Ghibli-style clouds, foliage, and environmental elements
- Hand-painted appearance with visible gentle brushwork
- Serene, contemplative atmosphere evoking wonder and reflection

## Image Storage

Generated images are stored in:

- File path: `/public/reflections/MM-DD.jpg`
- URL path: `/reflections/MM-DD.jpg`

## Customization

The image style is customized based on themes detected in the reflection text. The system analyzes the reflection content and adapts the Ghibli style to match themes like:

- Acceptance
- Gratitude
- Serenity
- Hope
- Struggle
- Spirituality
- Growth
- Nature

For each theme, specific Ghibli-style visual elements are incorporated to create a unique and meaningful image that resonates with the reflection content.