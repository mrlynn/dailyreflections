// Note: This file should only be imported server-side
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';

/**
 * Step8 Model - Represents an 8th Step amends list
 */
export class Step8 {
  constructor({
    _id,
    userId,
    startedAt,
    completedAt,
    updatedAt,
    status = 'in_progress',
    amendsEntries = [],
    progress = {
      totalEntries: 0,
      entriesWilling: 0,
      entriesCompleted: 0
    },
    isEncrypted = false
  }) {
    this._id = _id || new ObjectId();
    this.userId = userId;
    this.startedAt = startedAt || new Date();
    this.completedAt = completedAt;
    this.updatedAt = updatedAt || new Date();
    this.status = status;
    this.amendsEntries = amendsEntries;
    this.progress = progress;
    this.isEncrypted = isEncrypted;
  }
}

// Define mongoose schema for Step8
const Step8Schema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  // Overall inventory metadata
  startedAt: { type: Date, default: Date.now, required: true },
  completedAt: { type: Date },
  updatedAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'archived'],
    default: 'in_progress',
  },
  // Amends entries
  amendsEntries: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
      person: { type: String, required: true, trim: true },
      harmDone: { type: String, required: true, trim: true },
      willingnessStatus: {
        type: String,
        enum: ['not_willing', 'not_sure', 'willing', 'completed'],
        default: 'not_sure',
      },
      planForAmends: { type: String, trim: true },
      priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      },
      notes: { type: String, trim: true },
      completedAt: { type: Date },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    }
  ],
  // Progress tracking
  progress: {
    totalEntries: { type: Number, default: 0 },
    entriesWilling: { type: Number, default: 0 },
    entriesCompleted: { type: Number, default: 0 }
  },
  isEncrypted: { type: Boolean, default: false }
});

/**
 * Step8 Collection Operations
 */
export async function findOrCreateStep8ForUser(userId) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection('step8inventories');

    // Find existing inventory that's not archived
    let step8 = await collection.findOne({
      userId: new ObjectId(userId),
      status: { $ne: 'archived' }
    });

    // Create new if not found
    if (!step8) {
      step8 = new Step8({
        userId: new ObjectId(userId)
      });

      await collection.insertOne(step8);
    }

    return step8;
  } catch (error) {
    console.error('Error finding/creating Step 8 inventory:', error);
    throw new Error('Failed to find or create Step 8 inventory');
  }
}

/**
 * Get a user's Step 8 inventory by ID
 */
export async function getStep8ById(id, userId) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection('step8inventories');

    return await collection.findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(userId)
    });
  } catch (error) {
    console.error(`Error fetching Step 8 inventory ${id}:`, error);
    throw new Error('Failed to fetch Step 8 inventory');
  }
}

/**
 * Update a Step 8 inventory
 */
export async function updateStep8(id, userId, updateData) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection('step8inventories');

    // Prevent updating certain fields directly
    delete updateData._id;
    delete updateData.userId;
    delete updateData.startedAt;

    // If marking as completed, set completedAt
    if (updateData.status === 'completed' && !updateData.completedAt) {
      updateData.completedAt = new Date();
    }

    // Always update the updatedAt timestamp
    updateData.updatedAt = new Date();

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), userId: new ObjectId(userId) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    return result;
  } catch (error) {
    console.error(`Error updating Step 8 inventory ${id}:`, error);
    throw new Error('Failed to update Step 8 inventory');
  }
}

/**
 * Add an entry to a Step 8 inventory
 */
export async function addAmendsEntry(inventoryId, userId, entryData) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection('step8inventories');

    // Add ID and timestamps to entry
    const entry = {
      _id: new ObjectId(),
      ...entryData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add entry to the inventory
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(inventoryId), userId: new ObjectId(userId) },
      {
        $push: { amendsEntries: entry },
        $set: { updatedAt: new Date() },
        $inc: { 'progress.totalEntries': 1 }
      },
      { returnDocument: 'after' }
    );

    // Update progress counters
    await updateProgressCounters(inventoryId, userId);

    return result;
  } catch (error) {
    console.error(`Error adding amends entry to inventory ${inventoryId}:`, error);
    throw new Error('Failed to add amends entry');
  }
}

/**
 * Update an entry in a Step 8 inventory
 */
export async function updateAmendsEntry(inventoryId, userId, entryId, entryData) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection('step8inventories');

    // Prevent updating certain fields directly
    delete entryData._id;
    delete entryData.createdAt;

    // Add timestamp
    entryData.updatedAt = new Date();

    // If marked as completed, set completedAt if not already set
    if (entryData.willingnessStatus === 'completed') {
      entryData.completedAt = entryData.completedAt || new Date();
    }

    // Update the specific entry in the array
    const result = await collection.findOneAndUpdate(
      {
        _id: new ObjectId(inventoryId),
        userId: new ObjectId(userId),
        'amendsEntries._id': new ObjectId(entryId)
      },
      {
        $set: {
          'amendsEntries.$': {
            _id: new ObjectId(entryId),
            ...entryData
          },
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    // Update progress counters
    await updateProgressCounters(inventoryId, userId);

    return result;
  } catch (error) {
    console.error(`Error updating amends entry ${entryId}:`, error);
    throw new Error('Failed to update amends entry');
  }
}

/**
 * Delete an entry from a Step 8 inventory
 */
export async function deleteAmendsEntry(inventoryId, userId, entryId) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection('step8inventories');

    // Remove the entry from the array
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(inventoryId), userId: new ObjectId(userId) },
      {
        $pull: { amendsEntries: { _id: new ObjectId(entryId) } },
        $set: { updatedAt: new Date() },
        $inc: { 'progress.totalEntries': -1 }
      },
      { returnDocument: 'after' }
    );

    // Update progress counters
    await updateProgressCounters(inventoryId, userId);

    return result;
  } catch (error) {
    console.error(`Error deleting amends entry ${entryId}:`, error);
    throw new Error('Failed to delete amends entry');
  }
}

/**
 * Update progress counters for a Step 8 inventory
 */
async function updateProgressCounters(inventoryId, userId) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection('step8inventories');

    // Get the current inventory
    const inventory = await collection.findOne({
      _id: new ObjectId(inventoryId),
      userId: new ObjectId(userId)
    });

    if (!inventory || !inventory.amendsEntries) {
      return;
    }

    // Calculate progress counts
    const totalEntries = inventory.amendsEntries.length;
    const entriesWilling = inventory.amendsEntries.filter(
      entry => ['willing', 'completed'].includes(entry.willingnessStatus)
    ).length;
    const entriesCompleted = inventory.amendsEntries.filter(
      entry => entry.willingnessStatus === 'completed'
    ).length;

    // Update the progress object
    await collection.updateOne(
      { _id: new ObjectId(inventoryId), userId: new ObjectId(userId) },
      {
        $set: {
          'progress.totalEntries': totalEntries,
          'progress.entriesWilling': entriesWilling,
          'progress.entriesCompleted': entriesCompleted,
          updatedAt: new Date()
        }
      }
    );
  } catch (error) {
    console.error(`Error updating progress counters for inventory ${inventoryId}:`, error);
    throw new Error('Failed to update progress counters');
  }
}

/**
 * Get statistics for a user's Step 8 inventory
 */
export async function getStep8Stats(userId) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection('step8inventories');

    // Get the inventory
    const inventory = await collection.findOne({
      userId: new ObjectId(userId),
      status: { $ne: 'archived' }
    });

    if (!inventory) {
      return {
        totalEntries: 0,
        entriesWilling: 0,
        entriesCompleted: 0,
        willingnessPercentage: 0,
        completedPercentage: 0,
        priorityCounts: {
          high: 0,
          medium: 0,
          low: 0
        }
      };
    }

    // Calculate percentages
    const totalEntries = inventory.progress.totalEntries;
    const willingnessPercentage = totalEntries > 0
      ? Math.round((inventory.progress.entriesWilling / totalEntries) * 100)
      : 0;
    const completedPercentage = totalEntries > 0
      ? Math.round((inventory.progress.entriesCompleted / totalEntries) * 100)
      : 0;

    // Count entries by priority
    const priorityCounts = {
      high: 0,
      medium: 0,
      low: 0
    };

    if (inventory.amendsEntries) {
      inventory.amendsEntries.forEach(entry => {
        if (priorityCounts[entry.priority] !== undefined) {
          priorityCounts[entry.priority]++;
        }
      });
    }

    return {
      totalEntries,
      entriesWilling: inventory.progress.entriesWilling,
      entriesCompleted: inventory.progress.entriesCompleted,
      willingnessPercentage,
      completedPercentage,
      priorityCounts
    };
  } catch (error) {
    console.error(`Error getting stats for Step 8 inventory:`, error);
    throw new Error('Failed to get Step 8 statistics');
  }
}

// Pre-save hook to update progress metrics
Step8Schema.pre('save', function(next) {
  if (this.isModified('amendsEntries')) {
    // Count totals
    this.progress.totalEntries = this.amendsEntries.length;

    // Count by status
    this.progress.entriesWilling = this.amendsEntries.filter(entry =>
      ['willing', 'completed'].includes(entry.willingnessStatus)).length;

    this.progress.entriesCompleted = this.amendsEntries.filter(entry =>
      entry.willingnessStatus === 'completed').length;
  }

  // Update the updatedAt timestamp
  this.updatedAt = Date.now();

  next();
});

// Automatically create a Step8 collection or use the existing one
export default mongoose.models.Step8 || mongoose.model('Step8', Step8Schema);