"use server";

/**
 * Auth Server Actions
 *
 * Server-side authentication actions that require elevated privileges.
 * These actions use the Better Auth server API directly.
 *
 * @see https://www.better-auth.com/docs/authentication/email-password
 */

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Set password for OAuth-only users
 *
 * This allows users who signed up via OAuth (GitHub, Google) to add
 * a password so they can also sign in with email/password.
 *
 * For security, this can only be called from the server with a valid session.
 */
export async function setPasswordAction(
  newPassword: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    // Validate password
    if (!newPassword || newPassword.length < 8) {
      return { error: "Password must be at least 8 characters" };
    }

    // Get headers for session validation
    const headersList = await headers();

    // Call Better Auth's setPassword API
    const result = await auth.api.setPassword({
      body: { newPassword },
      headers: headersList,
    });

    if (!result) {
      return { error: "Failed to set password" };
    }

    return { success: true };
  } catch (error) {
    console.error("[Auth] Set password error:", error);

    // Handle specific Better Auth errors
    if (error instanceof Error) {
      if (error.message.includes("already has a password")) {
        return { error: "You already have a password set. Use change password instead." };
      }
      if (error.message.includes("session")) {
        return { error: "Session expired. Please sign in again." };
      }
      return { error: error.message };
    }

    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get user's linked accounts
 *
 * Returns a list of OAuth providers linked to the user's account.
 */
export async function getLinkedAccountsAction(): Promise<{
  accounts?: Array<{
    id: string;
    providerId: string;
    accountId: string;
    createdAt: Date;
  }>;
  error?: string;
}> {
  try {
    const headersList = await headers();

    // Get current session
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session?.user) {
      return { error: "Not authenticated" };
    }

    // Get linked accounts using Better Auth API
    const accounts = await auth.api.listUserAccounts({
      headers: headersList,
    });

    return {
      accounts: accounts?.map((acc: { id: string; providerId: string; accountId: string; createdAt: Date }) => ({
        id: acc.id,
        providerId: acc.providerId,
        accountId: acc.accountId,
        createdAt: acc.createdAt,
      })) || [],
    };
  } catch (error) {
    console.error("[Auth] Get linked accounts error:", error);
    return { error: "Failed to get linked accounts" };
  }
}

/**
 * Unlink an OAuth provider from the user's account
 *
 * @param providerId - The provider to unlink (e.g., "github", "google")
 */
export async function unlinkAccountAction(
  providerId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const headersList = await headers();

    // Get current accounts to check if this is the only one
    const accounts = await auth.api.listUserAccounts({
      headers: headersList,
    });

    // Get session to check if user has password
    const session = await auth.api.getSession({
      headers: headersList,
    });

    const hasPassword = session?.user?.hasPassword;
    const accountCount = accounts?.length || 0;

    // Prevent unlinking if it's the only login method
    if (accountCount <= 1 && !hasPassword) {
      return {
        error: "Cannot unlink your only login method. Add a password or connect another account first.",
      };
    }

    // Unlink the account
    await auth.api.unlinkAccount({
      headers: headersList,
      body: { providerId },
    });

    return { success: true };
  } catch (error) {
    console.error("[Auth] Unlink account error:", error);

    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: "Failed to unlink account" };
  }
}
