import { NextResponse } from 'next/server';
import { verifyResetToken, resetPassword } from '@/lib/models/User';
import { sendPasswordChangeConfirmationEmail } from '@/lib/emailService';
import bcrypt from 'bcryptjs';
import clientPromise from '@/lib/mongodb';

/**
 * POST /api/auth/reset-password
 * Reset a user's password using a valid reset token
 */
export async function POST(request) {
  try {
    // Extract data from request body
    const body = await request.json();
    const { token, password } = body;

    // Validate required fields
    if (!token || !password) {
      return NextResponse.json(
        { success: false, message: 'Token and new password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Verify the token
    const user = await verifyResetToken(token);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired password reset token' },
        { status: 400 }
      );
    }

    // Reset the password
    const success = await resetPassword(token, password, bcrypt.hash);
    if (!success) {
      return NextResponse.json(
        { success: false, message: 'Failed to reset password' },
        { status: 500 }
      );
    }

    // Get full user details for email
    const client = await clientPromise;
    const db = client.db('dailyreflections');
    const userDetails = await db.collection('users').findOne({ email: user.email });

    // Send confirmation email
    if (userDetails) {
      await sendPasswordChangeConfirmationEmail({
        email: user.email,
        name: userDetails.name || 'User'
      });
    }

    // Return success response
    return NextResponse.json(
      { success: true, message: 'Password has been reset successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while resetting your password' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/reset-password?token=<token>
 * Verify if a reset token is valid (used by the reset form before submission)
 */
export async function GET(request) {
  try {
    // Extract token from query parameters
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token is required' },
        { status: 400 }
      );
    }

    // Verify the token
    const user = await verifyResetToken(token);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired password reset token' },
        { status: 400 }
      );
    }

    // Return success with email (partially masked for security)
    const email = user.email;
    const maskedEmail = email.replace(/(.{2})(.*)(?=@)/, (_, start, rest) =>
      start + '*'.repeat(Math.max(2, rest.length))
    );

    return NextResponse.json(
      {
        success: true,
        email: maskedEmail,
        message: 'Valid password reset token'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while verifying your token' },
      { status: 500 }
    );
  }
}