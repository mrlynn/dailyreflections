import { NextResponse } from 'next/server';
import { getCacheStats, cleanExpiredCache, invalidateCache, invalidateDateCache } from '@/lib/responseCache';
import { getSession } from '@/lib/auth';

/**
 * GET /api/cache/manage
 * Get cache statistics (admin only)
 */
export async function GET(request) {
  try {
    const session = await getSession(request);

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const stats = await getCacheStats();

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return NextResponse.json(
      { error: 'Failed to get cache statistics' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cache/manage
 * Manage cache (admin only)
 *
 * Body:
 * - action: 'clean' | 'invalidate' | 'invalidate_date'
 * - dateKey: (optional) for invalidate_date action
 * - criteria: (optional) for custom invalidate
 */
export async function POST(request) {
  try {
    const session = await getSession(request);

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { action, dateKey, criteria } = body;

    let result;

    switch (action) {
      case 'clean':
        result = await cleanExpiredCache();
        return NextResponse.json({
          success: true,
          message: `Cleaned ${result} expired cache entries`,
          deletedCount: result,
        });

      case 'invalidate_date':
        if (!dateKey) {
          return NextResponse.json(
            { error: 'dateKey is required for invalidate_date action' },
            { status: 400 }
          );
        }
        result = await invalidateDateCache(dateKey);
        return NextResponse.json({
          success: true,
          message: `Invalidated ${result} cache entries for date ${dateKey}`,
          deletedCount: result,
        });

      case 'invalidate':
        result = await invalidateCache(criteria || {});
        return NextResponse.json({
          success: true,
          message: `Invalidated ${result} cache entries`,
          deletedCount: result,
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error managing cache:', error);
    return NextResponse.json(
      { error: 'Failed to manage cache' },
      { status: 500 }
    );
  }
}
