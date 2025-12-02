import mongoose from 'mongoose';

/**
 * MongoDB model for System Observation Agent results
 *
 * Stores the complete output of each observation run for historical tracking,
 * trend analysis, and administrative review.
 */
const SystemObservationSchema = new mongoose.Schema({
  // Observation metadata
  observation_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  observation_type: {
    type: String,
    enum: ['hourly', 'daily', 'weekly', 'on-demand'],
    required: true,
    index: true,
  },
  time_period: {
    start: { type: Date, required: true },
    end: { type: Date, required: true },
  },

  // Collected metrics
  volunteer_metrics: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  meeting_attendance: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  support_hotspots: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  journey_analytics: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  system_health: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },

  // Analysis results
  insights: [{
    insight_type: {
      type: String,
      enum: ['opportunity', 'warning', 'recommendation', 'celebration'],
    },
    category: String,
    title: String,
    description: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
    },
    actionable: Boolean,
    suggested_actions: [String],
    impact: String,
    data_supporting: mongoose.Schema.Types.Mixed,
  }],

  alerts: [{
    alert_type: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent', 'critical'],
    },
    message: String,
    recommended_action: String,
    timestamp: Date,
    acknowledged: { type: Boolean, default: false },
    acknowledged_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    acknowledged_at: Date,
  }],

  trends: [{
    trend_type: String,
    direction: {
      type: String,
      enum: ['up', 'down', 'stable', 'volatile'],
    },
    description: String,
    confidence: Number,
  }],

  // Summary report
  summary_report: String,

  // Execution metadata
  processing_start_time: Date,
  processing_end_time: Date,
  execution_path: [String],
  errors: [String],

  // Status
  status: {
    type: String,
    enum: ['running', 'completed', 'failed'],
    default: 'running',
  },

  // Admin review
  reviewed: { type: Boolean, default: false },
  reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewed_at: Date,
  admin_notes: String,
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// Indexes for efficient querying
SystemObservationSchema.index({ observation_type: 1, createdAt: -1 });
SystemObservationSchema.index({ 'time_period.start': 1, 'time_period.end': 1 });
SystemObservationSchema.index({ status: 1 });
SystemObservationSchema.index({ 'alerts.acknowledged': 1 });

// Virtual for duration
SystemObservationSchema.virtual('processing_duration_ms').get(function() {
  if (this.processing_start_time && this.processing_end_time) {
    return this.processing_end_time - this.processing_start_time;
  }
  return null;
});

// Method to get unacknowledged alerts
SystemObservationSchema.methods.getUnacknowledgedAlerts = function() {
  return this.alerts.filter(alert => !alert.acknowledged);
};

// Method to acknowledge an alert
SystemObservationSchema.methods.acknowledgeAlert = function(alertIndex, userId) {
  if (this.alerts[alertIndex]) {
    this.alerts[alertIndex].acknowledged = true;
    this.alerts[alertIndex].acknowledged_by = userId;
    this.alerts[alertIndex].acknowledged_at = new Date();
  }
};

// Static method to get latest observation by type
SystemObservationSchema.statics.getLatestByType = function(observationType) {
  return this.findOne({ observation_type: observationType })
    .sort({ createdAt: -1 })
    .exec();
};

// Static method to get observations in date range
SystemObservationSchema.statics.getByDateRange = function(startDate, endDate) {
  return this.find({
    'time_period.start': { $gte: startDate },
    'time_period.end': { $lte: endDate },
  })
    .sort({ createdAt: -1 })
    .exec();
};

export default mongoose.models.SystemObservation || mongoose.model('SystemObservation', SystemObservationSchema);
