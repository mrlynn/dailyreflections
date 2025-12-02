import mongoose from 'mongoose';

/**
 * MongoDB model for Generated Art Assets
 *
 * Stores AI-generated art created by the Ghibli Art Director Agent.
 * Supports daily reflections, step illustrations, badges, and seasonal graphics.
 */
const GeneratedArtSchema = new mongoose.Schema({
  // Unique identifier for the art asset
  asset_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  // Type of art asset
  art_type: {
    type: String,
    enum: ['daily_reflection', 'step_illustration', 'milestone_badge', 'seasonal_graphic', 'custom'],
    required: true,
    index: true,
  },

  // Related content reference
  content_reference: {
    // For daily_reflection: date string (YYYY-MM-DD)
    // For step_illustration: step number (1-12)
    // For milestone_badge: milestone type (e.g., "30_days", "90_days", "1_year")
    // For seasonal_graphic: season name (e.g., "spring", "summer", "fall", "winter")
    reference_key: String,
    reference_value: String,
  },

  // Art prompt and generation
  prompt: {
    original_prompt: String,
    enhanced_prompt: String, // Ghibli-style enhanced by agent
    generation_model: {
      type: String,
      default: 'dall-e-3',
    },
    model_parameters: {
      size: {
        type: String,
        default: '1024x1024',
      },
      quality: {
        type: String,
        default: 'standard',
      },
      style: {
        type: String,
        default: 'natural',
      },
    },
  },

  // Generated image details
  image: {
    url: String, // OpenAI CDN URL (temporary)
    stored_url: String, // Our permanent storage URL (S3, Cloudinary, etc.)
    width: Number,
    height: Number,
    format: String,
    size_bytes: Number,
  },

  // Ghibli style characteristics applied
  style_characteristics: {
    color_palette: [String], // e.g., ["warm", "pastel", "nature-inspired"]
    mood: String, // e.g., "peaceful", "hopeful", "reflective"
    elements: [String], // e.g., ["nature", "sky", "water", "light"]
    composition: String, // e.g., "centered", "rule-of-thirds", "panoramic"
  },

  // Generation metadata
  generation: {
    requested_at: Date,
    completed_at: Date,
    duration_ms: Number,
    attempt_number: {
      type: Number,
      default: 1,
    },
    cost_usd: Number, // Track API costs
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'generating', 'completed', 'failed', 'archived'],
    default: 'pending',
    index: true,
  },

  // Quality and approval
  quality_review: {
    auto_approved: Boolean,
    manual_review_required: Boolean,
    approved: Boolean,
    approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approved_at: Date,
    rejection_reason: String,
  },

  // Usage tracking
  usage: {
    first_used_at: Date,
    last_used_at: Date,
    usage_count: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },

  // Versioning (for regenerations)
  version: {
    type: Number,
    default: 1,
  },
  previous_version_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GeneratedArt',
  },
  superseded_by_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GeneratedArt',
  },

  // Error tracking
  errors: [String],

  // Admin metadata
  generated_by_agent: {
    type: Boolean,
    default: true,
  },
  manual_override: {
    type: Boolean,
    default: false,
  },
  notes: String,
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// Indexes for efficient querying
GeneratedArtSchema.index({ art_type: 1, status: 1 });
GeneratedArtSchema.index({ 'content_reference.reference_key': 1, 'content_reference.reference_value': 1 });
GeneratedArtSchema.index({ 'usage.active': 1, art_type: 1 });
GeneratedArtSchema.index({ createdAt: -1 });
GeneratedArtSchema.index({ 'quality_review.approved': 1 });

// Virtual for full image URL
GeneratedArtSchema.virtual('current_image_url').get(function() {
  return this.image.stored_url || this.image.url;
});

// Method to mark as used
GeneratedArtSchema.methods.recordUsage = function() {
  if (!this.usage.first_used_at) {
    this.usage.first_used_at = new Date();
  }
  this.usage.last_used_at = new Date();
  this.usage.usage_count += 1;
  return this.save();
};

// Method to archive (soft delete)
GeneratedArtSchema.methods.archive = function() {
  this.status = 'archived';
  this.usage.active = false;
  return this.save();
};

// Static method to get active art by type and reference
GeneratedArtSchema.statics.getActiveArt = function(artType, referenceKey, referenceValue) {
  return this.findOne({
    art_type: artType,
    'content_reference.reference_key': referenceKey,
    'content_reference.reference_value': referenceValue,
    status: 'completed',
    'usage.active': true,
    'quality_review.approved': { $ne: false }, // Not explicitly rejected
  })
    .sort({ version: -1, createdAt: -1 })
    .exec();
};

// Static method to get all art for a specific reference
GeneratedArtSchema.statics.getAllVersions = function(artType, referenceKey, referenceValue) {
  return this.find({
    art_type: artType,
    'content_reference.reference_key': referenceKey,
    'content_reference.reference_value': referenceValue,
  })
    .sort({ version: -1, createdAt: -1 })
    .exec();
};

// Static method to get art requiring review
GeneratedArtSchema.statics.getArtRequiringReview = function() {
  return this.find({
    status: 'completed',
    'quality_review.manual_review_required': true,
    'quality_review.approved': { $exists: false },
  })
    .sort({ createdAt: -1 })
    .exec();
};

// Pre-save hook to set asset_id
GeneratedArtSchema.pre('save', function(next) {
  if (!this.asset_id) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    this.asset_id = `art_${this.art_type}_${timestamp}_${random}`;
  }
  next();
});

export default mongoose.models.GeneratedArt || mongoose.model('GeneratedArt', GeneratedArtSchema);
