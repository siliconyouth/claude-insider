/**
 * Honeypot Catch-All Route
 *
 * Serves fake data to bots and low-trust visitors.
 * This is a catch-all route that can match any path configured in honeypot_configs.
 */

import { NextRequest, NextResponse } from "next/server";
import { checkForBot } from "@/lib/bot-detection";
import { getRequestMetadata } from "@/lib/request-id";
import {
  shouldServeHoneypot,
  generateHoneypotResponse,
} from "@/lib/honeypot";
import {
  logHoneypotTrigger,
  logSecurityEvent,
} from "@/lib/security-logger";
import {
  getVisitorByFingerprint,
  getOrCreateVisitor,
  updateVisitorStats,
  incrementHoneypotTriggers,
} from "@/lib/fingerprint";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, params, "GET");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, params, "POST");
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, params, "PUT");
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, params, "DELETE");
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, params, "PATCH");
}

async function handleRequest(
  request: NextRequest,
  paramsPromise: Promise<{ path: string[] }>,
  method: string
): Promise<NextResponse> {
  try {
    const resolvedParams = await paramsPromise;
    const path = `/api/honeypot/${resolvedParams.path.join("/")}`;
    const metadata = await getRequestMetadata();

    // Check if visitor exists and get their trust score
    let visitor = null;
    let trustScore: number | undefined;
    let isBlocked = false;

    if (metadata.visitorId) {
      visitor = await getVisitorByFingerprint(metadata.visitorId);
      if (visitor) {
        trustScore = visitor.trustScore;
        isBlocked = visitor.isBlocked;
      } else {
        // Create visitor record for this fingerprint
        visitor = await getOrCreateVisitor(metadata.visitorId, {
          ip: metadata.ip,
          userAgent: metadata.userAgent,
          endpoint: path,
        });
        trustScore = visitor.trustScore;
      }
    }

    // Check for bot
    const botCheck = await checkForBot();

    // Determine if we should serve honeypot
    const decision = await shouldServeHoneypot({
      path,
      method,
      isBot: botCheck.isBot,
      isVerifiedBot: botCheck.isVerifiedBot,
      trustScore,
      isBlocked,
      visitorId: metadata.visitorId,
    });

    // Log the request
    await logSecurityEvent({
      requestId: metadata.requestId,
      visitorId: metadata.visitorId,
      ipAddress: metadata.ip,
      userAgent: metadata.userAgent,
      endpoint: path,
      method,
      referer: metadata.referer,
      origin: metadata.origin,
      isBot: botCheck.isBot,
      isHuman: botCheck.isHuman,
      isVerifiedBot: botCheck.isVerifiedBot,
      eventType: decision.shouldTrigger ? "honeypot_served" : "request",
      severity: decision.shouldTrigger ? "warning" : "info",
      honeypotServed: decision.shouldTrigger,
      honeypotConfigId: decision.config?.id,
      metadata: {
        honeypotDecision: decision.reason,
        trustScore,
        isBlocked,
      },
    });

    // If honeypot should not be triggered, return 404
    // (This route is only for honeypot traffic)
    if (!decision.shouldTrigger || !decision.config) {
      return NextResponse.json(
        { error: "Not Found" },
        { status: 404 }
      );
    }

    // Log honeypot trigger
    await logHoneypotTrigger({
      requestId: metadata.requestId,
      visitorId: metadata.visitorId,
      endpoint: path,
      method,
      honeypotConfigId: decision.config.id,
      honeypotName: decision.config.name,
      responseType: decision.config.responseType,
      delayMs: decision.config.responseDelayMs,
    });

    // Update visitor stats
    if (metadata.visitorId) {
      await updateVisitorStats({
        visitorId: metadata.visitorId,
        ip: metadata.ip,
        userAgent: metadata.userAgent,
        endpoint: path,
        isBot: botCheck.isBot,
      });
      await incrementHoneypotTriggers(metadata.visitorId);
    }

    // Generate and return honeypot response
    return generateHoneypotResponse(decision.config, { path, method });
  } catch (error) {
    console.error("[Honeypot Route Error]:", error);

    // Return generic error that looks like a normal API error
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
