"use client";

/**
 * Browser Notification Permission Prompt
 *
 * A custom popup that explains browser notifications to users
 * before requesting the actual browser permission.
 * This provides a better UX than immediately showing the browser prompt.
 */

import { useState, useEffect } from "react";
import { cn } from "@/lib/design-system";
import { useBrowserNotifications } from "@/hooks/use-browser-notifications";

interface BrowserNotificationPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionResult?: (granted: boolean) => void;
}

export function BrowserNotificationPrompt({
  isOpen,
  onClose,
  onPermissionResult,
}: BrowserNotificationPromptProps) {
  const { isSupported, permission, requestPermission } = useBrowserNotifications();
  const [step, setStep] = useState<"explain" | "requesting" | "result">("explain");
  const [result, setResult] = useState<"granted" | "denied" | null>(null);

  // Reset state when opening - intentional state reset on modal open
  useEffect(() => {
    if (isOpen) {
       
      setStep("explain");
      setResult(null);
    }
  }, [isOpen]);

  const handleEnableClick = async () => {
    setStep("requesting");
    const permissionResult = await requestPermission();
    setResult(permissionResult === "granted" ? "granted" : "denied");
    setStep("result");
    onPermissionResult?.(permissionResult === "granted");
  };

  const handleClose = () => {
    onClose();
    // Reset after animation
    setTimeout(() => {
      setStep("explain");
      setResult(null);
    }, 200);
  };

  if (!isOpen) return null;

  // If not supported, show unsupported message
  if (!isSupported) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <div
          className={cn(
            "relative w-full max-w-md",
            "bg-white dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]",
            "rounded-2xl shadow-2xl",
            "animate-in fade-in zoom-in-95 duration-200"
          )}
        >
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Browser Not Supported
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Your browser doesn&apos;t support push notifications. Try using a modern browser like Chrome, Firefox, or Edge.
            </p>
            <button
              onClick={handleClose}
              className={cn(
                "w-full px-4 py-2.5 text-sm font-medium rounded-lg",
                "bg-gray-100 dark:bg-[#1a1a1a]",
                "text-gray-700 dark:text-gray-300",
                "hover:bg-gray-200 dark:hover:bg-[#262626]",
                "transition-colors"
              )}
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Already denied by browser
  if (permission === "denied") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <div
          className={cn(
            "relative w-full max-w-md",
            "bg-white dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]",
            "rounded-2xl shadow-2xl",
            "animate-in fade-in zoom-in-95 duration-200"
          )}
        >
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Notifications Blocked
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              You&apos;ve previously blocked notifications for this site. To enable them, you&apos;ll need to change your browser settings.
            </p>
            <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-lg p-4 mb-6 text-left">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">How to enable:</p>
              <ol className="text-xs text-gray-500 dark:text-gray-400 space-y-1 list-decimal list-inside">
                <li>Click the lock icon in your browser&apos;s address bar</li>
                <li>Find &quot;Notifications&quot; in the site settings</li>
                <li>Change it from &quot;Block&quot; to &quot;Allow&quot;</li>
                <li>Refresh the page</li>
              </ol>
            </div>
            <button
              onClick={handleClose}
              className={cn(
                "w-full px-4 py-2.5 text-sm font-medium rounded-lg",
                "bg-gray-100 dark:bg-[#1a1a1a]",
                "text-gray-700 dark:text-gray-300",
                "hover:bg-gray-200 dark:hover:bg-[#262626]",
                "transition-colors"
              )}
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={step !== "requesting" ? handleClose : undefined}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full max-w-md",
          "bg-white dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]",
          "rounded-2xl shadow-2xl",
          "animate-in fade-in zoom-in-95 duration-200"
        )}
      >
        {/* Close button (not during requesting) */}
        {step !== "requesting" && (
          <button
            onClick={handleClose}
            className={cn(
              "absolute top-4 right-4 p-1.5 rounded-lg",
              "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200",
              "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
              "transition-colors"
            )}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        <div className="p-6">
          {step === "explain" && (
            <>
              {/* Icon */}
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-2">
                Enable Browser Notifications?
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
                Get instant alerts when someone replies to you, mentions you, or when your suggestions are reviewed.
              </p>

              {/* Benefits */}
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Replies & Mentions</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Know immediately when someone responds to you</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Suggestion Updates</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Get notified when your edits are approved or merged</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">New Followers</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Be notified when someone follows you</p>
                  </div>
                </div>
              </div>

              {/* Note */}
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-6">
                You can change this anytime in your settings. We&apos;ll never spam you.
              </p>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className={cn(
                    "flex-1 px-4 py-2.5 text-sm font-medium rounded-lg",
                    "border border-gray-200 dark:border-[#262626]",
                    "text-gray-700 dark:text-gray-300",
                    "hover:bg-gray-50 dark:hover:bg-[#1a1a1a]",
                    "transition-colors"
                  )}
                >
                  Not Now
                </button>
                <button
                  onClick={handleEnableClick}
                  className={cn(
                    "flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg",
                    "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                    "text-white shadow-sm shadow-blue-500/25",
                    "hover:shadow-md hover:-translate-y-0.5",
                    "transition-all duration-200"
                  )}
                >
                  Enable Notifications
                </button>
              </div>
            </>
          )}

          {step === "requesting" && (
            <div className="py-8 text-center">
              {/* Loading spinner */}
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-[#262626]" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin" />
              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Requesting Permission
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Please click &quot;Allow&quot; in your browser&apos;s popup...
              </p>
            </div>
          )}

          {step === "result" && (
            <div className="py-4 text-center">
              {result === "granted" ? (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Notifications Enabled!
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    You&apos;ll now receive browser notifications for important updates.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Maybe Later
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    No problem! You can enable notifications anytime from your settings.
                  </p>
                </>
              )}
              <button
                onClick={handleClose}
                className={cn(
                  "w-full px-4 py-2.5 text-sm font-medium rounded-lg",
                  result === "granted"
                    ? "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 text-white shadow-sm"
                    : "bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300",
                  "transition-colors"
                )}
              >
                {result === "granted" ? "Great!" : "Got it"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
