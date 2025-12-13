"use server";

/**
 * Comments Server Actions
 *
 * Handle comment operations including creating, editing, deleting,
 * and voting on comments. Comments require moderation before being public.
 */

import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notifications";

export type CommentResult = {
  success?: boolean;
  data?: Comment;
  error?: string;
};

export type Comment = {
  id: string;
  user_id: string;
  resource_type: "resource" | "doc";
  resource_id: string;
  parent_id: string | null;
  content: string;
  status: "pending" | "approved" | "rejected" | "flagged";
  is_edited: boolean;
  upvotes: number;
  downvotes: number;
  created_at: string;
  updated_at: string;
  // Joined data
  user?: {
    name: string;
    email: string;
    image?: string;
    username?: string;
  };
  replies?: Comment[];
  user_vote?: "up" | "down" | null;
};

/**
 * Create a new comment
 */
export async function createComment(
  resourceType: "resource" | "doc",
  resourceId: string,
  content: string,
  parentId?: string
): Promise<CommentResult> {
  try {
    // Validate content
    if (!content.trim() || content.length < 3) {
      return { error: "Comment must be at least 3 characters" };
    }
    if (content.length > 2000) {
      return { error: "Comment must be less than 2000 characters" };
    }

    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in to comment" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createAdminClient() as any;

    const { data, error } = await supabase
      .from("comments")
      .insert({
        user_id: session.user.id,
        resource_type: resourceType,
        resource_id: resourceId,
        parent_id: parentId || null,
        content: content.trim(),
        status: "pending", // Requires moderation
      })
      .select()
      .single();

    if (error) {
      console.error("[Comments] Create error:", error);
      return { error: "Failed to post comment" };
    }

    // Log activity
    await logActivity(supabase, session.user.id, resourceType, resourceId);

    // Create notification for reply
    if (parentId && data) {
      try {
        // Get parent comment author
        const { data: parentComment } = await supabase
          .from("comments")
          .select("user_id")
          .eq("id", parentId)
          .single();

        if (parentComment && parentComment.user_id !== session.user.id) {
          // Get commenter's name for notification
          const { data: commenter } = await supabase
            .from("user")
            .select("name, username")
            .eq("id", session.user.id)
            .single();

          const commenterName = commenter?.name || commenter?.username || "Someone";

          await createNotification({
            userId: parentComment.user_id,
            type: "reply",
            title: `${commenterName} replied to your comment`,
            message: content.trim().slice(0, 100) + (content.length > 100 ? "..." : ""),
            actorId: session.user.id,
            resourceType: resourceType,
            resourceId: resourceId,
            data: {
              commentId: data.id,
              parentId: parentId,
            },
          });
        }
      } catch (notifError) {
        console.error("[Comments] Notification error:", notifError);
        // Don't fail the comment creation if notification fails
      }
    }

    revalidatePath(`/${resourceType}s`);

    return { success: true, data };
  } catch (error) {
    console.error("[Comments] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get comments for a resource
 */
export async function getComments(
  resourceType: "resource" | "doc",
  resourceId: string
): Promise<{ data?: Comment[]; error?: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createAdminClient() as any;
    const session = await getSession();

    // Get approved comments (and user's own pending comments)
    // Join with user table to get user info including username
    let query = supabase
      .from("comments")
      .select(`
        *,
        user:user_id (
          name,
          email,
          image,
          username
        )
      `)
      .eq("resource_type", resourceType)
      .eq("resource_id", resourceId)
      .is("parent_id", null) // Only top-level comments
      .order("created_at", { ascending: false });

    // If user is logged in, include their pending comments
    if (session?.user?.id) {
      query = query.or(`status.eq.approved,user_id.eq.${session.user.id}`);
    } else {
      query = query.eq("status", "approved");
    }

    const { data: comments, error } = await query;

    if (error) {
      console.error("[Comments] Fetch error:", error);
      return { error: "Failed to load comments" };
    }

    // Get replies for each comment
    if (comments && comments.length > 0) {
      const commentIds = comments.map((c: Comment) => c.id);
      const { data: replies } = await supabase
        .from("comments")
        .select(`
          *,
          user:user_id (
            name,
            email,
            image,
            username
          )
        `)
        .in("parent_id", commentIds)
        .eq("status", "approved")
        .order("created_at", { ascending: true });

      // Get user votes if logged in
      let userVotes: Record<string, string> = {};
      if (session?.user?.id) {
        const allCommentIds = [...commentIds, ...(replies?.map((r: Comment) => r.id) || [])];
        const { data: votes } = await supabase
          .from("comment_votes")
          .select("comment_id, vote_type")
          .eq("user_id", session.user.id)
          .in("comment_id", allCommentIds);

        if (votes) {
          userVotes = Object.fromEntries(
            votes.map((v: { comment_id: string; vote_type: string }) => [v.comment_id, v.vote_type])
          );
        }
      }

      // Attach replies and user votes to comments
      const commentsWithReplies = comments.map((comment: Comment) => ({
        ...comment,
        user_vote: userVotes[comment.id] || null,
        replies: (replies || [])
          .filter((r: Comment) => r.parent_id === comment.id)
          .map((r: Comment) => ({
            ...r,
            user_vote: userVotes[r.id] || null,
          })),
      }));

      return { data: commentsWithReplies };
    }

    return { data: comments || [] };
  } catch (error) {
    console.error("[Comments] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Edit a comment (only own pending comments)
 */
export async function editComment(
  commentId: string,
  content: string
): Promise<CommentResult> {
  try {
    if (!content.trim() || content.length < 3) {
      return { error: "Comment must be at least 3 characters" };
    }

    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createAdminClient() as any;

    // Check ownership and status
    const { data: existing } = await supabase
      .from("comments")
      .select("user_id, status")
      .eq("id", commentId)
      .single();

    if (!existing) {
      return { error: "Comment not found" };
    }
    if (existing.user_id !== session.user.id) {
      return { error: "You can only edit your own comments" };
    }
    if (existing.status !== "pending") {
      return { error: "You can only edit pending comments" };
    }

    const { data, error } = await supabase
      .from("comments")
      .update({
        content: content.trim(),
        is_edited: true,
        edited_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", commentId)
      .select()
      .single();

    if (error) {
      console.error("[Comments] Edit error:", error);
      return { error: "Failed to edit comment" };
    }

    return { success: true, data };
  } catch (error) {
    console.error("[Comments] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Delete a comment (only own comments)
 */
export async function deleteComment(commentId: string): Promise<CommentResult> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createAdminClient() as any;

    // Check ownership
    const { data: existing } = await supabase
      .from("comments")
      .select("user_id, resource_type")
      .eq("id", commentId)
      .single();

    if (!existing) {
      return { error: "Comment not found" };
    }
    if (existing.user_id !== session.user.id) {
      return { error: "You can only delete your own comments" };
    }

    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      console.error("[Comments] Delete error:", error);
      return { error: "Failed to delete comment" };
    }

    revalidatePath(`/${existing.resource_type}s`);

    return { success: true };
  } catch (error) {
    console.error("[Comments] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Vote on a comment (up or down)
 */
export async function voteComment(
  commentId: string,
  voteType: "up" | "down"
): Promise<CommentResult> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in to vote" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createAdminClient() as any;

    // Check for existing vote
    const { data: existing } = await supabase
      .from("comment_votes")
      .select("id, vote_type")
      .eq("user_id", session.user.id)
      .eq("comment_id", commentId)
      .single();

    if (existing) {
      if (existing.vote_type === voteType) {
        // Remove vote if same type
        await supabase
          .from("comment_votes")
          .delete()
          .eq("id", existing.id);
      } else {
        // Change vote
        await supabase
          .from("comment_votes")
          .update({ vote_type: voteType })
          .eq("id", existing.id);
      }
    } else {
      // Create new vote
      await supabase.from("comment_votes").insert({
        user_id: session.user.id,
        comment_id: commentId,
        vote_type: voteType,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("[Comments] Vote error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get comment count for a resource
 */
export async function getCommentCount(
  resourceType: "resource" | "doc",
  resourceId: string
): Promise<number> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createAdminClient() as any;
    const { count } = await supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("resource_type", resourceType)
      .eq("resource_id", resourceId)
      .eq("status", "approved");

    return count || 0;
  } catch {
    return 0;
  }
}

// Helper to log activity
async function logActivity(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  resourceType: string,
  resourceId: string
): Promise<void> {
  try {
    await supabase.from("user_activity").insert({
      user_id: userId,
      activity_type: "comment",
      resource_type: resourceType,
      resource_id: resourceId,
    });
  } catch (error) {
    console.error("[Activity] Log error:", error);
  }
}
