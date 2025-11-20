/**
 * Synchronization utilities for Step 8 and Step 9
 *
 * This file contains functions to keep Step 8 and Step 9 data in sync,
 * as Step 9 (making amends) builds directly on Step 8 (listing people harmed).
 */

import { connectToMongoose } from '@/lib/mongoose';
import mongoose from 'mongoose';
import Step8Model from '@/lib/models/Step8';
import Step9Model from '@/lib/models/Step9';

/**
 * Synchronizes entries from Step 8 to Step 9
 * @param {String} userId - The user ID
 * @returns {Object} Results of the synchronization
 */
export async function syncStep8ToStep9(userId) {
  try {
    await connectToMongoose();

    // Get Step 8 inventory
    const step8Inventory = await Step8Model.findOne({
      userId: new mongoose.Types.ObjectId(userId)
    });

    if (!step8Inventory || !step8Inventory.amendsEntries || step8Inventory.amendsEntries.length === 0) {
      return {
        success: true,
        message: 'No Step 8 entries found to sync',
        newEntries: 0,
        updatedEntries: 0
      };
    }

    // Get Step 9 inventory
    let step9Inventory = await Step9Model.findOne({
      userId: new mongoose.Types.ObjectId(userId)
    });

    // Create Step 9 inventory if it doesn't exist
    if (!step9Inventory) {
      step9Inventory = new Step9Model({
        userId: new mongoose.Types.ObjectId(userId),
        amendsEntries: []
      });
    }

    // Find eligible entries from Step 8 (willing or completed)
    const eligibleEntries = step8Inventory.amendsEntries.filter(
      entry => ['willing', 'completed'].includes(entry.willingnessStatus)
    );

    // Track sync results
    const syncResults = {
      newEntries: 0,
      updatedEntries: 0,
      entries: []
    };

    // Process each eligible entry
    for (const step8Entry of eligibleEntries) {
      // Check if this entry is already in Step 9
      const existingStep9Entry = step9Inventory.amendsEntries.find(
        entry => entry.stepEightEntryId &&
                entry.stepEightEntryId.toString() === step8Entry._id.toString()
      );

      if (!existingStep9Entry) {
        // This is a new entry from Step 8 - add it to Step 9
        const newEntry = {
          person: step8Entry.person,
          harmDone: step8Entry.harmDone,
          amendStatus: step8Entry.willingnessStatus === 'completed' ? 'completed' : 'not_started',
          priority: step8Entry.priority || 'medium',
          planForAmends: step8Entry.planForAmends || '',
          notes: step8Entry.notes || '',
          stepEightEntryId: step8Entry._id,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        step9Inventory.amendsEntries.push(newEntry);
        syncResults.newEntries++;
        syncResults.entries.push({
          action: 'added',
          person: step8Entry.person,
          id: step8Entry._id
        });
      } else {
        // This entry exists - check if we need to update any fields
        // from Step 8 to Step 9 (person name, harm done, etc.)
        let updated = false;

        if (existingStep9Entry.person !== step8Entry.person) {
          existingStep9Entry.person = step8Entry.person;
          updated = true;
        }

        if (existingStep9Entry.harmDone !== step8Entry.harmDone) {
          existingStep9Entry.harmDone = step8Entry.harmDone;
          updated = true;
        }

        // If the person moved from willing to completed in Step 8,
        // but not yet in Step 9, suggest to update Step 9 as well
        if (step8Entry.willingnessStatus === 'completed' &&
            existingStep9Entry.amendStatus === 'not_started') {
          existingStep9Entry.amendStatus = 'planned';
          updated = true;
        }

        if (updated) {
          existingStep9Entry.updatedAt = new Date();
          syncResults.updatedEntries++;
          syncResults.entries.push({
            action: 'updated',
            person: step8Entry.person,
            id: step8Entry._id
          });
        }
      }
    }

    // Save changes to Step 9
    if (syncResults.newEntries > 0 || syncResults.updatedEntries > 0) {
      await step9Inventory.save();
    }

    return {
      success: true,
      message: `Synchronized Step 8 to Step 9: ${syncResults.newEntries} new entries, ${syncResults.updatedEntries} updated`,
      ...syncResults
    };
  } catch (error) {
    console.error('Error syncing Step 8 to Step 9:', error);
    return {
      success: false,
      message: 'Failed to sync Step 8 to Step 9',
      error: error.message
    };
  }
}

/**
 * Updates a Step 8 entry based on changes in the corresponding Step 9 entry
 * @param {String} userId - The user ID
 * @param {String} step9EntryId - The ID of the Step 9 entry
 * @param {Object} step9Entry - The updated Step 9 entry data
 * @returns {Object} Result of the update
 */
export async function updateStep8FromStep9(userId, step9EntryId) {
  try {
    await connectToMongoose();

    // Get the Step 9 entry
    const step9Inventory = await Step9Model.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      'amendsEntries._id': new mongoose.Types.ObjectId(step9EntryId)
    });

    if (!step9Inventory) {
      return {
        success: false,
        message: 'Step 9 entry not found'
      };
    }

    // Find the specific entry
    const step9Entry = step9Inventory.amendsEntries.find(
      entry => entry._id.toString() === step9EntryId
    );

    if (!step9Entry || !step9Entry.stepEightEntryId) {
      return {
        success: false,
        message: 'Step 9 entry not found or not linked to Step 8'
      };
    }

    // Find the corresponding Step 8 entry
    const step8Inventory = await Step8Model.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      'amendsEntries._id': step9Entry.stepEightEntryId
    });

    if (!step8Inventory) {
      return {
        success: false,
        message: 'Corresponding Step 8 inventory not found'
      };
    }

    // Find the entry index
    const step8EntryIndex = step8Inventory.amendsEntries.findIndex(
      entry => entry._id.toString() === step9Entry.stepEightEntryId.toString()
    );

    if (step8EntryIndex === -1) {
      return {
        success: false,
        message: 'Corresponding Step 8 entry not found'
      };
    }

    // Update the Step 8 entry based on Step 9 status
    let updated = false;

    // If amend is completed in Step 9, update willingness status in Step 8
    if (step9Entry.amendStatus === 'completed' &&
        step8Inventory.amendsEntries[step8EntryIndex].willingnessStatus !== 'completed') {
      step8Inventory.amendsEntries[step8EntryIndex].willingnessStatus = 'completed';
      step8Inventory.amendsEntries[step8EntryIndex].completedAt = step9Entry.actualAmendsDate || new Date();
      updated = true;
    }

    // Update notes if they've been modified in Step 9
    if (step9Entry.notes &&
        step9Entry.notes !== step8Inventory.amendsEntries[step8EntryIndex].notes) {
      step8Inventory.amendsEntries[step8EntryIndex].notes = step9Entry.notes;
      updated = true;
    }

    // Save changes if needed
    if (updated) {
      step8Inventory.amendsEntries[step8EntryIndex].updatedAt = new Date();
      await step8Inventory.save();

      return {
        success: true,
        message: 'Step 8 entry updated based on Step 9 changes',
        step8EntryId: step9Entry.stepEightEntryId
      };
    }

    return {
      success: true,
      message: 'No updates needed for Step 8 entry',
      step8EntryId: step9Entry.stepEightEntryId
    };
  } catch (error) {
    console.error('Error updating Step 8 from Step 9:', error);
    return {
      success: false,
      message: 'Failed to update Step 8 from Step 9',
      error: error.message
    };
  }
}

/**
 * Check if Step 9 needs synchronization with Step 8
 * @param {String} userId - The user ID
 * @returns {Boolean} True if sync is needed
 */
export async function checkSyncNeeded(userId) {
  try {
    await connectToMongoose();

    // Get Step 8 inventory
    const step8Inventory = await Step8Model.findOne({
      userId: new mongoose.Types.ObjectId(userId)
    });

    if (!step8Inventory || !step8Inventory.amendsEntries || step8Inventory.amendsEntries.length === 0) {
      return false;
    }

    // Get Step 9 inventory
    const step9Inventory = await Step9Model.findOne({
      userId: new mongoose.Types.ObjectId(userId)
    });

    if (!step9Inventory) {
      // No Step 9 inventory exists, but Step 8 has entries
      return step8Inventory.amendsEntries.some(entry =>
        ['willing', 'completed'].includes(entry.willingnessStatus)
      );
    }

    // Count eligible entries from Step 8 not in Step 9
    const eligibleStep8Entries = step8Inventory.amendsEntries.filter(
      entry => ['willing', 'completed'].includes(entry.willingnessStatus)
    );

    // Check if any eligible entries are missing from Step 9
    for (const step8Entry of eligibleStep8Entries) {
      const existsInStep9 = step9Inventory.amendsEntries.some(
        entry => entry.stepEightEntryId &&
                entry.stepEightEntryId.toString() === step8Entry._id.toString()
      );

      if (!existsInStep9) {
        return true; // Found at least one entry that needs syncing
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking sync status:', error);
    return false;
  }
}