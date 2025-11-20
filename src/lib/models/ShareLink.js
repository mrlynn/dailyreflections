import mongoose from '../mongoose';

/**
 * ShareLink Schema
 *
 * Stores information about shared 4th step inventory links
 * including who created them, expiration, and access tracking
 */
const ShareLinkSchema = new mongoose.Schema({
  // Unique code for the share link (used in URL)
  shareCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Reference to the inventory being shared
  inventoryId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Step4'
  },

  // User who created the share link
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },

  // When the link was created
  createdAt: {
    type: Date,
    default: Date.now
  },

  // When the link expires
  expiresAt: {
    type: Date,
    required: true
  },

  // Whether the shared inventory requires a password
  isPasswordProtected: {
    type: Boolean,
    default: false
  },

  // Number of times the link has been accessed
  accessCount: {
    type: Number,
    default: 0
  },

  // Optional note from the user to their sponsor
  note: {
    type: String,
    default: ''
  },

  // Status of the share link
  status: {
    type: String,
    enum: ['active', 'revoked'],
    default: 'active'
  }
});

// Create index for efficient queries
ShareLinkSchema.index({ userId: 1 });
ShareLinkSchema.index({ expiresAt: 1 });
ShareLinkSchema.index({ inventoryId: 1 });

export default mongoose.models?.ShareLink || mongoose.model('ShareLink', ShareLinkSchema);