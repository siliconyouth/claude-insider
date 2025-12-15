"use client";

import { useState, useEffect, useTransition, useCallback, useRef } from "react";
import { cn } from "@/lib/design-system";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/toast";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import {
  getCompleteSettingsData,
  updateUserProfile,
  updatePrivacySettings,
  updateUsername,
  type UserProfile,
  type PrivacySettings,
  type NotificationPreferences,
} from "@/app/actions/profile";
import { updateNotificationPreferences } from "@/app/actions/notifications";
import { TwoFactorSettings } from "@/components/settings/two-factor-settings";
import { DataManagement } from "@/components/settings/data-management";
import { BlockedUsers } from "@/components/settings/blocked-users";
import { AvatarUpload } from "@/components/settings/avatar-upload";
import { PasswordSettings } from "@/components/settings/password-settings";
import { ConnectedAccounts } from "@/components/settings/connected-accounts";
import { AskAIButton } from "@/components/ask-ai/ask-ai-button";
import { BrowserNotificationPrompt } from "@/components/notifications/browser-notification-prompt";
import { useBrowserNotifications } from "@/hooks/use-browser-notifications";
import Link from "next/link";

// Cache key for sessionStorage
const SETTINGS_CACHE_KEY = "ci_settings_cache";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CachedSettingsData {
  profile: UserProfile;
  privacy: PrivacySettings & { username?: string };
  notifications: NotificationPreferences;
  timestamp: number;
}

function getFromCache(): CachedSettingsData | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = sessionStorage.getItem(SETTINGS_CACHE_KEY);
    if (!cached) return null;

    const data = JSON.parse(cached) as CachedSettingsData;
    if (Date.now() - data.timestamp > CACHE_TTL) {
      sessionStorage.removeItem(SETTINGS_CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function setToCache(data: Omit<CachedSettingsData, "timestamp">) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      SETTINGS_CACHE_KEY,
      JSON.stringify({ ...data, timestamp: Date.now() })
    );
  } catch {
    // Storage full or unavailable
  }
}

function clearCache() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SETTINGS_CACHE_KEY);
  } catch {
    // Ignore
  }
}

export default function SettingsPage() {
  const { isAuthenticated, isLoading: authLoading, showSignIn, signOut, user: authUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  // Form state
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  // Username state
  const [username, setUsername] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);

  // Password state (from auth user)
  const [hasPassword, setHasPassword] = useState(false);

  // Privacy settings state
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    showEmail: false,
    showActivity: true,
    showCollections: true,
    showStats: true,
  });

  // Notification preferences state
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>({
    in_app_comments: true,
    in_app_replies: true,
    in_app_suggestions: true,
    in_app_follows: true,
    in_app_mentions: true,
    email_comments: false,
    email_replies: true,
    email_suggestions: true,
    email_follows: false,
    email_digest: false,
    email_digest_frequency: "weekly",
    browser_notifications: false,
  });

  // Browser notifications state
  const [showBrowserNotifPrompt, setShowBrowserNotifPrompt] = useState(false);
  const { isSupported: browserNotifSupported, permission: browserNotifPermission, isEnabled: browserNotifEnabled } = useBrowserNotifications();

  // Track if we've loaded data (prevents duplicate fetches)
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      showSignIn();
    }
  }, [authLoading, isAuthenticated, showSignIn]);

  // Sync hasPassword from auth user
  useEffect(() => {
    if (authUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasPassword(authUser.hasPassword ?? false);
    }
  }, [authUser]);

  const loadSettings = useCallback(async (forceRefresh = false) => {
    // Try to load from cache first (instant)
    if (!forceRefresh) {
      const cached = getFromCache();
      if (cached) {
        setProfile(cached.profile);
        setName(cached.profile.name || "");
        setBio(cached.profile.bio || "");
        setWebsite(cached.profile.website || "");
        setUsername(cached.privacy.username || "");
        setOriginalUsername(cached.privacy.username || "");
        setPrivacy({
          showEmail: cached.privacy.showEmail,
          showActivity: cached.privacy.showActivity,
          showCollections: cached.privacy.showCollections,
          showStats: cached.privacy.showStats,
        });
        setNotifPrefs(cached.notifications);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);

    // Single optimized call that fetches all data at once
    // - 1 session lookup (instead of 3)
    // - 7 parallel DB queries
    const result = await getCompleteSettingsData();

    if (result.data) {
      const { profile: profileData, privacy: privacyData, notifications: notifData } = result.data;

      setProfile(profileData);
      setName(profileData.name || "");
      setBio(profileData.bio || "");
      setWebsite(profileData.website || "");

      setUsername(privacyData.username || "");
      setOriginalUsername(privacyData.username || "");
      setPrivacy({
        showEmail: privacyData.showEmail,
        showActivity: privacyData.showActivity,
        showCollections: privacyData.showCollections,
        showStats: privacyData.showStats,
      });

      setNotifPrefs(notifData);

      // Cache the results for future visits
      setToCache({
        profile: profileData,
        privacy: privacyData,
        notifications: notifData,
      });
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Prevent duplicate fetches on auth state changes
    if (isAuthenticated && !hasFetched.current) {
      hasFetched.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadSettings();
    }
  }, [isAuthenticated, loadSettings]);

  // Track changes
  useEffect(() => {
    if (!profile) return;

    const changed =
      name !== (profile.name || "") ||
      bio !== (profile.bio || "") ||
      website !== (profile.website || "");

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasChanges(changed);
  }, [name, bio, website, profile]);

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateUserProfile({ name, bio, website });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Profile updated successfully");
        setHasChanges(false);
        // Clear cache and reload to get fresh data
        clearCache();
        loadSettings(true);
      }
    });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
    } catch {
      toast.error("Failed to sign out");
    }
  };

  const handleUsernameUpdate = () => {
    if (username === originalUsername) return;

    setUsernameError(null);
    startTransition(async () => {
      const result = await updateUsername(username);

      if (result.error) {
        setUsernameError(result.error);
        toast.error(result.error);
      } else {
        toast.success("Username updated successfully");
        setOriginalUsername(username);
      }
    });
  };

  const handlePrivacyToggle = (key: keyof PrivacySettings) => {
    const newValue = !privacy[key];
    setPrivacy((prev) => ({ ...prev, [key]: newValue }));

    startTransition(async () => {
      const result = await updatePrivacySettings({ [key]: newValue });

      if (result.error) {
        // Revert on error
        setPrivacy((prev) => ({ ...prev, [key]: !newValue }));
        toast.error(result.error);
      }
    });
  };

  const handleNotifPrefToggle = (key: keyof NotificationPreferences) => {
    if (key === "email_digest_frequency") return; // Not a boolean toggle

    const newValue = !notifPrefs[key];
    setNotifPrefs((prev) => ({ ...prev, [key]: newValue }));

    startTransition(async () => {
      const result = await updateNotificationPreferences({ [key]: newValue });

      if (result.error) {
        // Revert on error
        setNotifPrefs((prev) => ({ ...prev, [key]: !newValue }));
        toast.error(result.error);
      }
    });
  };

  // Browser notification toggle handler - shows prompt if permission not granted
  const handleBrowserNotifToggle = () => {
    // If trying to enable and permission not granted, show prompt
    if (!notifPrefs.browser_notifications) {
      if (!browserNotifSupported) {
        toast.error("Browser notifications are not supported in your browser");
        return;
      }
      if (browserNotifPermission === "denied") {
        toast.error("Browser notifications are blocked. Please enable them in your browser settings.");
        return;
      }
      if (browserNotifPermission === "default") {
        // Show our custom prompt first
        setShowBrowserNotifPrompt(true);
        return;
      }
      // Already granted, just enable the setting
    }

    // Toggle the setting
    handleNotifPrefToggle("browser_notifications");
  };

  // Handle browser notification prompt result
  const handleBrowserNotifPromptClose = (result?: "granted" | "denied") => {
    setShowBrowserNotifPrompt(false);

    if (result === "granted") {
      // Permission granted, enable the setting
      setNotifPrefs((prev) => ({ ...prev, browser_notifications: true }));
      startTransition(async () => {
        const updateResult = await updateNotificationPreferences({ browser_notifications: true });
        if (updateResult.error) {
          setNotifPrefs((prev) => ({ ...prev, browser_notifications: false }));
          toast.error(updateResult.error);
        } else {
          toast.success("Browser notifications enabled");
        }
      });
    } else if (result === "denied") {
      toast.error("Browser notifications permission was denied");
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col">
        <Header />
        <main id="main-content" className="flex-1">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Header Skeleton */}
            <div className="mb-8 animate-pulse">
              <div className="h-8 w-32 bg-gray-200 dark:bg-[#1a1a1a] rounded mb-2" />
              <div className="h-4 w-64 bg-gray-200 dark:bg-[#1a1a1a] rounded" />
            </div>

            {/* Form Skeleton */}
            <div className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-20 bg-gray-200 dark:bg-[#1a1a1a] rounded" />
                  <div className="h-10 w-full bg-gray-200 dark:bg-[#1a1a1a] rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col">
        <Header />
        <main id="main-content" className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Sign in to access settings
            </h1>
            <button
              onClick={showSignIn}
              className={cn(
                "px-6 py-3 text-sm font-semibold rounded-lg",
                "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                "text-white shadow-lg shadow-blue-500/25",
                "hover:-translate-y-0.5 transition-all duration-200"
              )}
            >
              Sign In
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col">
      <Header />
      <main id="main-content" className="flex-1">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Page Title */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
            </div>
            <AskAIButton
              context={{
                type: "setting",
                title: "Settings & Configuration",
              }}
              suggestions={[
                "How do I enable 2FA?",
                "What privacy settings should I use?",
                "How do I export my data?",
                "How do I delete my account?",
              ]}
              variant="pill"
              size="md"
              position="inline"
              label="Need help?"
            />
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            Manage your profile and account preferences
          </p>
        </div>

        {/* Profile Section */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Profile Information
          </h2>

          <div className="space-y-6">
            {/* Avatar Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Profile Photo
              </label>
              <AvatarUpload
                currentAvatarUrl={profile?.avatarUrl}
                userName={name || profile?.name}
                onUploadSuccess={(url) => {
                  setProfile((prev) => prev ? { ...prev, avatarUrl: url } : prev);
                  clearCache();
                  toast.success("Avatar updated successfully");
                }}
                onUploadError={(error) => {
                  toast.error(error);
                }}
                onRemove={() => {
                  setProfile((prev) => prev ? { ...prev, avatarUrl: undefined } : prev);
                  clearCache();
                  toast.success("Avatar removed");
                }}
              />
            </div>

            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Display Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className={cn(
                  "w-full px-4 py-2.5 rounded-lg",
                  "bg-white dark:bg-[#111111]",
                  "border border-gray-200 dark:border-[#262626]",
                  "text-gray-900 dark:text-white",
                  "placeholder:text-gray-400",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                  "transition-colors"
                )}
              />
            </div>

            {/* Email (readonly) */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={profile?.email || ""}
                readOnly
                disabled
                className={cn(
                  "w-full px-4 py-2.5 rounded-lg",
                  "bg-gray-50 dark:bg-[#0a0a0a]",
                  "border border-gray-200 dark:border-[#262626]",
                  "text-gray-500 dark:text-gray-400",
                  "cursor-not-allowed"
                )}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Email cannot be changed
              </p>
            </div>

            {/* Bio */}
            <div>
              <label
                htmlFor="bio"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Bio
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={3}
                maxLength={500}
                className={cn(
                  "w-full px-4 py-2.5 rounded-lg resize-none",
                  "bg-white dark:bg-[#111111]",
                  "border border-gray-200 dark:border-[#262626]",
                  "text-gray-900 dark:text-white",
                  "placeholder:text-gray-400",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                  "transition-colors"
                )}
              />
              <p className="mt-1 text-xs text-gray-400 text-right">
                {bio.length}/500
              </p>
            </div>

            {/* Website */}
            <div>
              <label
                htmlFor="website"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Website
              </label>
              <input
                id="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://your-website.com"
                className={cn(
                  "w-full px-4 py-2.5 rounded-lg",
                  "bg-white dark:bg-[#111111]",
                  "border border-gray-200 dark:border-[#262626]",
                  "text-gray-900 dark:text-white",
                  "placeholder:text-gray-400",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                  "transition-colors"
                )}
              />
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-4 pt-4">
              <button
                onClick={handleSave}
                disabled={isPending || !hasChanges}
                className={cn(
                  "px-6 py-2.5 text-sm font-medium rounded-lg",
                  "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                  "text-white shadow-sm",
                  "hover:shadow-md hover:-translate-y-0.5",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0",
                  "transition-all duration-200"
                )}
              >
                {isPending ? "Saving..." : "Save Changes"}
              </button>

              {hasChanges && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  You have unsaved changes
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Divider */}
        <hr className="border-gray-200 dark:border-[#262626] mb-12" />

        {/* Public Profile Section */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Public Profile
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Your public profile is visible to other users at{" "}
            {originalUsername ? (
              <Link
                href={`/users/${originalUsername}`}
                className="text-blue-600 dark:text-cyan-400 hover:underline"
              >
                /users/{originalUsername}
              </Link>
            ) : (
              <span className="text-gray-400">/users/your-username</span>
            )}
          </p>

          <div className="space-y-6">
            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Username
              </label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      @
                    </span>
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                        setUsernameError(null);
                      }}
                      placeholder="your-username"
                      maxLength={30}
                      className={cn(
                        "w-full pl-8 pr-4 py-2.5 rounded-lg",
                        "bg-white dark:bg-[#111111]",
                        "border",
                        usernameError
                          ? "border-red-500"
                          : "border-gray-200 dark:border-[#262626]",
                        "text-gray-900 dark:text-white",
                        "placeholder:text-gray-400",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                        "transition-colors"
                      )}
                    />
                  </div>
                  {usernameError && (
                    <p className="mt-1 text-xs text-red-500">{usernameError}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    3-30 characters. Lowercase letters, numbers, and hyphens only.
                  </p>
                </div>
                <button
                  onClick={handleUsernameUpdate}
                  disabled={isPending || username === originalUsername || !username}
                  className={cn(
                    "px-4 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap",
                    "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                    "text-white shadow-sm",
                    "hover:shadow-md hover:-translate-y-0.5",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0",
                    "transition-all duration-200"
                  )}
                >
                  {isPending ? "..." : "Update"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <hr className="border-gray-200 dark:border-[#262626] mb-12" />

        {/* Privacy Section */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Privacy Settings
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Control what information is visible on your public profile
          </p>

          <div className="space-y-4">
            {/* Show Email */}
            <div
              className={cn(
                "flex items-center justify-between p-4 rounded-xl",
                "bg-gray-50 dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]"
              )}
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Show Email</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Display your email address on your public profile
                </p>
              </div>
              <button
                onClick={() => handlePrivacyToggle("showEmail")}
                disabled={isPending}
                className={cn(
                  "relative w-12 h-7 rounded-full transition-colors",
                  privacy.showEmail
                    ? "bg-gradient-to-r from-violet-600 to-blue-600"
                    : "bg-gray-300 dark:bg-[#262626]"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform",
                    privacy.showEmail ? "left-6" : "left-1"
                  )}
                />
              </button>
            </div>

            {/* Show Stats */}
            <div
              className={cn(
                "flex items-center justify-between p-4 rounded-xl",
                "bg-gray-50 dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]"
              )}
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Show Stats</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Display favorites, collections, and comment counts
                </p>
              </div>
              <button
                onClick={() => handlePrivacyToggle("showStats")}
                disabled={isPending}
                className={cn(
                  "relative w-12 h-7 rounded-full transition-colors",
                  privacy.showStats
                    ? "bg-gradient-to-r from-violet-600 to-blue-600"
                    : "bg-gray-300 dark:bg-[#262626]"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform",
                    privacy.showStats ? "left-6" : "left-1"
                  )}
                />
              </button>
            </div>

            {/* Show Collections */}
            <div
              className={cn(
                "flex items-center justify-between p-4 rounded-xl",
                "bg-gray-50 dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]"
              )}
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Show Collections</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Display your public collections on your profile
                </p>
              </div>
              <button
                onClick={() => handlePrivacyToggle("showCollections")}
                disabled={isPending}
                className={cn(
                  "relative w-12 h-7 rounded-full transition-colors",
                  privacy.showCollections
                    ? "bg-gradient-to-r from-violet-600 to-blue-600"
                    : "bg-gray-300 dark:bg-[#262626]"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform",
                    privacy.showCollections ? "left-6" : "left-1"
                  )}
                />
              </button>
            </div>

            {/* Show Activity */}
            <div
              className={cn(
                "flex items-center justify-between p-4 rounded-xl",
                "bg-gray-50 dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]"
              )}
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Show Activity</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Display your recent comments and suggestions
                </p>
              </div>
              <button
                onClick={() => handlePrivacyToggle("showActivity")}
                disabled={isPending}
                className={cn(
                  "relative w-12 h-7 rounded-full transition-colors",
                  privacy.showActivity
                    ? "bg-gradient-to-r from-violet-600 to-blue-600"
                    : "bg-gray-300 dark:bg-[#262626]"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform",
                    privacy.showActivity ? "left-6" : "left-1"
                  )}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Divider */}
        <hr className="border-gray-200 dark:border-[#262626] mb-12" />

        {/* Security Section */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Security
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Protect your account with additional security measures
          </p>

          <div className="space-y-8">
            {/* Password Settings */}
            <div
              className={cn(
                "p-6 rounded-xl",
                "bg-gray-50 dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]"
              )}
            >
              <PasswordSettings
                hasPassword={hasPassword}
                onSuccess={() => {
                  // Update hasPassword state after setting password
                  setHasPassword(true);
                  clearCache();
                }}
              />
            </div>

            {/* Connected Accounts */}
            <div
              className={cn(
                "p-6 rounded-xl",
                "bg-gray-50 dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]"
              )}
            >
              <ConnectedAccounts
                hasPassword={hasPassword}
                onAccountChange={() => {
                  clearCache();
                }}
              />
            </div>

            {/* Two-Factor Authentication */}
            <TwoFactorSettings />
          </div>
        </section>

        {/* Divider */}
        <hr className="border-gray-200 dark:border-[#262626] mb-12" />

        {/* Blocked Users Section */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Blocked Users
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Users you&apos;ve blocked won&apos;t be able to see your content or interact with you
          </p>

          <BlockedUsers />
        </section>

        {/* Divider */}
        <hr className="border-gray-200 dark:border-[#262626] mb-12" />

        {/* Account Section */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Account
          </h2>

          <div className="space-y-4">
            {/* Sign Out */}
            <div
              className={cn(
                "flex items-center justify-between p-4 rounded-xl",
                "bg-gray-50 dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]"
              )}
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Sign Out</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Sign out of your account on this device
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg",
                  "border border-gray-200 dark:border-[#262626]",
                  "text-gray-700 dark:text-gray-300",
                  "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
                  "transition-colors"
                )}
              >
                Sign Out
              </button>
            </div>

          </div>
        </section>

        {/* Divider */}
        <hr className="border-gray-200 dark:border-[#262626] mb-12" />

        {/* Data Management Section */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Data & Privacy
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Export your data or delete your account
          </p>

          <DataManagement />
        </section>

        {/* Divider */}
        <hr className="border-gray-200 dark:border-[#262626] mb-12" />

        {/* Notification Preferences Section */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Notification Preferences
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Choose which notifications you want to receive
          </p>

          {/* In-App Notifications */}
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            In-App Notifications
          </h3>
          <div className="space-y-3 mb-8">
            {/* Comments */}
            <div
              className={cn(
                "flex items-center justify-between p-4 rounded-xl",
                "bg-gray-50 dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]"
              )}
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Comments</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  When someone comments on your content
                </p>
              </div>
              <button
                onClick={() => handleNotifPrefToggle("in_app_comments")}
                disabled={isPending}
                className={cn(
                  "relative w-12 h-7 rounded-full transition-colors",
                  notifPrefs.in_app_comments
                    ? "bg-gradient-to-r from-violet-600 to-blue-600"
                    : "bg-gray-300 dark:bg-[#262626]"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform",
                    notifPrefs.in_app_comments ? "left-6" : "left-1"
                  )}
                />
              </button>
            </div>

            {/* Replies */}
            <div
              className={cn(
                "flex items-center justify-between p-4 rounded-xl",
                "bg-gray-50 dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]"
              )}
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Replies</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  When someone replies to your comment
                </p>
              </div>
              <button
                onClick={() => handleNotifPrefToggle("in_app_replies")}
                disabled={isPending}
                className={cn(
                  "relative w-12 h-7 rounded-full transition-colors",
                  notifPrefs.in_app_replies
                    ? "bg-gradient-to-r from-violet-600 to-blue-600"
                    : "bg-gray-300 dark:bg-[#262626]"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform",
                    notifPrefs.in_app_replies ? "left-6" : "left-1"
                  )}
                />
              </button>
            </div>

            {/* Suggestions */}
            <div
              className={cn(
                "flex items-center justify-between p-4 rounded-xl",
                "bg-gray-50 dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]"
              )}
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Suggestions</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Updates on your edit suggestions
                </p>
              </div>
              <button
                onClick={() => handleNotifPrefToggle("in_app_suggestions")}
                disabled={isPending}
                className={cn(
                  "relative w-12 h-7 rounded-full transition-colors",
                  notifPrefs.in_app_suggestions
                    ? "bg-gradient-to-r from-violet-600 to-blue-600"
                    : "bg-gray-300 dark:bg-[#262626]"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform",
                    notifPrefs.in_app_suggestions ? "left-6" : "left-1"
                  )}
                />
              </button>
            </div>

            {/* Follows */}
            <div
              className={cn(
                "flex items-center justify-between p-4 rounded-xl",
                "bg-gray-50 dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]"
              )}
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Follows</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  When someone follows you
                </p>
              </div>
              <button
                onClick={() => handleNotifPrefToggle("in_app_follows")}
                disabled={isPending}
                className={cn(
                  "relative w-12 h-7 rounded-full transition-colors",
                  notifPrefs.in_app_follows
                    ? "bg-gradient-to-r from-violet-600 to-blue-600"
                    : "bg-gray-300 dark:bg-[#262626]"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform",
                    notifPrefs.in_app_follows ? "left-6" : "left-1"
                  )}
                />
              </button>
            </div>

            {/* Mentions */}
            <div
              className={cn(
                "flex items-center justify-between p-4 rounded-xl",
                "bg-gray-50 dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]"
              )}
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Mentions</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  When someone mentions you
                </p>
              </div>
              <button
                onClick={() => handleNotifPrefToggle("in_app_mentions")}
                disabled={isPending}
                className={cn(
                  "relative w-12 h-7 rounded-full transition-colors",
                  notifPrefs.in_app_mentions
                    ? "bg-gradient-to-r from-violet-600 to-blue-600"
                    : "bg-gray-300 dark:bg-[#262626]"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform",
                    notifPrefs.in_app_mentions ? "left-6" : "left-1"
                  )}
                />
              </button>
            </div>
          </div>

          {/* Email Notifications */}
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Email Notifications
          </h3>
          <div className="space-y-3">
            {/* Email Comments */}
            <div
              className={cn(
                "flex items-center justify-between p-4 rounded-xl",
                "bg-gray-50 dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]"
              )}
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Comments</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Get emails when someone comments on your content
                </p>
              </div>
              <button
                onClick={() => handleNotifPrefToggle("email_comments")}
                disabled={isPending}
                className={cn(
                  "relative w-12 h-7 rounded-full transition-colors",
                  notifPrefs.email_comments
                    ? "bg-gradient-to-r from-violet-600 to-blue-600"
                    : "bg-gray-300 dark:bg-[#262626]"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform",
                    notifPrefs.email_comments ? "left-6" : "left-1"
                  )}
                />
              </button>
            </div>

            {/* Email Replies */}
            <div
              className={cn(
                "flex items-center justify-between p-4 rounded-xl",
                "bg-gray-50 dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]"
              )}
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Replies</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Get emails when someone replies to your comment
                </p>
              </div>
              <button
                onClick={() => handleNotifPrefToggle("email_replies")}
                disabled={isPending}
                className={cn(
                  "relative w-12 h-7 rounded-full transition-colors",
                  notifPrefs.email_replies
                    ? "bg-gradient-to-r from-violet-600 to-blue-600"
                    : "bg-gray-300 dark:bg-[#262626]"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform",
                    notifPrefs.email_replies ? "left-6" : "left-1"
                  )}
                />
              </button>
            </div>

            {/* Email Suggestions */}
            <div
              className={cn(
                "flex items-center justify-between p-4 rounded-xl",
                "bg-gray-50 dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]"
              )}
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Suggestions</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Get emails when your edit suggestions are reviewed
                </p>
              </div>
              <button
                onClick={() => handleNotifPrefToggle("email_suggestions")}
                disabled={isPending}
                className={cn(
                  "relative w-12 h-7 rounded-full transition-colors",
                  notifPrefs.email_suggestions
                    ? "bg-gradient-to-r from-violet-600 to-blue-600"
                    : "bg-gray-300 dark:bg-[#262626]"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform",
                    notifPrefs.email_suggestions ? "left-6" : "left-1"
                  )}
                />
              </button>
            </div>

            {/* Email Follows */}
            <div
              className={cn(
                "flex items-center justify-between p-4 rounded-xl",
                "bg-gray-50 dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]"
              )}
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Follows</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Get emails when someone starts following you
                </p>
              </div>
              <button
                onClick={() => handleNotifPrefToggle("email_follows")}
                disabled={isPending}
                className={cn(
                  "relative w-12 h-7 rounded-full transition-colors",
                  notifPrefs.email_follows
                    ? "bg-gradient-to-r from-violet-600 to-blue-600"
                    : "bg-gray-300 dark:bg-[#262626]"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform",
                    notifPrefs.email_follows ? "left-6" : "left-1"
                  )}
                />
              </button>
            </div>

            {/* Email Digest */}
            <div
              className={cn(
                "p-4 rounded-xl",
                "bg-gray-50 dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]"
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Email Digest</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Receive a summary of your activity and notifications
                  </p>
                </div>
                <button
                  onClick={() => handleNotifPrefToggle("email_digest")}
                  disabled={isPending}
                  className={cn(
                    "relative w-12 h-7 rounded-full transition-colors",
                    notifPrefs.email_digest
                      ? "bg-gradient-to-r from-violet-600 to-blue-600"
                      : "bg-gray-300 dark:bg-[#262626]"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform",
                      notifPrefs.email_digest ? "left-6" : "left-1"
                    )}
                  />
                </button>
              </div>

              {/* Frequency Selector - only show when digest is enabled */}
              {notifPrefs.email_digest && (
                <div className="pt-4 border-t border-gray-200 dark:border-[#262626]">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Digest Frequency
                  </label>
                  <div className="flex gap-2">
                    {(["daily", "weekly", "monthly"] as const).map((freq) => (
                      <button
                        key={freq}
                        onClick={() => {
                          setNotifPrefs((prev) => ({ ...prev, email_digest_frequency: freq }));
                          startTransition(async () => {
                            const result = await updateNotificationPreferences({ email_digest_frequency: freq });
                            if (result.error) {
                              toast.error(result.error);
                            }
                          });
                        }}
                        disabled={isPending}
                        className={cn(
                          "px-4 py-2 text-sm font-medium rounded-lg transition-all",
                          notifPrefs.email_digest_frequency === freq
                            ? "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 text-white shadow-sm"
                            : "bg-white dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#262626] hover:border-blue-500/50"
                        )}
                      >
                        {freq.charAt(0).toUpperCase() + freq.slice(1)}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {notifPrefs.email_digest_frequency === "daily" && "You'll receive a digest every morning at 9 AM"}
                    {notifPrefs.email_digest_frequency === "weekly" && "You'll receive a digest every Monday at 9 AM"}
                    {notifPrefs.email_digest_frequency === "monthly" && "You'll receive a digest on the 1st of each month"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Browser Notifications */}
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 mt-8">
            Browser Notifications
          </h3>
          <div className="space-y-3">
            <div
              className={cn(
                "flex items-center justify-between p-4 rounded-xl",
                "bg-gray-50 dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]"
              )}
            >
              <div className="flex-1 mr-4">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 dark:text-white">Push Notifications</p>
                  {!browserNotifSupported && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-200 dark:bg-[#262626] text-gray-500 dark:text-gray-400">
                      Not supported
                    </span>
                  )}
                  {browserNotifSupported && browserNotifPermission === "denied" && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                      Blocked
                    </span>
                  )}
                  {browserNotifSupported && browserNotifEnabled && notifPrefs.browser_notifications && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Receive notifications directly in your browser, even when the tab is not active
                </p>
                {browserNotifPermission === "denied" && (
                  <p className="text-xs text-red-500 mt-1">
                    To enable, click the lock icon in your browser&apos;s address bar and allow notifications
                  </p>
                )}
              </div>
              <button
                onClick={handleBrowserNotifToggle}
                disabled={isPending || !browserNotifSupported || browserNotifPermission === "denied"}
                className={cn(
                  "relative w-12 h-7 rounded-full transition-colors",
                  notifPrefs.browser_notifications && browserNotifEnabled
                    ? "bg-gradient-to-r from-violet-600 to-blue-600"
                    : "bg-gray-300 dark:bg-[#262626]",
                  (!browserNotifSupported || browserNotifPermission === "denied") && "opacity-50 cursor-not-allowed"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform",
                    notifPrefs.browser_notifications && browserNotifEnabled ? "left-6" : "left-1"
                  )}
                />
              </button>
            </div>
          </div>
        </section>
        </div>
      </main>
      <Footer />

      {/* Browser Notification Permission Prompt */}
      <BrowserNotificationPrompt
        isOpen={showBrowserNotifPrompt}
        onClose={handleBrowserNotifPromptClose}
      />
    </div>
  );
}
