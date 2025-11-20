# MongoDB Queryable Encryption for AA Companion

This document provides information on the MongoDB Queryable Encryption implementation for the AA Companion app.

## Overview

We have implemented MongoDB Queryable Encryption to secure sensitive user data in the 4th step inventory and 10th step journal. This ensures that this sensitive information can only be accessed by the user who created it.

## Features

- **Field-level encryption** for sensitive user data
- **Local Customer Master Key** for development
- **Deterministic encryption** allowing for equality queries
- **Seamless integration** with the existing API endpoints

## Implementation Details

The implementation uses MongoDB's Queryable Encryption to encrypt sensitive fields in the following collections:

1. **4th Step Inventory (`step4` collection)**
   - `resentments` (array)
   - `fears` (array)
   - `sexConduct.relationships` (array)
   - `sexConduct.patterns` (string)
   - `sexConduct.idealBehavior` (string)
   - `harmsDone` (array)

2. **10th Step Journal (`journal_entries` collection)**
   - `inventory.resentments` (string)
   - `inventory.fears` (string)
   - `inventory.honesty` (string)
   - `inventory.amends` (string)
   - `inventory.selfishness` (string)
   - `inventory.dishonesty` (string)
   - `inventory.self_seeking` (string)
   - `inventory.fear` (string)
   - `reflections` (string)
   - `promises` (string)
   - `improvements` (string)

## Setup and Configuration

### Prerequisites

- MongoDB 7.0+ with Queryable Encryption support
- The `mongodb-client-encryption` package

### Configuration

1. Set the path for your local Customer Master Key in `.env`:
```
CUSTOMER_MASTER_KEY_PATH=./path/to/master-key.txt
```

2. The system will automatically generate a master key if one doesn't exist at the specified path.

### Testing the Encryption

We've provided a test script to verify the encryption is working properly:

```bash
# Run the test script
node src/scripts/test-encryption.js
```

The test script will:
1. Initialize the encryption client
2. Create test data for both 4th step inventory and journal entries
3. Save the data to MongoDB (which will be encrypted on the server)
4. Retrieve and display the data (decrypted on the client)

## How It Works

1. When a user saves their 4th step inventory or journal entry, the sensitive fields are automatically encrypted before being sent to the MongoDB server.

2. When a user retrieves their data, the encrypted fields are automatically decrypted before being sent to the client.

3. The data remains encrypted while stored in the database, ensuring that even database administrators cannot access the sensitive information.

4. The Customer Master Key is stored locally and is used to create data encryption keys that are stored in a key vault within MongoDB.

## Security Considerations

- The Customer Master Key should be properly secured in production environments.
- For production use, consider using a key management service like AWS KMS.
- The current implementation uses deterministic encryption, which allows for equality queries but may reveal patterns in the data.

## References

- [MongoDB Queryable Encryption Documentation](https://www.mongodb.com/docs/manual/core/queryable-encryption/)
- [MongoDB Client-Side Field Level Encryption Guide](https://www.mongodb.com/docs/manual/core/security-client-side-encryption/)