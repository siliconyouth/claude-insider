"use client";

/**
 * Passkey Login Button Component
 *
 * Allows users to sign in with a passkey (Face ID, Touch ID, Windows Hello, etc.)
 * Uses WebAuthn for passwordless authentication.
 */

import { useState, useEffect } from "react";
import { cn } from "@/lib/design-system";
import { startAuthentication } from "@simplewebauthn/browser";
import {
  initPasskeyAuth,
  completePasskeyAuth,
} from "@/app/actions/passkeys";
import { isWebAuthnSupported, isPlatformAuthenticatorAvailable } from "@/lib/webauthn-client";

interface PasskeyLoginButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  email?: string;
}

export function PasskeyLoginButton({
  onSuccess,
  onError,
  disabled,
  email,
}: PasskeyLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [hasPlatform, setHasPlatform] = useState(false);

  useEffect(() => {
    // Check WebAuthn support
    const checkSupport = async () => {
      const supported = isWebAuthnSupported();
      setIsSupported(supported);

      if (supported) {
        const platform = await isPlatformAuthenticatorAvailable();
        setHasPlatform(platform);
      }
    };
    checkSupport();
  }, []);

  const handlePasskeyLogin = async () => {
    if (!isSupported || isLoading || disabled) return;

    setIsLoading(true);

    try {
      // Get authentication options from server
      const initResult = await initPasskeyAuth(email);
      if (initResult.error || !initResult.options) {
        onError?.(initResult.error || "Failed to start passkey authentication");
        setIsLoading(false);
        return;
      }

      // Trigger browser's WebAuthn prompt
      const credential = await startAuthentication({
        optionsJSON: initResult.options,
      });

      // Verify with server
      const authResult = await completePasskeyAuth(credential);
      if (authResult.error || !authResult.success || !authResult.email) {
        onError?.(authResult.error || "Passkey verification failed");
        setIsLoading(false);
        return;
      }

      // Create a session for the user via Better Auth
      // We need to use a custom passkey login endpoint or manually create session
      // For now, we'll redirect to a passkey login callback
      const response = await fetch("/api/auth/passkey-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: authResult.userId,
          email: authResult.email,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        onError?.(data.error || "Failed to complete login");
        setIsLoading(false);
        return;
      }

      // Success
      onSuccess?.();
    } catch (error) {
      // User cancelled or WebAuthn error
      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          // User cancelled - silently ignore
          setIsLoading(false);
          return;
        }
        onError?.(error.message);
      }
      setIsLoading(false);
    }
  };

  // Don't show if WebAuthn not supported
  if (!isSupported) return null;

  return (
    <button
      onClick={handlePasskeyLogin}
      disabled={isLoading || disabled}
      className={cn(
        "w-full flex items-center justify-center gap-3 px-4 py-2.5",
        "bg-gray-50 dark:bg-gray-800",
        "text-gray-700 dark:text-gray-200",
        "border border-gray-200 dark:border-gray-700",
        "rounded-lg font-medium",
        "hover:bg-gray-100 dark:hover:bg-gray-700",
        "transition-colors duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed"
      )}
    >
      {isLoading ? (
        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
          />
        </svg>
      )}
      {hasPlatform ? "Sign in with Face ID / Touch ID" : "Sign in with Passkey"}
    </button>
  );
}
