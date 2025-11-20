/**
 * API route for Ably token authentication
 * This endpoint authenticates users with Ably using their session data
 */

import * as Ably from "ably";
import { NextResponse } from "next/server";
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getFeatureFlag } from '@/lib/featureFlags';

export async function GET(request) {
  try {
    // Check if realtime chat feature is enabled
    if (!getFeatureFlag('REALTIME_CHAT')) {
      return NextResponse.json(
        { error: "Realtime chat feature is not enabled" },
        { status: 403 }
      );
    }

    // Get authenticated user from session
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Generate a client ID using the user's ID
    // This ensures messages are properly attributed
    const clientId = session.user.id;

    // Initialize Ably client with API key from environment variables
    const client = new Ably.Rest({ key: process.env.ABLY_API_KEY });

    // Create token with user data and appropriate permissions
    const tokenParams = {
      clientId: clientId,
      capability: {
        // Allow access to chat channels with proper permissions
        // The * wildcard allows access to all chat channels
        [`chat:*`]: ["publish", "subscribe", "presence"],
        // Personal channel for user-specific notifications
        [`user:${clientId}`]: ["publish", "subscribe", "presence"],
      }
    };

    // Generate the token request that will be used by the client
    const tokenRequest = await client.auth.createTokenRequest(tokenParams);

    // Return the token request to the client
    return NextResponse.json(tokenRequest);
  } catch (error) {
    console.error("Ably token request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}