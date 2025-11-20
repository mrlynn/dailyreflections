/**
 * Feedback Analysis Script
 *
 * Runs daily (via Vercel Schedule) to enrich chatbot feedback with tone/sentiment
 * scores, detect problematic responses, and maintain roll-up statistics.
 *
 * Usage (local): node scripts/feedback/analyzeFeedback.js
 */

import 'dotenv/config';
import { OpenAI } from 'openai';
import clientPromise from '../../src/lib/mongodb.js';

const MAX_BATCH_SIZE = 100;
const NEGATIVE_TAGS = new Set(['confusing', 'inaccurate', 'not_compassionate']);
const LOW_TONE_THRESHOLD = 0.3;
const RECENT_FLAG_WINDOW_HOURS = 72;
const HISTORY_LIMIT = 20;
const DAILY_STATS_LOOKBACK_DAYS = 30;
const TAG_LABELS = {
  not_compassionate: 'Not compassionate',
  confusing: 'Confusing',
  inaccurate: 'Inaccurate or misleading',
};

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function ensureEnv() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not configured.');
    process.exit(1);
  }

  if (!openai) {
    console.error('❌ OPENAI_API_KEY is not configured.');
    process.exit(1);
  }
}

async function classifyFeedback(entry) {
  const prompt = `
You are evaluating anonymous feedback about an Alcoholics Anonymous recovery assistant chatbot.

Provide a JSON object with:
- toneScore (0 to 1, higher = more positive/supportive tone)
- sentimentLabel ("positive", "neutral", or "negative")
- compassionScore (0 to 1, higher = more compassionate)
- reasoning (short explanation)

Focus on the user's comment (if any) and the feedback type/tags.

Feedback type: ${entry.feedbackType}
Tags: ${entry.tags?.join(', ') || 'none'}
Comment: ${entry.comment || '(no comment)'}
Chatbot response excerpt: ${entry.response?.content?.slice(0, 400) || '(not supplied)'}
`;

  try {
    const response = await openai.responses.create({
      model: 'gpt-4o-mini',
      input: prompt,
      response_format: { type: 'json_object' },
    });

    const outputText = response.output_text;
    const parsed = JSON.parse(outputText);

    const toneScore = Math.max(0, Math.min(1, Number(parsed.toneScore ?? 0)));
    const compassionScore = Math.max(0, Math.min(1, Number(parsed.compassionScore ?? 0)));
    const sentimentLabel = ['positive', 'neutral', 'negative'].includes(parsed.sentimentLabel)
      ? parsed.sentimentLabel
      : 'neutral';

    return {
      toneScore,
      compassionScore,
      sentimentLabel,
      reasoning: parsed.reasoning || null,
    };
  } catch (error) {
    console.error('⚠️ Failed to classify feedback', {
      id: entry._id?.toString(),
      messageId: entry.messageId,
      error: error?.message,
    });

    return {
      toneScore: null,
      compassionScore: null,
      sentimentLabel: 'unknown',
      reasoning: 'classification_error',
      classificationError: error?.message ?? 'Unknown error',
    };
  }
}

function collectSignals(entry, analysis) {
  const signals = [];

  if (entry.feedbackType === 'thumbs_down') {
    signals.push('thumbs_down');
  }

  if (entry.tags?.some(tag => NEGATIVE_TAGS.has(tag))) {
    signals.push('negative_tag');
  }

  if (
    typeof analysis.toneScore === 'number' &&
    analysis.toneScore !== null &&
    analysis.toneScore <= LOW_TONE_THRESHOLD
  ) {
    signals.push('low_tone_score');
  }

  if (analysis.sentimentLabel === 'negative') {
    signals.push('negative_sentiment');
  }

  return Array.from(new Set(signals));
}

function determineSeverity(signals, recentCount) {
  if (recentCount >= 3) {
    return 'critical';
  }

  if (signals.includes('thumbs_down') || signals.includes('negative_sentiment')) {
    return 'high';
  }

  if (signals.length > 0) {
    return 'medium';
  }

  return 'none';
}

async function updateFlagRecord(flagsCollection, entry, analysis, signals) {
  if (signals.length === 0) return null;

  const responseMessageId = entry.response?.messageId || entry.messageId;
  if (!responseMessageId) return null;

  const update = {
    $setOnInsert: {
      responseMessageId,
      responsePreview: {
        content: entry.response?.content?.slice(0, 600) ?? null,
        citations: entry.response?.citations ?? [],
        retrievalContext: entry.response?.retrievalContext ?? [],
      },
      createdAt: new Date(),
    },
    $set: {
      updatedAt: new Date(),
      lastSignals: signals,
      lastFeedbackType: entry.feedbackType,
      lastSubmittedAt: entry.submittedAt ?? new Date(),
      lastToneScore: analysis.toneScore,
      lastSentiment: analysis.sentimentLabel,
      lastCompassionScore: analysis.compassionScore,
      lastComment: entry.comment ?? null,
    },
    $inc: {
      totalFeedback: 1,
      negativeFeedback: entry.feedbackType === 'thumbs_down' ? 1 : 0,
    },
    $addToSet: {
      activeSignals: { $each: signals },
    },
    $push: {
      history: {
        $each: [
          {
            feedbackId: entry._id,
            submittedAt: entry.submittedAt ?? new Date(),
            feedbackType: entry.feedbackType,
            tags: entry.tags ?? [],
            signals,
            toneScore: analysis.toneScore,
            sentimentLabel: analysis.sentimentLabel,
          },
        ],
        $slice: -HISTORY_LIMIT,
      },
    },
  };

  await flagsCollection.updateOne(
    { responseMessageId },
    update,
    { upsert: true }
  );

  const flagRecord = await flagsCollection.findOne({ responseMessageId });
  if (!flagRecord) return null;

  const now = Date.now();
  const recentCount = (flagRecord.history ?? []).filter(item => {
    const submittedAt = item.submittedAt ? new Date(item.submittedAt).getTime() : 0;
    return now - submittedAt <= RECENT_FLAG_WINDOW_HOURS * 60 * 60 * 1000;
  }).length;

  const severity = determineSeverity(signals, recentCount);

  await flagsCollection.updateOne(
    { responseMessageId },
    {
      $set: {
        severity,
        recentFlagCount: recentCount,
        activeSignals: Array.from(new Set([
          ...(flagRecord.activeSignals ?? []),
          ...signals,
        ])),
      },
    }
  );

  return { severity, recentCount };
}

async function enrichFeedback(feedbackCollection, flagsCollection) {
  console.log('🔍 Looking for feedback entries that need enrichment...');

  const cursor = feedbackCollection.find(
    { 'analysis.processedAt': { $exists: false } },
    { limit: MAX_BATCH_SIZE }
  );

  const pending = await cursor.toArray();

  if (!pending.length) {
    console.log('✅ No new feedback requires analysis.');
    return { processed: 0, flagged: 0 };
  }

  console.log(`📝 Found ${pending.length} feedback record(s) awaiting analysis.`);

  let processed = 0;
  let flagged = 0;

  for (const entry of pending) {
    const analysis = await classifyFeedback(entry);
    const signals = collectSignals(entry, analysis);

    const updateDoc = {
      analysis: {
        ...analysis,
        signals,
        processedAt: new Date(),
        flagged: signals.length > 0,
      },
    };

    await feedbackCollection.updateOne(
      { _id: entry._id },
      { $set: updateDoc }
    );

    if (signals.length > 0) {
      flagged += 1;
      await updateFlagRecord(flagsCollection, entry, analysis, signals);
    }

    processed += 1;
  }

  console.log(`✅ Enriched ${processed} feedback entr${processed === 1 ? 'y' : 'ies'} (${flagged} flagged).`);
  return { processed, flagged };
}

async function generateDailyStats(feedbackCollection, statsCollection) {
  console.log('📊 Updating daily feedback rollups...');

  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - DAILY_STATS_LOOKBACK_DAYS);

  const pipeline = [
    {
      $match: {
        submittedAt: { $gte: sinceDate },
      },
    },
    {
      $group: {
        _id: {
          $dateTrunc: {
            date: '$submittedAt',
            unit: 'day',
            timezone: 'America/New_York',
          },
        },
        totalCount: { $sum: 1 },
        thumbsUpCount: {
          $sum: { $cond: [{ $eq: ['$feedbackType', 'thumbs_up'] }, 1, 0] },
        },
        thumbsDownCount: {
          $sum: { $cond: [{ $eq: ['$feedbackType', 'thumbs_down'] }, 1, 0] },
        },
        avgToneScore: { $avg: '$analysis.toneScore' },
        tags: { $push: '$tags' },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ];

  const dailyStats = await feedbackCollection.aggregate(pipeline).toArray();

  for (const day of dailyStats) {
    const tagCounts = {};
    for (const tags of day.tags || []) {
      if (!Array.isArray(tags)) continue;
      for (const tag of tags) {
        if (!tag) continue;
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }

    await statsCollection.updateOne(
      { date: day._id },
      {
        $set: {
          date: day._id,
          totals: {
            total: day.totalCount,
            thumbsUp: day.thumbsUpCount,
            thumbsDown: day.thumbsDownCount,
          },
          averageToneScore: day.avgToneScore ?? null,
          tags: tagCounts,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );
  }

  console.log(`✅ Updated ${dailyStats.length} day-level rollup${dailyStats.length === 1 ? '' : 's'}.`);
  return dailyStats.length;
}

async function upsertRecommendation(recommendationsCollection, key, payload) {
  const existing = await recommendationsCollection.findOne({ key });
  const now = new Date();

  if (existing) {
    if (existing.status === 'accepted') {
      return { created: false, updated: false, skipped: true };
    }

    const updateDoc = {
      $set: {
        ...payload,
        updatedAt: now,
      },
    };

    if (existing.status === 'dismissed') {
      updateDoc.$set.status = 'pending';
    }

    await recommendationsCollection.updateOne({ _id: existing._id }, updateDoc);
    return { created: false, updated: true, skipped: false };
  }

  await recommendationsCollection.insertOne({
    key,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    ...payload,
  });

  return { created: true, updated: false, skipped: false };
}

async function createRetrievalRecommendations(flagsCollection, recommendationsCollection) {
  const recentFlags = await flagsCollection
    .find({
      $or: [
        { severity: { $in: ['critical', 'high'] } },
        { recentFlagCount: { $gte: 2 } },
        { negativeFeedback: { $gte: 3 } },
      ],
    })
    .limit(100)
    .toArray();

  if (!recentFlags.length) {
    return { created: 0, updated: 0 };
  }

  let created = 0;
  let updated = 0;

  for (const flag of recentFlags) {
    const contexts = flag.responsePreview?.retrievalContext ?? [];
    if (!contexts.length) {
      continue;
    }

    for (const context of contexts) {
      const key = context.chunkId
        ? `retrieval:${context.chunkId}`
        : `retrieval:${context.reference ?? flag.responseMessageId}`;

      const summary = `Review retrieval result "${context.reference ?? context.source}" — `
        + `${flag.negativeFeedback ?? 0} negative signal${(flag.negativeFeedback ?? 0) === 1 ? '' : 's'} recorded`;

      const payload = {
        type: 'retrieval',
        target: {
          chunkId: context.chunkId ?? null,
          reference: context.reference ?? null,
          source: context.source ?? null,
          pageNumber: context.pageNumber ?? null,
          url: context.url ?? null,
        },
        summary,
        signals: flag.lastSignals ?? [],
        metrics: {
          totalFeedback: flag.totalFeedback ?? 0,
          negativeFeedback: flag.negativeFeedback ?? 0,
          recentFlagCount: flag.recentFlagCount ?? 0,
        },
        evidence: {
          responseMessageId: flag.responseMessageId,
          lastComment: flag.lastComment ?? null,
          lastSubmittedAt: flag.lastSubmittedAt ?? flag.updatedAt ?? null,
        },
      };

      const result = await upsertRecommendation(recommendationsCollection, key, payload);
      if (result.created) created += 1;
      if (result.updated) updated += 1;
    }
  }

  return { created, updated };
}

async function createPromptRecommendations(feedbackCollection, recommendationsCollection) {
  const lookback = new Date();
  lookback.setDate(lookback.getDate() - 14);

  const promptSignals = await feedbackCollection
    .aggregate([
      {
        $match: {
          submittedAt: { $gte: lookback },
          tags: { $exists: true, $ne: [] },
          'analysis.signals': { $in: ['negative_tag', 'negative_sentiment', 'low_tone_score'] },
        },
      },
      { $unwind: '$tags' },
      {
        $match: {
          tags: { $in: ['not_compassionate', 'confusing', 'inaccurate'] },
        },
      },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 },
          examples: {
            $push: {
              comment: '$comment',
              responseMessageId: '$response.messageId',
              submittedAt: '$submittedAt',
            },
          },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ])
    .toArray();

  if (!promptSignals.length) {
    return { created: 0, updated: 0 };
  }

  let created = 0;
  let updated = 0;

  for (const signal of promptSignals) {
    if (signal.count < 3) {
      continue;
    }

    const key = `prompt:${signal._id}`;
    const label = TAG_LABELS[signal._id] ?? signal._id;

    const payload = {
      type: 'prompt',
      target: {
        tag: signal._id,
      },
      summary: `Recurring "${label}" feedback (${signal.count} reports in 14 days). Review prompt tone guidance.`,
      signals: ['prompt_tone'],
      metrics: {
        occurrences: signal.count,
        lookbackDays: 14,
      },
      evidence: {
        examples: signal.examples
          .slice(0, 3)
          .map((example) => ({
            comment: example.comment ?? null,
            responseMessageId: example.responseMessageId ?? null,
            submittedAt: example.submittedAt ?? null,
          })),
      },
    };

    const result = await upsertRecommendation(recommendationsCollection, key, payload);
    if (result.created) created += 1;
    if (result.updated) updated += 1;
  }

  return { created, updated };
}

async function generateRecommendations(feedbackCollection, flagsCollection, recommendationsCollection) {
  console.log('🧠 Generating manual review recommendations...');

  const retrieval = await createRetrievalRecommendations(flagsCollection, recommendationsCollection);
  const prompt = await createPromptRecommendations(feedbackCollection, recommendationsCollection);

  console.log(`✅ Recommendations updated (retrieval: ${retrieval.created} new / ${retrieval.updated} refreshed, prompt: ${prompt.created} new / ${prompt.updated} refreshed).`);

  return {
    retrieval,
    prompt,
  };
}

export async function runFeedbackAnalysis() {
  ensureEnv();

  const client = await clientPromise;
  const db = client.db('dailyreflections');
  const feedbackCollection = db.collection('feedback');
  const flagsCollection = db.collection('feedbackFlags');
  const statsCollection = db.collection('feedbackDailyStats');
  const recommendationsCollection = db.collection('feedbackRecommendations');

  const { processed, flagged } = await enrichFeedback(feedbackCollection, flagsCollection);
  const rollups = await generateDailyStats(feedbackCollection, statsCollection);
  const recommendations = await generateRecommendations(
    feedbackCollection,
    flagsCollection,
    recommendationsCollection
  );

  console.log('🏁 Feedback analysis complete.');
  console.log({
    processed,
    flagged,
    rollups,
    recommendations,
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runFeedbackAnalysis()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Feedback analysis failed:', error);
      process.exit(1);
    });
}

