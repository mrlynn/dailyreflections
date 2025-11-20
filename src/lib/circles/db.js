import clientPromise from '@/lib/mongodb';
import { CIRCLE_COLLECTIONS, CIRCLE_MEMBER_STATUS } from './constants';

let indexesEnsured = false;

/**
 * Returns the MongoDB database reference for Circles operations.
 * Ensures collection indexes are available on first access.
 */
export async function getCirclesDb() {
  const client = await clientPromise;
  const db = client.db('dailyreflections');

  if (!indexesEnsured) {
    await ensureCircleIndexes(db);
    indexesEnsured = true;
  }

  return db;
}

/**
 * Retrieves a specific Circles collection by key.
 * @param {keyof typeof CIRCLE_COLLECTIONS} collectionKey
 */
export async function getCirclesCollection(collectionKey) {
  const db = await getCirclesDb();
  const collectionName = CIRCLE_COLLECTIONS[collectionKey];

  if (!collectionName) {
    throw new Error(`Unknown circles collection key: ${collectionKey}`);
  }

  return db.collection(collectionName);
}

/**
 * Ensures indexes for all circles collections are created.
 * @param {import('mongodb').Db} db
 */
export async function ensureCircleIndexes(db) {
  await Promise.all([
    db.collection(CIRCLE_COLLECTIONS.CIRCLES).createIndexes([
      { key: { name: 1 }, name: 'circles_name_idx' },
      { key: { createdBy: 1 }, name: 'circles_createdBy_idx' },
      { key: { isDeleted: 1, createdAt: -1 }, name: 'circles_active_idx' },
      { key: { slug: 1 }, name: 'circles_slug_unique', unique: true },
    ]),
    db.collection(CIRCLE_COLLECTIONS.MEMBERS).createIndexes([
      {
        key: { circleId: 1, userId: 1, status: 1 },
        name: 'circle_members_unique_active',
        unique: true,
      },
      {
        key: { userId: 1, status: 1 },
        name: 'circle_members_user_status_idx',
      },
      {
        key: { circleId: 1, status: 1 },
        name: 'circle_members_circle_status_idx',
      },
      {
        key: { circleId: 1, role: 1 },
        name: 'circle_members_role_idx',
        partialFilterExpression: { status: CIRCLE_MEMBER_STATUS.ACTIVE },
      },
    ]),
    db.collection(CIRCLE_COLLECTIONS.POSTS).createIndexes([
      {
        key: { circleId: 1, createdAt: -1 },
        name: 'circle_posts_recent_idx',
      },
      {
        key: { circleId: 1, stepTag: 1, createdAt: -1 },
        name: 'circle_posts_step_idx',
      },
      {
        key: { authorId: 1, createdAt: -1 },
        name: 'circle_posts_author_idx',
      },
      {
        key: { circleId: 1, isPinned: 1, pinnedAt: -1 },
        name: 'circle_posts_pinned_idx',
      },
    ]),
    db.collection(CIRCLE_COLLECTIONS.COMMENTS).createIndexes([
      {
        key: { postId: 1, createdAt: 1 },
        name: 'circle_comments_thread_idx',
      },
      {
        key: { circleId: 1, createdAt: -1 },
        name: 'circle_comments_circle_idx',
      },
    ]),
    db.collection(CIRCLE_COLLECTIONS.INVITES).createIndexes([
      {
        key: { token: 1 },
        name: 'circle_invites_token_unique',
        unique: true,
      },
      {
        key: { expiresAt: 1 },
        name: 'circle_invites_expiration_idx',
        expireAfterSeconds: 0,
      },
      {
        key: { circleId: 1, isRevoked: 1 },
        name: 'circle_invites_revoked_idx',
      },
    ]),
  ]);
}

