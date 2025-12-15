/**
 * Bot Detection Utilities
 *
 * Server-side bot detection using Vercel BotID.
 * Provides utilities for checking and handling bot traffic.
 */

import { checkBotId } from "botid/server";
import { NextResponse } from "next/server";

export interface BotCheckResult {
  isBot: boolean;
  isHuman: boolean;
  isVerifiedBot: boolean;
  bypassed: boolean;
  verifiedBotName?: string;
  verifiedBotCategory?: string;
  classificationReason?: string;
}

/**
 * Check if the current request is from a bot
 * @returns BotCheckResult with detection details
 */
export async function checkForBot(): Promise<BotCheckResult> {
  try {
    const verification = await checkBotId();

    return {
      isBot: verification.isBot,
      isHuman: verification.isHuman,
      isVerifiedBot: verification.isVerifiedBot,
      bypassed: verification.bypassed,
      verifiedBotName: "verifiedBotName" in verification ? verification.verifiedBotName : undefined,
      verifiedBotCategory: "verifiedBotCategory" in verification ? verification.verifiedBotCategory : undefined,
      classificationReason: "classificationReason" in verification ? verification.classificationReason : undefined,
    };
  } catch (error) {
    // In case of error, fail open (allow request)
    // but log the error for monitoring
    console.error("[Bot Detection Error]:", error);
    return {
      isBot: false,
      isHuman: true,
      isVerifiedBot: false,
      bypassed: true,
      classificationReason: "detection_error",
    };
  }
}

/**
 * Returns a 403 response for bot requests
 */
export function botBlockedResponse(result: BotCheckResult) {
  return NextResponse.json(
    {
      error: "Access denied",
      code: "BOT_DETECTED",
      isVerifiedBot: result.isVerifiedBot,
      verifiedBotName: result.verifiedBotName,
    },
    { status: 403 }
  );
}

/**
 * Higher-order function to wrap an API handler with bot protection
 * @param handler The original request handler
 * @returns Wrapped handler with bot detection
 */
export function withBotProtection<T>(
  handler: (request: Request) => Promise<T>
): (request: Request) => Promise<T | NextResponse> {
  return async (request: Request) => {
    const botCheck = await checkForBot();

    if (botCheck.isBot) {
      console.warn("[Bot Blocked]:", {
        isVerifiedBot: botCheck.isVerifiedBot,
        verifiedBotName: botCheck.verifiedBotName,
        classificationReason: botCheck.classificationReason,
        path: new URL(request.url).pathname,
      });
      return botBlockedResponse(botCheck);
    }

    return handler(request);
  };
}

/**
 * Get bot detection status for diagnostics
 * Returns current configuration and capabilities
 */
export function getBotDetectionStatus() {
  return {
    enabled: true,
    provider: "Vercel BotID (Kasada)",
    features: [
      "Invisible CAPTCHA",
      "Credential stuffing protection",
      "API abuse prevention",
      "Automated scraping detection",
    ],
    protectedRoutes: [
      "/api/auth/*",
      "/api/feedback",
      "/api/beta-application",
      "/api/comments/*",
      "/api/suggestions",
      "/api/user/*",
      "/api/assistant/chat",
      "/api/dashboard/*",
      "/api/notifications/*",
    ],
  };
}
