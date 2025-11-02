import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

/**
 * NextAuth Configuration
 * Supports email/password and Google OAuth authentication
 */
// Build providers array - conditionally include Google if credentials exist
const providers = [
  // Email/Password Provider
  CredentialsProvider({
    name: 'Credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null;
      }

      const client = await clientPromise;
      const db = client.db('dailyreflections');
      
      // Find user by email
      const user = await db.collection('users').findOne({
        email: credentials.email.toLowerCase(),
      });

      if (!user) {
        return null;
      }

      // Check if user has a password (email/password users only)
      if (!user.password) {
        return null;
      }

      // Check password
      const isValidPassword = await bcrypt.compare(
        credentials.password,
        user.password
      );

      if (!isValidPassword) {
        return null;
      }

      // Return user object for session
      return {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        image: user.image,
      };
    },
  }),
];

// Add Google provider only if credentials are configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

// Validate required environment variables
const requiredEnvVars = {
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || (process.env.NODE_ENV === 'development' ? 'development-secret-change-in-production' : null),
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : null),
};

if (!requiredEnvVars.NEXTAUTH_SECRET) {
  console.warn('⚠️  NEXTAUTH_SECRET is not set. Authentication may not work properly.');
}

if (!requiredEnvVars.NEXTAUTH_URL) {
  console.warn('⚠️  NEXTAUTH_URL is not set. Authentication may not work properly.');
}

// Initialize adapter with error handling
let adapter;
try {
  adapter = MongoDBAdapter(clientPromise);
} catch (error) {
  console.error('⚠️  MongoDB adapter initialization failed:', error.message);
  // Continue without adapter - sessions will be JWT-only (not persisted to DB)
  // This is acceptable for development but not ideal for production
  adapter = undefined;
}

const authOptions = {
  ...(adapter && { adapter }), // Only include adapter if it initialized successfully
  providers,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user ID to session
      if (session.user && token.id) {
        session.user.id = token.id;
      }
      return session;
    },
  },
  secret: requiredEnvVars.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  // Handle errors gracefully
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      // Log sign-in events
      if (process.env.NODE_ENV === 'development') {
        console.log('Sign in:', { userId: user.id, email: user.email });
      }
    },
    async error({ error }) {
      // Log errors for debugging
      console.error('NextAuth error:', error);
    },
  },
};

// Export authOptions for use in other files
export { authOptions };

// Initialize NextAuth handler
// For NextAuth v5 beta with Next.js App Router
let GET, POST;

try {
  const handler = NextAuth(authOptions);
  
  // Log handler structure for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('NextAuth handler initialized:', {
      type: typeof handler,
      hasGET: !!handler?.GET,
      hasPOST: !!handler?.POST,
      handlerKeys: handler ? Object.keys(handler) : [],
    });
  }
  
  // NextAuth v5 beta returns an object with GET and POST handlers
  if (handler && typeof handler === 'object' && handler.GET && handler.POST) {
    // Wrap handlers to ensure all responses are valid JSON
    GET = async (req, context) => {
      try {
        const response = await handler.GET(req, context);
        // Ensure response is valid - if it's null/undefined, return error
        if (!response) {
          console.error('NextAuth GET returned empty response');
          return Response.json({ error: 'Empty response from authentication service' }, { status: 500 });
        }
        return response;
      } catch (error) {
        console.error('NextAuth GET handler error:', error);
        return Response.json(
          { error: 'Authentication error', message: error.message || 'Unknown error' },
          { status: 500 }
        );
      }
    };
    
    POST = async (req, context) => {
      try {
        const response = await handler.POST(req, context);
        // Ensure response is valid - if it's null/undefined, return error
        if (!response) {
          console.error('NextAuth POST returned empty response');
          return Response.json({ error: 'Empty response from authentication service' }, { status: 500 });
        }
        return response;
      } catch (error) {
        console.error('NextAuth POST handler error:', error);
        return Response.json(
          { error: 'Authentication error', message: error.message || 'Unknown error' },
          { status: 500 }
        );
      }
    };
  } else {
    // Fallback: create error handlers
    const errorHandler = async (req) => {
      console.error('NextAuth handler structure unexpected:', typeof handler, handler);
      return Response.json(
        { error: 'Authentication handler configuration error' },
        { status: 500 }
      );
    };
    GET = errorHandler;
    POST = errorHandler;
  }
} catch (error) {
  console.error('❌ Failed to initialize NextAuth:', error);
  // Create fallback handlers that return proper JSON errors
  const fallbackHandler = async (req) => {
    console.error('NextAuth handler called but initialization failed');
    return Response.json(
      { 
        error: 'Authentication service error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Please check configuration'
      },
      { status: 500 }
    );
  };
  GET = fallbackHandler;
  POST = fallbackHandler;
}

// Export handlers - NextAuth v5 beta structure
export { GET, POST };

