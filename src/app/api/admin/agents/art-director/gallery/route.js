import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectToMongoose } from '@/lib/mongoose';
import GeneratedArt from '@/lib/models/GeneratedArt';

/**
 * GET /api/admin/agents/art-director/gallery
 *
 * Get generated art gallery with filtering options
 */
export async function GET(request) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const artType = searchParams.get('art_type');
    const status = searchParams.get('status');
    const active = searchParams.get('active');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = parseInt(searchParams.get('skip') || '0', 10);

    // Build query
    const query = {};
    if (artType) query.art_type = artType;
    if (status) query.status = status;
    if (active !== null) query['usage.active'] = active === 'true';

    // Get art
    const artworks = await GeneratedArt.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const totalCount = await GeneratedArt.countDocuments(query);

    // Get stats
    const stats = await GeneratedArt.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$art_type',
          count: { $sum: 1 },
          total_cost: { $sum: '$generation.cost_usd' },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      artworks,
      pagination: {
        total: totalCount,
        limit,
        skip,
        hasMore: skip + artworks.length < totalCount,
      },
      stats,
    });
  } catch (error) {
    console.error('Error fetching art gallery:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch art gallery',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
