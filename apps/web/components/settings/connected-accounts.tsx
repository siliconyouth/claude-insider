"use client";

/**
 * Connected Accounts Component
 *
 * Manages OAuth provider connections (GitHub, Google).
 * Allows users to:
 * - View connected providers
 * - Connect new providers
 * - Disconnect existing providers (with safety checks)
 *
 * @see https://www.better-auth.com/docs/authentication/social-sign-on
 */

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/design-system";
import { authClient } from "@/lib/auth-client";
import { getLinkedAccountsAction, unlinkAccountAction } from "@/app/actions/auth";

interface ConnectedAccountsProps {
  hasPassword: boolean;
  onAccountChange?: () => void;
}

interface LinkedAccount {
  id: string;
  providerId: string;
  accountId: string;
  createdAt: Date;
}

// Supported OAuth providers
const PROVIDERS = [
  {
    id: "github",
    name: "GitHub",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path
          fillRule="evenodd"
          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
          clipRule="evenodd"
        />
      </svg>
    ),
    color: "hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900",
    connectedBg: "bg-gray-100 dark:bg-gray-800",
  },
  {
    id: "google",
    name: "Google",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    ),
    color: "hover:bg-gray-100 dark:hover:bg-gray-800",
    connectedBg: "bg-blue-50 dark:bg-blue-900/20",
  },
];

export function ConnectedAccounts({ hasPassword, onAccountChange }: ConnectedAccountsProps) {
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch linked accounts on mount
  const fetchAccounts = useCallback(async () => {
    try {
      const result = await getLinkedAccountsAction();
      if (result.error) {
        setError(result.error);
      } else {
        setLinkedAccounts(result.accounts || []);
      }
    } catch {
      setError("Failed to load connected accounts");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const isConnected = (providerId: string) => {
    return linkedAccounts.some((acc) => acc.providerId === providerId);
  };

  const canDisconnect = () => {
    // Can disconnect if user has password OR has more than one connected account
    return hasPassword || linkedAccounts.length > 1;
  };

  const handleConnect = async (providerId: string) => {
    setError(null);
    setSuccess(null);
    setActionLoading(providerId);

    try {
      // Use Better Auth client to initiate OAuth flow
      // This will redirect to the provider
      await authClient.signIn.social({
        provider: providerId as "github" | "google",
        callbackURL: `${window.location.origin}/settings?connected=${providerId}`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect account");
      setActionLoading(null);
    }
  };

  const handleDisconnect = async (providerId: string) => {
    if (!canDisconnect()) {
      setError("Cannot disconnect your only login method. Add a password or connect another account first.");
      return;
    }

    setError(null);
    setSuccess(null);
    setActionLoading(providerId);

    try {
      const result = await unlinkAccountAction(providerId);

      if (result.error) {
        throw new Error(result.error);
      }

      // Update local state
      setLinkedAccounts((prev) => prev.filter((acc) => acc.providerId !== providerId));
      setSuccess(`${getProviderName(providerId)} account disconnected successfully`);
      onAccountChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect account");
    } finally {
      setActionLoading(null);
    }
  };

  const getProviderName = (providerId: string) => {
    return PROVIDERS.find((p) => p.id === providerId)?.name || providerId;
  };

  // Check URL for connection success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    if (connected) {
      setSuccess(`${getProviderName(connected)} account connected successfully`);
      // Clean up URL
      window.history.replaceState({}, "", "/settings");
      // Refresh accounts
      fetchAccounts();
      onAccountChange?.();
    }
  }, [fetchAccounts, onAccountChange]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">
          Connected Accounts
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage your linked social accounts for sign-in.
        </p>
      </div>

      {/* Provider List */}
      <div className="space-y-3">
        {PROVIDERS.map((provider) => {
          const connected = isConnected(provider.id);
          const account = linkedAccounts.find((acc) => acc.providerId === provider.id);
          const loading = actionLoading === provider.id;

          return (
            <div
              key={provider.id}
              className={cn(
                "flex items-center justify-between p-4 rounded-lg border transition-all",
                connected
                  ? "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10"
                  : "border-gray-200 dark:border-[#262626] bg-white dark:bg-[#111111]"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    connected
                      ? provider.connectedBg
                      : "bg-gray-100 dark:bg-gray-800"
                  )}
                >
                  {provider.icon}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {provider.name}
                  </p>
                  {connected && account && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Connected{" "}
                      {new Date(account.createdAt).toLocaleDateString()}
                    </p>
                  )}
                  {!connected && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Not connected
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() =>
                  connected
                    ? handleDisconnect(provider.id)
                    : handleConnect(provider.id)
                }
                disabled={loading || (connected && !canDisconnect())}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                  connected
                    ? cn(
                        "text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800",
                        "hover:bg-red-50 dark:hover:bg-red-900/20",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )
                    : cn(
                        "text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#262626]",
                        "hover:border-blue-500/50 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      ),
                  loading && "opacity-50 cursor-wait"
                )}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    {connected ? "Disconnecting..." : "Connecting..."}
                  </span>
                ) : connected ? (
                  "Disconnect"
                ) : (
                  "Connect"
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Safety Warning */}
      {linkedAccounts.length === 1 && !hasPassword && (
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            <strong>Note:</strong> You have only one login method. Add a password
            or connect another account before disconnecting.
          </p>
        </div>
      )}

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
    </div>
  );
}
