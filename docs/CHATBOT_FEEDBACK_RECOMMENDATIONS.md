# Chatbot Feedback Recommendations – Manual Review Workflow

## Overview
Nightly and weekly cron jobs produce guidance for human reviewers instead of mutating retrieval weights automatically. Use this workflow to inspect issues, adjust RAG configuration, and capture decisions.

## Data Flow
1. `scripts/feedback/analyzeFeedback.js` (nightly via Vercel Schedule)
   - Enriches new feedback with tone/sentiment metadata.
   - Updates `feedbackFlags` and `feedbackDailyStats`.
   - Generates recommendation records in `feedbackRecommendations`:
     - **Retrieval** suggestions – recurring negative signals tied to specific chunks/sources.
     - **Prompt** suggestions – repeated tone/clarity complaints (e.g., `not_compassionate`, `confusing`).
2. `scripts/feedback/cleanupFeedback.js` (weekly)
   - Trims sensitive/raw content after 90 days while keeping metrics intact.

## Collections
- `feedbackFlags`: flag history per assistant response.
- `feedbackRecommendations`:
  ```javascript
  {
    key: 'retrieval:chunk_123' | 'prompt:not_compassionate',
    type: 'retrieval' | 'prompt',
    target: { chunkId?, reference?, source?, tag? },
    summary: String,
    signals: Array<String>,
    metrics: Object,        // e.g., totalFeedback, occurrences, recentFlagCount
    evidence: Object,       // sample comments, message ids, timestamps
    status: 'pending' | 'accepted' | 'dismissed',
    actionHistory: [
      {
        performedAt: Date,
        status: String,
        note: String?,
        userId: String?,
        userEmail: String?
      }
    ],
    createdAt: Date,
    updatedAt: Date
  }
  ```

## Admin Dashboard (`/admin/feedback`)
Tabs:
- **All Feedback** – raw submissions with thumbs up/down, tags, sentiment.
- **Flagged Responses** – aggregated signals needing close attention.
- **Recommendations** – manual review queue for retrieval/prompt changes.

Recommendation actions:
- **Mark as accepted** – indicates the remediation was performed outside the app (e.g., adjust chunk weight, update prompt instructions).
- **Dismiss** – acknowledges but chooses not to act.
- **Reopen** – returns a dismissed/accepted recommendation to pending.
- Optional reviewer note is persisted with each action.

## Reviewer Responsibilities
1. Visit `/admin/feedback` regularly (daily recommended).
2. Inspect “Recommendations” tab:
   - For retrieval issues: confirm the cited chunk/source, adjust weights/content manually, then mark accepted.
   - For prompt issues: tweak `createLLMPrompt` instructions or other prompt templates, note the action, mark accepted.
3. If no change is needed, add a short explanation and dismiss.
4. Keep an eye on the trend chart to watch positive/negative rates and tone scores.

## Operational Notes
- Automated scripts never alter retrieval weights or prompt text; humans remain in control.
- Every admin action is recorded for auditability.
- Accepted recommendations remain visible (status + history) for institutional memory.
- Dismissed items reappear as “pending” if new negative signals accumulate in future runs.

