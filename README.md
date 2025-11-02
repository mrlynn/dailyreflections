# Daily Reflections App

A modern web application for displaying daily recovery reflections from Alcoholics Anonymous literature with community discussion features.

## Features

- 📖 **Daily Reflections**: One reflection per day of the year (month/day)
- 💬 **Threaded Comments**: Full nested discussion with replies
- 🎨 **Modern UI**: Material UI with MongoDB-inspired design
- 🔄 **Optimistic Updates**: Instant feedback on user actions
- 📅 **Date Navigation**: Easy navigation between dates
- 🚀 **Production Ready**: MongoDB Atlas, Next.js App Router, optimized performance

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: Material UI v7
- **Database**: MongoDB Atlas
- **Runtime**: Node.js
- **Styling**: Emotion (MUI default)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB Atlas cluster (or local MongoDB for development)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd daily-reflections
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your MongoDB connection string:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dailyreflections?retryWrites=true&w=majority
```

4. Seed the database with sample data:
```bash
npm run seed
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
daily-reflections/
├── memory-bank/              # Documentation and project context
├── public/                   # Static assets
├── scripts/
│   └── seed.js              # Database seeding script
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── reflections/
│   │   │   │   └── [dateKey]/
│   │   │   │       └── route.js    # Fetch reflection by date
│   │   │   └── comments/
│   │   │       └── route.js        # CRUD for comments
│   │   ├── layout.js               # Root layout with MUI theme
│   │   └── page.js                 # Main page
│   ├── components/
│   │   ├── ReflectionCard.js      # Display reflection
│   │   ├── CommentList.js         # Container for comments
│   │   ├── CommentItem.js         # Individual comment
│   │   └── CommentForm.js         # Comment submission
│   ├── lib/
│   │   └── mongodb.js             # Database connection
│   ├── utils/
│   │   └── dateUtils.js           # Date utilities
│   └── theme.js                   # MUI theme configuration
├── .cursorrules                   # Project intelligence
├── .gitignore
├── jsconfig.json
├── next.config.mjs
└── package.json
```

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

## API Routes

### GET `/api/reflections/[dateKey]`

Fetch a reflection by date key (MM-DD format).

**Response:**
```json
{
  "_id": "...",
  "title": "DO I HAVE A CHOICE?",
  "quote": "The fact is that...",
  "comment": "<p>My powerlessness...</p>",
  "reference": "--ALCOHOLICS ANONYMOUS, p. 24",
  "month": 1,
  "day": 8
}
```

### GET `/api/comments?dateKey=MM-DD`

Fetch all comments for a specific date.

**Response:**
```json
[
  {
    "_id": "...",
    "dateKey": "01-08",
    "parentId": null,
    "path": [],
    "author": "RecoveryOne",
    "body": "This resonated with me...",
    "createdAt": "2024-01-08T10:00:00Z"
  }
]
```

### POST `/api/comments`

Create a new comment.

**Body:**
```json
{
  "dateKey": "01-08",
  "parentId": null,  // Optional, for replies
  "author": "Your Name",
  "body": "Your comment here"
}
```

### DELETE `/api/comments`

Delete a comment.

**Body:**
```json
{
  "commentId": "..."
}
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run seed` - Seed database with sample data

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub/GitLab
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
4. Deploy!

### Environment Variables

- **MONGODB_URI** (required): MongoDB Atlas connection string
- **NEXT_PUBLIC_TIMEZONE** (optional): Default: "America/New_York"

## Architecture Highlights

### Server Components
- Reflections are fetched server-side for better SEO
- MongoDB connection pooling across requests
- Incremental Static Regeneration (ISR)

### Client Components
- Comment system with optimistic updates
- Date navigation and UI interactions
- Real-time comment threading

### Performance Optimizations
- Proper MongoDB indexing
- Connection pooling
- Lazy loading of nested replies
- Efficient comment tree building

## Future Enhancements

- [ ] Authentication with NextAuth.js
- [ ] User profiles and avatars
- [ ] Markdown support
- [ ] Quote of the day hero banner
- [ ] Moderation tools
- [ ] Email notifications
- [ ] Mobile app
- [ ] Offline support

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Daily reflections sourced from Alcoholics Anonymous literature
- Inspired by the recovery community's need for digital access to spiritual readings

---

Built with ❤️ for the recovery community
# dailyreflections
