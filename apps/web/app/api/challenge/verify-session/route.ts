/**
 * Verify Session API
 *
 * Verifies that the user has a valid session and can bypass
 * the bot challenge. Returns a verification token.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getClientIP } from "@/lib/client-ip";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const ip = getClientIP(request);

    // Generate bypass token
    const payload = {
      userId: session.user.id,
      ip,
      type: "session_bypass",
      timestamp: Date.now(),
      exp: Date.now() + 30 * 60 * 1000, // 30 minute expiry
    };

    const token = Buffer.from(JSON.stringify(payload)).toString("base64");

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: session.user.id,
        name: session.user.name,
      },
    });
  } catch (error) {
    console.error("[Challenge API] Verify session error:", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
