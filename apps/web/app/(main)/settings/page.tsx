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
import { PasskeySettings } from "@/components/settings/passkey-settings";
import { DataManagement } from "@/components/settings/data-management";
import { BlockedUsers } from "@/components/settings/blocked-users";
import { AvatarUpload } from "@/components/settings/avatar-upload";
import { CoverPhotoSection } from "@/components/settings/cover-photo-section";
import { PasswordSettings } from "@/components/settings/password-settings";
import { ConnectedAccounts } from "@/components/settings/connected-accounts";
import { ApiKeySettings } from "@/components/settings/api-key-settings";
import { ActivitySettings } from "@/components/settings/activity-settings";
import { AskAIButton } from "@/components/ask-ai/ask-ai-button";
import { BrowserNotificationPrompt } from "@/components/notifications/browser-notification-prompt";
import { useBrowserNotifications } from "@/hooks/use-browser-notifications";
import { useSound, type SoundSettings, THEME_LIST } from "@/hooks/use-sound-effects";
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
    in_app_version_updates: true,
    email_comments: false,
    email_replies: true,
    email_suggestions: true,
    email_follows: false,
    email_version_updates: false,
    email_digest: false,
    email_digest_frequency: "weekly",
    browser_notifications: false,
  });

  // Browser notifications state
  const [showBrowserNotifPrompt, setShowBrowserNotifPrompt] = useState(false);
  const { isSupported: browserNotifSupported, permission: browserNotifPermission, isEnabled: browserNotifEnabled, unsubscribe: unsubscribeFromPush } = useBrowserNotifications();

  // Sound settings
  const sounds = useSound();
  const { settings: soundSettings, updateSettings: updateSoundSettings, playSuccess, playToggleOn, playToggleOff } = sounds;

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
      } else {
        // Clear cache so reload gets fresh data
        clearCache();
      }
    });
  };

  // Browser notification toggle handler - shows prompt if permission not granted
  const handleBrowserNotifToggle = async () => {
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
      handleNotifPrefToggle("browser_notifications");
    } else {
      // Disabling - unsubscribe from push and update preference
      setNotifPrefs((prev) => ({ ...prev, browser_notifications: false }));

      startTransition(async () => {
        // Unsubscribe from push notifications (removes from browser and server)
        await unsubscribeFromPush();

        // Update database preference
        const result = await updateNotificationPreferences({ browser_notifications: false });

        if (result.error) {
          // Revert on error
          setNotifPrefs((prev) => ({ ...prev, browser_notifications: true }));
          toast.error(result.error);
        } else {
          clearCache();
          toast.success("Browser notifications disabled");
        }
      });
    }
  };

  // Handle browser notification prompt close (just close the modal)
  const handleBrowserNotifPromptClose = () => {
    setShowBrowserNotifPrompt(false);
  };

  // Handle browser notification permission result
  const handleBrowserNotifPermissionResult = (granted: boolean) => {
    setShowBrowserNotifPrompt(false);

    if (granted) {
      // Permission granted, enable the setting
      setNotifPrefs((prev) => ({ ...prev, browser_notifications: true }));
      startTransition(async () => {
        const updateResult = await updateNotificationPreferences({ browser_notifications: true });
        if (updateResult.error) {
          setNotifPrefs((prev) => ({ ...prev, browser_notifications: false }));
          toast.error(updateResult.error);
        } else {
          clearCache(); // Clear cache so reload gets fresh data
          toast.success("Browser notifications enabled");
        }
      });
    } else {
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

            {/* Cover Photo */}
            <CoverPhotoSection
              currentCoverUrl={profile?.coverPhotoUrl}
              avatarUrl={profile?.avatarUrl}
              userName={name || profile?.name}
              onCoverPhotoChange={(url) => {
                setProfile((prev) => prev ? { ...prev, coverPhotoUrl: url } : prev);
                clearCache();
              }}
            />

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

            {/* Email with verification status */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={profile?.email || ""}
                  readOnly
                  disabled
                  className={cn(
                    "w-full px-4 py-2.5 rounded-lg pr-28",
                    "bg-gray-50 dark:bg-[#0a0a0a]",
                    "border border-gray-200 dark:border-[#262626]",
                    "text-gray-500 dark:text-gray-400",
                    "cursor-not-allowed"
                  )}
                />
                {/* Verification Badge */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {authUser?.emailVerified ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Unverified
                    </span>
                  )}
                </div>
              </div>
              {/* Show verification actions if not verified */}
              {!authUser?.emailVerified && (
                <div className="mt-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                        Email not verified
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-400/80 mt-0.5">
                        Please verify your email to access all features.
                      </p>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const response = await fetch("/api/auth/send-verification-email", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ email: profile?.email }),
                            });
                            if (response.ok) {
                              toast.success("Verification email sent! Check your inbox.");
                            } else {
                              toast.error("Failed to send verification email");
                            }
                          } catch {
                            toast.error("Failed to send verification email");
                          }
                        }}
                        className="mt-2 text-sm font-medium text-yellow-800 dark:text-yellow-300 hover:underline"
                      >
                        Resend verification email &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {authUser?.emailVerified && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Email cannot be changed
                </p>
              )}
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
        <section id="security" className="scroll-mt-24 mb-12">
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

            {/* Passkeys */}
            <PasskeySettings />
          </div>
        </section>

        {/* Divider */}
        <hr className="border-gray-200 dark:border-[#262626] mb-12" />

        {/* AI Integration Section */}
        <section id="ai" className="scroll-mt-24 mb-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/10 to-blue-500/10">
              <svg
                className="w-5 h-5 text-violet-600 dark:text-violet-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              AI Integration
            </h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Connect your Anthropic account to use AI features with your own API credits
          </p>

          <div className={cn(
            "p-6 rounded-xl",
            "bg-gray-50 dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]"
          )}>
            <ApiKeySettings />
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

        {/* Sound & Audio Section */}
        <section id="sound" className="scroll-mt-24 mb-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/10 to-blue-500/10">
              <svg
                className="w-5 h-5 text-violet-600 dark:text-violet-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Sound & Audio
            </h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Control sound effects for interactions and notifications
          </p>

          <div className="space-y-4">
            {/* Master Enable */}
            <div
              className={cn(
                "flex items-center justify-between p-4 rounded-xl",
                "bg-gray-50 dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]"
              )}
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Enable Sound Effects</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Master toggle for all sound effects
                </p>
              </div>
              <button
                onClick={() => {
                  const newValue = !soundSettings.enabled;
                  updateSoundSettings({ enabled: newValue });
                  if (newValue) {
                    playToggleOn();
                  }
                }}
                className={cn(
                  "relative w-12 h-7 rounded-full transition-colors",
                  soundSettings.enabled
                    ? "bg-gradient-to-r from-violet-600 to-blue-600"
                    : "bg-gray-300 dark:bg-[#262626]"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform",
                    soundSettings.enabled ? "left-6" : "left-1"
                  )}
                />
              </button>
            </div>

            {/* Volume Slider */}
            {soundSettings.enabled && (
              <div
                className={cn(
                  "p-4 rounded-xl",
                  "bg-gray-50 dark:bg-[#111111]",
                  "border border-gray-200 dark:border-[#262626]"
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Volume</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {Math.round(soundSettings.volume * 100)}%
                    </p>
                  </div>
                  <button
                    onClick={() => playSuccess()}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-lg",
                      "border border-gray-200 dark:border-[#262626]",
                      "text-gray-700 dark:text-gray-300",
                      "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
                      "transition-colors"
                    )}
                  >
                    Test Sound
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(soundSettings.volume * 100)}
                  onChange={(e) => {
                    updateSoundSettings({ volume: parseInt(e.target.value) / 100 });
                  }}
                  className={cn(
                    "w-full h-2 rounded-full appearance-none cursor-pointer",
                    "bg-gray-200 dark:bg-[#262626]",
                    "[&::-webkit-slider-thumb]:appearance-none",
                    "[&::-webkit-slider-thumb]:w-4",
                    "[&::-webkit-slider-thumb]:h-4",
                    "[&::-webkit-slider-thumb]:rounded-full",
                    "[&::-webkit-slider-thumb]:bg-gradient-to-r",
                    "[&::-webkit-slider-thumb]:from-violet-600",
                    "[&::-webkit-slider-thumb]:to-blue-600",
                    "[&::-webkit-slider-thumb]:shadow-md",
                    "[&::-webkit-slider-thumb]:cursor-pointer",
                    "[&::-moz-range-thumb]:w-4",
                    "[&::-moz-range-thumb]:h-4",
                    "[&::-moz-range-thumb]:rounded-full",
                    "[&::-moz-range-thumb]:bg-gradient-to-r",
                    "[&::-moz-range-thumb]:from-violet-600",
                    "[&::-moz-range-thumb]:to-blue-600",
                    "[&::-moz-range-thumb]:border-0",
                    "[&::-moz-range-thumb]:cursor-pointer"
                  )}
                />
              </div>
            )}

            {/* Sound Theme Selector - only show when enabled */}
            {soundSettings.enabled && (
              <div
                className={cn(
                  "p-4 rounded-xl",
                  "bg-gray-50 dark:bg-[#111111]",
                  "border border-gray-200 dark:border-[#262626]"
                )}
              >
                <div className="mb-4">
                  <p className="font-medium text-gray-900 dark:text-white">Sound Theme</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Choose a sound style that fits your preference
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {THEME_LIST.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={async () => {
                        updateSoundSettings({ theme: theme.id });
                        // Play a preview sound with the new theme
                        setTimeout(() => playSuccess(), 50);
                        // Persist to database for authenticated users
                        try {
                          await fetch("/api/user/assistant-settings", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ soundTheme: theme.id }),
                          });
                        } catch {
                          // Silently fail - localStorage is the primary storage
                        }
                      }}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all",
                        soundSettings.theme === theme.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                          : "border-gray-200 dark:border-[#262626] hover:border-blue-300 dark:hover:border-blue-700"
                      )}
                    >
                      <span className="text-2xl" role="img" aria-label={theme.name}>
                        {theme.icon}
                      </span>
                      <span className={cn(
                        "text-xs font-medium truncate w-full text-center",
                        soundSettings.theme === theme.id
                          ? "text-blue-700 dark:text-blue-300"
                          : "text-gray-700 dark:text-gray-300"
                      )}>
                        {theme.name}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  Click a theme to preview its sound style. Each theme has unique characteristics.
                </p>
              </div>
            )}

            {/* Category Toggles - only show when enabled */}
            {soundSettings.enabled && (
              <>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-6 mb-3">
                  Sound Categories
                </h3>

                {/* Notifications */}
                <div
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl",
                    "bg-gray-50 dark:bg-[#111111]",
                    "border border-gray-200 dark:border-[#262626]"
                  )}
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Notifications</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Sound when notifications arrive
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const newValue = !soundSettings.notifications;
                      updateSoundSettings({ notifications: newValue });
                      if (newValue) playToggleOn();
                      else playToggleOff();
                    }}
                    className={cn(
                      "relative w-12 h-7 rounded-full transition-colors",
                      soundSettings.notifications
                        ? "bg-gradient-to-r from-violet-600 to-blue-600"
                        : "bg-gray-300 dark:bg-[#262626]"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform",
                        soundSettings.notifications ? "left-6" : "left-1"
                      )}
                    />
                  </button>
                </div>

                {/* Feedback */}
                <div
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl",
                    "bg-gray-50 dark:bg-[#111111]",
                    "border border-gray-200 dark:border-[#262626]"
                  )}
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Feedback</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Success, error, and warning sounds
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const newValue = !soundSettings.feedback;
                      updateSoundSettings({ feedback: newValue });
                      if (newValue) playToggleOn();
                      else playToggleOff();
                    }}
                    className={cn(
                      "relative w-12 h-7 rounded-full transition-colors",
                      soundSettings.feedback
                        ? "bg-gradient-to-r from-violet-600 to-blue-600"
                        : "bg-gray-300 dark:bg-[#262626]"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform",
                        soundSettings.feedback ? "left-6" : "left-1"
                      )}
                    />
                  </button>
                </div>

                {/* Chat */}
                <div
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl",
                    "bg-gray-50 dark:bg-[#111111]",
                    "border border-gray-200 dark:border-[#262626]"
                  )}
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Chat & Messaging</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Message sounds, typing indicators, mentions
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const newValue = !soundSettings.chat;
                      updateSoundSettings({ chat: newValue });
                      if (newValue) playToggleOn();
                      else playToggleOff();
                    }}
                    className={cn(
                      "relative w-12 h-7 rounded-full transition-colors",
                      soundSettings.chat
                        ? "bg-gradient-to-r from-violet-600 to-blue-600"
                        : "bg-gray-300 dark:bg-[#262626]"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform",
                        soundSettings.chat ? "left-6" : "left-1"
                      )}
                    />
                  </button>
                </div>

                {/* Achievements */}
                <div
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl",
                    "bg-gray-50 dark:bg-[#111111]",
                    "border border-gray-200 dark:border-[#262626]"
                  )}
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Achievements</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Level up, achievement unlocks, progress
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const newValue = !soundSettings.achievements;
                      updateSoundSettings({ achievements: newValue });
                      if (newValue) playToggleOn();
                      else playToggleOff();
                    }}
                    className={cn(
                      "relative w-12 h-7 rounded-full transition-colors",
                      soundSettings.achievements
                        ? "bg-gradient-to-r from-violet-600 to-blue-600"
                        : "bg-gray-300 dark:bg-[#262626]"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform",
                        soundSettings.achievements ? "left-6" : "left-1"
                      )}
                    />
                  </button>
                </div>

                {/* UI Interactions */}
                <div
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl",
                    "bg-gray-50 dark:bg-[#111111]",
                    "border border-gray-200 dark:border-[#262626]"
                  )}
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">UI Interactions</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Subtle clicks, toggles, navigation sounds (power users)
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const newValue = !soundSettings.ui;
                      updateSoundSettings({ ui: newValue });
                      if (newValue) playToggleOn();
                      else playToggleOff();
                    }}
                    className={cn(
                      "relative w-12 h-7 rounded-full transition-colors",
                      soundSettings.ui
                        ? "bg-gradient-to-r from-violet-600 to-blue-600"
                        : "bg-gray-300 dark:bg-[#262626]"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform",
                        soundSettings.ui ? "left-6" : "left-1"
                      )}
                    />
                  </button>
                </div>

                {/* Info note about browser push notification sounds */}
                <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        Browser Push Notifications
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-400/80 mt-0.5">
                        Push notifications use your browser&apos;s default system sound. Custom sounds play when you interact with notifications.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Divider */}
        <hr className="border-gray-200 dark:border-[#262626] mb-12" />

        {/* Activity & History Section */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Activity & History
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            View your activity stats and recent history
          </p>

          <ActivitySettings />
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

            {/* Version Updates */}
            <div
              className={cn(
                "flex items-center justify-between p-4 rounded-xl",
                "bg-gray-50 dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]"
              )}
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Version Updates</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  When new versions of Claude Insider are released
                </p>
              </div>
              <button
                onClick={() => handleNotifPrefToggle("in_app_version_updates")}
                disabled={isPending}
                className={cn(
                  "relative w-12 h-7 rounded-full transition-colors",
                  notifPrefs.in_app_version_updates
                    ? "bg-gradient-to-r from-violet-600 to-blue-600"
                    : "bg-gray-300 dark:bg-[#262626]"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform",
                    notifPrefs.in_app_version_updates ? "left-6" : "left-1"
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

            {/* Email Version Updates */}
            <div
              className={cn(
                "flex items-center justify-between p-4 rounded-xl",
                "bg-gray-50 dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]"
              )}
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Version Updates</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Get emails about new Claude Insider releases and features
                </p>
              </div>
              <button
                onClick={() => handleNotifPrefToggle("email_version_updates")}
                disabled={isPending}
                className={cn(
                  "relative w-12 h-7 rounded-full transition-colors",
                  notifPrefs.email_version_updates
                    ? "bg-gradient-to-r from-violet-600 to-blue-600"
                    : "bg-gray-300 dark:bg-[#262626]"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform",
                    notifPrefs.email_version_updates ? "left-6" : "left-1"
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
                            } else {
                              clearCache();
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
        onPermissionResult={handleBrowserNotifPermissionResult}
      />
    </div>
  );
}
