# Technical Context

## Technology Stack

### Frontend
- **Next.js 16**: App Router architecture
- **React 19**: UI framework
- **Material UI v7**: Component library with Emotion styling
- **jsdom + DOMPurify**: For sanitizing HTML content

### Backend
- **Next.js API Routes**: `/app/api` directory
- **MongoDB 6.20**: Official driver
- **MongoDB Atlas**: Cloud database (production)

### Development
- **Node.js**: Runtime
- **ESLint**: Code quality
- **Webpack**: Bundling (legacy support)

## Project Structure

```
/daily-reflections
├── memory-bank/           # Documentation
├── src/
│   ├── app/
│   │   ├── api/          # API routes
│   │   ├── [dateKey]/    # Dynamic reflection pages
│   │   ├── layout.js     # Root layout with MUI theme
│   │   └── page.js       # Home page
│   ├── components/       # React components
│   │   ├── ReflectionCard.js
│   │   ├── CommentList.js
│   │   ├── CommentItem.js
│   │   └── CommentForm.js
│   ├── lib/
│   │   └── mongodb.js    # Database connection
│   └── utils/            # Helper functions
├── public/               # Static assets
└── package.json
```

## Environment Variables

Required:
- `MONGODB_URI`: MongoDB Atlas connection string

Optional:
- `NEXT_PUBLIC_TIMEZONE`: Default America/New_York
- `NODE_ENV`: development/production

## Key Dependencies

```json
{
  "next": "16.0.1",
  "react": "19.2.0",
  "@mui/material": "^7.3.4",
  "mongodb": "^6.20.0",
  "dompurify": "^3.3.0"
}
```

## Build Commands

```bash
npm run dev      # Development server
npm run build    # Production build
npm start        # Start production server
npm run lint     # Lint code
```

## Deployment Target
Vercel (recommended for Next.js) or any Node.js hosting

