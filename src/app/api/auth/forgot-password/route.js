import { NextResponse } from 'next/server';
import { createPasswordResetToken } from '@/lib/models/User';
import { sendPasswordResetEmail } from '@/lib/emailService';

/**
 * POST /api/auth/forgot-password
 * Request a password reset link via email
 */

// Configure CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}
export async function POST(request) {
  try {
    // Extract email from request body
    const body = await request.json();
    const { email } = body;

    // Validate email presence
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    // Generate a password reset token and get user info
    const result = await createPasswordResetToken(email.toLowerCase());

    // If no user is found, still return success to prevent email enumeration
    // But don't actually send an email
    if (!result) {
      return NextResponse.json(
        { success: true, message: 'If an account exists, a password reset link will be sent to your email' },
        { status: 200 }
      );
    }

    // Determine the base URL for password reset
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXTAUTH_URL ||
      'http://localhost:3000';

    const resetUrl = `${baseUrl}/reset-password`;

    // Send the password reset email
    await sendPasswordResetEmail(
      { email: result.user.email, name: result.user.name },
      result.token,
      resetUrl
    );

    // Return success response
    return NextResponse.json(
      { success: true, message: 'If an account exists, a password reset link will be sent to your email' },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while processing your request' },
      { status: 500, headers: corsHeaders }
    );
  }
}