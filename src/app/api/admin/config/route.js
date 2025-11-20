/**
 * API routes for managing system configuration
 */

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import {
  getConfig,
  setConfig,
  getCategoryConfigs,
  getConfigCategories
} from '@/lib/models/SystemConfig';

/**
 * GET /api/admin/config
 * Get system configuration
 */
export async function GET(request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const key = searchParams.get('key');

    // Return specific config if key is provided
    if (key) {
      const configValue = await getConfig(key);
      if (configValue === null) {
        return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
      }
      return NextResponse.json({ key, value: configValue });
    }

    // Return configs for a specific category
    if (category) {
      const configs = await getCategoryConfigs(category);
      return NextResponse.json({ category, configs });
    }

    // Return all categories if neither key nor category is provided
    const categories = await getConfigCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching configuration:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch configuration' }, { status: 500 });
  }
}

/**
 * POST /api/admin/config
 * Set system configuration
 */
export async function POST(request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { key, value, category, description } = body;

    if (!key) {
      return NextResponse.json({ error: 'Configuration key is required' }, { status: 400 });
    }

    if (value === undefined) {
      return NextResponse.json({ error: 'Configuration value is required' }, { status: 400 });
    }

    await setConfig(
      key,
      value,
      category || 'general',
      description || '',
      session.user.id
    );

    return NextResponse.json({ success: true, message: 'Configuration saved successfully' });
  } catch (error) {
    console.error('Error saving configuration:', error);
    return NextResponse.json({ error: error.message || 'Failed to save configuration' }, { status: 500 });
  }
}