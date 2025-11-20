import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getUserConnectionProfile } from '@/lib/connection-profiles/db';

/**
 * GET /api/user/qrcode
 * Generate QR code for user's connection profile
 */
export async function GET(request) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        {
          error: 'You must be signed in to generate a QR code.',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    const userId = session.user.id || session.user.sub;

    // Fetch user's connection profile
    const profile = await getUserConnectionProfile(userId);

    if (!profile || !profile.isEnabled) {
      return NextResponse.json(
        {
          error: 'Connection profile not found or disabled.',
          code: 'PROFILE_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const size = parseInt(searchParams.get('size') || '300', 10);
    const margin = parseInt(searchParams.get('margin') || '1', 10);
    const colorDark = searchParams.get('color') || profile.theme?.primaryColor || '#5d88a6';
    const colorLight = '#FFFFFF';

    // Validate parameters
    if (size < 100 || size > 1000) {
      return NextResponse.json(
        { error: 'Size must be between 100 and 1000 pixels.' },
        { status: 400 }
      );
    }

    if (margin < 0 || margin > 5) {
      return NextResponse.json(
        { error: 'Margin must be between 0 and 5 modules.' },
        { status: 400 }
      );
    }

    // Generate the URL to encode
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://aacompanion.com';
    const connectionUrl = `${baseUrl}/connect/${profile.urlSlug}`;

    // Generate QR code as data URL
    const qrOptions = {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: size,
      margin: margin,
      color: {
        dark: colorDark,
        light: colorLight
      }
    };

    const qrDataUrl = await QRCode.toDataURL(connectionUrl, qrOptions);

    return NextResponse.json({
      qrDataUrl,
      connectionUrl,
      urlSlug: profile.urlSlug,
      settings: {
        size,
        margin,
        colorDark,
        colorLight
      }
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code.' },
      { status: 500 }
    );
  }
}