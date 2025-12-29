/**
 * Presence Offline API Endpoint
 *
 * Used by sendBeacon() when browser is closing to mark user as offline.
 * This endpoint is designed for fire-and-forget requests.
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: true }); // Silently succeed for anonymous
    }

    const supabase = await createAdminClient();

    // Update presence to offline
    await supabase
      .from("user_presence")
      .update({
        status: "offline",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    // Log but don't fail - this is a best-effort endpoint
    console.warn("[Presence Offline] Error:", error);
    return NextResponse.json({ success: true });
  }
}
