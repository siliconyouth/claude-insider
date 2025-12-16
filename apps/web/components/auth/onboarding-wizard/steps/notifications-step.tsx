"use client";

/**
 * Notifications Step
 *
 * Onboarding step for configuring notification preferences,
 * requesting push notification permission, and PWA installation.
 */

import { useState, useEffect } from "react";
import { cn } from "@/lib/design-system";
import { useWizard } from "../wizard-context";
import { StepWrapper } from "../shared/step-wrapper";
import { WizardNavigation } from "../wizard-navigation";
import { usePWA } from "@/hooks/use-pwa";

interface NotificationToggle {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
}

export function NotificationsStep() {
  const { isLastStep, setError } = useWizard();
  const { isInstallable, isInstalled, promptInstall } = usePWA();

  // PWA install state
  const [isInstallingApp, setIsInstallingApp] = useState(false);
  const [installDismissed, setInstallDismissed] = useState(false);

  // Push notification state
  const [pushPermission, setPushPermission] = useState<NotificationPermission>("default");
  const [isRequestingPush, setIsRequestingPush] = useState(false);

  // Notification toggles (all enabled by default)
  const [notifications, setNotifications] = useState<NotificationToggle[]>([
    {
      key: "in_app_comments",
      label: "Comments",
      description: "Get notified when someone comments on your content",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      enabled: true,
    },
    {
      key: "in_app_replies",
      label: "Replies",
      description: "Get notified when someone replies to your comments",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      ),
      enabled: true,
    },
    {
      key: "in_app_mentions",
      label: "Mentions",
      description: "Get notified when someone mentions you",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
        </svg>
      ),
      enabled: true,
    },
    {
      key: "in_app_version_updates",
      label: "Version Updates",
      description: "Get notified about new features and updates",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      enabled: true,
    },
  ]);

  // Check current push permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPushPermission(Notification.permission);
    }
  }, []);

  const handleToggle = (key: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.key === key ? { ...n, enabled: !n.enabled } : n))
    );
  };

  const requestPushPermission = async () => {
    if (!("Notification" in window)) {
      setError("Push notifications are not supported in this browser");
      return;
    }

    setIsRequestingPush(true);
    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);

      if (permission === "granted") {
        // Register service worker and subscribe to push
        if ("serviceWorker" in navigator) {
          try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
            });

            // Save subscription to server
            await fetch("/api/push-subscription", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(subscription),
            });
          } catch (err) {
            console.error("[Onboarding] Push subscription error:", err);
          }
        }
      }
    } catch (err) {
      console.error("[Onboarding] Push permission error:", err);
    } finally {
      setIsRequestingPush(false);
    }
  };

  const handleInstallApp = async () => {
    setIsInstallingApp(true);
    try {
      const accepted = await promptInstall();
      if (!accepted) {
        setInstallDismissed(true);
      }
    } catch (err) {
      console.error("[Onboarding] Install error:", err);
    } finally {
      setIsInstallingApp(false);
    }
  };

  const handleContinue = async (): Promise<boolean> => {
    try {
      // Build preferences object
      const preferences: Record<string, boolean> = {
        browser_notifications: pushPermission === "granted",
      };

      notifications.forEach((n) => {
        preferences[n.key] = n.enabled;
        // Also enable email for the same preferences
        const emailKey = n.key.replace("in_app_", "email_");
        if (["email_comments", "email_replies", "email_suggestions", "email_follows", "email_version_updates"].includes(emailKey)) {
          preferences[emailKey] = false; // Email off by default
        }
      });

      // Save preferences
      const response = await fetch("/api/user/notification-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error("Failed to save notification preferences");
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save preferences");
      return false;
    }
  };

  return (
    <StepWrapper
      title="Notifications & App"
      description="Stay informed and get the best experience"
    >
      <div className="space-y-4">
        {/* PWA Install Prompt */}
        {isInstallable && !isInstalled && !installDismissed && (
          <div
            className={cn(
              "p-4 rounded-xl",
              "bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-violet-500/10",
              "border border-cyan-500/20"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3v11.25" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">Install App</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Add to your home screen for offline access &amp; faster loading
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={handleInstallApp}
                    disabled={isInstallingApp}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium",
                      "bg-gradient-to-r from-cyan-600 via-blue-600 to-violet-600",
                      "text-white shadow-lg shadow-blue-500/25",
                      "hover:opacity-90 transition-all duration-200",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {isInstallingApp ? (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Installing...
                      </span>
                    ) : (
                      "Install Now"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setInstallDismissed(true)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
                  >
                    Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Already Installed Badge */}
        {isInstalled && (
          <div className="p-3 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800">
            <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium">App installed</span>
            </div>
          </div>
        )}

        {/* Push Notification Request */}
        {pushPermission === "default" && (
          <div
            className={cn(
              "p-4 rounded-xl",
              "bg-gradient-to-br from-violet-500/10 via-blue-500/10 to-cyan-500/10",
              "border border-violet-500/20"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">Enable Push Notifications</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Get instant alerts even when you&apos;re not on the site
                </p>
                <button
                  type="button"
                  onClick={requestPushPermission}
                  disabled={isRequestingPush}
                  className={cn(
                    "mt-3 px-4 py-2 rounded-lg text-sm font-medium",
                    "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                    "text-white shadow-lg shadow-blue-500/25",
                    "hover:opacity-90 transition-all duration-200",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {isRequestingPush ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Requesting...
                    </span>
                  ) : (
                    "Enable Push Notifications"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Push permission granted */}
        {pushPermission === "granted" && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium">Push notifications enabled</span>
            </div>
          </div>
        )}

        {/* Push permission denied */}
        {pushPermission === "denied" && (
          <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              Push notifications are blocked. You can enable them later in your browser settings.
            </p>
          </div>
        )}

        {/* In-App Notification Toggles */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">In-App Notifications</p>
          {notifications.map((notification) => (
            <div
              key={notification.key}
              className={cn(
                "flex items-center justify-between p-3 rounded-xl",
                "bg-gray-50 dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="text-gray-500 dark:text-gray-400">{notification.icon}</div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{notification.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{notification.description}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggle(notification.key)}
                className={cn(
                  "relative w-11 h-6 rounded-full transition-colors",
                  notification.enabled
                    ? "bg-gradient-to-r from-violet-600 to-blue-600"
                    : "bg-gray-300 dark:bg-[#262626]"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                    notification.enabled ? "left-5" : "left-0.5"
                  )}
                />
              </button>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          You can change these settings anytime in your profile
        </p>
      </div>

      <WizardNavigation
        onNext={handleContinue}
        nextLabel={isLastStep ? "Complete Setup" : "Continue"}
      />
    </StepWrapper>
  );
}
