"use client";

/**
 * Auth Modal Wrapper
 *
 * Connects the AuthModal to the AuthProvider context.
 * Placed inside the AuthProvider to access modal state.
 */

import { useAuth } from "@/components/providers/auth-provider";
import { AuthModal } from "./auth-modal";

export function AuthModalWrapper() {
  const { authModalState, hideAuthModal } = useAuth();

  return (
    <AuthModal
      isOpen={authModalState !== "closed"}
      onClose={hideAuthModal}
      initialMode={authModalState === "signup" ? "signup" : "signin"}
    />
  );
}
