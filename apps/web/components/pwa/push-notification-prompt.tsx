"use client";

/**
 * Push Notification Prompt Component
 *
 * Prompts users to enable push notifications after they've been on the site for a while.
 * Only shows for authenticated users who haven't enabled notifications yet.
 *
 * CRITICAL: When permission is granted, we must:
 * 1. Subscribe to Web Push (handled by useBrowserNotifications hook)
 * 2. Update browser_notifications preference in database (handled here)
 *
 * Without step 2, push notifications won't be sent even though the subscription exists.
 */

import { useState, useEffect, useTransition } from "react";
import { cn } from "@/lib/design-system";
import { useBrowserNotifications } from "@/hooks/use-browser-notifications";
import { useSession } from "@/lib/auth-client";
import { Bell, X } from "lucide-react";
import { updateNotificationPreferences } from "@/app/actions/notifications";

interface PushNotificationPromptProps {
  className?: string;
  /** Delay in ms before showing the prompt (default: 30 seconds) */
  delay?: number;
}

export function PushNotificationPrompt({
  className,
  delay = 30000,
}: PushNotificationPromptProps) {
  const { data: session } = useSession();
  const {
    isSupported,
    isPushSupported,
    permission,
    isSubscribed,
    isRequesting,
    requestPermission,
  } = useBrowserNotifications();

  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Check if user has dismissed the prompt before
  useEffect(() => {
    const dismissed = localStorage.getItem("push-notification-dismissed");
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const now = new Date();
      // Show again after 14 days
      const daysSinceDismissed =
        (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 14) {
        setIsDismissed(true);
      }
    }
  }, []);

  // Show prompt after delay (only for logged-in users who haven't enabled notifications)
  useEffect(() => {
    if (!session?.user?.id) return;
    if (!isSupported || !isPushSupported) return;
    if (permission === "denied") return;
    if (isSubscribed) return;
    if (isDismissed) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [session, isSupported, isPushSupported, permission, isSubscribed, isDismissed, delay]);

  // Don't render if not applicable
  if (!isVisible || isDismissed || isSubscribed || permission === "denied") {
    return null;
  }

  const handleEnable = async () => {
    const result = await requestPermission();
    if (result === "granted") {
      // CRITICAL: Update browser_notifications preference in database
      // Without this, the server won't send push notifications even though
      // the browser subscription exists. The createNotification() function
      // checks this preference before calling sendPushNotificationToUser().
      startTransition(async () => {
        const updateResult = await updateNotificationPreferences({
          browser_notifications: true,
        });
        if (updateResult.error) {
          console.error("[PushPrompt] Failed to update preference:", updateResult.error);
        } else {
          console.log("[PushPrompt] Successfully enabled browser_notifications preference");
        }
      });
      setIsVisible(false);
    } else if (result === "denied") {
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem("push-notification-dismissed", new Date().toISOString());
  };

  return (
    <div
      className={cn(
        "fixed left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-40",
        "animate-in slide-in-from-bottom-4 fade-in duration-300",
        className
      )}
      style={{
        // Position above mobile bottom navigation (original was bottom-20 = 5rem)
        bottom: "calc(5rem + var(--mobile-nav-height, 0px))",
      }}
    >
      <div
        className={cn(
          "rounded-xl p-4",
          "bg-white dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]",
          "shadow-xl"
        )}
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-600 flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              Enable Notifications
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Stay updated with new docs and features
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Benefits */}
        <div className="space-y-1.5 mb-4">
          {[
            "New documentation alerts",
            "Feature announcements",
            "Community highlights",
          ].map((benefit) => (
            <div
              key={benefit}
              className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-3.5 h-3.5 text-green-500"
              >
                <path
                  d="M5 13l4 4L19 7"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {benefit}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleEnable}
            disabled={isRequesting || isPending}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white",
              "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
              "hover:shadow-lg hover:shadow-blue-500/25",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all duration-200"
            )}
          >
            {isRequesting || isPending ? "Enabling..." : "Enable Notifications"}
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
