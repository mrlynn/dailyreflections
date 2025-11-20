/**
 * Daily Thought Model
 *
 * This model represents a daily recovery thought that appears in a pop-up
 * when users visit the home page. Each thought is tied to a specific date
 * and may relate to the corresponding daily reflection.
 */

import mongoose from 'mongoose';

// Define schema if mongoose is available (not during static build)
let DailyThoughtSchema;
let DailyThought;

if (mongoose) {
  DailyThoughtSchema = new mongoose.Schema({
    // Date fields (corresponding to the date this thought is shown)
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    day: {
      type: Number,
      required: true,
      min: 1,
      max: 31
    },
    // Key for date-based lookups (format: MM-DD)
    dateKey: {
      type: String,
      required: true,
      match: /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/
    },
    // Main content fields
    title: {
      type: String,
      required: true,
      trim: true
    },
    thought: {
      type: String,
      required: true,
      trim: true
    },
    challenge: {
      type: String,
      required: false,
      trim: true
    },
    // Related reflection reference
    relatedReflectionDateKey: {
      type: String,
      required: false,
      match: /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/
    },
    // Metadata
    author: {
      type: String,
      required: false
    },
    active: {
      type: Boolean,
      default: true
    },
    // Automatic timestamps
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  });

  // Create compound index for date-based lookup
  DailyThoughtSchema.index({ month: 1, day: 1 }, { unique: true });

  // Ensure dateKey is updated when month/day changes
  DailyThoughtSchema.pre('save', function(next) {
    // Format month and day with leading zeros
    const formattedMonth = String(this.month).padStart(2, '0');
    const formattedDay = String(this.day).padStart(2, '0');
    this.dateKey = `${formattedMonth}-${formattedDay}`;
    this.updatedAt = new Date();
    next();
  });

  // Create the model
  DailyThought = mongoose.models.DailyThought || mongoose.model('DailyThought', DailyThoughtSchema);
}

export default DailyThought;