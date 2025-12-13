"use client";

import { useState, useEffect, useTransition } from "react";
import { cn } from "@/lib/design-system";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/toast";
import {
  getCurrentUserProfile,
  updateUserProfile,
  type UserProfile,
} from "@/app/actions/profile";
import Link from "next/link";

export default function SettingsPage() {
  const { isAuthenticated, isLoading: authLoading, showSignIn, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  // Form state
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      showSignIn();
    }
  }, [authLoading, isAuthenticated, showSignIn]);

  useEffect(() => {
    if (isAuthenticated) {
      loadProfile();
    }
  }, [isAuthenticated]);

  const loadProfile = async () => {
    setIsLoading(true);
    const result = await getCurrentUserProfile();

    if (result.data) {
      setProfile(result.data);
      setName(result.data.name || "");
      setBio(result.data.bio || "");
      setWebsite(result.data.website || "");
    }

    setIsLoading(false);
  };

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
        // Reload profile to get fresh data
        loadProfile();
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

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
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
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
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
            {/* Avatar Preview */}
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold",
                  "bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-600 text-white"
                )}
              >
                {name?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Profile Photo
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Avatar is generated from your initials
                </p>
              </div>
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

            {/* Delete Account - Coming Soon */}
            <div
              className={cn(
                "flex items-center justify-between p-4 rounded-xl",
                "bg-gray-50 dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]",
                "opacity-50"
              )}
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Delete Account
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Permanently delete your account and all data
                </p>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500 px-2 py-1 bg-gray-100 dark:bg-[#1a1a1a] rounded">
                Coming Soon
              </span>
            </div>
          </div>
        </section>

        {/* Divider */}
        <hr className="border-gray-200 dark:border-[#262626] mb-12" />

        {/* Preferences Section - Coming Soon */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Preferences
          </h2>

          <div
            className={cn(
              "p-6 rounded-xl text-center",
              "bg-gray-50 dark:bg-[#111111]",
              "border border-gray-200 dark:border-[#262626]"
            )}
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-[#1a1a1a] text-gray-400 mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Notification Preferences
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Email notifications and preferences coming soon
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
