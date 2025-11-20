import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import SMSProvider from '@/lib/smsAuthProvider';

/**
 * NextAuth Configuration
 * Supports email/password, SMS verification, and Google OAuth authentication
 */
// Build providers array - conditionally include Google if credentials exist
const providers = [
  // Email/Password Provider
  CredentialsProvider({
    id: 'credentials',
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
        displayName: user.displayName || user.name, // Use displayName if available
        image: user.image,
        isAdmin: user.isAdmin === true, // Include admin status
        roles: user.roles || [], // Include user roles
      };
    },
  }),

  // SMS Authentication Provider
  SMSProvider(),
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
        token.displayName = user.displayName;

        // Check if user exists in the database and get roles and admin status
        try {
          const client = await clientPromise;
          const db = client.db('dailyreflections');
          const userDoc = await db.collection('users').findOne({ email: user.email });
          if (userDoc) {
            token.isAdmin = userDoc.isAdmin === true;
            token.roles = userDoc.roles || [];
          } else {
            token.isAdmin = false;
            token.roles = [];
          }
        } catch (error) {
          console.error('Error checking user roles/admin status:', error);
          token.isAdmin = false;
          token.roles = [];
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Add user ID, displayName, isAdmin, and roles to session
      if (session.user && token.id) {
        session.user.id = token.id;
        session.user.displayName = token.displayName;
        session.user.isAdmin = token.isAdmin || false;
        session.user.roles = token.roles || [];
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

// Initialize NextAuth for App Router (v5 exports handlers & auth)
const { handlers, auth } = NextAuth(authOptions);

export const { GET, POST } = handlers;
export { auth };

