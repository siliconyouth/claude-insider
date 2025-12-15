"use client";

/**
 * Password Settings Component
 *
 * Allows users to:
 * - Change password (if they have one)
 * - Set password (if OAuth-only user)
 *
 * Uses Better Auth's changePassword (client) and setPassword (server action).
 *
 * @see https://www.better-auth.com/docs/authentication/email-password
 */

import { useState, useCallback } from "react";
import { cn } from "@/lib/design-system";
import { authClient } from "@/lib/auth-client";
import { setPasswordAction } from "@/app/actions/auth";

interface PasswordSettingsProps {
  hasPassword: boolean;
  onSuccess?: () => void;
}

export function PasswordSettings({ hasPassword, onSuccess }: PasswordSettingsProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);

  const validatePassword = useCallback((password: string): string | null => {
    if (password.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }
    return null;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate new password
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    // Check passwords match
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      if (hasPassword) {
        // Change existing password using Better Auth client
        const { error: changeError } = await authClient.changePassword({
          currentPassword,
          newPassword,
          revokeOtherSessions: false, // Keep other sessions active
        });

        if (changeError) {
          throw new Error(changeError.message || "Failed to change password");
        }
      } else {
        // Set new password for OAuth user using server action
        const result = await setPasswordAction(newPassword);

        if (result.error) {
          throw new Error(result.error);
        }
      }

      setSuccess(hasPassword ? "Password changed successfully!" : "Password set successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">
          {hasPassword ? "Change Password" : "Set Password"}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {hasPassword
            ? "Update your password to keep your account secure."
            : "Add a password to sign in with email in addition to your connected accounts."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current Password (only if user has one) */}
        {hasPassword && (
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Current Password
            </label>
            <div className="relative">
              <input
                id="currentPassword"
                type={showPasswords ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className={cn(
                  "w-full px-4 py-2.5 pr-12 rounded-lg",
                  "bg-white dark:bg-[#111111]",
                  "border border-gray-200 dark:border-[#262626]",
                  "text-gray-900 dark:text-white",
                  "placeholder:text-gray-400",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                  "transition-colors"
                )}
              />
            </div>
          </div>
        )}

        {/* New Password */}
        <div>
          <label
            htmlFor="newPassword"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {hasPassword ? "New Password" : "Password"}
          </label>
          <div className="relative">
            <input
              id="newPassword"
              type={showPasswords ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className={cn(
                "w-full px-4 py-2.5 pr-12 rounded-lg",
                "bg-white dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]",
                "text-gray-900 dark:text-white",
                "placeholder:text-gray-400",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                "transition-colors"
              )}
            />
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Minimum 8 characters with uppercase, lowercase, and numbers
          </p>
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showPasswords ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className={cn(
                "w-full px-4 py-2.5 pr-12 rounded-lg",
                "bg-white dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]",
                "text-gray-900 dark:text-white",
                "placeholder:text-gray-400",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                "transition-colors"
              )}
            />
          </div>
        </div>

        {/* Show/Hide Passwords Toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showPasswords"
            checked={showPasswords}
            onChange={(e) => setShowPasswords(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label
            htmlFor="showPasswords"
            className="text-sm text-gray-600 dark:text-gray-400"
          >
            Show passwords
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "px-5 py-2.5 text-sm font-medium rounded-lg",
              "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
              "text-white shadow-sm",
              "hover:shadow-md hover:-translate-y-0.5",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0",
              "transition-all duration-200"
            )}
          >
            {isLoading
              ? "Saving..."
              : hasPassword
              ? "Change Password"
              : "Set Password"}
          </button>

          {(currentPassword || newPassword || confirmPassword) && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
