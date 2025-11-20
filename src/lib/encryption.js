'use strict';

// This module should only be imported on the server side
if (typeof window !== 'undefined') {
  throw new Error('This module is intended for server-side use only');
}

import { Binary } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import crypto from 'crypto';
import clientPromise from './mongodb';

// Dynamically import mongodb-client-encryption to prevent webpack from processing it
let ClientEncryption;
try {
  const { ClientEncryption: CE } = require('mongodb-client-encryption');
  ClientEncryption = CE;
} catch (error) {
  console.error('Failed to load mongodb-client-encryption:', error);
}

// Constants for encryption
const ENCRYPTION_ALGORITHM = 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic';
const KEY_VAULT_NAMESPACE = 'encryption.__keyVault';
const LOCAL_KEY_PATH = process.env.CUSTOMER_MASTER_KEY_PATH || './master-key.txt';

// This tracks whether encryption has been initialized
let encryptionInitialized = false;
let clientEncryption = null;

/**
 * Get the file path for the local master key
 * @returns {string} The absolute file path for the master key
 */
function getMasterKeyPath() {
  // For ESM compatibility, if needed
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    return path.resolve(__dirname, '../../', LOCAL_KEY_PATH);
  } catch (error) {
    // For CommonJS
    return path.resolve(process.cwd(), LOCAL_KEY_PATH);
  }
}

/**
 * Create or retrieve the Customer Master Key (CMK)
 * @returns {Promise<Binary>} The CMK as a MongoDB Binary
 */
export async function getOrCreateMasterKey() {
  const keyPath = getMasterKeyPath();

  // Try to read existing key
  try {
    if (fs.existsSync(keyPath)) {
      const keyData = fs.readFileSync(keyPath);
      return new Binary(keyData, Binary.SUBTYPE_UUID);
    }
  } catch (error) {
    console.error('Error reading master key:', error);
  }

  // Key doesn't exist, create a new one
  if (!ClientEncryption) {
    throw new Error('mongodb-client-encryption is not available. Encryption cannot be initialized.');
  }

  const client = await clientPromise;

  // Initialize client encryption if not already done
  if (!clientEncryption) {
    try {
      clientEncryption = new ClientEncryption(client, {
        keyVaultNamespace: KEY_VAULT_NAMESPACE,
        kmsProviders: {
          local: {
            key: new Uint8Array(96) // Will be overwritten with a secure key
          }
        }
      });
    } catch (error) {
      console.error('Failed to create ClientEncryption instance:', error);
      throw error;
    }
  }

  // Generate new master key for local provider
  const localMasterKey = crypto.randomBytes(96);

  // Create data key
  const dataKey = await clientEncryption.createDataKey('local', {
    masterKey: { key: localMasterKey },
  });

  // Save the local master key to file
  const keyDir = path.dirname(keyPath);
  if (!fs.existsSync(keyDir)) {
    fs.mkdirSync(keyDir, { recursive: true });
  }
  fs.writeFileSync(keyPath, Buffer.from(localMasterKey), { mode: 0o600 });

  console.log('Created new master key for encryption');
  return dataKey;
}

/**
 * Initialize the MongoDB client with encryption configuration
 * @returns {Promise<Object>} The MongoDB client with encryption enabled
 */
export async function initializeEncryption() {
  if (encryptionInitialized) {
    return;
  }

  // Check if ClientEncryption is available
  if (!ClientEncryption) {
    console.warn('mongodb-client-encryption is not available. Encryption will be disabled.');
    encryptionInitialized = true; // Mark as initialized to prevent repeated warnings
    return null;
  }

  try {
    // Get or create the master key
    const masterKeyId = await getOrCreateMasterKey();

    // Setup encryption configuration
    const client = await clientPromise;
    const db = client.db();

    // Ensure key vault collection exists
    await db.createCollection(KEY_VAULT_NAMESPACE.split('.')[1]);

    // Initialize client encryption if not already done
    if (!clientEncryption) {
      const keyPath = getMasterKeyPath();
      const localMasterKey = fs.existsSync(keyPath)
        ? fs.readFileSync(keyPath)
        : crypto.randomBytes(96);

      try {
        clientEncryption = new ClientEncryption(client, {
          keyVaultNamespace: KEY_VAULT_NAMESPACE,
          kmsProviders: {
            local: {
              key: localMasterKey
            }
          }
        });
      } catch (error) {
        console.error('Failed to create ClientEncryption instance:', error);
        throw error;
      }
    }

    encryptionInitialized = true;
    console.log('MongoDB encryption initialized successfully');
    return client;
  } catch (error) {
    console.error('Failed to initialize MongoDB encryption:', error);
    encryptionInitialized = true; // Mark as initialized to prevent repeated errors
    // Don't throw - allow the app to continue without encryption
    return null;
  }
}

/**
 * Get the encryption schema for a collection
 * @param {string} collectionName - The name of the collection
 * @returns {Object|null} The encryption schema for the collection, or null if not supported
 */
export function getEncryptionSchemaForCollection(collectionName) {
  switch (collectionName) {
    case 'step4':
      return {
        resentments: {
          bsonType: 'array',
          algorithm: ENCRYPTION_ALGORITHM
        },
        fears: {
          bsonType: 'array',
          algorithm: ENCRYPTION_ALGORITHM
        },
        sexConduct: {
          bsonType: 'object',
          properties: {
            relationships: {
              bsonType: 'array',
              algorithm: ENCRYPTION_ALGORITHM
            },
            patterns: {
              bsonType: 'string',
              algorithm: ENCRYPTION_ALGORITHM
            },
            idealBehavior: {
              bsonType: 'string',
              algorithm: ENCRYPTION_ALGORITHM
            }
          }
        },
        harmsDone: {
          bsonType: 'array',
          algorithm: ENCRYPTION_ALGORITHM
        }
      };

    case 'journal_entries':
      return {
        inventory: {
          bsonType: 'object',
          properties: {
            resentments: {
              bsonType: 'string',
              algorithm: ENCRYPTION_ALGORITHM
            },
            fears: {
              bsonType: 'string',
              algorithm: ENCRYPTION_ALGORITHM
            },
            honesty: {
              bsonType: 'string',
              algorithm: ENCRYPTION_ALGORITHM
            },
            amends: {
              bsonType: 'string',
              algorithm: ENCRYPTION_ALGORITHM
            },
            service: {
              bsonType: 'string',
              algorithm: ENCRYPTION_ALGORITHM
            },
            prayer: {
              bsonType: 'string',
              algorithm: ENCRYPTION_ALGORITHM
            },
            selfishness: {
              bsonType: 'string',
              algorithm: ENCRYPTION_ALGORITHM
            },
            dishonesty: {
              bsonType: 'string',
              algorithm: ENCRYPTION_ALGORITHM
            },
            self_seeking: {
              bsonType: 'string',
              algorithm: ENCRYPTION_ALGORITHM
            },
            fear: {
              bsonType: 'string',
              algorithm: ENCRYPTION_ALGORITHM
            }
          }
        },
        reflections: {
          bsonType: 'string',
          algorithm: ENCRYPTION_ALGORITHM
        },
        promises: {
          bsonType: 'string',
          algorithm: ENCRYPTION_ALGORITHM
        },
        improvements: {
          bsonType: 'string',
          algorithm: ENCRYPTION_ALGORITHM
        }
      };

    default:
      return null;
  }
}

/**
 * Create a MongoDB client with encryption enabled for a specific collection
 * @param {string} collectionName - The name of the collection to encrypt
 * @returns {Promise<Object>} The MongoDB client with encryption enabled
 */
export async function getEncryptedClient(collectionName) {
  const encryptionResult = await initializeEncryption();
  
  // If encryption is not available, return null to indicate encryption is disabled
  if (!encryptionResult || !clientEncryption) {
    return null;
  }

  // Get the encryption schema for the collection
  const encryptionSchema = getEncryptionSchemaForCollection(collectionName);

  if (!encryptionSchema) {
    throw new Error(`No encryption schema defined for collection: ${collectionName}`);
  }

  // Setup the encrypted client
  const client = await clientPromise;

  return {
    client,
    encryptionSchema,
    clientEncryption
  };
}