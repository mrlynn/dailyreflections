# System Patterns & Architecture

## Architecture Overview

### Client-Server Data Flow

```
User → Next.js Page Component → API Route → MongoDB → Response → UI Update
```

### Key Patterns

#### 1. API Routes (Server-Side)
All database operations happen in API routes under `/app/api`:
- `/api/reflections/[dateKey]/route.js` - Fetch reflection
- `/api/comments/route.js` - CRUD for comments
- Use MongoDB connection pooling
- Proper error handling and validation

**Next.js 16 Dynamic Routes**: `params` is now a Promise - must `await`:
```javascript
export async function GET(request, { params }) {
  const { dateKey } = await params;  // ✅ Await params
  // ... rest of handler
}
```

#### 2. MUI Theme Setup Pattern
**Issue**: MUI themes contain functions that can't be serialized in server components
**Solution**: Split into server (`layout.js`) and client (`providers.js`) components
**Implementation**:
```javascript
// layout.js (server)
import Providers from "./providers";
export default function RootLayout({ children }) {
  return <Providers>{children}</Providers>;
}

// providers.js (client - 'use client')
import { ThemeProvider } from "@mui/material";
import theme from "@/theme";
export default function Providers({ children }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
```

**Benefits**: Proper SSR/CSR separation, no serialization errors, optimal build

#### 3. Component Architecture

**ReflectionCard**: Display main reflection content
- Shows title, quote, comment (sanitized HTML)
- Date-based lookup

**CommentList**: Container for all comments
- Fetches comments by dateKey
- Renders hierarchical threads
- Handles expand/collapse state

**CommentItem**: Individual comment display
- Shows author, body, timestamp
- Recursive rendering for replies
- Reply form toggle

**CommentForm**: Comment submission
- Validates input
- Optimistic UI updates
- Parent ID for threading

#### 4. MongoDB Connection Pattern

```javascript
// lib/mongodb.js
import { MongoClient } from 'mongodb'

const client = new MongoClient(uri, {
  // Connection pooling config
})

export default clientPromise // Returns connected client
```

**Key Practices**:
- Singleton connection pattern
- Reuse client across requests
- Handle connection errors gracefully

**Database Name**: Always specify explicitly in API routes:
```javascript
const client = await clientPromise;
const db = client.db('dailyreflections');  // ✅ Always specify
// Not: client.db() ❌ (uses default database)
```

#### 5. Data Fetching Strategy

**Server Components** (Preferred):
- Fetch data directly in server components
- No client-side JavaScript needed
- Better SEO and performance

**API Routes** (When needed):
- Use for mutations (POST, PUT, DELETE)
- Client-side fetching with SWR/fetch
- Server-side validation

#### 6. Comment Threading

**Path-Based Threading**:
```javascript
{
  path: [],           // Top-level: []
  path: ['abc123'],   // Reply: [parentId]
  path: ['abc123', 'def456'] // Nested: [...parents, parentId]
}
```

**Benefits**:
- Easy to query and sort
- Efficient rendering
- Clear hierarchy

#### 7. Date Handling

**DateKey Format**: "MM-DD" (e.g., "01-08")
- Consistent across application
- Easy to query and index
- Timezone: America/New_York

**MongoDB Indexes**:
- `reflections`: `{ month: 1, day: 1 }` (compound)
- `comments`: `{ dateKey: 1, createdAt: -1 }` (compound)
- `comments`: `{ parentId: 1 }` (for threading)

## Error Handling

1. **API Routes**: Return consistent error responses
2. **Components**: Graceful degradation
3. **Database**: Connection timeout handling
4. **Validation**: Input sanitization (DOMPurify)

## Performance Considerations

1. **Caching**:
   - Use Next.js revalidate for reflections (ISR)
   - Cache comments for short duration
   - MongoDB connection pooling

2. **Optimization**:
   - Paginate comments if needed
   - Lazy load nested replies
   - Optimistic UI updates

3. **Scalability**:
   - Index all query fields
   - Aggregate queries for heavy operations
   - Consider read replicas

## Security

1. **Input Sanitization**: All HTML content sanitized
2. **Rate Limiting**: Prevent spam (future)
3. **Authentication**: Optional NextAuth.js (future)
4. **Environment Variables**: Secure secrets

