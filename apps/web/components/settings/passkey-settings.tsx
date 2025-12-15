"use client";

/**
 * Passkey Settings Component
 *
 * Manages WebAuthn passkeys for passwordless authentication.
 * Supports Face ID, Touch ID, Windows Hello, and security keys.
 */

import { useState, useEffect, useTransition } from "react";
import { cn } from "@/lib/design-system";
import { useToast } from "@/components/toast";
import {
  getPasskeys,
  initPasskeyRegistration,
  completePasskeyRegistration,
  renamePasskey,
  removePasskey,
  type PasskeyInfo,
} from "@/app/actions/passkeys";
import { startRegistration } from "@simplewebauthn/browser";
import { formatLastUsed, isWebAuthnSupported } from "@/lib/webauthn";

type ViewState = "list" | "registering" | "naming";

export function PasskeySettings() {
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  // State
  const [passkeys, setPasskeys] = useState<PasskeyInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewState, setViewState] = useState<ViewState>("list");
  const [isSupported, setIsSupported] = useState(true);
  const [newPasskeyName, setNewPasskeyName] = useState("");
  const [pendingPasskey, setPendingPasskey] = useState<PasskeyInfo | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadPasskeys = async () => {
    setIsLoading(true);
    const result = await getPasskeys();
    if (!result.error && result.passkeys) {
      setPasskeys(result.passkeys);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    // Check WebAuthn support
    setIsSupported(isWebAuthnSupported());
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPasskeys();
  }, []);

  const handleAddPasskey = async () => {
    if (!isSupported) {
      toast.error("Passkeys are not supported in this browser");
      return;
    }

    setViewState("registering");

    try {
      // Get registration options from server
      const initResult = await initPasskeyRegistration();
      if (initResult.error || !initResult.options) {
        toast.error(initResult.error || "Failed to start registration");
        setViewState("list");
        return;
      }

      // Trigger browser's WebAuthn prompt (Face ID, Touch ID, etc.)
      const credential = await startRegistration({
        optionsJSON: initResult.options,
      });

      // Complete registration on server
      const completeResult = await completePasskeyRegistration(credential);
      if (completeResult.error || !completeResult.passkey) {
        toast.error(completeResult.error || "Failed to register passkey");
        setViewState("list");
        return;
      }

      // Show naming step
      setPendingPasskey(completeResult.passkey);
      setNewPasskeyName(completeResult.passkey.name);
      setViewState("naming");
    } catch (error) {
      // User cancelled or WebAuthn error
      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          // User cancelled - silently return to list
          setViewState("list");
          return;
        }
        toast.error(error.message);
      }
      setViewState("list");
    }
  };

  const handleSavePasskeyName = async () => {
    if (!pendingPasskey) return;

    startTransition(async () => {
      // If name changed, update it
      if (newPasskeyName.trim() && newPasskeyName !== pendingPasskey.name) {
        await renamePasskey(pendingPasskey.id, newPasskeyName.trim());
        pendingPasskey.name = newPasskeyName.trim();
      }

      setPasskeys([pendingPasskey, ...passkeys]);
      setPendingPasskey(null);
      setNewPasskeyName("");
      setViewState("list");
      toast.success("Passkey added successfully!");
    });
  };

  const handleRename = async (id: string) => {
    if (!editingName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    startTransition(async () => {
      const result = await renamePasskey(id, editingName.trim());
      if (result.error) {
        toast.error(result.error);
        return;
      }

      setPasskeys(
        passkeys.map((p) =>
          p.id === id ? { ...p, name: editingName.trim() } : p
        )
      );
      setEditingId(null);
      setEditingName("");
      toast.success("Passkey renamed");
    });
  };

  const handleRemove = async (id: string) => {
    startTransition(async () => {
      const result = await removePasskey(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      setPasskeys(passkeys.filter((p) => p.id !== id));
      setDeletingId(null);
      toast.success("Passkey removed");
    });
  };

  // Not supported view
  if (!isSupported) {
    return (
      <div
        className={cn(
          "p-6 rounded-xl",
          "bg-gray-50 dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]"
        )}
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center">
            <svg
              className="w-6 h-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Passkeys Not Supported
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Your browser doesn&apos;t support passkeys. Try using a modern browser
              like Chrome, Safari, Firefox, or Edge.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-24 bg-gray-200 dark:bg-[#1a1a1a] rounded-xl" />
        <div className="h-16 bg-gray-200 dark:bg-[#1a1a1a] rounded-xl" />
      </div>
    );
  }

  // Registering state
  if (viewState === "registering") {
    return (
      <div
        className={cn(
          "p-6 rounded-xl",
          "bg-gray-50 dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]"
        )}
      >
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center mb-4 animate-pulse">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Waiting for Passkey
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Follow the prompts from your device to create a passkey
          </p>
          <button
            onClick={() => setViewState("list")}
            className="mt-4 text-sm text-blue-600 dark:text-cyan-400 hover:underline"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Naming state
  if (viewState === "naming" && pendingPasskey) {
    return (
      <div
        className={cn(
          "p-6 rounded-xl",
          "bg-gray-50 dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]"
        )}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              "bg-gradient-to-br from-green-500 to-emerald-600"
            )}
          >
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Passkey Created!
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Give it a name so you can identify it later
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            value={newPasskeyName}
            onChange={(e) => setNewPasskeyName(e.target.value.slice(0, 100))}
            placeholder="e.g., iPhone, MacBook, YubiKey"
            className={cn(
              "w-full px-4 py-3 rounded-lg",
              "bg-white dark:bg-[#0a0a0a]",
              "border border-gray-200 dark:border-[#262626]",
              "text-gray-900 dark:text-white",
              "placeholder:text-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-blue-500"
            )}
            autoFocus
          />

          <div className="flex gap-3">
            <button
              onClick={() => {
                setPendingPasskey(null);
                setNewPasskeyName("");
                setViewState("list");
                loadPasskeys(); // Refresh to show new passkey
              }}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium",
                "border border-gray-200 dark:border-[#262626]",
                "text-gray-700 dark:text-gray-300",
                "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
                "transition-colors"
              )}
            >
              Skip
            </button>
            <button
              onClick={handleSavePasskeyName}
              disabled={isPending}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium",
                "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                "text-white shadow-lg shadow-blue-500/25",
                "hover:opacity-90 transition-opacity",
                "disabled:opacity-50"
              )}
            >
              {isPending ? "Saving..." : "Save Name"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main list view
  return (
    <div className="space-y-4">
      {/* Header */}
      <div
        className={cn(
          "p-6 rounded-xl",
          "bg-gray-50 dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]"
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 via-blue-500 to-cyan-500 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Passkeys
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Sign in faster with Face ID, Touch ID, Windows Hello, or security keys
              </p>
            </div>
          </div>
          <button
            onClick={handleAddPasskey}
            disabled={isPending}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium",
              "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
              "text-white shadow-lg shadow-blue-500/25",
              "hover:opacity-90 transition-opacity",
              "disabled:opacity-50"
            )}
          >
            Add Passkey
          </button>
        </div>
      </div>

      {/* Passkey List */}
      {passkeys.length === 0 ? (
        <div
          className={cn(
            "p-8 rounded-xl text-center",
            "bg-gray-50 dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]"
          )}
        >
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <h4 className="text-gray-900 dark:text-white font-medium mb-2">
            No passkeys yet
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            Add a passkey to sign in quickly and securely without entering your password
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {passkeys.map((passkey) => (
            <div
              key={passkey.id}
              className={cn(
                "p-4 rounded-xl",
                "bg-gray-50 dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]"
              )}
            >
              {/* Delete confirmation */}
              {deletingId === passkey.id ? (
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Remove this passkey?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDeletingId(null)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm",
                        "border border-gray-200 dark:border-[#262626]",
                        "text-gray-600 dark:text-gray-400",
                        "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
                      )}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleRemove(passkey.id)}
                      disabled={isPending}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium",
                        "bg-red-500 text-white",
                        "hover:bg-red-600",
                        "disabled:opacity-50"
                      )}
                    >
                      {isPending ? "Removing..." : "Remove"}
                    </button>
                  </div>
                </div>
              ) : editingId === passkey.id ? (
                /* Edit mode */
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value.slice(0, 100))}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-lg text-sm",
                      "bg-white dark:bg-[#0a0a0a]",
                      "border border-gray-200 dark:border-[#262626]",
                      "text-gray-900 dark:text-white",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500"
                    )}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(passkey.id);
                      if (e.key === "Escape") {
                        setEditingId(null);
                        setEditingName("");
                      }
                    }}
                  />
                  <button
                    onClick={() => handleRename(passkey.id)}
                    disabled={isPending}
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm font-medium",
                      "bg-blue-500 text-white",
                      "hover:bg-blue-600",
                      "disabled:opacity-50"
                    )}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setEditingName("");
                    }}
                    className="px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                /* Normal view */
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div
                    className={cn(
                      "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                      passkey.deviceType === "platform"
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-cyan-400"
                        : "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                    )}
                  >
                    {passkey.deviceType === "platform" ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white truncate">
                        {passkey.name}
                      </span>
                      {passkey.backedUp && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                          Synced
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {passkey.deviceType === "platform" ? "Platform" : "Security Key"}
                      {" • "}
                      {formatLastUsed(passkey.lastUsedAt)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingId(passkey.id);
                        setEditingName(passkey.name);
                      }}
                      className={cn(
                        "p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
                        "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
                        "transition-colors"
                      )}
                      title="Rename"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeletingId(passkey.id)}
                      className={cn(
                        "p-2 rounded-lg text-gray-400 hover:text-red-500",
                        "hover:bg-red-50 dark:hover:bg-red-900/20",
                        "transition-colors"
                      )}
                      title="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <p className="text-xs text-gray-500 dark:text-gray-400 px-2">
        Passkeys are phishing-resistant and more secure than passwords. They work across
        your devices when synced via iCloud Keychain, Google Password Manager, or similar services.
      </p>
    </div>
  );
}
