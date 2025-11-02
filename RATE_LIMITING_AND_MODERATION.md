# Rate Limiting & Content Moderation

## Overview

The Daily Reflections app includes comprehensive rate limiting and AI-powered content moderation to ensure a safe, supportive environment for the recovery community.

## Features

### 1. Rate Limiting

**Purpose**: Prevent spam and abuse by limiting comment submissions per IP address.

**Configuration**:
- **Window**: 1 hour (60 minutes)
- **Limit**: 10 comments per IP per hour
- **Tracking**: IP address-based using MongoDB

**How It Works**:
1. Each comment submission is tracked by client IP address
2. Rate limit records are stored in the `rateLimits` collection
3. Old records automatically expire after 2 hours (MongoDB TTL index)
4. When limit is exceeded, user receives a 429 status with reset time

**Error Response**:
```json
{
  "error": "Rate limit exceeded. You can post X more comment(s) after [time].",
  "code": "RATE_LIMIT_EXCEEDED",
  "remaining": 0,
  "resetAt": "2024-01-15T14:30:00.000Z"
}
```

### 2. Content Moderation

**Purpose**: Detect inappropriate content, negative intent, and content that violates community guidelines.

**Technology**: OpenAI GPT-4o-mini for AI-powered analysis

**What It Checks**:
1. **Profanity**: Inappropriate language
2. **Hate Speech**: Discrimination or targeting groups
3. **Harassment**: Personal attacks or bullying
4. **Negative Intent**: Harmful content for recovery community
5. **Spam**: Promotional or repetitive content
6. **Threats**: Dangerous or threatening language

**Moderation Process**:
1. **Quick Check**: Client-side pattern detection (excessive caps, special chars, etc.)
2. **AI Analysis**: OpenAI analyzes sentiment, intent, and appropriateness
3. **Decision**: Approve or reject with specific reason

**Error Response**:
```json
{
  "error": "Your comment does not meet our community guidelines...",
  "code": "CONTENT_NOT_APPROVED",
  "flags": ["negative_intent", "harassment"]
}
```

## Setup

### 1. Rate Limiting Indexes

Create MongoDB indexes for rate limiting:

```bash
npm run setup-rate-limits
```

This creates:
- Unique index on `ipAddress` for fast lookups
- TTL index on `windowStart` for automatic cleanup

### 2. Environment Variables

Ensure `.env.local` includes:

```env
MONGODB_URI=mongodb+srv://...
OPENAI_API_KEY=sk-...  # Required for content moderation
```

**Note**: If `OPENAI_API_KEY` is not set, content moderation will be disabled (fail-open behavior).

## Implementation Details

### Rate Limiter (`src/lib/rateLimiter.js`)

- Tracks submissions by IP address
- Sliding window algorithm (1 hour window)
- Automatic cleanup of expired records
- Returns remaining count and reset time

### Content Moderation (`src/lib/contentModeration.js`)

**Quick Check** (Client-side):
- Excessive capitalization detection
- Special character spam detection
- Repeated character patterns
- Minimum length validation

**AI Moderation**:
- Uses OpenAI GPT-4o-mini
- JSON response format for consistency
- Confidence scoring (0.0 - 1.0)
- Flag categorization for audit trail

### Comments API (`src/app/api/comments/route.js`)

**Request Flow**:
1. Validate input (dateKey, author, body)
2. Quick profanity/spam check
3. Rate limit check
4. AI content moderation
5. Save to database (if all checks pass)

**Response Headers**:
- `X-RateLimit-Remaining`: Number of comments remaining
- `X-RateLimit-Reset`: ISO timestamp when limit resets

## User Experience

### CommentForm Component

The form displays user-friendly error messages:

- **Rate Limit**: Shows remaining count and reset time
- **Content Flagged**: Shows specific reason from moderation
- **General Errors**: Generic error message with retry option

### Error Messages

**Rate Limit Exceeded**:
```
You've posted too many comments recently. Please wait until [time] to post again. 
We limit comments to 10 per hour to keep the community safe and supportive.
```

**Content Not Approved**:
```
Your comment doesn't meet our community guidelines. Please ensure your comment 
is supportive, respectful, and appropriate for a recovery community.
```

## Configuration

### Adjusting Rate Limits

Edit `src/lib/rateLimiter.js`:

```javascript
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_COMMENTS_PER_WINDOW = 10; // Comments per window
```

### Modifying Moderation Sensitivity

Edit `src/lib/contentModeration.js`:

```javascript
// Adjust temperature for stricter/more lenient moderation
temperature: 0.1, // Lower = more strict
```

## Database Schema

### rateLimits Collection

```javascript
{
  _id: ObjectId,
  ipAddress: String,      // Unique index
  count: Number,          // Current count in window
  windowStart: Date,      // TTL index (expires after 2h)
  lastRequest: Date
}
```

### comments Collection (Enhanced)

```javascript
{
  // ... existing fields ...
  moderationPassed: Boolean,
  moderationTimestamp: Date
}
```

## Monitoring

### Rate Limit Metrics

Check rate limit usage:
```javascript
// In MongoDB
db.rateLimits.find().sort({ count: -1 })
```

### Content Moderation Logs

Flagged content is logged to console:
```javascript
console.warn('Content flagged:', {
  author,
  flags: moderation.flags,
  reason: moderation.reason,
  confidence: moderation.confidence,
});
```

## Best Practices

1. **Fail Open**: If moderation fails, allow content (log for review)
2. **User-Friendly Messages**: Clear, supportive error messages
3. **Privacy**: IP addresses are only used for rate limiting, not stored long-term
4. **Monitoring**: Review flagged content to improve moderation
5. **Adjustment**: Fine-tune limits based on community needs

## Cost Considerations

### Content Moderation

- **Model**: GPT-4o-mini (~$0.15/1M tokens input, $0.60/1M tokens output)
- **Average**: ~100-200 tokens per comment
- **Cost**: ~$0.00003-0.00006 per comment check

**Example**: 1,000 comments/day = ~$0.03-0.06/day = ~$1-2/month

## Troubleshooting

### Rate Limits Not Working

1. Check indexes: `npm run setup-rate-limits`
2. Verify MongoDB connection
3. Check IP address detection (may be "unknown" in development)

### Content Moderation Not Working

1. Verify `OPENAI_API_KEY` in `.env.local`
2. Check OpenAI API status
3. Review error logs for API issues
4. Moderation fails open (allows content) if service unavailable

### IP Address Detection

The system tries multiple headers:
1. `x-forwarded-for` (most proxies)
2. `x-real-ip` (nginx)
3. `cf-connecting-ip` (Cloudflare)

In development, IP may show as "unknown" - this is normal.

## Future Enhancements

- [ ] User authentication-based rate limiting (more accurate)
- [ ] Moderation queue for manual review
- [ ] Machine learning model fine-tuning
- [ ] Per-user moderation history
- [ ] Appeal process for flagged content
- [ ] Whitelist/blacklist management

