"use server";

/**
 * Account Management Server Actions
 *
 * Handle data export, account deletion, and GDPR compliance.
 */

import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

export interface ExportData {
  profile: {
    id: string;
    email: string;
    name: string | null;
    username: string | null;
    bio: string | null;
    createdAt: string;
    role: string;
  };
  settings: {
    privacy: Record<string, boolean>;
    notifications: Record<string, boolean>;
  };
  content: {
    comments: Array<{
      id: string;
      content: string;
      resourceType: string;
      resourceId: string;
      createdAt: string;
      status: string;
    }>;
    suggestions: Array<{
      id: string;
      title: string;
      description: string;
      resourceType: string;
      resourceId: string;
      createdAt: string;
      status: string;
    }>;
    favorites: Array<{
      id: string;
      resourceType: string;
      resourceId: string;
      createdAt: string;
    }>;
    collections: Array<{
      id: string;
      name: string;
      description: string | null;
      itemCount: number;
      createdAt: string;
    }>;
  };
  social: {
    followers: Array<{
      id: string;
      username: string | null;
      name: string;
      followedAt: string;
    }>;
    following: Array<{
      id: string;
      username: string | null;
      name: string;
      followedAt: string;
    }>;
  };
  achievements: Array<{
    name: string;
    description: string;
    earnedAt: string;
    points: number;
  }>;
  exportedAt: string;
  version: string;
}

/**
 * Export all user data as JSON (GDPR-compliant)
 */
export async function exportUserData(): Promise<{
  data?: ExportData;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;
    const userId = session.user.id;

    // Fetch all user data in parallel
    const [
      userResult,
      commentsResult,
      suggestionsResult,
      favoritesResult,
      collectionsResult,
      followersResult,
      followingResult,
      achievementsResult,
      notifPrefsResult,
    ] = await Promise.all([
      supabase
        .from("user")
        .select("id, email, name, username, bio, createdAt, role, profilePrivacy")
        .eq("id", userId)
        .single(),
      supabase
        .from("comments")
        .select("id, content, resource_type, resource_id, created_at, status")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("edit_suggestions")
        .select("id, title, description, resource_type, resource_id, created_at, status")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("favorites")
        .select("id, resource_type, resource_id, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("collections")
        .select("id, name, description, item_count, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("user_follows")
        .select(
          "created_at, follower:follower_id (id, username, name)"
        )
        .eq("following_id", userId),
      supabase
        .from("user_follows")
        .select(
          "created_at, following:following_id (id, username, name)"
        )
        .eq("follower_id", userId),
      supabase
        .from("user_achievements")
        .select(
          "earned_at, achievement:achievement_id (name, description, points)"
        )
        .eq("user_id", userId),
      supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId)
        .single(),
    ]);

    const user = userResult.data;
    if (!user) {
      return { error: "User not found" };
    }

    const exportData: ExportData = {
      profile: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        bio: user.bio,
        createdAt: user.createdAt,
        role: user.role,
      },
      settings: {
        privacy: user.profilePrivacy || {},
        notifications: notifPrefsResult.data || {},
      },
      content: {
        comments: (commentsResult.data || []).map((c: {
          id: string;
          content: string;
          resource_type: string;
          resource_id: string;
          created_at: string;
          status: string;
        }) => ({
          id: c.id,
          content: c.content,
          resourceType: c.resource_type,
          resourceId: c.resource_id,
          createdAt: c.created_at,
          status: c.status,
        })),
        suggestions: (suggestionsResult.data || []).map((s: {
          id: string;
          title: string;
          description: string;
          resource_type: string;
          resource_id: string;
          created_at: string;
          status: string;
        }) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          resourceType: s.resource_type,
          resourceId: s.resource_id,
          createdAt: s.created_at,
          status: s.status,
        })),
        favorites: (favoritesResult.data || []).map((f: {
          id: string;
          resource_type: string;
          resource_id: string;
          created_at: string;
        }) => ({
          id: f.id,
          resourceType: f.resource_type,
          resourceId: f.resource_id,
          createdAt: f.created_at,
        })),
        collections: (collectionsResult.data || []).map((c: {
          id: string;
          name: string;
          description: string | null;
          item_count: number;
          created_at: string;
        }) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          itemCount: c.item_count,
          createdAt: c.created_at,
        })),
      },
      social: {
        followers: (followersResult.data || [])
          .filter((f: { follower: { id: string } | null }) => f.follower)
          .map((f: {
            created_at: string;
            follower: { id: string; username: string | null; name: string };
          }) => ({
            id: f.follower.id,
            username: f.follower.username,
            name: f.follower.name,
            followedAt: f.created_at,
          })),
        following: (followingResult.data || [])
          .filter((f: { following: { id: string } | null }) => f.following)
          .map((f: {
            created_at: string;
            following: { id: string; username: string | null; name: string };
          }) => ({
            id: f.following.id,
            username: f.following.username,
            name: f.following.name,
            followedAt: f.created_at,
          })),
      },
      achievements: (achievementsResult.data || [])
        .filter((a: { achievement: { name: string } | null }) => a.achievement)
        .map((a: {
          earned_at: string;
          achievement: { name: string; description: string; points: number };
        }) => ({
          name: a.achievement.name,
          description: a.achievement.description,
          earnedAt: a.earned_at,
          points: a.achievement.points,
        })),
      exportedAt: new Date().toISOString(),
      version: "1.0",
    };

    return { data: exportData };
  } catch (error) {
    console.error("[Account] Export error:", error);
    return { error: "Failed to export data" };
  }
}

/**
 * Request account deletion
 */
export async function requestAccountDeletion(): Promise<{
  success?: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id || !session.user.email) {
      return { error: "You must be signed in" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Generate a deletion token
    const deletionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store the deletion request
    const { error: insertError } = await supabase.from("account_deletion_requests").insert({
      user_id: session.user.id,
      token: deletionToken,
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      // Table might not exist, create inline
      await supabase.rpc("execute_sql", {
        sql: `
          CREATE TABLE IF NOT EXISTS account_deletion_requests (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
            token TEXT NOT NULL UNIQUE,
            expires_at TIMESTAMPTZ NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
        `,
      });

      // Retry insert
      await supabase.from("account_deletion_requests").insert({
        user_id: session.user.id,
        token: deletionToken,
        expires_at: expiresAt.toISOString(),
      });
    }

    // Get user name
    const { data: user } = await supabase
      .from("user")
      .select("name")
      .eq("id", session.user.id)
      .single();

    // Send confirmation email
    await sendEmail({
      to: session.user.email,
      subject: "Account Deletion Request - Claude Insider",
      html: getDeletionEmailHtml(user?.name || "User", deletionToken),
    });

    return { success: true };
  } catch (error) {
    console.error("[Account] Deletion request error:", error);
    return { error: "Failed to request account deletion" };
  }
}

/**
 * Confirm and execute account deletion
 */
export async function confirmAccountDeletion(token: string): Promise<{
  success?: boolean;
  error?: string;
}> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Verify the token
    const { data: request } = await supabase
      .from("account_deletion_requests")
      .select("user_id, expires_at")
      .eq("token", token)
      .single();

    if (!request) {
      return { error: "Invalid or expired deletion token" };
    }

    if (new Date(request.expires_at) < new Date()) {
      return { error: "Deletion token has expired. Please request a new one." };
    }

    // Delete all user data
    const userId = request.user_id;

    // Delete in order to respect foreign key constraints
    await Promise.all([
      supabase.from("notifications").delete().eq("user_id", userId),
      supabase.from("notification_preferences").delete().eq("user_id", userId),
      supabase.from("user_achievements").delete().eq("user_id", userId),
      supabase.from("achievement_progress").delete().eq("user_id", userId),
      supabase.from("user_follows").delete().or(`follower_id.eq.${userId},following_id.eq.${userId}`),
      supabase.from("comments").delete().eq("user_id", userId),
      supabase.from("edit_suggestions").delete().eq("user_id", userId),
      supabase.from("collection_items").delete().match({ collection_id: supabase.from("collections").select("id").eq("user_id", userId) }),
      supabase.from("collections").delete().eq("user_id", userId),
      supabase.from("favorites").delete().eq("user_id", userId),
      supabase.from("feedback").delete().eq("user_id", userId),
      supabase.from("beta_applications").delete().eq("user_id", userId),
      supabase.from("account_deletion_requests").delete().eq("user_id", userId),
    ]);

    // Finally delete the user
    await supabase.from("user").delete().eq("id", userId);

    // Delete from auth (Better Auth sessions)
    await supabase.from("session").delete().eq("userId", userId);
    await supabase.from("account").delete().eq("userId", userId);

    return { success: true };
  } catch (error) {
    console.error("[Account] Deletion error:", error);
    return { error: "Failed to delete account" };
  }
}

/**
 * Cancel a pending deletion request
 */
export async function cancelAccountDeletion(): Promise<{
  success?: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    await supabase
      .from("account_deletion_requests")
      .delete()
      .eq("user_id", session.user.id);

    return { success: true };
  } catch (error) {
    console.error("[Account] Cancel deletion error:", error);
    return { error: "Failed to cancel deletion request" };
  }
}

/**
 * Check if there's a pending deletion request
 */
export async function getPendingDeletionRequest(): Promise<{
  pending?: boolean;
  expiresAt?: string;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { pending: false };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data } = await supabase
      .from("account_deletion_requests")
      .select("expires_at")
      .eq("user_id", session.user.id)
      .gt("expires_at", new Date().toISOString())
      .single();

    return {
      pending: !!data,
      expiresAt: data?.expires_at,
    };
  } catch {
    return { pending: false };
  }
}

function getDeletionEmailHtml(name: string, token: string): string {
  const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://www.claudeinsider.com"}/settings/delete-account?token=${token}`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Deletion Request</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
      <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(to right, #7c3aed, #2563eb, #06b6d4); padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Account Deletion Request</h1>
        </div>
        <div style="padding: 32px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Hi ${name},
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            We received a request to delete your Claude Insider account. This action is <strong>irreversible</strong> and will permanently remove:
          </p>
          <ul style="color: #6b7280; font-size: 14px; line-height: 1.8;">
            <li>Your profile and account information</li>
            <li>All comments and suggestions</li>
            <li>Your favorites and collections</li>
            <li>Followers and following relationships</li>
            <li>Achievements and progress</li>
            <li>Notification preferences</li>
          </ul>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            If you want to proceed, click the button below. This link expires in 24 hours.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${confirmUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
              Confirm Account Deletion
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 14px; line-height: 1.6;">
            If you didn't request this deletion, you can safely ignore this email. Your account will not be affected.
          </p>
        </div>
        <div style="background: #f9fafb; padding: 16px 32px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
            Claude Insider · <a href="https://www.claudeinsider.com" style="color: #6b7280;">www.claudeinsider.com</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
