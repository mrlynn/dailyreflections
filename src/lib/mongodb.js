import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

if (!uri) {
  throw new Error('Please add your Mongo URI to .env.local');
}

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

/**
 * Connects to MongoDB and returns the database and client
 * @param {Object} options - Optional configuration
 * @param {boolean} options.withEncryption - Whether to initialize encryption
 * @param {string} options.collection - Collection name for encryption schema
 */
export async function connectToDatabase(options = {}) {
  const client = await clientPromise;
  const db = client.db('dailyreflections');

  // If encryption is requested, initialize it
  if (options.withEncryption && options.collection) {
    try {
      // Import encryption utilities dynamically to avoid circular dependencies
      const { getEncryptedClient } = await import('./encryption');
      const encryptedClient = await getEncryptedClient(options.collection);
      
      // Check if encryption is available (encryptedClient will be null if not available)
      if (!encryptedClient) {
        console.warn('Encryption not available, falling back to unencrypted client');
        return { db, client };
      }
      
      return {
        db,
        client,
        encryptionClient: encryptedClient.clientEncryption,
        encryptionSchema: encryptedClient.encryptionSchema
      };
    } catch (error) {
      console.error('Failed to initialize encryption:', error);
      // Fall back to unencrypted client
      return { db, client };
    }
  }

  return { db, client };
}
