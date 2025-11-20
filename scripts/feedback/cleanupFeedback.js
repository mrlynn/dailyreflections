/**
 * Feedback Cleanup Script
 *
 * Runs weekly (via Vercel Schedule) to prune sensitive/raw fields
 * from historical chatbot feedback that is no longer needed for analysis.
 *
 * Usage (local): node scripts/feedback/cleanupFeedback.js
 */

import 'dotenv/config';
import clientPromise from '../../src/lib/mongodb.js';

const RETENTION_DAYS = 90;
const BATCH_SIZE = 200;

function ensureEnv() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not configured.');
    process.exit(1);
  }
}

async function pruneFeedback(feedbackCollection, flagsCollection) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

  console.log(`🧹 Pruning feedback entries submitted before ${cutoffDate.toISOString()}`);

  const candidatesCursor = feedbackCollection.find(
    {
      submittedAt: { $lte: cutoffDate },
      'analysis.flagged': { $ne: true },
      'cleanup.pruned': { $ne: true },
    },
    {
      projection: { _id: 1, response: 1, userMessage: 1, comment: 1, messageId: 1 },
      limit: BATCH_SIZE,
    }
  );

  const candidates = await candidatesCursor.toArray();
  if (!candidates.length) {
    console.log('✅ No feedback records require pruning.');
    return 0;
  }

  const messageIds = candidates
    .map((entry) => entry.response?.messageId || entry.messageId)
    .filter(Boolean);

  const flaggedResponseIds = new Set();
  if (messageIds.length) {
    const flagged = await flagsCollection
      .find({ responseMessageId: { $in: messageIds } }, { projection: { responseMessageId: 1 } })
      .toArray();
    flagged.forEach((doc) => flaggedResponseIds.add(doc.responseMessageId));
  }

  let pruned = 0;

  for (const entry of candidates) {
    const responseMessageId = entry.response?.messageId || entry.messageId;
    if (flaggedResponseIds.has(responseMessageId)) {
      continue;
    }

    await feedbackCollection.updateOne(
      { _id: entry._id },
      {
        $set: {
          cleanup: {
            pruned: true,
            prunedAt: new Date(),
            note: 'Sensitive/raw content removed after retention window.',
          },
          'response.content': entry.response?.content
            ? entry.response.content.slice(0, 200)
            : null,
          'response.metadata.llmPrompt': null,
          comment: null,
          'userMessage.content': entry.userMessage?.content
            ? entry.userMessage.content.slice(0, 120)
            : null,
        },
      }
    );

    pruned += 1;
  }

  console.log(`✅ Pruned ${pruned} feedback entr${pruned === 1 ? 'y' : 'ies'} this run.`);
  return pruned;
}

export async function runFeedbackCleanup() {
  ensureEnv();

  const client = await clientPromise;
  const db = client.db('dailyreflections');
  const feedbackCollection = db.collection('feedback');
  const flagsCollection = db.collection('feedbackFlags');

  const pruned = await pruneFeedback(feedbackCollection, flagsCollection);

  console.log('🏁 Feedback cleanup complete.', { pruned });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runFeedbackCleanup()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Feedback cleanup failed:', error);
      process.exit(1);
    });
}

