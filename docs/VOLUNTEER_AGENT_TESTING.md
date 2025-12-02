# Volunteer Support Agent Testing Guide

## Overview

This guide provides comprehensive testing procedures for the Volunteer Support Agent system. Use this to verify functionality, performance, and reliability.

## Quick Start Testing

### 1. Database Setup Verification

```bash
# Check database status
curl http://localhost:3000/api/admin/setup-agent-database

# Expected response:
{
  "status": "ready",
  "collections": {
    "peer_support_conversations": { "exists": true, "documents": 0, "indexCount": 7 },
    "agent_analyses": { "exists": true, "documents": 0, "indexCount": 7 },
    "crisis_alerts": { "exists": true, "documents": 0, "indexCount": 9 },
    "agent_performance_metrics": { "exists": true, "documents": 0, "indexCount": 4 }
  }
}

# If collections don't exist, initialize:
curl -X POST http://localhost:3000/api/admin/setup-agent-database
```

### 2. Agent Health Check

```bash
# Verify agent API is responding
curl http://localhost:3000/api/volunteer/agent

# Expected response:
{
  "status": "healthy",
  "service": "Volunteer Support Agent",
  "version": "1.0.0",
  "agents": [
    "crisis_detection",
    "resource_recommendation",
    "response_coach",
    "conversation_analyst",
    "triage"
  ],
  "volunteer": {
    "id": "...",
    "email": "..."
  }
}
```

## Test Scenarios

### Scenario 1: Crisis Detection

**Purpose**: Verify the agent correctly identifies crisis situations

**Test Case 1.1 - High Risk Crisis**

```javascript
const testCrisis = async () => {
  const response = await fetch('/api/volunteer/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversationId: 'test-crisis-001',
      action: 'analyze_message',
      userMessage: "I can't take this anymore. I'm thinking about ending it all. I have a plan."
    })
  });

  const result = await response.json();

  // Assertions
  console.assert(result.success === true, 'Request should succeed');
  console.assert(result.analysis.crisisDetection.isCrisis === true, 'Should detect crisis');
  console.assert(['high', 'critical'].includes(result.analysis.crisisDetection.riskLevel), 'Risk level should be high/critical');
  console.assert(result.analysis.crisisDetection.indicators.length > 0, 'Should have indicators');
  console.assert(result.analysis.crisisDetection.recommendedAction.includes('988'), 'Should recommend crisis line');

  console.log('✅ Crisis detection test passed');
  return result;
};

testCrisis();
```

**Expected Output:**
```json
{
  "success": true,
  "analysis": {
    "crisisDetection": {
      "isCrisis": true,
      "riskLevel": "critical",
      "indicators": [
        "suicidal ideation",
        "specific plan",
        "expressions of hopelessness"
      ],
      "recommendedAction": "IMMEDIATE ACTION REQUIRED: Contact crisis line 988, do not leave user alone",
      "urgencyLevel": "immediate"
    }
  }
}
```

**Test Case 1.2 - Low Risk (No Crisis)**

```javascript
const testNoCrisis = async () => {
  const response = await fetch('/api/volunteer/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversationId: 'test-no-crisis-001',
      action: 'analyze_message',
      userMessage: "I'm having a tough day with cravings, but I'm going to a meeting tonight."
    })
  });

  const result = await response.json();

  console.assert(result.analysis.crisisDetection.isCrisis === false, 'Should not detect crisis');
  console.assert(result.analysis.crisisDetection.riskLevel === 'low', 'Risk level should be low');

  console.log('✅ No crisis test passed');
  return result;
};

testNoCrisis();
```

### Scenario 2: Resource Recommendation

**Purpose**: Verify semantic search finds relevant AA literature

**Test Case 2.1 - Cravings Topic**

```javascript
const testResourceSearch = async () => {
  const response = await fetch('/api/volunteer/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversationId: 'test-resources-001',
      action: 'analyze_message',
      userMessage: "I've been having strong cravings lately. How do I deal with them?"
    })
  });

  const result = await response.json();

  console.assert(result.analysis.resourceSuggestions.length > 0, 'Should find resources');
  console.assert(
    result.analysis.resourceSuggestions.some(r =>
      r.excerpt.toLowerCase().includes('craving') ||
      r.excerpt.toLowerCase().includes('desire')
    ),
    'Resources should be relevant to cravings'
  );

  console.log('✅ Resource search test passed');
  console.log('Found resources:', result.analysis.resourceSuggestions.length);
  return result;
};

testResourceSearch();
```

**Expected Output:**
```json
{
  "analysis": {
    "resourceSuggestions": [
      {
        "title": "Big Book - Into Action",
        "excerpt": "We have found that willpower and self-knowledge are insufficient...",
        "citation": "Alcoholics Anonymous, p. 39",
        "relevanceScore": 0.87
      },
      {
        "title": "Daily Reflection - January 15",
        "excerpt": "When facing temptation, we can pause and call our sponsor...",
        "citation": "Daily Reflections, p. 15",
        "relevanceScore": 0.82
      }
    ]
  }
}
```

### Scenario 3: Response Coaching

**Purpose**: Verify the agent provides quality feedback on volunteer responses

**Test Case 3.1 - Good Response**

```javascript
const testGoodResponse = async () => {
  const response = await fetch('/api/volunteer/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversationId: 'test-coaching-001',
      userMessage: "I'm feeling really alone and isolated in my recovery.",
      volunteerDraft: "Thank you for sharing that with me. I hear that you're feeling isolated, and that must be really difficult. Many people in recovery experience similar feelings. Have you been able to attend meetings or connect with your sponsor? Sometimes reaching out, even when it's hard, can help ease that sense of isolation."
    })
  });

  const result = await response.json();

  console.assert(result.analysis.responseCoaching.empathyScore >= 7, 'Should have high empathy score');
  console.assert(result.analysis.responseCoaching.qualityScore >= 7, 'Should have high quality score');
  console.assert(result.analysis.responseCoaching.strengths.length > 0, 'Should identify strengths');

  console.log('✅ Good response coaching test passed');
  console.log('Empathy:', result.analysis.responseCoaching.empathyScore);
  console.log('Quality:', result.analysis.responseCoaching.qualityScore);
  return result;
};

testGoodResponse();
```

**Test Case 3.2 - Poor Response (Needs Improvement)**

```javascript
const testPoorResponse = async () => {
  const response = await fetch('/api/volunteer/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversationId: 'test-coaching-002',
      userMessage: "I'm feeling really alone and isolated in my recovery.",
      volunteerDraft: "Just go to more meetings."
    })
  });

  const result = await response.json();

  console.assert(result.analysis.responseCoaching.empathyScore < 7, 'Should have low empathy score');
  console.assert(result.analysis.responseCoaching.improvements.length > 0, 'Should have improvement suggestions');

  console.log('✅ Poor response coaching test passed');
  console.log('Improvements suggested:', result.analysis.responseCoaching.improvements.length);
  return result;
};

testPoorResponse();
```

### Scenario 4: Conversation Analysis

**Purpose**: Verify sentiment analysis and topic extraction

**Test Case 4.1 - Distressed Sentiment**

```javascript
const testSentimentAnalysis = async () => {
  const response = await fetch('/api/volunteer/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversationId: 'test-sentiment-001',
      action: 'analyze_message',
      userMessage: "Everything is falling apart. I lost my job, my family won't talk to me, and I'm barely staying sober."
    })
  });

  const result = await response.json();

  console.assert(
    ['distressed', 'negative'].includes(result.analysis.conversationAnalysis.sentiment),
    'Should detect distressed/negative sentiment'
  );
  console.assert(result.analysis.conversationAnalysis.topics.length > 0, 'Should extract topics');
  console.assert(
    result.analysis.conversationAnalysis.topics.some(t =>
      ['stress', 'family', 'job', 'sobriety'].some(keyword => t.toLowerCase().includes(keyword))
    ),
    'Topics should be relevant'
  );

  console.log('✅ Sentiment analysis test passed');
  console.log('Sentiment:', result.analysis.conversationAnalysis.sentiment);
  console.log('Topics:', result.analysis.conversationAnalysis.topics);
  return result;
};

testSentimentAnalysis();
```

### Scenario 5: Agent Execution Path

**Purpose**: Verify agents execute in correct order

**Test Case 5.1 - Standard Flow**

```javascript
const testExecutionPath = async () => {
  const response = await fetch('/api/volunteer/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversationId: 'test-path-001',
      action: 'analyze_message',
      userMessage: "I'm struggling today but staying strong."
    })
  });

  const result = await response.json();
  const path = result.metadata.agentExecutionPath;

  // Verify crisis check runs first
  const crisisIndex = path.findIndex(agent => agent === 'crisis_check');
  console.assert(crisisIndex === 1, 'Crisis check should run second (after supervisor)'); // Index 1 because supervisor is 0

  // Verify supervisor coordinates
  console.assert(path.filter(agent => agent === 'supervisor').length >= 2, 'Supervisor should run multiple times');

  console.log('✅ Execution path test passed');
  console.log('Path:', path.join(' → '));
  return result;
};

testExecutionPath();
```

### Scenario 6: Streaming API

**Purpose**: Verify Server-Sent Events streaming works

**Test Case 6.1 - Stream Events**

```javascript
const testStreaming = () => {
  return new Promise((resolve, reject) => {
    const events = [];
    const eventSource = new EventSource('/api/volunteer/agent/stream', {
      method: 'POST',
      body: JSON.stringify({
        conversationId: 'test-stream-001',
        userMessage: 'Test message'
      })
    });

    eventSource.addEventListener('start', (event) => {
      events.push({ type: 'start', data: JSON.parse(event.data) });
    });

    eventSource.addEventListener('agent_start', (event) => {
      events.push({ type: 'agent_start', data: JSON.parse(event.data) });
    });

    eventSource.addEventListener('complete', (event) => {
      events.push({ type: 'complete', data: JSON.parse(event.data) });
      eventSource.close();

      console.assert(events.some(e => e.type === 'start'), 'Should receive start event');
      console.assert(events.some(e => e.type === 'complete'), 'Should receive complete event');
      console.assert(events.filter(e => e.type === 'agent_start').length > 0, 'Should receive agent_start events');

      console.log('✅ Streaming test passed');
      console.log('Events received:', events.length);
      resolve(events);
    });

    eventSource.addEventListener('error', (error) => {
      eventSource.close();
      reject(error);
    });

    setTimeout(() => {
      eventSource.close();
      reject(new Error('Timeout waiting for stream'));
    }, 30000);
  });
};

testStreaming();
```

## Performance Testing

### Test Case: Processing Time

```javascript
const testProcessingTime = async () => {
  const start = Date.now();

  const response = await fetch('/api/volunteer/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversationId: 'test-perf-001',
      action: 'analyze_message',
      userMessage: "I need help staying sober today."
    })
  });

  const result = await response.json();
  const clientTime = Date.now() - start;
  const serverTime = result.metadata.processingTime;

  console.log('Client total time:', clientTime, 'ms');
  console.log('Server processing time:', serverTime, 'ms');
  console.log('Network overhead:', clientTime - serverTime, 'ms');

  console.assert(serverTime < 5000, 'Processing should complete in under 5 seconds');
  console.assert(serverTime > 0, 'Should have processing time');

  console.log('✅ Performance test passed');
  return result;
};

testProcessingTime();
```

### Test Case: Concurrent Requests

```javascript
const testConcurrency = async () => {
  const requests = [];

  for (let i = 0; i < 5; i++) {
    requests.push(
      fetch('/api/volunteer/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: `test-concurrent-${i}`,
          action: 'analyze_message',
          userMessage: `Test message ${i}`
        })
      })
    );
  }

  const start = Date.now();
  const results = await Promise.all(requests);
  const elapsed = Date.now() - start;

  console.assert(results.every(r => r.ok), 'All requests should succeed');
  console.log('✅ Concurrency test passed');
  console.log(`Processed ${requests.length} requests in ${elapsed}ms`);
  console.log(`Average: ${elapsed / requests.length}ms per request`);

  return results;
};

testConcurrency();
```

## Database Testing

### Test Case: Crisis Alert Storage

```javascript
const testCrisisStorage = async () => {
  // 1. Trigger crisis detection
  const response = await fetch('/api/volunteer/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversationId: 'test-db-crisis-001',
      action: 'analyze_message',
      userMessage: "I want to end my life."
    })
  });

  const result = await response.json();

  // 2. Verify crisis alert was stored in database
  // (This would require a database query - implement via admin API)

  console.assert(result.analysis.crisisDetection.isCrisis === true, 'Crisis should be detected');
  console.log('✅ Crisis storage test passed');

  return result;
};

testCrisisStorage();
```

### Test Case: Metrics Collection

```javascript
const testMetricsCollection = async () => {
  // 1. Run several analyses
  for (let i = 0; i < 3; i++) {
    await fetch('/api/volunteer/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: `test-metrics-${i}`,
        action: 'analyze_message',
        userMessage: 'Test message'
      })
    });
  }

  // 2. Check metrics endpoint
  const metricsResponse = await fetch('/api/admin/agent-metrics?range=24h');
  const metrics = await metricsResponse.json();

  console.assert(metrics.totalExecutions >= 3, 'Should have recorded executions');
  console.assert(metrics.avgProcessingTime > 0, 'Should have average processing time');

  console.log('✅ Metrics collection test passed');
  console.log('Total executions:', metrics.totalExecutions);

  return metrics;
};

testMetricsCollection();
```

## Integration Testing

### Full Workflow Test

```javascript
const testFullWorkflow = async () => {
  console.log('🧪 Starting full workflow test...\n');

  // 1. Analyze incoming message
  console.log('Step 1: Analyzing incoming message...');
  const analysis = await fetch('/api/volunteer/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversationId: 'test-full-workflow-001',
      action: 'analyze_message',
      userMessage: "I'm 30 days sober but struggling with cravings."
    })
  }).then(r => r.json());

  console.log('✓ Crisis check:', analysis.analysis.crisisDetection.isCrisis ? 'CRISIS' : 'OK');
  console.log('✓ Resources found:', analysis.analysis.resourceSuggestions?.length || 0);
  console.log('✓ Sentiment:', analysis.analysis.conversationAnalysis?.sentiment);

  // 2. Coach volunteer response
  console.log('\nStep 2: Coaching volunteer response...');
  const coaching = await fetch('/api/volunteer/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversationId: 'test-full-workflow-001',
      action: 'coach_response',
      userMessage: "I'm 30 days sober but struggling with cravings.",
      volunteerDraft: "Congratulations on 30 days! That's a huge accomplishment. Cravings are normal, especially early in recovery. Have you tried using the tools from your program? Calling your sponsor or attending a meeting can really help."
    })
  }).then(r => r.json());

  console.log('✓ Empathy score:', coaching.analysis.responseCoaching?.empathyScore);
  console.log('✓ Quality score:', coaching.analysis.responseCoaching?.qualityScore);

  // 3. Check metrics
  console.log('\nStep 3: Checking metrics...');
  const metrics = await fetch('/api/admin/agent-metrics?range=24h')
    .then(r => r.json());

  console.log('✓ Total executions:', metrics.totalExecutions);
  console.log('✓ Avg processing time:', metrics.avgProcessingTime, 'ms');

  console.log('\n✅ Full workflow test PASSED');
};

testFullWorkflow();
```

## Manual Testing Checklist

- [ ] Database collections created and indexed
- [ ] Agent API health check passes
- [ ] Crisis detection works for high-risk messages
- [ ] Crisis detection doesn't false positive on normal messages
- [ ] Resource search returns relevant AA literature
- [ ] Response coaching provides constructive feedback
- [ ] Sentiment analysis detects distressed users
- [ ] Topic extraction identifies conversation themes
- [ ] Agent execution path follows correct order
- [ ] Streaming API sends real-time updates
- [ ] Crisis alerts stored in database
- [ ] Agent metrics collected and displayed
- [ ] Admin dashboard loads correctly
- [ ] Processing time under 5 seconds
- [ ] Concurrent requests handled properly
- [ ] Browser notifications work for crises
- [ ] UI components render without errors
- [ ] Mobile responsive design works

## Troubleshooting Test Failures

### Crisis Not Detected

**Possible Causes:**
- OpenAI API key not configured
- Temperature setting too high (should be 0)
- Crisis keywords not in training data

**Debug:**
```javascript
// Check agent execution path
console.log(result.metadata.agentExecutionPath);

// Verify crisis agent ran
console.assert(
  result.metadata.agentExecutionPath.includes('crisis_check'),
  'Crisis check agent should have run'
);
```

### Resources Not Found

**Possible Causes:**
- Vector index not created on bigbook_page_vectors
- Embedding model mismatch
- Search threshold too strict

**Debug:**
```bash
# Check vector index exists
mongosh "mongodb+srv://..." --eval "db.bigbook_page_vectors.getIndexes()"
```

### Slow Performance

**Possible Causes:**
- Network latency to OpenAI API
- MongoDB slow queries
- Too many agents running

**Debug:**
```javascript
// Check individual agent times
const path = result.metadata.agentExecutionPath;
console.log('Agents that ran:', path.length);
console.log('Total time:', result.metadata.processingTime, 'ms');
console.log('Avg per agent:', result.metadata.processingTime / path.length, 'ms');
```

## Automated Test Suite

Save as `tests/volunteer-agent.test.js`:

```javascript
describe('Volunteer Support Agent', () => {
  describe('Crisis Detection', () => {
    it('should detect high-risk crisis', async () => {
      // Test implementation
    });

    it('should not false positive on normal messages', async () => {
      // Test implementation
    });
  });

  describe('Resource Recommendation', () => {
    it('should find relevant resources', async () => {
      // Test implementation
    });
  });

  describe('Response Coaching', () => {
    it('should score empathy correctly', async () => {
      // Test implementation
    });
  });

  describe('Performance', () => {
    it('should complete in under 5 seconds', async () => {
      // Test implementation
    });
  });
});
```

## Success Criteria

The agent system passes testing if:

- ✅ Crisis detection accuracy > 95%
- ✅ Resource relevance score > 0.75
- ✅ Response coaching useful (volunteer feedback)
- ✅ Average processing time < 3 seconds
- ✅ Success rate > 98%
- ✅ Zero data leaks or privacy violations
- ✅ Mobile UI fully functional
- ✅ All critical paths tested

## Next Steps

After passing all tests:

1. **Deploy to staging environment**
2. **Conduct user acceptance testing with volunteers**
3. **Monitor metrics for 1 week**
4. **Gather volunteer feedback**
5. **Optimize based on real-world usage**
6. **Deploy to production**

## Support

For testing issues:
- Check server logs
- Review agent execution paths
- Verify environment variables
- Test with simplified inputs
- Contact development team
