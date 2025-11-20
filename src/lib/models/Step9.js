'use strict';

import mongoose from 'mongoose';

const Step9Schema = new mongoose.Schema({
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

  // Amends entries (linked from Step 8)
  amendsEntries: [
    {
      person: { type: String, required: true, trim: true },
      harmDone: { type: String, required: true, trim: true },

      // Step 9 specific fields
      amendStatus: {
        type: String,
        enum: ['not_started', 'planned', 'in_progress', 'completed', 'deferred', 'not_possible'],
        default: 'not_started',
      },

      // Planning fields
      planForAmends: { type: String, trim: true },
      plannedDate: { type: Date },

      // Execution fields
      actualAmendsDate: { type: Date },
      amendsMethod: {
        type: String,
        enum: ['in_person', 'phone', 'letter', 'email', 'indirect', 'other'],
      },
      amendsDescription: { type: String, trim: true },

      // Outcome fields
      outcome: { type: String, trim: true },
      followUpNeeded: { type: Boolean, default: false },
      followUpNotes: { type: String, trim: true },

      // Meta
      stepEightEntryId: { type: mongoose.Schema.Types.ObjectId }, // Reference to original Step 8 entry if applicable
      priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      },
      notes: { type: String, trim: true },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    }
  ],

  // Progress tracking
  progress: {
    totalEntries: { type: Number, default: 0 },
    entriesPlanned: { type: Number, default: 0 },
    entriesInProgress: { type: Number, default: 0 },
    entriesCompleted: { type: Number, default: 0 },
    entriesDeferred: { type: Number, default: 0 },
    entriesNotPossible: { type: Number, default: 0 }
  }
});

// Pre-save hook to update progress metrics
Step9Schema.pre('save', function(next) {
  if (this.isModified('amendsEntries')) {
    // Count totals
    this.progress.totalEntries = this.amendsEntries.length;

    // Count by status
    this.progress.entriesPlanned = this.amendsEntries.filter(entry =>
      entry.amendStatus === 'planned').length;

    this.progress.entriesInProgress = this.amendsEntries.filter(entry =>
      entry.amendStatus === 'in_progress').length;

    this.progress.entriesCompleted = this.amendsEntries.filter(entry =>
      entry.amendStatus === 'completed').length;

    this.progress.entriesDeferred = this.amendsEntries.filter(entry =>
      entry.amendStatus === 'deferred').length;

    this.progress.entriesNotPossible = this.amendsEntries.filter(entry =>
      entry.amendStatus === 'not_possible').length;
  }

  // Update the updatedAt timestamp
  this.updatedAt = Date.now();

  next();
});

// Automatically create a Step9 collection or use the existing one
export default mongoose.models.Step9 || mongoose.model('Step9', Step9Schema);