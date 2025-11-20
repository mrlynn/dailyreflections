import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import smsService from '@/lib/smsService';

// GET /api/user/sms - Get user's SMS preferences
export async function GET(request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();
    const userId = session.user.id;

    // Find user's SMS preferences
    const userPreferences = await db.collection('userSMSPreferences').findOne({
      userId: new ObjectId(userId)
    });

    if (!userPreferences) {
      return NextResponse.json({
        phoneNumber: null,
        preferences: null,
        verified: false
      });
    }

    // Return preferences with sanitized phone number for security
    const sanitizedPhoneNumber = userPreferences.phoneNumber
      ? userPreferences.phoneNumber.slice(-4).padStart(10, '*')
      : null;

    return NextResponse.json({
      phoneNumber: userPreferences.phoneNumber,
      phoneNumberMasked: sanitizedPhoneNumber,
      preferences: userPreferences.preferences,
      verified: userPreferences.verified || false,
      verificationSentAt: userPreferences.verificationSentAt || null
    });
  } catch (error) {
    console.error('Error fetching SMS preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SMS preferences' },
      { status: 500 }
    );
  }
}

// PUT /api/user/sms - Update user's SMS preferences
export async function PUT(request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phoneNumber, preferences } = await request.json();
    const userId = session.user.id;

    // Validate phone number (if provided)
    if (phoneNumber && !/^\d{10}$/.test(phoneNumber)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Must be 10 digits.' },
        { status: 400 }
      );
    }

    // Connect to database
    const client = await clientPromise;
    const db = client.db();

    // Check if phone number changed (will require re-verification)
    const existingData = await db.collection('userSMSPreferences').findOne({
      userId: new ObjectId(userId)
    });

    const phoneChanged = existingData && existingData.phoneNumber !== phoneNumber;
    const needsVerification = phoneNumber && (!existingData || phoneChanged || !existingData.verified);
    let verificationSent = false;
    let verificationError = null;

    // Update or insert preferences
    const updateData = {
      userId: new ObjectId(userId),
      phoneNumber: phoneNumber || null,
      preferences: preferences || null,
      updatedAt: new Date()
    };

    // If phone number changed or new, set verified to false
    if (phoneChanged || (phoneNumber && !existingData)) {
      updateData.verified = false;
    }

    const result = await db.collection('userSMSPreferences').updateOne(
      { userId: new ObjectId(userId) },
      { $set: updateData },
      { upsert: true }
    );

    // If SMS is enabled and verified, update user record
    const verified = existingData?.verified && !phoneChanged;
    if (phoneNumber && preferences?.enabled && verified) {
      await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $set: { hasSmsEnabled: true } }
      );
    } else {
      await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $set: { hasSmsEnabled: false } }
      );
    }

    // Send verification SMS if needed
    if (needsVerification && phoneNumber) {
      try {
        const verificationResult = await smsService.sendVerificationSMS(phoneNumber);

        // Update verification sent timestamp
        await db.collection('userSMSPreferences').updateOne(
          { userId: new ObjectId(userId) },
          {
            $set: {
              verificationSentAt: new Date(),
              verificationMessageId: verificationResult.messageId
            }
          }
        );

        verificationSent = true;
      } catch (error) {
        console.error('Error sending verification SMS:', error);
        verificationError = error.message;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'SMS preferences updated successfully',
      verified: verified,
      verificationSent: verificationSent,
      verificationError: verificationError
    });
  } catch (error) {
    console.error('Error updating SMS preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update SMS preferences' },
      { status: 500 }
    );
  }
}

// DELETE /api/user/sms - Remove user's SMS preferences
export async function DELETE(request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Connect to database
    const client = await clientPromise;
    const db = client.db();

    // Delete SMS preferences
    await db.collection('userSMSPreferences').deleteOne({
      userId: new ObjectId(userId)
    });

    // Update user record to indicate SMS is disabled
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { hasSmsEnabled: false } }
    );

    return NextResponse.json({
      success: true,
      message: 'SMS preferences removed successfully'
    });
  } catch (error) {
    console.error('Error removing SMS preferences:', error);
    return NextResponse.json(
      { error: 'Failed to remove SMS preferences' },
      { status: 500 }
    );
  }
}