import mongoose from '../mongoose';

const SponsorFeedbackEntrySchema = new mongoose.Schema({
  authorName: {
    type: String,
    trim: true,
    maxlength: 120,
    default: ''
  },
  body: {
    type: String,
    required: true,
    trim: true,
    maxlength: 4000
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

/**
 * Step 4 Inventory Schema
 *
 * Stores a user's 4th step inventory data
 * including progress tracking and creation date
 */
const Step4Schema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  startedAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'archived'],
    default: 'in_progress',
  },
  progress: {
    currentStep: {
      type: Number,
      default: 0,
    },
    resentmentsComplete: {
      type: Boolean,
      default: false,
    },
    fearsComplete: {
      type: Boolean,
      default: false,
    },
    sexConductComplete: {
      type: Boolean,
      default: false,
    },
    harmsDoneComplete: {
      type: Boolean,
      default: false,
    },
  },
  resentments: [{
    who: String,
    cause: String,
    affects: {
      selfEsteem: Boolean,
      security: Boolean,
      ambitions: Boolean,
      personalRelations: Boolean,
      sexRelations: Boolean
    },
    myPart: String,
  }],
  fears: [{
    fear: String,
    why: String,
    affects: String,
    isRational: Boolean,
  }],
  sexConduct: {
    relationships: [{
      person: String,
      whoHurt: String,
      causeJealousy: String,
      liedTo: String,
      whatShouldHaveDone: String,
    }],
    patterns: String,
    idealBehavior: String,
  },
  harmsDone: [{
    who: String,
    what: String,
    affects: String,
    motives: String,
  }],
  sponsorFeedback: {
    resentments: {
      type: [SponsorFeedbackEntrySchema],
      default: []
    },
    fears: {
      type: [SponsorFeedbackEntrySchema],
      default: []
    },
    sexConduct: {
      type: [SponsorFeedbackEntrySchema],
      default: []
    },
    harmsDone: {
      type: [SponsorFeedbackEntrySchema],
      default: []
    }
  },
  isPasswordProtected: {
    type: Boolean,
    default: false,
  },
  passwordHash: String,
  passwordHint: String,
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

// Create index for faster user lookups
Step4Schema.index({ userId: 1 });

// Add another index for userId and status for looking up active inventories
Step4Schema.index({ userId: 1, status: 1 });

export default mongoose.models?.Step4 || mongoose.model('Step4', Step4Schema);