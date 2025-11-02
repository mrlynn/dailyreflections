# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Daily Reflections is a modern web application built with Next.js that displays daily recovery reflections from Alcoholics Anonymous literature with community discussion features. It uses MongoDB for data storage and Material UI for the user interface.

## Key Commands

### Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local to add your MongoDB connection string

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

### Database Operations

```bash
# Seed database with sample data
npm run seed

# Clean and embed reflections (processes reflection content)
npm run clean-reflections

# Dry run of clean-reflections (no changes)
npm run clean-reflections:dry

# Set up rate limiting indexes
npm run setup-rate-limits

# Create vector search index for reflections
npm run create-vector-index
```

### Testing

Since this project doesn't have automated tests configured yet, manual testing is required:

1. Verify reflection loading for different dates
2. Test comment creation, nesting, and deletion
3. Validate responsive design on different screen sizes
4. Verify proper API error handling by testing edge cases

## Architecture

### Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: MongoDB Atlas
- **UI**: Material UI v7
- **Authentication**: NextAuth.js (planned)

### Project Structure

```
daily-reflections/
├── src/
│   ├── app/               # Next.js app router structure
│   │   ├── api/           # API endpoints
│   │   │   ├── reflections/
│   │   │   │   └── [dateKey]/route.js    # Fetch reflection by date
│   │   │   └── comments/route.js         # CRUD for comments
│   │   ├── layout.js      # Root layout with MUI theme
│   │   └── page.js        # Main page
│   ├── components/        # React components
│   │   ├── ReflectionCard.js      # Display reflection
│   │   ├── CommentList.js         # Container for comments
│   │   ├── CommentItem.js         # Individual comment
│   │   └── CommentForm.js         # Comment submission
│   ├── lib/               # Database and utility libraries
│   │   ├── mongodb.js             # Database connection pooling
│   │   ├── contentModeration.js   # Comment moderation
│   │   └── rateLimiter.js         # API rate limiting
│   └── utils/             # Utility functions
│       └── dateUtils.js           # Date manipulation functions
├── scripts/               # Utility scripts
│   ├── seed.js                    # Database seeding
│   └── clean-and-embed-reflections.js  # Process reflection content
└── public/                # Static assets
```

### Key Patterns

#### MongoDB Connection

The application uses a connection pooling pattern. Always use the provided MongoDB client from `@/lib/mongodb`:

```javascript
import clientPromise from '@/lib/mongodb';

async function yourFunction() {
  const client = await clientPromise;
  const db = client.db('dailyreflections');
  // Use the db instance for operations
}
```

#### Date Keys

Dates are represented in "MM-DD" format (e.g., "01-08" for January 8th). Use the utility functions in `src/utils/dateUtils.js` for date manipulation:

```javascript
import { getTodayKey, formatDateKey, parseDateKey } from '@/utils/dateUtils';

// Get today's date key in MM-DD format
const today = getTodayKey();

// Parse a date key into month and day
const { month, day } = parseDateKey(dateKey);

// Format a date key to readable string (e.g., "January 8")
const formattedDate = formatDateKey(dateKey);
```

#### API Structure

The app uses Next.js App Router for API routes:

- `GET /api/reflections/[dateKey]` - Fetch reflection by date key
- `GET /api/comments?dateKey=MM-DD` - Fetch comments for a date
- `POST /api/comments` - Create a new comment
- `DELETE /api/comments` - Delete a comment

#### Security Practices

- Sanitize HTML with DOMPurify before rendering
- Use MongoDB indexes for efficient queries
- Validate user input on both client and server sides

## Database Schema

### Reflections Collection

```javascript
{
  _id: ObjectId,
  title: String,
  quote: String,
  comment: String,     // HTML content
  reference: String,
  month: Number,       // 1-12
  day: Number          // 1-31
}
```

**Indexes:**
- `{ month: 1, day: 1 }` - Unique compound index

### Comments Collection

```javascript
{
  _id: ObjectId,
  dateKey: String,      // "MM-DD" format
  parentId: String,     // ObjectId or null
  path: Array,          // Threading path
  author: String,
  body: String,
  createdAt: Date
}
```

**Indexes:**
- `{ dateKey: 1, createdAt: -1 }` - Compound index for date queries
- `{ parentId: 1 }` - Index for threading

## Environment Variables

- **MONGODB_URI** (required): MongoDB Atlas connection string
- **MONGODB_DB** (optional): Database name, defaults to 'dailyreflections'
- **NEXT_PUBLIC_TIMEZONE** (optional): Default: "America/New_York"

## Development Workflows

### Adding a New Reflection

1. Add the new reflection to the database:
   ```javascript
   // Using the MongoDB client
   const client = await clientPromise;
   const db = client.db('dailyreflections');
   await db.collection('reflections').insertOne({
     title: "REFLECTION TITLE",
     quote: "Quote text...",
     comment: "Reflection text...",
     reference: "--REFERENCE SOURCE, p. XX",
     month: 1, // 1-12
     day: 15,  // 1-31
   });
   ```

2. Alternatively, update the seed script to include the new reflection and re-run it (in development).

### Adding a New Feature to Comments

1. Update the Comment schema in both frontend and API endpoints
2. Modify the CommentForm.js component to include the new fields
3. Update the comment API route to handle the new fields
4. Update the CommentItem.js component to display the new fields

### Adding Authentication

1. Configure NextAuth.js in `src/app/api/auth/[...nextauth]/route.js`
2. Set up the MongoDB adapter in the NextAuth configuration
3. Create login/signup components
4. Add user-related fields to the comments collection
5. Update the comment submission workflow to include user information

## Performance Considerations

- The application uses Incremental Static Regeneration (ISR) with a revalidation period of 3600 seconds (1 hour)
- MongoDB connection pooling reduces connection overhead
- Proper indexing on MongoDB collections ensures efficient queries
- Lazy loading of nested comment replies improves initial load times
- Optimistic UI updates provide responsive user experience

## Troubleshooting

### Common Issues

#### MongoDB Connection Errors

If you see MongoDB connection errors:

1. Verify your connection string in `.env.local`
2. Check network access settings in MongoDB Atlas
3. Ensure your IP is allowlisted in MongoDB Atlas

#### Missing Reflections

If reflections are not loading for certain dates:

1. Check if the reflection exists in the database for that date
2. Verify the date key format is correct ("MM-DD")
3. Run the seed script to populate sample data

#### API Error Handling

API routes have consistent error handling with appropriate status codes:
- 400: Bad Request (invalid input)
- 404: Not Found (resource does not exist)
- 500: Server Error (database or processing error)

Always check the response status and error message when debugging API issues.