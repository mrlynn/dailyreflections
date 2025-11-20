import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import smsService from '@/lib/smsService';
import { auth } from '@/app/api/auth/[...nextauth]/route';

/**
 * Generate and send a verification code via SMS for authentication
 *
 * POST /api/auth/sms/send-code
 * Body: { phoneNumber }
 */
export async function POST(request) {
  try {
    const { phoneNumber } = await request.json();

    // Validate phone number
    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Format phone number to consistent format
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

    // Check if the phone number exists in the system
    const userPreferences = await db.collection('userSMSPreferences').findOne({
      phoneNumber: formattedPhone.replace(/^\+1/, '') // Remove +1 prefix if present
    });

    if (!userPreferences) {
      return NextResponse.json(
        { error: 'Phone number not registered with any account' },
        { status: 404 }
      );
    }

    // Generate a 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiration time (10 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Store the code in the database
    await db.collection('smsVerificationCodes').insertOne({
      phoneNumber: formattedPhone.replace(/^\+1/, ''), // Store without +1 prefix for consistency
      userId: userPreferences.userId,
      code,
      createdAt: new Date(),
      expiresAt,
      used: false
    });

    // Send the verification code via SMS
    const message = `Your AA Companion login code is: ${code}. This code will expire in 10 minutes.`;
    await smsService.sendSMS(formattedPhone, message, { priority: true });

    // Return success
    return NextResponse.json({
      success: true,
      message: 'Verification code sent',
      phoneNumber: formattedPhone.replace(/^\+1/, '') // Return without prefix
    });
  } catch (error) {
    console.error('Error sending SMS verification code:', error);
    return NextResponse.json(
      { error: 'Failed to send verification code. Please try again.' },
      { status: 500 }
    );
  }
}