/**
 * Assistant Settings API
 *
 * GET - Fetch user's assistant settings
 * POST/PUT - Update assistant settings
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export interface AssistantSettings {
  id: string;
  userId: string;
  assistantName: string;
  userDisplayName: string | null;
  selectedVoiceId: string;
  autoSpeak: boolean;
  speechRate: number;
  showSuggestedQuestions: boolean;
  showConversationHistory: boolean;
  compactMode: boolean;
  enableVoiceInput: boolean;
  enableCodeHighlighting: boolean;
  soundTheme: string;
  createdAt: string;
  updatedAt: string;
}

// Valid sound themes
const VALID_SOUND_THEMES = [
  "claude-insider",
  "anthropic",
  "apple",
  "microsoft",
  "google",
  "linux",
  "whatsapp",
  "telegram",
  "github",
  "vercel",
];

// Available voices for selection (internal use only - route files can only export HTTP handlers)
const AVAILABLE_VOICES = [
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", accent: "American", gender: "Female", description: "Soft, conversational" },
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", accent: "American", gender: "Female", description: "Calm, professional" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi", accent: "American", gender: "Female", description: "Strong, confident" },
  { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli", accent: "American", gender: "Female", description: "Emotional, young" },
  { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh", accent: "American", gender: "Male", description: "Deep, narrative" },
  { id: "VR6AewLTigWG4xSOukaG", name: "Arnold", accent: "American", gender: "Male", description: "Crisp, mature" },
  { id: "pNInz6obpgDQGcFmaJgB", name: "Adam", accent: "American", gender: "Male", description: "Deep, authoritative" },
  { id: "yoZ06aMxZJJ28mfd3POQ", name: "Sam", accent: "American", gender: "Male", description: "Raspy, dynamic" },
];

function mapDbToSettings(row: Record<string, unknown>): AssistantSettings {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    assistantName: row.assistant_name as string,
    userDisplayName: row.user_display_name as string | null,
    selectedVoiceId: row.selected_voice_id as string,
    autoSpeak: row.auto_speak as boolean,
    speechRate: Number(row.speech_rate),
    showSuggestedQuestions: row.show_suggested_questions as boolean,
    showConversationHistory: row.show_conversation_history as boolean,
    compactMode: row.compact_mode as boolean,
    enableVoiceInput: row.enable_voice_input as boolean,
    enableCodeHighlighting: row.enable_code_highlighting as boolean,
    soundTheme: (row.sound_theme as string) || "claude-insider",
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Get or create settings (returns array from SETOF function)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase.rpc("get_or_create_assistant_settings", {
      p_user_id: session.user.id,
    });

    if (error) {
      console.error("[Assistant Settings] Error fetching settings:", error);
      return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }

    // RPC with SETOF returns an array, take the first element
    const settings = Array.isArray(data) ? data[0] : data;

    if (!settings) {
      return NextResponse.json({ error: "Settings not found" }, { status: 404 });
    }

    return NextResponse.json({
      settings: mapDbToSettings(settings),
      availableVoices: AVAILABLE_VOICES,
    });
  } catch (error) {
    console.error("[Assistant Settings] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const supabase = await createClient();

    // Build update object
    const updates: Record<string, unknown> = {};

    if (body.assistantName !== undefined) {
      updates.assistant_name = body.assistantName.trim() || "Claude";
    }
    if (body.userDisplayName !== undefined) {
      updates.user_display_name = body.userDisplayName?.trim() || null;
    }
    if (body.selectedVoiceId !== undefined) {
      // Validate voice ID
      const validVoice = AVAILABLE_VOICES.find((v) => v.id === body.selectedVoiceId);
      if (validVoice) {
        updates.selected_voice_id = body.selectedVoiceId;
      }
    }
    if (body.autoSpeak !== undefined) {
      updates.auto_speak = Boolean(body.autoSpeak);
    }
    if (body.speechRate !== undefined) {
      const rate = Number(body.speechRate);
      if (rate >= 0.5 && rate <= 2.0) {
        updates.speech_rate = rate;
      }
    }
    if (body.showSuggestedQuestions !== undefined) {
      updates.show_suggested_questions = Boolean(body.showSuggestedQuestions);
    }
    if (body.showConversationHistory !== undefined) {
      updates.show_conversation_history = Boolean(body.showConversationHistory);
    }
    if (body.compactMode !== undefined) {
      updates.compact_mode = Boolean(body.compactMode);
    }
    if (body.enableVoiceInput !== undefined) {
      updates.enable_voice_input = Boolean(body.enableVoiceInput);
    }
    if (body.enableCodeHighlighting !== undefined) {
      updates.enable_code_highlighting = Boolean(body.enableCodeHighlighting);
    }
    if (body.soundTheme !== undefined) {
      // Validate sound theme
      if (VALID_SOUND_THEMES.includes(body.soundTheme)) {
        updates.sound_theme = body.soundTheme;
      }
    }

    // First ensure settings exist
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.rpc("get_or_create_assistant_settings", {
      p_user_id: session.user.id,
    });

    // Then update
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
      .from("assistant_settings")
      .update(updates)
      .eq("user_id", session.user.id)
      .select()
      .single();

    if (error) {
      console.error("[Assistant Settings] Error updating settings:", error);
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }

    return NextResponse.json({
      settings: mapDbToSettings(data),
      success: true,
    });
  } catch (error) {
    console.error("[Assistant Settings] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Support PUT as alias for POST
export const PUT = POST;
