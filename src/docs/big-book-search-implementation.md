# Big Book Search Implementation

This document explains how we've implemented Big Book content search in the chatbot using vector embeddings.

## Overview

We've integrated the existing Big Book page vectors into the chatbot search functionality. This allows the chatbot to find and reference content from the Big Book Reader when answering user queries, providing more comprehensive responses based on AA literature.

## Implementation Details

### 1. Big Book Vector Search Function

Created a dedicated search function in `/lib/bigbook/vectorSearch.js` to search the Big Book pages using vector similarity:

```javascript
export async function searchBigBookPages(query, options = {}) {
  // Uses MongoDB $vectorSearch with the existing bigbook_page_vectors collection
  // Returns formatted results with page numbers and chapter information
}
```

This function:
- Takes a text query or pre-generated embedding
- Performs vector similarity search using the `bigbook_page_vectors_index`
- Returns results with proper formatting for chatbot integration
- Each result includes page number, chapter information, and a direct URL to the page in the Big Book Reader

### 2. Integration with Chatbot Search

Modified `/lib/chatbotSearch.js` to include Big Book search results in the combined search:

```javascript
export async function searchCombinedSources(query, options = {}) {
  // Now searches in three sources in parallel:
  // 1. AA literature from text_chunks collection (Big Book + 12&12)
  // 2. Big Book pages from bigbook_page_vectors collection
  // 3. Daily Reflections

  const [aaLiteratureResults, bigBookResults, reflectionsResults] = await Promise.all([
    searchAALiteratureContent(...),
    searchBigBookPages(...),
    searchReflectionContent(...)
  ]);

  // Combines and weights results
}
```

Key changes:
- Added parallel search in the Big Book pages collection
- Applied the same priority weighting to Big Book results as other AA literature (1.2x score boost)
- Updated citation formatting to properly show Big Book page sources
- Added URLs linking directly to pages in the Big Book Reader

### 3. Citation Formatting

Updated the citation formatting in `createLLMPrompt` to include Big Book Reader sources:

```javascript
// Determine the source info based on result source
if (result.source === 'Daily Reflection') {
  sourceInfo = `Daily Reflection (${result.reference})`;
} else if (result.source === 'AA Big Book 4th Edition') {
  sourceInfo = `Big Book (Page ${result.page_number})`;
} else if (result.source === 'Big Book Reader') {
  sourceInfo = `Big Book (Page ${result.pageNumber})`;
} else if (result.source === 'AA Twelve Steps and Twelve Traditions') {
  sourceInfo = `Twelve Steps and Twelve Traditions (Page ${result.page_number})`;
}
```

### 4. Test Endpoint

Created a test endpoint at `/api/test-bigbook-search/route.js` to verify the functionality:

```javascript
// GET /api/test-bigbook-search?q=your+query
// Returns both direct Big Book search results and combined search results
```

Use this endpoint to test the integration with queries like:
- `/api/test-bigbook-search?q=spiritual awakening`
- `/api/test-bigbook-search?q=step 3`
- `/api/test-bigbook-search?q=powerlessness`

## Collection and Index Information

The implementation uses:
- `bigbook_page_vectors` collection for the vector embeddings
- `bigbook_pages` collection for the full page content
- `bigbook_page_vectors_index` for the vector search index

## Benefits

1. **More Comprehensive Coverage**: Includes the entire Big Book content, not just the previously chunked excerpts
2. **Direct Links**: Provides URLs to the exact pages in the Big Book Reader
3. **Chapter Context**: Includes chapter information for better context
4. **Prioritized Results**: Weights Big Book content alongside other AA literature
5. **Improved User Experience**: Users can click through to read the full page in the Big Book Reader

## Next Steps

1. Monitor response quality with the new Big Book content included
2. Consider integrating specific chapter searches for targeted queries
3. Add custom prompt instructions to better utilize the Big Book Reader links