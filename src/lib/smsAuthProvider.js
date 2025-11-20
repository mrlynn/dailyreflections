/**
 * Custom SMS Authentication Provider for NextAuth.js
 *
 * This provider allows users to authenticate using SMS verification codes.
 */
import CredentialsProvider from 'next-auth/providers/credentials';
import clientPromise from '@/lib/mongodb';

/**
 * Create a custom SMS authentication provider for NextAuth
 *
 * @returns {Object} The SMS authentication provider
 */
export default function SMSProvider() {
  return CredentialsProvider({
    id: 'sms',
    name: 'SMS',
    credentials: {
      phoneNumber: { label: 'Phone Number', type: 'text' },
      verificationCode: { label: 'Verification Code', type: 'text' }
    },
    /**
     * Verify the SMS code and authorize the user
     */
    async authorize(credentials) {
      try {
        // Validate credentials
        if (!credentials?.phoneNumber || !credentials?.verificationCode) {
          return null;
        }

        // Connect to database
        const client = await clientPromise;
        const db = client.db();

        // Normalize phone number (remove +1 prefix if present)
        const normalizedPhone = credentials.phoneNumber.replace(/^\+1/, '').replace(/\D/g, '');

        // Check if verification code is valid
        const verificationCode = await db.collection('smsVerificationCodes')
          .findOne({
            phoneNumber: normalizedPhone,
            code: credentials.verificationCode,
            expiresAt: { $gt: new Date() }, // Not expired
            used: false // Not already used
          }, {
            sort: { createdAt: -1 } // Most recent
          });

        // If the code is invalid or expired, authentication fails
        if (!verificationCode) {
          console.log('Invalid or expired verification code');
          return null;
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

        // If no user found with this phone number, authentication fails
        if (!userSMSPreferences) {
          console.log('No user found with this phone number');
          return null;
        }

        // Find the user
        const user = await db.collection('users').findOne({
          _id: userSMSPreferences.userId
        });

        // If no user found, authentication fails
        if (!user) {
          console.log('User not found');
          return null;
        }

        // Update the SMS verification status if not already verified
        if (!userSMSPreferences.verified) {
          await db.collection('userSMSPreferences').updateOne(
            { _id: userSMSPreferences._id },
            { $set: { verified: true, verifiedAt: new Date() } }
          );
        }

        // Return user object for session
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          displayName: user.displayName || user.name,
          image: user.image,
          isAdmin: user.isAdmin === true,
          smsVerified: true
        };
      } catch (error) {
        console.error('SMS authentication error:', error);
        return null;
      }
    }
  });
}