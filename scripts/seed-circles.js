/**
 * Circles Seed Script
 *
 * Populates the database with sample users, circles, memberships, and invites
 * for local development. Safely tagged with `seedSource` so they can be reset.
 *
 * Usage:
 *   node scripts/seed-circles.js           # seed if not already present
 *   node scripts/seed-circles.js --reset   # clear previous seed data then reseed
 */

import dotenv from 'dotenv';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { MongoClient, ObjectId } from 'mongodb';
import {
  CIRCLE_COLLECTIONS,
  CIRCLE_DEFAULTS,
  CIRCLE_INVITE_MAX_DAYS,
  CIRCLE_INVITE_MODES,
  CIRCLE_MEMBER_STATUS,
  CIRCLE_ROLES,
  CIRCLE_TYPES,
  CIRCLE_VISIBILITY,
} from '../src/lib/circles/constants.js';

dotenv.config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'dailyreflections';

if (!uri) {
  console.error('❌ MONGODB_URI is not defined. Add it to your .env.local file.');
  process.exit(1);
}

const seedSource = 'seed-circles-dev';
const resetRequested = process.argv.includes('--reset');

const circleDefinitions = [
  {
    name: 'Daily Gratitude Circle',
    description:
      'A public space to share daily gratitude, wins, and encouragement for the recovery journey. Open to any verified member.',
    type: 'general',
    visibility: CIRCLE_VISIBILITY.PUBLIC,
    maxMembers: 30,
    allowMultipleInvites: true,
    createdBy: 'owner',
    members: [
      { userKey: 'owner', role: CIRCLE_ROLES.OWNER, status: CIRCLE_MEMBER_STATUS.ACTIVE },
      { userKey: 'admin', role: CIRCLE_ROLES.ADMIN, status: CIRCLE_MEMBER_STATUS.ACTIVE },
      { userKey: 'member', role: CIRCLE_ROLES.MEMBER, status: CIRCLE_MEMBER_STATUS.ACTIVE },
      {
        userKey: 'pending',
        role: CIRCLE_ROLES.MEMBER,
        status: CIRCLE_MEMBER_STATUS.PENDING,
        requestedOffsetDays: 1,
      },
    ],
    invites: [
      {
        createdBy: 'owner',
        mode: CIRCLE_INVITE_MODES.MULTI_USE,
        maxUses: 25,
        expiresInDays: 60,
      },
    ],
    posts: [
      {
        author: 'owner',
        type: 'share',
        tags: ['gratitude', 'morning'],
        createdOffsetHours: 12,
        isPinned: true,
        content:
          '<p>Grateful for another day sober and the chance to open this space for us. What is one thing you are thankful for today?</p>',
        comments: [
          {
            author: 'member',
            content: '<p>Thanks for creating this! I am grateful for the call I had with my sponsor.</p>',
          },
          {
            author: 'admin',
            content: '<p>Love seeing us rally together. Keep sharing the hope!</p>',
          },
        ],
      },
      {
        author: 'member',
        type: 'step-experience',
        stepTag: 10,
        tags: ['step10', 'inventory'],
        createdOffsetHours: 6,
        content:
          '<p>Step 10 reminder for myself tonight: pause before reacting. Dropping this here so the circle can hold me accountable.</p>',
        comments: [
          {
            author: 'owner',
            content: '<p>Great share. Text me if you want to run through the nightly review later.</p>',
          },
        ],
      },
    ],
  },
  {
    name: 'Step 4 Workshop',
    description:
      'Private workbook circle for sponsors and sponsees actively working Step 4 inventories together.',
    type: 'sponsor-circle',
    visibility: CIRCLE_VISIBILITY.PRIVATE,
    maxMembers: 12,
    allowMultipleInvites: false,
    createdBy: 'sponsor',
    members: [
      { userKey: 'sponsor', role: CIRCLE_ROLES.OWNER, status: CIRCLE_MEMBER_STATUS.ACTIVE },
      { userKey: 'member', role: CIRCLE_ROLES.MEMBER, status: CIRCLE_MEMBER_STATUS.ACTIVE },
      {
        userKey: 'alumni',
        role: CIRCLE_ROLES.MEMBER,
        status: CIRCLE_MEMBER_STATUS.LEFT,
        leftOffsetDays: 7,
      },
    ],
    invites: [
      {
        createdBy: 'sponsor',
        mode: CIRCLE_INVITE_MODES.SINGLE_USE,
        expiresInDays: 14,
      },
    ],
    posts: [
      {
        author: 'sponsor',
        type: 'linked-entry',
        tags: ['step4', 'sponsor-notes'],
        createdOffsetHours: 24,
        linkedSource: {
          sourceType: 'reflection',
          entryId: 'seed-reflection-001',
          snapshot:
            '<p>Inventory reminder: focus on facts, avoid judgment. Bring compassion for yourself into the work.</p>',
        },
        content:
          '<p>Sharing my notes from last night’s workshop so everyone has the same guidance going into the weekend writing.</p>',
        comments: [
          {
            author: 'member',
            content:
              '<p>Appreciate the notes! I will use these questions as a guide while I write tonight.</p>',
          },
        ],
      },
    ],
  },
];

const slugify = (value) =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);

async function generateSeedCircleSlug(db, name, fallback) {
  const base = slugify(name) || `circle-${fallback?.toString()?.slice(-6) || Date.now()}`;
  let candidate = base;
  let counter = 1;

  while (true) {
    const existing = await db.collection(CIRCLE_COLLECTIONS.CIRCLES).findOne({ slug: candidate });
    if (!existing) {
      return candidate;
    }

    counter += 1;
    candidate = `${base}-${counter}`;
    if (candidate.length > 70) {
      candidate = `${base.slice(0, 60)}-${counter}`;
    }
  }
}

async function ensureSeedUsers(db, now) {
  const passwordHash = await bcrypt.hash('circles-dev-pass', 12);

  const baseUser = {
    password: passwordHash,
    emailVerified: now,
    onboarding: {
      setupComplete: true,
      completedAt: now,
      lastStep: 3,
    },
    profile: {
      isComplete: true,
      bio: 'Seed user for Circles development.',
    },
    updatedAt: now,
    seedSource,
  };

  const userBlueprints = [
    {
      key: 'owner',
      email: 'grace.owner@example.com',
      name: 'Grace Owner',
      displayName: 'Grace O.',
      isAdmin: true,
    },
    {
      key: 'admin',
      email: 'alex.admin@example.com',
      name: 'Alex Admin',
      displayName: 'Alex A.',
      isAdmin: true,
    },
    {
      key: 'member',
      email: 'morgan.member@example.com',
      name: 'Morgan Member',
      displayName: 'Morgan M.',
      isAdmin: false,
    },
    {
      key: 'pending',
      email: 'pat.pending@example.com',
      name: 'Pat Pending',
      displayName: 'Pat P.',
      isAdmin: false,
    },
    {
      key: 'sponsor',
      email: 'sam.sponsor@example.com',
      name: 'Sam Sponsor',
      displayName: 'Sam S.',
      isAdmin: false,
    },
    {
      key: 'alumni',
      email: 'amy.alumni@example.com',
      name: 'Amy Alumni',
      displayName: 'Amy A.',
      isAdmin: false,
    },
  ];

  const userIds = {};

  for (const blueprint of userBlueprints) {
    const { key, email, name, displayName, isAdmin } = blueprint;
    const existing = await db.collection('users').findOne({ email });

    if (existing && existing.seedSource !== seedSource && !resetRequested) {
      console.warn(
        `⚠️  User with email ${email} exists but was not created by this seed. Skipping modification.`,
      );
      userIds[key] = existing._id;
      continue;
    }

    const baseDoc = {
      ...baseUser,
      name,
      displayName,
      email,
      isAdmin,
      image: existing?.image ?? null,
    };

    const upsertResult = await db.collection('users').updateOne(
      { email },
      {
        $set: baseDoc,
        $setOnInsert: {
          _id: existing?._id ?? new ObjectId(),
          createdAt: now,
        },
      },
      { upsert: true },
    );

    const finalUser =
      existing ??
      (await db
        .collection('users')
        .findOne({ _id: upsertResult.upsertedId?._id ?? upsertResult.upsertedId }));

    userIds[key] = finalUser._id;
  }

  return userIds;
}

function buildInviteDoc({ circleId, createdById, definition, now }) {
  const maxUses =
    definition.mode === CIRCLE_INVITE_MODES.SINGLE_USE
      ? 1
      : definition.maxUses ?? CIRCLE_DEFAULTS.MAX_MEMBERS;

  let expiresAt = null;
  if (definition.expiresAt) {
    const temp = new Date(definition.expiresAt);
    if (!Number.isNaN(temp.getTime())) {
      expiresAt = temp;
    }
  } else if (definition.expiresInDays) {
    const safeDays = Math.min(definition.expiresInDays, CIRCLE_INVITE_MAX_DAYS);
    expiresAt = new Date(now.getTime() + safeDays * 24 * 60 * 60 * 1000);
  }

  return {
    circleId,
    token: definition.token ?? crypto.randomBytes(24).toString('base64url'),
    mode: definition.mode ?? CIRCLE_INVITE_MODES.MULTI_USE,
    maxUses,
    usedCount: definition.usedCount ?? 0,
    expiresAt,
    isRevoked: definition.isRevoked ?? false,
    createdBy: createdById,
    createdAt: now,
    updatedAt: now,
    seedSource,
  };
}

async function seedCircles() {
  const client = new MongoClient(uri);
  const now = new Date();

  try {
    console.log('🚀 Connecting to MongoDB...');
    await client.connect();
    const db = client.db(dbName);

    if (resetRequested) {
      console.log('🧹 Clearing previous circle seed data...');
      const collectionsToClear = [
        CIRCLE_COLLECTIONS.CIRCLES,
        CIRCLE_COLLECTIONS.MEMBERS,
        CIRCLE_COLLECTIONS.POSTS,
        CIRCLE_COLLECTIONS.COMMENTS,
        CIRCLE_COLLECTIONS.INVITES,
        'users',
      ];

      await Promise.all(
        collectionsToClear.map(async (name) => {
          const collection = db.collection(name);
          const { deletedCount } = await collection.deleteMany({ seedSource });
          if (deletedCount) {
            console.log(`   • Removed ${deletedCount} docs from ${name}`);
          }
        }),
      );
    } else {
      const existingCount = await db
        .collection(CIRCLE_COLLECTIONS.CIRCLES)
        .countDocuments({ seedSource });
      if (existingCount > 0) {
        console.log(
          `✅ Circles seed data already exists (${existingCount} circles). Use --reset to regenerate.`,
        );
        return;
      }
    }

    console.log('🛠️  Ensuring indexes for circles collections...');
    await ensureSeedCircleIndexes(db);

    console.log('👥 Ensuring seed users...');
    const userIds = await ensureSeedUsers(db, now);

    console.log('🧩 Inserting circles, members, and invites...');
    const circlesCollection = db.collection(CIRCLE_COLLECTIONS.CIRCLES);
    const membersCollection = db.collection(CIRCLE_COLLECTIONS.MEMBERS);
    const invitesCollection = db.collection(CIRCLE_COLLECTIONS.INVITES);
    const postsCollection = db.collection(CIRCLE_COLLECTIONS.POSTS);
    const commentsCollection = db.collection(CIRCLE_COLLECTIONS.COMMENTS);

    let circleCount = 0;
    let memberCount = 0;
    let inviteCount = 0;
    let postCount = 0;
    let commentCount = 0;

    for (const definition of circleDefinitions) {
      const activeMembers = definition.members.filter(
        (member) => member.status === CIRCLE_MEMBER_STATUS.ACTIVE,
      );

      const circleId = new ObjectId();
      const circleDoc = {
        _id: circleId,
        name: definition.name,
        description: definition.description,
        type: CIRCLE_TYPES.includes(definition.type) ? definition.type : 'general',
        visibility: definition.visibility ?? CIRCLE_VISIBILITY.PRIVATE,
        maxMembers: definition.maxMembers ?? CIRCLE_DEFAULTS.MAX_MEMBERS,
        allowMultipleInvites:
          definition.allowMultipleInvites ?? (definition.visibility !== CIRCLE_VISIBILITY.PRIVATE),
        slug: await generateSeedCircleSlug(db, definition.name, circleId),
        createdBy: userIds[definition.createdBy],
        memberCount: activeMembers.length,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
        seedSource,
      };

      await circlesCollection.insertOne(circleDoc);
      circleCount += 1;

      const memberDocs = definition.members.map((memberDef) => {
        const timestamps = {
          createdAt: now,
          updatedAt: now,
          joinedAt:
            memberDef.status === CIRCLE_MEMBER_STATUS.ACTIVE
              ? memberDef.joinedAt ?? new Date(now.getTime() - (memberDef.joinedOffsetDays ?? 0) * 86400000)
              : null,
          leftAt:
            memberDef.status === CIRCLE_MEMBER_STATUS.LEFT
              ? new Date(now.getTime() - (memberDef.leftOffsetDays ?? 0) * 86400000)
              : undefined,
        };

        return {
          circleId: circleId,
          userId: userIds[memberDef.userKey],
          role: memberDef.role ?? CIRCLE_ROLES.MEMBER,
          status: memberDef.status ?? CIRCLE_MEMBER_STATUS.PENDING,
          joinedAt: timestamps.joinedAt,
          leftAt: timestamps.leftAt,
          requestedAt:
            memberDef.status === CIRCLE_MEMBER_STATUS.PENDING
              ? new Date(now.getTime() - (memberDef.requestedOffsetDays ?? 0) * 86400000)
              : undefined,
          createdAt: timestamps.createdAt,
          updatedAt: timestamps.updatedAt,
          seedSource,
        };
      });

      if (memberDocs.length) {
        const result = await membersCollection.insertMany(memberDocs);
        memberCount += result.insertedCount;
      }

      if (definition.invites?.length) {
        const inviteDocs = definition.invites.map((inviteDef) =>
          buildInviteDoc({
            circleId,
            createdById: userIds[inviteDef.createdBy ?? definition.createdBy],
            definition: inviteDef,
            now,
          }),
        );

        const result = await invitesCollection.insertMany(inviteDocs);
        inviteCount += result.insertedCount;
      }

      if (definition.posts?.length) {
        for (const postDef of definition.posts) {
          const createdAt = new Date(
            now.getTime() - (postDef.createdOffsetHours ?? 0) * 60 * 60 * 1000,
          );

          const postDoc = {
            circleId,
            authorId: userIds[postDef.author ?? definition.createdBy],
            type: postDef.type ?? 'share',
            content: postDef.content,
            stepTag: postDef.stepTag ?? null,
            tags: Array.isArray(postDef.tags) ? postDef.tags : [],
            linkedSource: postDef.linkedSource ?? null,
            commentCount: 0,
            isDeleted: false,
            isPinned: Boolean(postDef.isPinned),
            pinnedAt: postDef.isPinned ? createdAt : null,
            pinnedBy: postDef.isPinned
              ? userIds[postDef.pinnedBy ?? postDef.author ?? definition.createdBy]
              : null,
            createdAt,
            updatedAt: createdAt,
            seedSource,
          };

          const { insertedId } = await postsCollection.insertOne(postDoc);
          postCount += 1;

          if (postDef.comments?.length) {
            const commentDocs = postDef.comments.map((commentDef, index) => {
              const commentCreatedAt = new Date(createdAt.getTime() + (index + 1) * 10 * 60 * 1000);
              return {
                circleId,
                postId: insertedId,
                authorId: userIds[commentDef.author ?? postDef.author ?? definition.createdBy],
                content: commentDef.content,
                parentId: null,
                isDeleted: false,
                createdAt: commentCreatedAt,
                updatedAt: commentCreatedAt,
                seedSource,
              };
            });

            const result = await commentsCollection.insertMany(commentDocs);
            const insertedComments =
              result.insertedCount ?? Object.keys(result.insertedIds || {}).length;
            commentCount += insertedComments;

            await postsCollection.updateOne(
              { _id: insertedId },
              {
                $set: {
                  commentCount: insertedComments,
                  updatedAt: commentDocs[commentDocs.length - 1].createdAt,
                },
              },
            );
          }
        }
      }
    }

    console.log('\n✅ Circles seed data created successfully!');
    console.log(`   • Circles:     ${circleCount}`);
    console.log(`   • Memberships: ${memberCount}`);
    console.log(`   • Invites:     ${inviteCount}`);
    console.log(`   • Posts:       ${postCount}`);
    console.log(`   • Comments:    ${commentCount}`);
    console.log('\n🔐 Sample credentials (email / password)');
    console.log('   grace.owner@example.com / circles-dev-pass');
    console.log('   alex.admin@example.com / circles-dev-pass');
    console.log('   morgan.member@example.com / circles-dev-pass');
    console.log('   pat.pending@example.com / circles-dev-pass');
    console.log('   sam.sponsor@example.com / circles-dev-pass');
    console.log('   amy.alumni@example.com / circles-dev-pass');
  } catch (error) {
    console.error('❌ Circles seed failed:', error);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

seedCircles();

async function ensureSeedCircleIndexes(db) {
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

