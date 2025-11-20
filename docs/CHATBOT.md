# RAG Chatbot for Daily Reflections

This document provides an overview and technical documentation for the Recovery Assistant chatbot implementation in the Daily Reflections web application.

## Overview

The Recovery Assistant is a floating chatbot that leverages Retrieval-Augmented Generation (RAG) to provide informed responses about:

- AA Big Book content
- Daily Reflections
- Recovery concepts and principles

The chatbot combines semantic search with AI generation to provide relevant, accurate responses with proper citations to source material.

## Features

- **Floating UI**: Non-intrusive chat bubble that expands when clicked
- **Unified Search**: Searches across both AA Big Book and Daily Reflections
- **Citation System**: Responses include references with relevance scores
- **Direct Links**: Citations include links to related reflections when available
- **Persistent Chat**: Conversation history is saved between sessions
- **Suggested Questions**: Helpful starting points for users

## Technical Implementation

### Architecture

1. **Frontend Components**
   - Floating chat bubble with expand/collapse functionality
   - Chat interface with message history
   - Citation display with relevance scores
   - Responsive design for all screen sizes

2. **Backend API**
   - Vector search across multiple collections
   - LLM integration for response generation
   - Citation formatting and reference system

3. **Data Processing**
   - Embedding generation using Sentence Transformers
   - MongoDB Atlas vector search for semantic retrieval
   - Fallback systems for resilience

### Component Structure

```
src/components/ChatBot/
  ├── index.js           # Main chatbot component
  ├── ChatBubble.js      # Floating chat icon
  ├── ChatWindow.js      # Expanded chat interface
  ├── Message.js         # Individual message with citations
  ├── MessageList.js     # Scrollable list of messages
  ├── ChatInput.js       # Text input with send button
  └── SuggestedQuestions.js # Clickable suggestion chips
```

### API Routes

```
src/app/api/chatbot/
  └── query/
      └── route.js      # Processes chatbot queries using RAG
```

### Utility Functions

```
src/lib/chatbotSearch.js # Unified search across collections
```

## Setup Instructions

### Prerequisites

1. MongoDB Atlas account with vector search capability
2. OpenAI API key for response generation
3. AA Big Book content in the prescribed format
4. Daily Reflections already set up in the database

### Configuration

1. Ensure environment variables are set in `.env.local`:
   ```
   MONGODB_URI=your_mongodb_connection_string
   OPENAI_API_KEY=your_openai_api_key
   ```

2. Import AA Big Book content:
   ```bash
   node scripts/chatbot/ingest-big-book.js
   ```

3. Verify MongoDB indexes:
   - `vector_index` for AA Big Book content
   - `reflections_vector_index` for Daily Reflections

### Testing

Use the test script to verify the chatbot functionality:
```bash
node scripts/chatbot/test-chatbot-api.js
```

## Usage Examples

1. **Ask about recovery concepts:**
   - "What are the 12 steps?"
   - "How do I find serenity?"
   - "What is acceptance in recovery?"

2. **Query Daily Reflections:**
   - "Tell me about today's reflection"
   - "What reflections discuss gratitude?"
   - "Show me reflections about step 3"

3. **Learn about the Big Book:**
   - "What does the Big Book say about resentment?"
   - "How does the Big Book describe spiritual awakening?"
   - "Explain the promises in the Big Book"

## Future Enhancements

1. **Multi-turn Conversation**: Improve context awareness across multiple messages
2. **Personalization**: Adapt responses based on user history and preferences
3. **Additional Sources**: Integrate more AA literature (12&12, Living Sober, etc.)
4. **User Feedback**: Add rating system to improve response quality
5. **Analytics**: Track common questions to improve content coverage
6. **Voice Interface**: Add speech-to-text and text-to-speech capabilities

## Troubleshooting

### Common Issues

1. **No results from vector search**:
   - Verify vector indexes are created correctly in MongoDB Atlas
   - Check embedding dimensions match (384 for all-MiniLM-L6-v2)

2. **Slow response times**:
   - Optimize MongoDB Atlas configuration
   - Implement caching for common queries
   - Reduce context size sent to LLM

3. **Irrelevant citations**:
   - Adjust minimum similarity score (default: 0.65)
   - Increase number of candidates in vector search
   - Fine-tune chunk size for content

## Support

For issues or questions about the chatbot implementation, please contact the development team.