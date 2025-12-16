/**
 * E2EE Provider
 *
 * React context provider for end-to-end encryption state and actions.
 * Wraps the useE2EE hook in a context for app-wide access.
 *
 * Usage:
 * 1. Add <E2EEProvider> to your app layout
 * 2. Use useE2EEContext() in components to access E2EE state/actions
 *
 * The provider gracefully handles:
 * - Server-side rendering (returns safe defaults)
 * - Usage outside provider (returns safe defaults with warning)
 * - Lazy initialization (only loads when user is authenticated)
 */

"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useE2EE } from "@/hooks/use-e2ee";
import type { UseE2EEReturn, E2EEStatus } from "@/lib/e2ee/types";

// ============================================================================
// CONTEXT
// ============================================================================

const E2EEContext = createContext<UseE2EEReturn | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface E2EEProviderProps {
  children: ReactNode;
}

export function E2EEProvider({ children }: E2EEProviderProps) {
  const e2ee = useE2EE();

  return <E2EEContext.Provider value={e2ee}>{children}</E2EEContext.Provider>;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Access E2EE context from any component
 *
 * Returns safe defaults when:
 * - Running on server (SSR)
 * - Used outside of E2EEProvider
 * - E2EE not yet initialized
 */
export function useE2EEContext(): UseE2EEReturn {
  const context = useContext(E2EEContext);

  if (!context) {
    // Return safe defaults when outside provider or during SSR
    return createSafeDefaults();
  }

  return context;
}

// ============================================================================
// SAFE DEFAULTS
// ============================================================================

function createSafeDefaults(): UseE2EEReturn {
  const noOp = async () => {};
  const noOpEncrypt = async () => "";
  const noOpGroup = async () => ({ ciphertext: "", sessionId: "" });

  return {
    // State
    status: "uninitialized" as E2EEStatus,
    isInitialized: false,
    isLoading: false,
    error: null,
    deviceId: null,
    identityKey: null,
    signingKey: null,
    availablePrekeys: 0,
    hasBackup: false,
    usingWasm: false,

    // Actions (no-op)
    initialize: noOp,
    generateKeys: noOp,
    getPublicKeys: () => null,
    replenishPrekeys: noOp,
    createBackup: noOp,
    restoreFromBackup: noOp,
    checkBackupExists: async () => false,
    destroy: noOp,
    encryptMessage: noOpEncrypt,
    decryptMessage: noOpEncrypt,
    encryptGroupMessage: noOpGroup,
    decryptGroupMessage: noOpEncrypt,
  };
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Check if E2EE is available and ready
 */
export function useE2EEReady(): boolean {
  const { isInitialized } = useE2EEContext();
  return isInitialized;
}

/**
 * Get E2EE status for UI display
 */
export function useE2EEStatus(): {
  status: E2EEStatus;
  isLoading: boolean;
  needsSetup: boolean;
  hasError: boolean;
} {
  const { status, isLoading, error } = useE2EEContext();

  return {
    status,
    isLoading,
    needsSetup: status === "needs-setup",
    hasError: status === "error" || error !== null,
  };
}

/**
 * Get public keys for sharing or display
 */
export function useE2EEPublicKeys() {
  const { getPublicKeys, deviceId, identityKey, signingKey } = useE2EEContext();

  return {
    publicKeys: getPublicKeys(),
    deviceId,
    identityKey,
    signingKey,
    hasKeys: Boolean(identityKey && signingKey),
  };
}

/**
 * Get backup status
 */
export function useE2EEBackup() {
  const { hasBackup, createBackup, restoreFromBackup, checkBackupExists } =
    useE2EEContext();

  return {
    hasBackup,
    createBackup,
    restoreFromBackup,
    checkBackupExists,
  };
}
