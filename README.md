# AA Companion

<div align="center">

![License](https://img.shields.io/github/license/your-username/aa-companion)
![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

**A modern recovery support platform delivering daily reflections, personal growth tools, and community features for the recovery journey.**

[Key Features](#key-features) •
[Getting Started](#getting-started) •
[Contributing](#contributing) •
[Developer Documentation](#developer-documentation) •
[Deployment](#deployment)

</div>

## Overview

AA Companion is an open-source platform designed to support individuals in recovery through Alcoholics Anonymous principles. The application combines traditional AA literature with modern technology to provide an accessible and comprehensive digital companion for the recovery journey.

Built with Next.js and leveraging AI capabilities, this platform delivers daily reflections from AA literature, personal recovery tools including a 10th Step Journal and 4th Step inventory guide, community discussion features, and an AI-powered assistant trained on recovery literature.

Our mission is to make recovery resources more accessible while respecting the traditions of anonymity and non-affiliation that are fundamental to the AA program.

## Key Features

### Core Features
- **Daily Reflections**: Access reflections for each day of the year with intuitive date navigation
- **Community Discussions**: Engage with others through threaded comments on reflections
- **Recovery Assistant**: AI chatbot with knowledge of AA literature and recovery principles
- **Semantic Search**: Find relevant reflections using natural language queries
- **Direct URL Access**: Visit specific date reflections via direct URL (e.g., `/01-15` for January 15th)
- **Modern UI**: Clean, responsive interface with Material UI design system
- **Authentication**: Secure user accounts with privacy-focused identity options
- **Custom Display Names**: Set a custom display name for privacy and anonymity

### Personal Recovery Tools
- **10th Step Journal**: Daily inventory system for tracking personal progress
- **4th Step Inventory Guide**: Structured framework for personal inventory work
- **Resentment & Fear Inventory**: Specialized tools for working through specific aspects of recovery
- **Relationship Inventory**: Framework for examining relationship patterns

### Resource Center & Additional Features
- **AA Resource Directory**: Curated collection of official AA literature and resources
- **Meeting Finder**: Locate AA meetings in your area
- **Recovery Blog**: Articles on recovery topics, experiences, and insights
- **Step Guides**: Detailed guidance on working through all 12 Steps

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB Atlas cluster (or local MongoDB for development)
- OpenAI API key (for AI features)

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/your-username/aa-companion.git
cd aa-companion
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.local.example .env.local
```
Edit `.env.local` with your configuration values, including MongoDB connection string and OpenAI API key.

4. **Seed the database**
```bash
npm run seed
```

5. **Run the development server**
```bash
npm run dev
```

6. **Open the application**
Visit [http://localhost:3000](http://localhost:3000) in your browser.

## Contributing

**We welcome contributions from developers of all skill levels!** Whether you're fixing a bug, adding a feature, or improving documentation, your help is appreciated.

### Ways to Contribute

- **Code Contributions**: Features, bug fixes, performance improvements
- **Documentation**: Improving README, code comments, developer guides
- **Design**: UI/UX improvements, accessibility enhancements
- **Testing**: Writing tests, reporting bugs, manual testing
- **Ideas**: Feature suggestions and feedback

### Development Workflow

1. **Set up your development environment**
   - Fork the repository and clone it locally
   - Install dependencies with `npm install`
   - Set up environment variables following the instructions above
   - Seed the database with test data using `npm run seed`

2. **Create a feature branch**
   - Branch naming convention: `feature/your-feature-name` or `fix/bug-description`
   - Keep your branches focused on a single issue/feature

3. **Develop and test your changes**
   - Follow the code style and patterns used in the project
   - Add tests for new functionality
   - Ensure all existing tests pass
   - Test your changes thoroughly in the development environment

4. **Submit a Pull Request**
   - Provide a clear description of what your PR addresses
   - Reference any related issues
   - Include screenshots for UI changes
   - Ensure CI checks pass

### Contribution Guidelines

- **Code Style**: Follow the existing code style and patterns
- **Commits**: Write clear, concise commit messages
- **Documentation**: Update relevant documentation for your changes
- **Tests**: Add tests for new functionality
- **Feature Flags**: Use the feature flag system for new features

### Getting Help

If you need assistance or have questions:
1. Check the existing issues or create a new one
2. Ask questions in the pull request
3. Contact the maintainers

## Developer Documentation

### Project Structure

The project follows Next.js App Router structure with clear separation of concerns:

```
aa-companion/
├── public/                # Static assets
├── scripts/              # Utility scripts for seeding, migrations, etc.
├── src/
│   ├── app/              # Next.js App Router pages and API routes
│   │   ├── [dateKey]/    # Dynamic route for daily reflections
│   │   ├── api/          # API endpoints
│   │   │   ├── reflections/
│   │   │   ├── comments/
│   │   │   └── ...
│   │   ├── blog/         # Blog section
│   │   ├── journal/      # Journal feature
│   │   └── ...           # Other page routes
│   ├── components/       # React components organized by feature
│   │   ├── ReflectionCard.js  # Display for reflections
│   │   ├── ChatBot/      # Assistant components
│   │   └── ...
│   ├── lib/              # Core libraries and utilities
│   │   ├── mongodb.js    # Database connection pooling
│   │   └── ...
│   └── utils/            # Helper functions
│       ├── dateUtils.js  # Date manipulation utilities
│       └── ...
└── middleware.js         # Next.js middleware (auth, etc.)
```

### Key Architecture Patterns

1. **MongoDB Connection Pooling**
   - Use the provided client from `@/lib/mongodb` to ensure efficient connections

```javascript
import clientPromise from '@/lib/mongodb';

async function yourFunction() {
  const client = await clientPromise;
  const db = client.db('dailyreflections');
  // Use the db instance for operations
}
```

2. **Date Key Handling**
   - Dates are represented as "MM-DD" format (e.g., "01-08" for January 8th)
   - Use the utilities in `src/utils/dateUtils.js` for consistent handling

3. **Feature Flag System**
   - Use the `useFeatureFlag` hook to conditionally enable features
   - Configure flags in environment variables

4. **API Structure**
   - RESTful API routes in the `/api` directory
   - Consistent error handling and response formats

### Database Models

For detailed information on the data models and MongoDB schema, refer to the Database Schema section in the full documentation.

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to a Git repository
2. Import project in [Vercel](https://vercel.com)
3. Add required environment variables:
   - `MONGODB_URI`: MongoDB Atlas connection string
   - `NEXTAUTH_URL`: Your production URL
   - `NEXTAUTH_SECRET`: A secure random string
   - `OPENAI_API_KEY`: Your OpenAI API key
4. Deploy!

### Required Environment Variables

- `MONGODB_URI` - MongoDB connection string
- `NEXTAUTH_URL` - Full URL of your application
- `NEXTAUTH_SECRET` - Secret for JWT encryption
- `OPENAI_API_KEY` - OpenAI API key for embeddings and AI assistant

## Roadmap

Planned enhancements include:

- **Sponsorship Tools**: Private communication and progress sharing
- **Step Progress Tracker**: Visualization of progress through all 12 Steps
- **Mobile Applications**: Native iOS and Android apps
- **Group Features**: Create and manage private groups for meetings
- **Multilingual Support**: Translations of reflections and interface

## A Note on Privacy and Anonymity

AA Companion takes anonymity and privacy seriously, in line with AA traditions:

- Never requires real names or identifying information
- Allows completely anonymous participation through display names
- Implements strict data privacy measures
- Follows the principle "anonymity is the spiritual foundation of all our traditions"

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Daily reflections sourced from Alcoholics Anonymous literature
- Inspired by the recovery community's need for digital access to spiritual readings
- Built with appreciation for the principles of the AA program

---

<div align="center">

**Built by the recovery community, for the recovery community**

[Report an Issue](https://github.com/your-username/aa-companion/issues) • [Request a Feature](https://github.com/your-username/aa-companion/issues/new?labels=enhancement)

</div>