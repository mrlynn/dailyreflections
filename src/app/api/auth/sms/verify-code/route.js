import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import smsService from '@/lib/smsService';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import jwt from 'jsonwebtoken';

/**
 * Verify an SMS code for authentication
 *
 * POST /api/auth/sms/verify-code
 * Body: { phoneNumber, code }
 */
export async function POST(request) {
  try {
    const { phoneNumber, code } = await request.json();

    // Validate inputs
    if (!phoneNumber || !code) {
      return NextResponse.json(
        { error: 'Phone number and code are required' },
        { status: 400 }
      );
    }

    // Format phone number for consistent storage
    const formattedPhone = smsService.formatPhoneNumber(phoneNumber);
    if (!formattedPhone) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Connect to database
    const client = await clientPromise;
    const db = client.db();

    // Find the most recent verification code for this phone number
    const normalizedPhone = formattedPhone.replace(/^\+1/, ''); // Remove +1 prefix
    const verificationCode = await db.collection('smsVerificationCodes')
      .findOne({
        phoneNumber: normalizedPhone,
        code: code,
        expiresAt: { $gt: new Date() }, // Not expired
        used: false // Not already used
      }, {
        sort: { createdAt: -1 } // Most recent
      });

    if (!verificationCode) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    // Mark the code as used
    await db.collection('smsVerificationCodes').updateOne(
      { _id: verificationCode._id },
      { $set: { used: true, usedAt: new Date() } }
    );

    // Find the user associated with this phone number
    const userSMSPreferences = await db.collection('userSMSPreferences').findOne({
      phoneNumber: normalizedPhone
    });

    if (!userSMSPreferences) {
      return NextResponse.json(
        { error: 'No user found with this phone number' },
        { status: 404 }
      );
    }

    // Find the user
    const user = await db.collection('users').findOne({
      _id: userSMSPreferences.userId
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update the SMS verification status if not already verified
    if (!userSMSPreferences.verified) {
      await db.collection('userSMSPreferences').updateOne(
        { _id: userSMSPreferences._id },
        { $set: { verified: true, verifiedAt: new Date() } }
      );
    }

    // Create a session token for the user
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      throw new Error('NEXTAUTH_SECRET is not set');
    }

    // Generate a token that NextAuth can use
    const token = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      displayName: user.displayName || user.name,
      image: user.image,
      isAdmin: user.isAdmin === true,
      smsVerified: true
    };

    // Return user info and authentication details
    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        displayName: user.displayName || user.name
      },
      message: 'SMS verification successful'
    });
  } catch (error) {
    console.error('Error verifying SMS code:', error);
    return NextResponse.json(
      { error: 'Failed to verify code. Please try again.' },
      { status: 500 }
    );
  }
}