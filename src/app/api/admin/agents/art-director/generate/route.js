import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectToMongoose } from '@/lib/mongoose';
import { runArtDirectorAgent } from '@/lib/agents/art/graph';
import ArtGenerationHistory from '@/lib/models/ArtGenerationHistory';

/**
 * POST /api/admin/agents/art-director/generate
 *
 * Trigger the Ghibli Art Director Agent to generate art assets
 */
export async function POST(request) {
  try {
    // Check authentication
    const session = await getSession(request);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    // Check for admin role
    const isAdmin = session.user.roles?.includes('admin') || session.user.isAdmin;
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Connect to database
    await connectToMongoose();

    // Parse request body
    const body = await request.json();
    const {
      request_type,
      art_type,
      generation_items,
      configuration,
    } = body;

    // Validate required fields
    if (!request_type || !art_type || !generation_items || !Array.isArray(generation_items)) {
      return NextResponse.json(
        { error: 'Missing required fields: request_type, art_type, generation_items' },
        { status: 400 }
      );
    }

    if (generation_items.length === 0) {
      return NextResponse.json(
        { error: 'generation_items array cannot be empty' },
        { status: 400 }
      );
    }

    // Enrich generation items with content from database
    const enrichedItems = await Promise.all(
      generation_items.map(async (item) => {
        // For daily reflections, fetch the reflection content
        if (art_type === 'daily_reflection' && item.reference_value) {
          const dateMatch = item.reference_value.match(/(\d{4})-(\d{2})-(\d{2})/);
          if (dateMatch) {
            const [, year, month, day] = dateMatch;
            const monthNum = parseInt(month, 10);
            const dayNum = parseInt(day, 10);

            // Query the reflections collection
            const mongoose = await import('mongoose');
            const Reflection = mongoose.default.models.reflections ||
              mongoose.default.model('reflections', new mongoose.default.Schema({}, { strict: false, collection: 'reflections' }));

            const reflection = await Reflection.findOne({
              month: monthNum,
              day: dayNum
            }).lean();

            if (reflection) {
              // Build the full reflection text
              const reflectionText = `${reflection.title}\n\n"${reflection.quote}"\n\n${reflection.comment}`;

              return {
                ...item,
                content_data: {
                  text: reflectionText,
                  title: reflection.title,
                  quote: reflection.quote,
                  comment: reflection.comment,
                },
              };
            }
          }
        }

        // Return item unchanged if no enrichment needed
        return item;
      })
    );

    // Create history record
    const history = new ArtGenerationHistory({
      request_type,
      trigger: {
        type: 'manual',
        initiated_by: session.user.id,
        initiated_at: new Date(),
      },
      scope: {
        art_type,
        batch_size: enrichedItems.length,
        items: enrichedItems,
      },
      results: {
        total_requested: enrichedItems.length,
      },
      configuration: {
        ghibli_style_level: configuration?.ghibli_style_level || 'moderate',
        quality_setting: configuration?.quality_setting || 'standard',
        auto_approve: configuration?.auto_approve !== false,
        manual_review_required: configuration?.manual_review_required || false,
      },
    });

    await history.save();

    // Mark as started
    const agentRunId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    await history.markStarted(agentRunId);

    // Run the agent
    try {
      const finalState = await runArtDirectorAgent({
        request_type,
        art_type,
        generation_items: enrichedItems,
        configuration: configuration || {},
        trigger_type: 'manual',
        initiated_by: session.user.id,
      });

      // Update history with results
      history.results.successful = finalState.successful_generations || 0;
      history.results.failed = finalState.failed_generations || 0;
      history.results.skipped = finalState.skipped_generations || 0;
      history.results.generated_art_ids = finalState.generated_art.map(art => art._id);
      history.costs.total_api_calls = finalState.total_api_calls || 0;
      history.costs.total_cost_usd = finalState.total_cost_usd || 0;
      history.errors = finalState.errors || [];

      await history.markCompleted();

      return NextResponse.json({
        success: true,
        history_id: history._id,
        request_id: history.request_id,
        results: {
          total_requested: finalState.total_items,
          successful: finalState.successful_generations || 0,
          failed: finalState.failed_generations || 0,
          skipped: finalState.skipped_generations || 0,
          generated_art: finalState.generated_art,
        },
        costs: {
          total_cost_usd: finalState.total_cost_usd || 0,
          total_api_calls: finalState.total_api_calls || 0,
        },
        execution_path_length: finalState.execution_path?.length || 0,
      });
    } catch (agentError) {
      // Mark history as failed
      history.status = 'failed';
      history.errors.push({
        timestamp: new Date(),
        error_type: 'agent_execution_failed',
        message: agentError.message,
      });
      await history.save();

      throw agentError;
    }
  } catch (error) {
    console.error('Error in art director generate endpoint:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate art',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
