import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import smsService from '@/lib/smsService';

/**
 * POST /api/auth/register
 * Register a new user with email and password
 * Optionally includes phone number for SMS authentication
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, name, phoneNumber, enableSmsLogin } = body;

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required.' },
        { status: 400 }
      );
    }

    // Phone number validation if SMS login is enabled
    if (enableSmsLogin && !phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required when SMS login is enabled.' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format.' },
        { status: 400 }
      );
    }

    // Password validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('dailyreflections');

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const trimmedName = name.trim();
    const user = {
      email: email.toLowerCase(),
      password: hashedPassword,
      name: trimmedName, // Real name for internal use
      displayName: trimmedName, // Display name for comments (starts same as name)
      image: null,
      emailVerified: null,
      createdAt: new Date(),
      hasSmsEnabled: enableSmsLogin ? true : false,
      // Add onboarding status for new users
      onboarding: {
        setupComplete: false,
        lastStep: 0,
      }
    };

    const result = await db.collection('users').insertOne(user);

    // If SMS login is enabled, create SMS preferences record
    if (enableSmsLogin && phoneNumber) {
      // Create SMS preferences record with default settings
      const smsPreferencesDoc = {
        userId: result.insertedId,
        phoneNumber: phoneNumber,
        verified: false, // Requires verification via SMS
        preferences: {
          enabled: true,
          quietHoursStart: '22:00', // 10 PM
          quietHoursEnd: '08:00', // 8 AM
          dailyReflection: true,
          step10Reminder: false,
          step4CheckIn: false
        },
        createdAt: new Date()
      };

      await db.collection('userSMSPreferences').insertOne(smsPreferencesDoc);

      // Send verification SMS
      try {
        // Send the SMS for phone number verification
        const verificationResult = await smsService.sendVerificationSMS(phoneNumber);

        // Update the SMS preferences document with verification info
        await db.collection('userSMSPreferences').updateOne(
          { userId: result.insertedId },
          {
            $set: {
              verificationSentAt: new Date(),
              verificationMessageId: verificationResult.messageId
            }
          }
        );
      } catch (smsError) {
        console.error('Failed to send verification SMS:', smsError);
        // We'll still continue with registration even if SMS fails
      }
    }

    // Return user (without password)
    return NextResponse.json(
      {
        id: result.insertedId.toString(),
        email: user.email,
        name: user.name,
        phoneNumber: enableSmsLogin ? phoneNumber : null,
        message: 'Account created successfully. Please sign in.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create account.' },
      { status: 500 }
    );
  }
}

