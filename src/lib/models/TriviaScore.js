/**
 * MongoDB model for Trivia leaderboard scores
 */

import mongoose from 'mongoose';

// Define the schema
const TriviaScoreSchema = new mongoose.Schema({
  displayName: {
    type: String,
    required: true,
    trim: true,
  },
  userId: {
    type: String,
    required: false, // Optional: can be null for anonymous users
    index: true,
  },
  score: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    index: true,
  },
  totalQuestions: {
    type: Number,
    required: true,
    min: 1
  },
  difficulty: { // Average difficulty of questions
    type: Number,
    required: false,
  },
  timeSpent: { // Time in seconds
    type: Number,
    required: false,
  },
  date: {
    type: Date,
    default: Date.now,
    index: true,
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

// Create compound indexes for efficient queries
TriviaScoreSchema.index({ category: 1, score: -1 }); // For category leaderboards
TriviaScoreSchema.index({ userId: 1, category: 1, score: -1 }); // For user's best scores by category

// Create the model if it doesn't exist already
const TriviaScore = mongoose.models.TriviaScore || mongoose.model('TriviaScore', TriviaScoreSchema);

export default TriviaScore;