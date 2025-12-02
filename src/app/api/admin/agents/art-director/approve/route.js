import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectToMongoose } from '@/lib/mongoose';
import GeneratedArt from '@/lib/models/GeneratedArt';
import { downloadAndSaveImage, getFilenameFromDate } from '@/lib/storage/imageStorage';
import mongoose from 'mongoose';

/**
 * POST /api/admin/agents/art-director/approve
 *
 * Approve generated art and deploy it to the reflection
 */
export async function POST(request) {
  try {
    console.log('[Approve API] Starting approval process...');

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
    const { art_id } = body;

    if (!art_id) {
      return NextResponse.json(
        { error: 'Missing required field: art_id' },
        { status: 400 }
      );
    }

    console.log(`[Approve API] Fetching art: ${art_id}`);

    // Get the generated art
    const generatedArt = await GeneratedArt.findOne({ asset_id: art_id });

    if (!generatedArt) {
      return NextResponse.json(
        { error: 'Generated art not found' },
        { status: 404 }
      );
    }

    console.log(`[Approve API] Found art: ${generatedArt.art_type} for ${generatedArt.content_reference.reference_value}`);

    // Check if already approved
    if (generatedArt.quality_review.approved) {
      return NextResponse.json(
        {
          success: true,
          message: 'Art already approved and deployed',
          art_id,
          already_approved: true,
        }
      );
    }

    // Download and save the image
    console.log('[Approve API] Downloading image from OpenAI CDN...');
    const filename = getFilenameFromDate(generatedArt.content_reference.reference_value);
    const downloadResult = await downloadAndSaveImage(generatedArt.image.url, filename);

    if (!downloadResult.success) {
      throw new Error(`Failed to download image: ${downloadResult.error}`);
    }

    console.log(`[Approve API] Image saved - Storage: ${downloadResult.storage}`);
    console.log(`[Approve API] Public URL: ${downloadResult.publicUrl}`);
    if (downloadResult.cdnUrl) {
      console.log(`[Approve API] CDN URL: ${downloadResult.cdnUrl}`);
    }

    // Update the GeneratedArt document
    generatedArt.image.stored_url = downloadResult.publicUrl;
    generatedArt.quality_review.approved = true;
    generatedArt.quality_review.approved_by = session.user.id;
    generatedArt.quality_review.approved_at = new Date();
    generatedArt.usage.first_used_at = new Date();
    generatedArt.usage.last_used_at = new Date();
    generatedArt.usage.usage_count = 1;

    await generatedArt.save();

    console.log('[Approve API] Updated GeneratedArt document');

    // Update the corresponding reflection document
    if (generatedArt.art_type === 'daily_reflection') {
      const dateMatch = generatedArt.content_reference.reference_value.match(/(\d{4})-(\d{2})-(\d{2})/);

      if (dateMatch) {
        const [, year, month, day] = dateMatch;
        const monthNum = parseInt(month, 10);
        const dayNum = parseInt(day, 10);

        console.log(`[Approve API] Updating reflection: month=${monthNum}, day=${dayNum}`);

        // Get the reflection model
        const Reflection = mongoose.models.reflections ||
          mongoose.model('reflections', new mongoose.Schema({}, { strict: false, collection: 'reflections' }));

        // Update the reflection with the new image
        const updateFields = {
          'image.url': downloadResult.publicUrl,
          'image.size': downloadResult.size,
          'image.dateKey': `${month}-${day}`,
          'image.status': 'completed',
          'image.generatedAt': new Date(),
          'image.generated_art_id': generatedArt.asset_id,
        };

        // Only set path if it exists (local development)
        if (downloadResult.storage === 'local') {
          updateFields['image.path'] = downloadResult.publicUrl;
        }

        const updateResult = await Reflection.updateOne(
          { month: monthNum, day: dayNum },
          { $set: updateFields }
        );

        console.log(`[Approve API] Reflection update result:`, updateResult);

        if (updateResult.matchedCount === 0) {
          console.warn(`[Approve API] Warning: No reflection found for ${monthNum}/${dayNum}`);
        } else {
          console.log(`[Approve API] Successfully updated reflection!`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Art approved and deployed successfully',
      art_id,
      public_url: downloadResult.publicUrl,
      file_size: downloadResult.size,
      approved_by: session.user.email,
    });

  } catch (error) {
    console.error('[Approve API] ERROR:', error);
    return NextResponse.json(
      {
        error: 'Failed to approve art',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
