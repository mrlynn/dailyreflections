import { ChatOpenAI } from '@langchain/openai';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OBSERVATION AGENT SUPERVISOR NODE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The supervisor is the "traffic controller" for the observation agent.
 * It decides which data to collect next and when the observation is complete.
 *
 * Flow:
 * 1. Examine current state
 * 2. Determine what data is missing
 * 3. Route to appropriate collection node
 * 4. Once all data is collected, move to analysis
 * 5. Finally, generate report and complete
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

export async function supervisorNode(state) {
  console.log('🎯 Observation Supervisor: Determining next action...');

  // Determine what we've already collected
  const hasVolunteerMetrics = !!state.volunteer_metrics;
  const hasMeetingData = !!state.meeting_attendance;
  const hasSupportData = !!state.support_hotspots;
  const hasJourneyData = !!state.journey_analytics;
  const hasInsights = !!state.insights;

  let nextAction;

  // Collection phase: Gather all metrics
  if (!hasVolunteerMetrics) {
    nextAction = 'collect_volunteer_metrics';
    console.log('📊 → Collecting volunteer metrics...');
  } else if (!hasMeetingData) {
    nextAction = 'collect_meeting_data';
    console.log('📊 → Collecting meeting attendance data...');
  } else if (!hasSupportData) {
    nextAction = 'collect_support_data';
    console.log('📊 → Detecting support hotspots...');
  } else if (!hasJourneyData) {
    nextAction = 'collect_journey_data';
    console.log('📊 → Collecting journey analytics...');
  }
  // Analysis phase: Generate insights from collected data
  else if (!hasInsights) {
    nextAction = 'generate_insights';
    console.log('🧠 → Generating insights...');
  }
  // Completion: Create final report
  else {
    nextAction = 'complete';
    console.log('✅ → Observation complete!');
  }

  return {
    nextAction,
    execution_path: ['supervisor'],
  };
}
