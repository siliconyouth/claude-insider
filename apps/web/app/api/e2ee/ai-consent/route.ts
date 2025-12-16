/**
 * E2EE AI Consent API
 *
 * Manages AI consent for encrypted conversations.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

interface ConsentRow {
  user_id: string;
  consent_status: string;
  allowed_features: string[];
  consent_given_at: string | null;
  consent_expires_at: string | null;
}

interface AISettingsRow {
  ai_allowed: boolean;
  enabled_features: string[];
  require_unanimous_consent: boolean;
}

interface ParticipantRow {
  user_id: string;
}

/**
 * GET /api/e2ee/ai-consent?conversationId=xxx
 *
 * Get AI consent status for a conversation.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversationId = request.nextUrl.searchParams.get("conversationId");
    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId required" },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    // Verify user is a participant
    const { data: participant } = await supabase
      .from("dm_participants" as "profiles")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("user_id", session.user.id)
      .single();

    if (!participant) {
      return NextResponse.json(
        { error: "Not a participant" },
        { status: 403 }
      );
    }

    // Get AI settings for conversation
    const { data: settings } = await supabase
      .from("e2ee_conversation_ai_settings")
      .select("*")
      .eq("conversation_id", conversationId)
      .single();

    const aiSettings = settings as AISettingsRow | null;

    // Get all participant consent status
    const { data: consents } = await supabase
      .from("e2ee_ai_consent")
      .select("user_id, consent_status, allowed_features, consent_given_at, consent_expires_at")
      .eq("conversation_id", conversationId);

    const consentRows = (consents || []) as ConsentRow[];

    // Get all participants
    const { data: participants } = await supabase
      .from("dm_participants" as "profiles")
      .select("user_id")
      .eq("conversation_id", conversationId);

    const participantRows = (participants || []) as ParticipantRow[];
    const participantIds = participantRows.map((p) => p.user_id);

    // Build consent map
    const consentMap = new Map(
      consentRows.map((c) => [c.user_id, c])
    );

    // Find who hasn't consented
    const missingConsent = participantIds.filter((id) => {
      const consent = consentMap.get(id);
      return !consent || consent.consent_status !== "granted";
    });

    const participantConsent = consentRows.map((c) => ({
      userId: c.user_id,
      status: c.consent_status,
      allowedFeatures: c.allowed_features || [],
      consentGivenAt: c.consent_given_at,
      expiresAt: c.consent_expires_at,
    }));

    return NextResponse.json({
      conversationId,
      aiAllowed: aiSettings?.ai_allowed || false,
      enabledFeatures: aiSettings?.enabled_features || [],
      requireUnanimousConsent: aiSettings?.require_unanimous_consent ?? true,
      participantConsent,
      allConsented: missingConsent.length === 0,
      missingConsent,
    });
  } catch (error) {
    console.error("AI consent GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/e2ee/ai-consent
 *
 * Grant or revoke AI consent.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, action, features, reason } = body as {
      conversationId: string;
      action: "grant" | "revoke";
      features?: string[];
      reason?: string;
    };

    if (!conversationId || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    // Verify user is a participant
    const { data: participant } = await supabase
      .from("dm_participants" as "profiles")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("user_id", session.user.id)
      .single();

    if (!participant) {
      return NextResponse.json(
        { error: "Not a participant" },
        { status: 403 }
      );
    }

    // Get user's device ID
    const { data: device } = await supabase
      .from("device_keys")
      .select("device_id")
      .eq("user_id", session.user.id)
      .order("last_seen_at", { ascending: false })
      .limit(1)
      .single();

    const deviceId = device?.device_id || "unknown";

    if (action === "grant") {
      const { error } = await supabase.rpc("grant_ai_consent" as never, {
        p_conversation_id: conversationId,
        p_user_id: session.user.id,
        p_device_id: deviceId,
        p_features: features || ["mention_response"],
      } as never);

      if (error) {
        console.error("Failed to grant consent:", error);
        return NextResponse.json(
          { error: "Failed to grant consent" },
          { status: 500 }
        );
      }
    } else if (action === "revoke") {
      const { error } = await supabase.rpc("revoke_ai_consent" as never, {
        p_conversation_id: conversationId,
        p_user_id: session.user.id,
        p_reason: reason,
      } as never);

      if (error) {
        console.error("Failed to revoke consent:", error);
        return NextResponse.json(
          { error: "Failed to revoke consent" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("AI consent POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
