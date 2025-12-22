/**
 * AI Consent Modal
 *
 * Prompts users to consent to AI features in encrypted chats.
 * Shows clear explanation of what access is being granted and why.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/design-system";
import {
  getConversationAIStatus,
  grantAIConsent,
  revokeAIConsent,
  AI_FEATURES,
  type AIFeature,
  type ConversationAIStatus,
} from "@/lib/e2ee/ai-consent";
import {
  Bot,
  ShieldCheck,
  ShieldAlert,
  X,
  Loader2,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Users,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface AIConsentModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal closes */
  onClose: () => void;
  /** Conversation ID */
  conversationId: string;
  /** Current user ID */
  currentUserId: string;
  /** Callback when consent changes */
  onConsentChange?: (granted: boolean) => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AIConsentModal({
  isOpen,
  onClose,
  conversationId,
  currentUserId,
  onConsentChange,
}: AIConsentModalProps) {
  const [status, setStatus] = useState<ConversationAIStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState<AIFeature[]>([
    "mention_response",
  ]);
  const [error, setError] = useState<string | null>(null);

  // Load consent status
  useEffect(() => {
    if (!isOpen) return;

    const loadStatus = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getConversationAIStatus(conversationId);
        setStatus(data);

        // Pre-select user's existing features
        const userConsent = data.participantConsent.find(
          (c) => c.userId === currentUserId
        );
        if (userConsent && userConsent.allowedFeatures.length > 0) {
          setSelectedFeatures(userConsent.allowedFeatures as AIFeature[]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load status");
      } finally {
        setIsLoading(false);
      }
    };

    loadStatus();
  }, [isOpen, conversationId, currentUserId]);

  // Check if current user has already consented
  const userHasConsented = status?.participantConsent.some(
    (c) => c.userId === currentUserId && c.status === "granted"
  );

  // Handle grant consent
  const handleGrant = useCallback(async () => {
    try {
      setIsSaving(true);
      setError(null);
      await grantAIConsent(conversationId, selectedFeatures);
      const newStatus = await getConversationAIStatus(conversationId);
      setStatus(newStatus);
      onConsentChange?.(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to grant consent");
    } finally {
      setIsSaving(false);
    }
  }, [conversationId, selectedFeatures, onConsentChange]);

  // Handle revoke consent
  const handleRevoke = useCallback(async () => {
    try {
      setIsSaving(true);
      setError(null);
      await revokeAIConsent(conversationId);
      const newStatus = await getConversationAIStatus(conversationId);
      setStatus(newStatus);
      onConsentChange?.(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke consent");
    } finally {
      setIsSaving(false);
    }
  }, [conversationId, onConsentChange]);

  // Toggle feature selection
  const toggleFeature = (feature: AIFeature) => {
    setSelectedFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature]
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        // Account for mobile bottom navigation
        paddingBottom: "calc(1rem + var(--mobile-nav-height, 0px))",
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative z-10 w-full max-w-lg",
          "rounded-xl bg-gray-900 border border-gray-800",
          "shadow-2xl shadow-black/50",
          "overflow-y-auto",
          "p-6"
        )}
        style={{
          // Max height accounts for mobile nav
          maxHeight: "calc(90vh - var(--mobile-nav-height, 0px))",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Bot className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                AI in Encrypted Chat
              </h2>
              <p className="text-sm text-gray-400">
                Manage AI access for this conversation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-red-500/20 text-red-300 text-center">
            {error}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status Banner */}
            {status?.allConsented ? (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/20">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <div>
                  <p className="font-medium text-emerald-300">
                    AI Features Enabled
                  </p>
                  <p className="text-sm text-emerald-400/70">
                    All participants have consented
                  </p>
                </div>
              </div>
            ) : status && status.missingConsent.length > 0 ? (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-500/20">
                <Clock className="h-5 w-5 text-amber-400" />
                <div>
                  <p className="font-medium text-amber-300">
                    Waiting for Consent
                  </p>
                  <p className="text-sm text-amber-400/70">
                    {status.missingConsent.length} participant(s) haven&apos;t
                    consented yet
                  </p>
                </div>
              </div>
            ) : null}

            {/* Privacy Explanation */}
            <div className="p-4 rounded-lg bg-gray-800/50 space-y-3">
              <h3 className="font-medium text-white flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-400" />
                How AI Access Works
              </h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  Messages are decrypted{" "}
                  <span className="text-white font-medium">
                    on your device
                  </span>{" "}
                  before sending to AI
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  AI responses are{" "}
                  <span className="text-white font-medium">
                    encrypted before storage
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  All AI access is{" "}
                  <span className="text-white font-medium">logged</span> for
                  transparency
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  You can{" "}
                  <span className="text-white font-medium">
                    revoke consent
                  </span>{" "}
                  at any time
                </li>
              </ul>
            </div>

            {/* Feature Selection */}
            <div className="space-y-3">
              <h3 className="font-medium text-white">Select AI Features</h3>
              <div className="space-y-2">
                {(Object.entries(AI_FEATURES) as [AIFeature, (typeof AI_FEATURES)[AIFeature]][]).map(
                  ([key, feature]) => (
                    <button
                      key={key}
                      onClick={() => toggleFeature(key)}
                      disabled={userHasConsented}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg",
                        "border transition-all",
                        selectedFeatures.includes(key)
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-gray-700 bg-gray-800/50 hover:border-gray-600",
                        userHasConsented && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <span className="text-2xl">{feature.icon}</span>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-white">{feature.name}</p>
                        <p className="text-sm text-gray-400">
                          {feature.description}
                        </p>
                      </div>
                      {selectedFeatures.includes(key) && (
                        <CheckCircle2 className="h-5 w-5 text-blue-400" />
                      )}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Participant Status */}
            {status && status.participantConsent.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-white flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  Participant Consent
                </h3>
                <div className="space-y-2">
                  {status.participantConsent.map((consent) => (
                    <div
                      key={consent.userId}
                      className="flex items-center justify-between p-2 rounded-lg bg-gray-800/50"
                    >
                      <span className="text-sm text-gray-300">
                        {consent.userId === currentUserId ? "You" : "Participant"}
                      </span>
                      {consent.status === "granted" ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />
                          Consented
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="h-3 w-3" />
                          Pending
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              {userHasConsented ? (
                <button
                  onClick={handleRevoke}
                  disabled={isSaving}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2",
                    "rounded-lg px-4 py-3",
                    "bg-red-600 hover:bg-red-500",
                    "text-white font-medium",
                    "transition-colors",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {isSaving ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <EyeOff className="h-5 w-5" />
                  )}
                  Revoke Consent
                </button>
              ) : (
                <button
                  onClick={handleGrant}
                  disabled={isSaving || selectedFeatures.length === 0}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2",
                    "rounded-lg px-4 py-3",
                    "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                    "text-white font-medium",
                    "hover:shadow-lg hover:shadow-blue-500/25",
                    "transition-all",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {isSaving ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-5 w-5" />
                  )}
                  Grant Consent
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// AI PRIVACY INDICATOR
// ============================================================================

interface AIPrivacyIndicatorProps {
  /** Whether AI is enabled for this conversation */
  aiEnabled: boolean;
  /** Whether all have consented */
  allConsented: boolean;
  /** Click handler to open consent modal */
  onClick?: () => void;
  /** Size variant */
  size?: "sm" | "md";
  /** Additional classes */
  className?: string;
}

export function AIPrivacyIndicator({
  aiEnabled,
  allConsented,
  onClick,
  size = "md",
  className,
}: AIPrivacyIndicatorProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-1 gap-1",
    md: "text-sm px-3 py-1.5 gap-2",
  };

  if (!aiEnabled) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "inline-flex items-center rounded-full",
          "bg-gray-800/50 text-gray-400",
          "hover:bg-gray-700/50 transition-colors",
          sizeClasses[size],
          className
        )}
        title="Click to enable AI features"
      >
        <Bot className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
        <span>AI Off</span>
      </button>
    );
  }

  if (!allConsented) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "inline-flex items-center rounded-full",
          "bg-amber-900/30 text-amber-400",
          "hover:bg-amber-800/30 transition-colors",
          sizeClasses[size],
          className
        )}
        title="Waiting for all participants to consent"
      >
        <Clock className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
        <span>AI Pending</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full",
        "bg-blue-900/30 text-blue-400",
        "hover:bg-blue-800/30 transition-colors",
        sizeClasses[size],
        className
      )}
      title="AI features enabled - click to manage"
    >
      <Bot className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
      <span>AI On</span>
    </button>
  );
}
