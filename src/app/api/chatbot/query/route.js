import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { randomUUID, createHash } from 'crypto';
import { searchCombinedSources, formatCitations, createLLMPrompt } from '@/lib/chatbotSearch';
import { parseDateFromQuery, parseDateKey, getTodayKey } from '@/utils/dateUtils';
import clientPromise from '@/lib/mongodb';

// Initialize OpenAI client for generating responses (separate from embedding generation)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Month names for date formatting
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];

const SUICIDE_KEYWORDS = [
  'suicide',
  'kill myself',
  'killing myself',
  'end my life',
  'want to die',
  'can\'t go on',
  'life isn\'t worth',
  'self harm',
  'hurt myself',
  'take my life',
  'overdose',
];

const RELAPSE_KEYWORDS = [
  'drink again',
  'have a drink',
  'buy a drink',
  'get drunk',
  'relapse',
  'use again',
  'slip up',
  'fall off the wagon',
  'take a drink',
];

const CRISIS_RESPONSE_TEMPLATES = {
  suicidal_ideation: `I'm really sorry that you're feeling like this right now. You don't have to face it alone—there are people who can help right now.

If you're in the United States, please call or text 988 to reach the Suicide and Crisis Lifeline.

If you're outside the U.S., you can visit https://findahelpline.com or search “mental health helpline” in your country to connect with someone immediately.

You matter. You're not alone, and help is available 24/7.`,
  relapse_risk: `It sounds like you're really struggling with the idea of drinking again. You don't have to go through this by yourself.

Reaching out for support can make a difference. You might consider talking to someone at a meeting, connecting with your sponsor, or calling the AA Hotline at (212) 870-3400 (United States).

We can also look for meetings near you together. Would you like me to show you nearby meetings or online options?`,
};

const CRISIS_DEFAULT_TEMPLATE = `I'm really sorry that you're feeling this way. You're not alone—there are people who can help right now.

In the United States, you can call or text 988 for the Suicide and Crisis Lifeline. If you're elsewhere, visit https://findahelpline.com to find support in your area.

You deserve help and compassion. Please reach out to someone right away.`;

function getCrisisResponse(templateKey) {
  return CRISIS_RESPONSE_TEMPLATES[templateKey] || CRISIS_DEFAULT_TEMPLATE;
}

function containsKeyword(message, keywords) {
  const normalized = message.toLowerCase();
  return keywords.some(keyword => normalized.includes(keyword));
}

async function detectCrisisIndicators(message) {
  const normalized = message.trim().toLowerCase();
  const triggeredReasons = [];

  if (containsKeyword(normalized, SUICIDE_KEYWORDS)) {
    triggeredReasons.push('keyword_suicidal');
  }

  if (containsKeyword(normalized, RELAPSE_KEYWORDS)) {
    triggeredReasons.push('keyword_relapse');
  }

  let moderationCategory = null;
  try {
    const moderation = await openai.moderations.create({
      model: 'omni-moderation-latest',
      input: message,
    });
    const result = moderation.results?.[0];
    if (result?.categories?.self_harm) {
      moderationCategory = 'self_harm';
      triggeredReasons.push('moderation_self_harm');
    }
    if (result?.categories?.violence_self_harm) {
      moderationCategory = 'self_harm';
      triggeredReasons.push('moderation_violence_self_harm');
    }
  } catch (error) {
    console.error('Failed to run moderation check:', error);
  }

  if (triggeredReasons.some(reason => reason.includes('suicidal')) || moderationCategory === 'self_harm') {
    return {
      triggered: true,
      intent: 'suicidal_ideation',
      responseTemplate: 'suicidal_ideation',
      triggeredBy: triggeredReasons,
    };
  }

  if (triggeredReasons.some(reason => reason.includes('relapse'))) {
    return {
      triggered: true,
      intent: 'relapse_risk',
      responseTemplate: 'relapse_risk',
      triggeredBy: triggeredReasons,
    };
  }

  return {
    triggered: false,
    intent: null,
    responseTemplate: null,
    triggeredBy: [],
  };
}

async function logCrisisEvent({
  sessionId,
  detectedIntent,
  responseTemplateKey,
  triggeredBy = [],
}) {
  try {
    const client = await clientPromise;
    const db = client.db('dailyreflections');
    await db.collection('crisis_logs').insertOne({
      timestamp: new Date(),
      sessionHash: sessionId ? createHash('sha256').update(sessionId).digest('hex') : null,
      detectedIntent,
      responseTemplate: responseTemplateKey,
      escalationFlag: detectedIntent === 'suicidal_ideation',
      triggeredBy,
    });
  } catch (error) {
    console.error('Failed to log crisis event:', error);
  }
}

async function evaluateTone(responseText) {
  try {
    const evaluation = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are assessing whether an assistant message sounds warm, compassionate, and supportive. Respond with a single word: "warm" if the tone is empathetic, or "cold" if it feels clinical, dismissive, or detached.',
        },
        {
          role: 'user',
          content: responseText,
        },
      ],
      max_tokens: 4,
      temperature: 0,
    });

    const tone = evaluation.choices?.[0]?.message?.content?.trim().toLowerCase() ?? 'warm';
    return tone.includes('cold') ? 'cold' : 'warm';
  } catch (error) {
    console.error('Tone evaluation failed:', error);
    return 'warm';
  }
}

async function rewriteWithCompassion(originalResponse, userQuery) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You rewrite assistant responses to be warm, compassionate, supportive, and grounded in AA principles. Preserve the factual content and citations while avoiding medical or clinical advice.',
        },
        {
          role: 'user',
          content: `User query: "${userQuery}"\n\nOriginal response:\n"""${originalResponse}"""\n\nRewrite the response so it stays accurate but feels gentle, empathetic, and encouraging.`,
        },
      ],
      temperature: 0.4,
      max_tokens: 800,
    });

    const rewritten = completion.choices?.[0]?.message?.content?.trim();
    return rewritten || originalResponse;
  } catch (error) {
    console.error('Failed to rewrite response compassionately:', error);
    return originalResponse;
  }
}

async function ensureCompassionateTone(responseText, userQuery) {
  const tone = await evaluateTone(responseText);
  if (tone === 'warm') {
    return {
      response: responseText,
      toneCheck: {
        initialTone: tone,
        adjusted: false,
      },
    };
  }

  const rewritten = await rewriteWithCompassion(responseText, userQuery);
  return {
    response: rewritten,
    toneCheck: {
      initialTone: tone,
      adjusted: true,
    },
  };
}

/**
 * POST /api/chatbot/query
 * Processes chatbot queries using RAG with AA literature
 *
 * Body parameters:
 * - query: String question from the user
 * - chatHistory: Array of previous messages for context
 *
 * Returns:
 * - response: Generated text response
 * - citations: Array of citations with sources and relevance scores
 */
export async function POST(request) {
  console.log('🤖 API: Chatbot query received');

  try {
    // Parse request body
    const body = await request.json();
    const { query, chatHistory = [], sessionId = null } = body;
    let todaysReflection = null;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query string must not be empty' },
        { status: 400 }
      );
    }

    console.log('📝 Chatbot query:', query);

    // Crisis detection layer
    const crisisCheck = await detectCrisisIndicators(query);
    if (crisisCheck.triggered) {
      const messageId = `msg_${randomUUID()}`;
      const crisisResponse = getCrisisResponse(crisisCheck.responseTemplate);

      await logCrisisEvent({
        sessionId,
        detectedIntent: crisisCheck.intent,
        responseTemplateKey: crisisCheck.responseTemplate,
        triggeredBy: crisisCheck.triggeredBy,
      });

      return NextResponse.json({
        messageId,
        response: crisisResponse,
        citations: [],
        retrievalContext: [],
        metadata: {
          query,
          crisis: {
            detected: true,
            intent: crisisCheck.intent,
            template: crisisCheck.responseTemplate,
          },
        },
      });
    }

    // Step 0: Check if query references a specific date reflection
    const dateKey = parseDateFromQuery(query);
    if (dateKey) {
      console.log(`📅 Date detected in query: ${dateKey}`);

      try {
        const client = await clientPromise;
        const db = client.db('dailyreflections');
        const { month, day } = parseDateKey(dateKey);

        const reflection = await db.collection('reflections').findOne({
          month,
          day,
        });

        if (reflection) {
          // Format the reflection for display
          const formattedDate = `${MONTH_NAMES[month - 1]} ${day}`;

          // Combine all reflection content
          const reflectionText = `${reflection.title}\n\n${reflection.quote}\n\n${reflection.comment}\n\n${reflection.reference}`;

          // Check if the query is asking about the meaning/interpretation of the reflection
          // Words that indicate a request for explanation rather than just the content
          const explanationWords = /\b(mean|meaning|explain|interpret|understand|significance|about|thoughts on)\b/i;

          // If user is asking for the meaning, use the LLM to generate an explanation
          if (explanationWords.test(query)) {
            console.log('📝 User is asking for an explanation of the reflection, using LLM');

            // Store reflection for use in LLM prompt later
            // Continue with the normal flow to use the LLM for explanation
            todaysReflection = reflection;

            // Add special instruction to ensure reflection is properly explained
            // The function will continue to the search and LLM steps
          } else {
            // User is just asking for the reflection content itself, return it directly
            console.log('📄 User is asking for the reflection content, returning directly');
            const messageId = `msg_${randomUUID()}`;

            return NextResponse.json({
              messageId,
              response: `Here's the daily reflection for ${formattedDate}:\n\n${reflectionText}`,
              citations: [{
                source: 'Daily Reflection',
                reference: `Daily Reflection, ${formattedDate} - ${reflection.title}`,
                text: reflectionText.substring(0, 250) + '...',
                score: 1.0,
                scorePercentage: '100%',
                url: `/${dateKey}`,
              }],
              retrievalContext: [{
                source: 'Daily Reflection',
                reference: `Daily Reflection, ${formattedDate} - ${reflection.title}`,
                score: 1.0,
                chunkId: null,
                pageNumber: null,
                dateKey,
                textSnippet: reflectionText.substring(0, 500),
                url: `/${dateKey}`,
              }],
              metadata: {
                query,
                llmPrompt: null,
                todaysReflection: {
                  title: reflection.title,
                  month: reflection.month,
                  day: reflection.day,
                  reference: reflection.reference,
                  dateKey,
                },
                toneCheck: null,
                crisis: {
                  detected: false,
                  intent: null,
                },
              },
            });
          }
        } else {
          // Format date for error message
          const formattedDate = `${MONTH_NAMES[month - 1]} ${day}`;
          
          return NextResponse.json({
            response: `I couldn't find a reflection for ${formattedDate}. The reflection may not exist in the database for that date.`,
            citations: []
          });
        }
      } catch (error) {
        console.error('Error fetching reflection by date:', error);
        // Fall through to regular search if date lookup fails
      }
    }

    // Step 1: Perform vector search across both collections
    const searchResults = await searchCombinedSources(query, {
      limit: 7, // Increased limit to get more potential results
      minScore: 0.58, // Slightly lowered threshold to allow more literature matches
    });

    console.log(`✅ Found ${searchResults.length} relevant passages`);

    // If no relevant content found, provide a fallback response
    if (!searchResults || searchResults.length === 0) {
      const messageId = `msg_${randomUUID()}`;

      return NextResponse.json({
        messageId,
        response: "I don't have enough information to answer that question specifically based on AA literature. If you'd like to know more about Alcoholics Anonymous, you might try asking about the 12 steps, the Big Book, or daily reflections.",
        citations: [],
        retrievalContext: [],
        metadata: {
          query,
          llmPrompt: null,
          todaysReflection: null,
          toneCheck: null,
          crisis: {
            detected: false,
            intent: null,
          },
        },
      });
    }

    // Step 2: Check if this might be a query about today's reflection
    const todayPattern = /\b(today|today['']?s|current|this)\b/i;
    const reflectionPattern = /\b(reflection|reading|message|daily)\b/i;

    if (todayPattern.test(query) && reflectionPattern.test(query)) {
      try {
        // Fetch today's reflection to include in the context
        const client = await clientPromise;
        const db = client.db('dailyreflections');
        const todayKey = getTodayKey();
        const { month, day } = parseDateKey(todayKey);

        todaysReflection = await db.collection('reflections').findOne({
          month,
          day,
        });

        if (todaysReflection) {
          console.log(`📅 Including today's reflection (${todayKey}) in context`);
        }
      } catch (error) {
        console.error('Error fetching today\'s reflection:', error);
        // Continue without today's reflection if fetch fails
      }
    }

    // Step 3: Format citations for the response
    const citations = formatCitations(searchResults);

    // Step 4: Add today's reflection to citations if used
    if (todaysReflection) {
      const todayKey = getTodayKey();
      const formattedDate = `${MONTH_NAMES[todaysReflection.month - 1]} ${todaysReflection.day}`;

      // Add today's reflection to the citations
      citations.unshift({
        source: 'Daily Reflection',
        reference: `Today's Reflection (${formattedDate}) - ${todaysReflection.title}`,
        text: `${todaysReflection.quote}\n\n${todaysReflection.comment.substring(0, 150)}...`,
        score: 1.0,
        scorePercentage: '100%',
        url: `/${todayKey}`,
      });
    }

    // Step 5: Create LLM prompt with context including today's reflection
    const prompt = createLLMPrompt(query, searchResults, chatHistory, todaysReflection);

    // Step 4: Generate response using OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4", // Can be adjusted based on needs and availability
      messages: [
        { role: "system", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const generatedText = response.choices[0].message.content.trim();
    const toneResult = await ensureCompassionateTone(generatedText, query);
    const messageId = `msg_${randomUUID()}`;

    console.log('✅ Generated response with citations');

    return NextResponse.json({
      messageId,
      response: toneResult.response,
      citations: citations,
      retrievalContext: searchResults.map(result => ({
        source: result.source,
        reference: result.reference,
        score: parseFloat(result.score.toFixed(4)),
        chunkId: result.chunk_id || null,
        pageNumber: result.page_number || null,
        dateKey: result.dateKey || null,
        textSnippet: result.text ? result.text.substring(0, 500) : null,
        url: result.url || null,
      })),
      metadata: {
        query,
        llmPrompt: prompt,
        todaysReflection: todaysReflection ? {
          title: todaysReflection.title,
          month: todaysReflection.month,
          day: todaysReflection.day,
          reference: todaysReflection.reference,
          dateKey: `${String(todaysReflection.month).padStart(2, '0')}-${String(todaysReflection.day).padStart(2, '0')}`,
        } : null,
        toneCheck: toneResult.toneCheck,
        crisis: {
          detected: false,
          intent: null,
        },
      }
    });
  } catch (error) {
    console.error('❌ API: Error processing chatbot query:', error);

    return NextResponse.json(
      {
        error: 'Failed to process query',
        details: error.message
      },
      { status: 500 }
    );
  }
}