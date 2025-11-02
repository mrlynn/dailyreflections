import OpenAI from 'openai';

/**
 * Content Moderation Utility
 * Uses OpenAI to analyze comments for inappropriate content and negative intent
 */

const openaiApiKey = process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
  console.warn('⚠️  OPENAI_API_KEY not found. Content moderation will be disabled.');
}

const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

/**
 * Moderate comment content for bad words and negative intent
 * @param {string} text - Comment text to moderate
 * @param {string} author - Author name (for context)
 * @returns {Promise<{approved: boolean, reason?: string, confidence?: number, flags?: string[]}>}
 */
export async function moderateContent(text, author = '') {
  // If OpenAI is not configured, allow all content (fail open)
  if (!openai) {
    return {
      approved: true,
      reason: 'Content moderation not configured',
    };
  }

  try {
    const prompt = `You are a content moderator for a recovery-focused support community. Analyze the following comment for appropriateness.

COMMENT TEXT:
${text}

AUTHOR NAME:
${author}

TASK:
Evaluate this comment for:
1. Profanity or inappropriate language
2. Hate speech, discrimination, or targeting specific groups
3. Harassment or personal attacks
4. Negative intent that could harm others in recovery
5. Spam or promotional content
6. Threats or dangerous content

Recovery communities need:
- Supportive, encouraging language
- Respectful disagreement is okay
- Personal sharing of struggles is encouraged
- Hope and positive transformation focus

RESPONSE FORMAT (JSON only):
{
  "approved": true/false,
  "confidence": 0.0-1.0,
  "flags": ["flag1", "flag2"] or [],
  "reason": "brief explanation"
}

Flags can include: profanity, hate_speech, harassment, negative_intent, spam, threats, inappropriate

Return ONLY valid JSON, no other text:`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Cost-effective and fast
      messages: [
        {
          role: 'system',
          content: 'You are a strict content moderator. Return only valid JSON with approved (boolean), confidence (number 0-1), flags (array), and reason (string).',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1, // Low temperature for consistency
      max_tokens: 200,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content);

    // Validate response structure
    if (typeof result.approved !== 'boolean') {
      console.error('Invalid moderation response format');
      return {
        approved: true, // Fail open
        reason: 'Moderation service error',
      };
    }

    return {
      approved: result.approved,
      confidence: result.confidence || 0.5,
      flags: result.flags || [],
      reason: result.reason || (result.approved ? 'Content approved' : 'Content flagged'),
    };
  } catch (error) {
    console.error('Content moderation error:', error);

    // If moderation fails, we fail open (allow content) to avoid blocking legitimate comments
    // But log the error for monitoring
    return {
      approved: true,
      reason: 'Moderation service unavailable',
      error: error.message,
    };
  }
}

/**
 * Check if comment contains profanity (quick client-side check)
 * This is a basic check that can be done before sending to API
 * @param {string} text - Text to check
 * @returns {boolean} True if potentially inappropriate
 */
export function quickProfanityCheck(text) {
  if (!text) return false;

  const lowerText = text.toLowerCase();
  
  // Basic profanity list (common words that should be caught)
  const profanityList = [
    // Add your specific list here or use a library
    // This is just a basic example - you may want to use a more comprehensive list
  ];

  // Check for excessive caps (potential shouting/spam)
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.7 && text.length > 20) {
    return true; // Likely spam or inappropriate
  }

  // Check for excessive special characters (potential spam)
  const specialCharRatio = (text.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length / text.length;
  if (specialCharRatio > 0.3 && text.length > 30) {
    return true; // Likely spam
  }

  // Check for very short comments (potential spam)
  if (text.trim().length < 3) {
    return true;
  }

  // Check for repeated characters (potential spam)
  if (/(.)\1{10,}/.test(text)) {
    return true; // Repeated character spam
  }

  return false;
}

