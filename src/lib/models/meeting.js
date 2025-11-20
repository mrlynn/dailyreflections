/**
 * Meeting Model
 * Schema and utilities for AA meetings compatible with Meeting Guide JSON API
 *
 * Reference:
 * - Meeting Guide JSON spec: https://github.com/code4recovery/spec
 * - TSML-UI: https://github.com/code4recovery/tsml-ui
 */
import { ObjectId } from 'mongodb';
import clientPromise from '../mongodb';

// Collection name
const COLLECTION_NAME = 'meetings';

/**
 * Meeting schema (Meeting Guide JSON format):
 * {
 *   _id: ObjectId,
 *
 *   // Required fields for Meeting Guide
 *   name: String,                 // "Sunday Serenity"
 *   slug: String,                 // "sunday-serenity-14" (unique)
 *   day: Number | Number[],       // 0=Sun..6=Sat
 *   time: String,                 // "18:00" 24h format
 *
 *   // Location info (use either formatted_address OR split fields)
 *   formatted_address: String,    // "123 Main St, New York, NY 10001, USA"
 *   address: String,              // "123 Main St"
 *   city: String,                 // "New York"
 *   state: String,                // "NY"
 *   postal_code: String,          // "10001"
 *   country: String,              // "US"
 *
 *   // Optional fields
 *   end_time: String,             // "19:00" 24h format
 *   conference_url: String,       // URL for online meeting
 *   conference_phone: String,     // Phone number for dial-in
 *   location: String,             // Building/location name "Alano Club"
 *   location_notes: String,       // "In the basement"
 *   group: String,                // Group name
 *   group_notes: String,          // Notes about the group
 *   notes: String,                // General meeting notes
 *   types: [String],              // ["O","D","LGBTQ", ...]
 *   latitude: Number,             // 40.7128
 *   longitude: Number,            // -74.0060
 *   timezone: String,             // "America/New_York"
 *   approximate: String,          // "yes" or "no"
 *   url: String,                  // Website URL
 *   edit_url: String,             // URL for editing info
 *   feedback_url: String,         // URL for feedback
 *
 *   // Metadata fields (not part of Meeting Guide JSON)
 *   active: Boolean,              // Whether meeting is active/visible
 *   created_by: ObjectId,         // User who created the meeting
 *   updated: String,              // "YYYY-MM-DD HH:MM:SS" UTC
 *   created_at: Date,
 *   updated_at: Date
 * }
 */

/**
 * Get the meetings collection
 */
export async function getMeetingsCollection() {
  const client = await clientPromise;
  const db = client.db();
  return db.collection(COLLECTION_NAME);
}

/**
 * Create necessary indexes for meetings collection
 */
export async function createMeetingIndexes() {
  const collection = await getMeetingsCollection();

  // Create unique index on slug
  await collection.createIndex({ slug: 1 }, { unique: true });

  // Create index on day for quick lookup by day of week
  await collection.createIndex({ day: 1 });

  // Create index on location fields for geographic queries
  await collection.createIndex({ city: 1, state: 1 });

  // Create geospatial index if coordinates are available
  await collection.createIndex({
    coordinates: "2dsphere"
  }, {
    sparse: true
  });

  // Create text index for search
  await collection.createIndex({
    name: 'text',
    location: 'text',
    group: 'text',
    notes: 'text',
    formatted_address: 'text'
  });

  console.log('Meeting indexes created');
}

/**
 * Get all active meetings
 * @param {Object} options - Query options
 * @param {Number|Number[]} options.day - Filter by day(s) of week
 * @param {String} options.city - Filter by city
 * @param {String} options.state - Filter by state
 * @param {String} options.type - Filter by meeting type
 * @param {Boolean} options.includeInactive - Whether to include inactive meetings
 * @returns {Promise<Array>} - Array of meetings
 */
export async function getAllMeetings({
  day = null,
  city = null,
  state = null,
  type = null,
  includeInactive = false
} = {}) {
  const collection = await getMeetingsCollection();

  const query = {};

  // Only include active meetings by default
  if (!includeInactive) {
    query.active = { $ne: false };
  }

  // Apply filters
  if (day !== null) {
    if (Array.isArray(day)) {
      query.day = { $in: day };
    } else {
      query.day = day;
    }
  }

  if (city) {
    query.city = city;
  }

  if (state) {
    query.state = state;
  }

  if (type) {
    query.types = type;
  }

  const meetings = await collection.find(query).toArray();
  return meetings;
}

/**
 * Get meeting by slug
 * @param {String} slug - Meeting slug
 * @returns {Promise<Object|null>} - Meeting object or null if not found
 */
export async function getMeetingBySlug(slug) {
  if (!slug) throw new Error('Slug is required');

  const collection = await getMeetingsCollection();
  return collection.findOne({ slug });
}

/**
 * Create new meeting
 * @param {Object} meeting - Meeting data
 * @returns {Promise<Object>} - Created meeting
 */
export async function createMeeting(meeting) {
  if (!meeting.name) throw new Error('Meeting name is required');
  if (!meeting.slug) throw new Error('Meeting slug is required');
  if (meeting.day === undefined) throw new Error('Day is required');

  // Ensure either formatted_address or address components are provided
  if (!meeting.formatted_address && !meeting.address) {
    throw new Error('Either formatted_address or address components are required');
  }

  const collection = await getMeetingsCollection();

  // Check for duplicate slug
  const existing = await getMeetingBySlug(meeting.slug);
  if (existing) {
    throw new Error(`Meeting with slug "${meeting.slug}" already exists`);
  }

  // Set timestamps
  const now = new Date();
  meeting.created_at = now;
  meeting.updated_at = now;
  meeting.updated = now.toISOString().replace('T', ' ').split('.')[0];

  // Set default values
  meeting.active = meeting.active !== false;

  // Convert created_by to ObjectId if provided
  if (meeting.created_by) {
    meeting.created_by = new ObjectId(meeting.created_by);
  }

  // Insert the meeting
  const result = await collection.insertOne(meeting);

  return { ...meeting, _id: result.insertedId };
}

/**
 * Update meeting
 * @param {String} slug - Meeting slug
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} - Updated meeting
 */
export async function updateMeeting(slug, updates) {
  if (!slug) throw new Error('Slug is required');

  const collection = await getMeetingsCollection();

  // Verify meeting exists
  const existingMeeting = await getMeetingBySlug(slug);
  if (!existingMeeting) {
    throw new Error(`Meeting with slug "${slug}" not found`);
  }

  // Set updated timestamp
  const now = new Date();
  updates.updated_at = now;
  updates.updated = now.toISOString().replace('T', ' ').split('.')[0];

  // Remove fields that shouldn't be updated
  delete updates._id;
  delete updates.created_at;
  delete updates.created_by;

  // If updating slug, verify new slug is unique
  if (updates.slug && updates.slug !== slug) {
    const conflictingMeeting = await getMeetingBySlug(updates.slug);
    if (conflictingMeeting) {
      throw new Error(`Meeting with slug "${updates.slug}" already exists`);
    }
  }

  await collection.updateOne({ slug }, { $set: updates });

  // Return updated meeting
  return getMeetingBySlug(updates.slug || slug);
}

/**
 * Delete meeting
 * @param {String} slug - Meeting slug
 * @returns {Promise<Boolean>} - True if deleted successfully
 */
export async function deleteMeeting(slug) {
  if (!slug) throw new Error('Slug is required');

  const collection = await getMeetingsCollection();

  const result = await collection.deleteOne({ slug });

  return result.deletedCount === 1;
}

/**
 * Generate Meeting Guide compatible JSON
 * @param {Array} meetings - Array of meeting objects
 * @returns {Array} - Meeting Guide spec JSON array
 */
export function generateMeetingGuideJson(meetings) {
  if (!Array.isArray(meetings)) {
    throw new Error('Meetings must be an array');
  }

  return meetings.map(meeting => {
    // Create base meeting object with required fields
    const jsonMeeting = {
      name: meeting.name,
      slug: meeting.slug,
      // Ensure day is properly formatted for Meeting Guide spec
      day: Array.isArray(meeting.day)
        ? meeting.day.map(d => parseInt(d, 10)) // Ensure integers in array
        : parseInt(meeting.day, 10),  // Ensure integer for single day
      time: meeting.time
    };

    // Add location info (either formatted_address or components)
    if (meeting.formatted_address) {
      jsonMeeting.formatted_address = meeting.formatted_address;
    } else {
      if (meeting.address) jsonMeeting.address = meeting.address;
      if (meeting.city) jsonMeeting.city = meeting.city;
      if (meeting.state) jsonMeeting.state = meeting.state;
      if (meeting.postal_code) jsonMeeting.postal_code = meeting.postal_code;
      if (meeting.country) jsonMeeting.country = meeting.country;
    }

    // Add optional fields if they exist
    const optionalFields = [
      'end_time', 'conference_url', 'conference_phone', 'location',
      'location_notes', 'group', 'group_notes', 'notes', 'types',
      'latitude', 'longitude', 'timezone', 'approximate',
      'url', 'edit_url', 'feedback_url', 'updated'
    ];

    optionalFields.forEach(field => {
      if (meeting[field] !== undefined && meeting[field] !== null) {
        jsonMeeting[field] = meeting[field];
      }
    });

    return jsonMeeting;
  });
}