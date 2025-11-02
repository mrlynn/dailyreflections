# Daily Reflections App - Project Brief

## Overview
Daily Reflections is a web application that displays one recovery reflection per day of the year, sourced from Alcoholics Anonymous literature. Users can view reflections and engage with threaded comments.

## Core Requirements

### Primary Features
1. **Daily Reflection Display**: Show one reflection per day based on month/day (1-365)
2. **Threaded Comments**: Users can post and reply to comments with full nesting support
3. **Date Navigation**: Easy navigation between different days
4. **Clean Modern UI**: Material UI with MongoDB-inspired color palette

### Data Model

#### Reflection
```javascript
{
  _id: ObjectId,
  title: String,
  quote: String,
  comment: String,  // HTML content
  reference: String,
  month: Number,    // 1-12
  day: Number       // 1-31
}
```

#### Comment
```javascript
{
  _id: ObjectId,
  dateKey: String,      // "MM-DD" format (e.g., "01-08")
  parentId: String,     // null for top-level, ObjectId for replies
  path: Array,          // Hierarchical path for threading
  author: String,
  body: String,
  createdAt: Date
}
```

### Technical Stack
- **Framework**: Next.js 16 (App Router)
- **UI**: Material UI v7
- **Database**: MongoDB Atlas
- **Language**: JavaScript (preferred over TypeScript per user rules)
- **Time Zone**: America/New_York

### Key Constraints
- Must use MongoDB Atlas (not local MongoDB)
- Create `@/lib/mongodb` connection module
- Use Material UI over Tailwind
- Prefer JavaScript over TypeScript
- Clean separation of concerns

### Success Criteria
- Fast, responsive UI
- Efficient database queries with proper indexing
- Threaded comments with expand/collapse
- Optimistic UI updates
- Production-ready code organization

## Optional Enhancements (Future)
- Authentication with NextAuth.js
- Markdown support
- Quote of the day hero banner
- Moderation tools
- Server-side rendering for SEO
- Pagination for comments

