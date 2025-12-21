/**
 * Challenge API
 *
 * Endpoints for bot challenge verification:
 * - POST /api/challenge - Verify a challenge token
 * - GET /api/challenge - Check if challenge is required
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { updateTrustScore, getTrustScore, type TrustFactors } from "@/lib/trust-score";
import { getClientIP } from "@/lib/client-ip";

// Secret for signing tokens (in production, use environment variable)
const CHALLENGE_SECRET = process.env.CHALLENGE_SECRET || "challenge-secret-key";

/**
 * Verify a challenge token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, metadata } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Decode and validate token
    let decoded: { timestamp: number; random: string; status: string };
    try {
      const decoded_str = atob(token);
      const parts = decoded_str.split(":");
      const timestamp = parts[0];
      const random = parts[1];
      const status = parts[2];

      if (!timestamp || !random || !status) {
        return NextResponse.json(
          { error: "Invalid token format" },
          { status: 400 }
        );
      }

      decoded = {
        timestamp: parseInt(timestamp, 10),
        random,
        status,
      };
    } catch {
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 400 }
      );
    }

    // Check token age (max 5 minutes)
    const tokenAge = Date.now() - decoded.timestamp;
    if (tokenAge > 5 * 60 * 1000) {
      return NextResponse.json(
        { error: "Token expired" },
        { status: 400 }
      );
    }

    // Validate status
    if (decoded.status !== "verified") {
      return NextResponse.json(
        { error: "Invalid token status" },
        { status: 400 }
      );
    }

    // Update trust score positively
    const ip = getClientIP(request);
    const session = await getSession();

    const trustFactors: TrustFactors = {
      challengePassed: true,
      challengeType: metadata?.type || "unknown",
      completionTime: metadata?.completionTime,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Update trust score
    await updateTrustScore(supabase, {
      ip,
      userId: session?.user?.id,
      factors: trustFactors,
      increment: 15, // Boost trust score for passing challenge
    });

    // Generate server-signed verification token
    const verificationToken = generateVerificationToken(ip, session?.user?.id);

    // Log successful challenge
    await supabase.from("security_logs").insert({
      event_type: "challenge_passed",
      ip_address: ip,
      user_id: session?.user?.id || null,
      details: {
        challengeType: metadata?.type,
        completionTime: metadata?.completionTime,
        moveCount: metadata?.moveCount,
      },
    });

    return NextResponse.json({
      success: true,
      token: verificationToken,
      expiresIn: 30 * 60, // 30 minutes
    });
  } catch (error) {
    console.error("[Challenge API] Verify error:", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}

/**
 * Check if challenge is required
 */
export async function GET(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const session = await getSession();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Get current trust score
    const trustScore = await getTrustScore(supabase, {
      ip,
      userId: session?.user?.id,
    });

    // Determine if challenge is needed
    const requiresChallenge = trustScore < 30;
    const difficulty = trustScore < 15 ? "hard" : trustScore < 25 ? "medium" : "easy";

    // Check for recent successful challenge
    const recentChallenge = await checkRecentChallenge(supabase, ip, session?.user?.id);

    return NextResponse.json({
      requiresChallenge: requiresChallenge && !recentChallenge,
      trustScore,
      difficulty,
      reason: requiresChallenge
        ? "Unusual activity detected"
        : undefined,
    });
  } catch (error) {
    console.error("[Challenge API] Check error:", error);
    return NextResponse.json(
      { requiresChallenge: false, trustScore: 50 },
      { status: 200 }
    );
  }
}

/**
 * Generate a server-signed verification token
 */
function generateVerificationToken(ip: string, userId?: string): string {
  const payload = {
    ip,
    userId: userId || "anonymous",
    timestamp: Date.now(),
    exp: Date.now() + 30 * 60 * 1000, // 30 minute expiry
  };

  // In production, use proper JWT signing
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64");
  const signature = simpleHash(`${encoded}:${CHALLENGE_SECRET}`);

  return `${encoded}.${signature}`;
}

/**
 * Simple hash function for signature
 * In production, use crypto.createHmac
 */
function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Check for recent successful challenge
 */
async function checkRecentChallenge(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  ip: string,
  userId?: string
): Promise<boolean> {
  const thirtyMinutesAgo = new Date(
    Date.now() - 30 * 60 * 1000
  ).toISOString();

  let query = supabase
    .from("security_logs")
    .select("id")
    .eq("event_type", "challenge_passed")
    .gte("created_at", thirtyMinutesAgo);

  if (userId) {
    query = query.eq("user_id", userId);
  } else {
    query = query.eq("ip_address", ip);
  }

  const { data } = await query.limit(1);
  return (data?.length || 0) > 0;
}
