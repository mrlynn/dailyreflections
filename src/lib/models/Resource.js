import mongoose from '../mongoose';

const ResourceSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  summary: {
    type: String,
    trim: true,
    default: '',
  },
  body: {
    type: String,
    default: '',
  },
  resourceType: {
    type: String,
    required: true,
    trim: true,
  },
  topics: {
    type: [String],
    default: [],
  },
  aaType: {
    type: String,
    trim: true,
    default: '',
  },
  link: {
    type: String,
    trim: true,
    default: '',
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  },
  publishedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
});

ResourceSchema.index({ slug: 1 }, { unique: true });
ResourceSchema.index({ status: 1, resourceType: 1, publishedAt: -1 });
ResourceSchema.index({ topics: 1 });
ResourceSchema.index({ isFeatured: 1 });

ResourceSchema.index(
  {
    title: 'text',
    summary: 'text',
    body: 'text',
    resourceType: 'text',
    topics: 'text',
  },
  {
    name: 'resources_text_index',
    weights: {
      title: 5,
      summary: 3,
      topics: 2,
      body: 1,
      resourceType: 1,
    },
  }
);

ResourceSchema.pre('save', function handleTimestamps(next) {
  this.updatedAt = new Date();
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

ResourceSchema.pre('findOneAndUpdate', function handleUpdate(next) {
  const update = this.getUpdate() ?? {};
  update.$set = update.$set ?? {};
  update.$set.updatedAt = new Date();
  if (update.$set.status === 'published' && !update.$set.publishedAt) {
    update.$set.publishedAt = new Date();
  }
  this.setUpdate(update);
  next();
});

export default mongoose.models?.Resource || mongoose.model('Resource', ResourceSchema);

