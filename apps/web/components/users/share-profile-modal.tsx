"use client";

/**
 * Share Profile Modal
 *
 * A modal for sharing user profiles with social media buttons,
 * a preview of the OG image, and a copy link button.
 */

import { useState } from "react";
import { cn } from "@/lib/design-system";
import { useToast } from "@/components/toast";

interface ShareProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    username: string;
    name: string;
    bio?: string;
    avatar?: string;
    location?: string;
    followersCount?: number;
    achievementPoints?: number;
  };
}

export function ShareProfileModal({ isOpen, onClose, profile }: ShareProfileModalProps) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Build profile URL
  const profileUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/users/${profile.username}`;

  // Build OG image URL with encoded parameters
  const ogImageUrl = `/api/og/profile?${new URLSearchParams({
    name: profile.name,
    username: profile.username,
    ...(profile.bio && { bio: profile.bio }),
    ...(profile.avatar && { avatar: profile.avatar }),
    ...(profile.location && { location: profile.location }),
    ...(profile.followersCount && { followers: String(profile.followersCount) }),
    ...(profile.achievementPoints && { points: String(profile.achievementPoints) }),
  }).toString()}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const shareText = `Check out ${profile.name}'s profile on Claude Insider!`;

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(profileUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full max-w-lg mx-4",
          "bg-white dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]",
          "rounded-2xl shadow-2xl",
          "animate-in fade-in zoom-in-95 duration-200",
          "overflow-hidden"
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#262626]">
          <h2
            id="share-modal-title"
            className="text-lg font-semibold text-gray-900 dark:text-white"
          >
            Share Profile
          </h2>
          <button
            onClick={onClose}
            className={cn(
              "p-2 rounded-lg",
              "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
              "hover:bg-gray-100 dark:hover:bg-gray-800",
              "transition-colors"
            )}
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* OG Image Preview */}
          <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-[#262626]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ogImageUrl}
              alt="Profile preview"
              className="w-full h-auto"
              loading="lazy"
            />
          </div>

          {/* Profile URL */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={profileUrl}
              readOnly
              className={cn(
                "flex-1 px-4 py-2.5 rounded-xl text-sm",
                "bg-gray-50 dark:bg-[#0a0a0a]",
                "border border-gray-200 dark:border-[#262626]",
                "text-gray-700 dark:text-gray-300",
                "focus:outline-none"
              )}
            />
            <button
              onClick={handleCopyLink}
              className={cn(
                "px-4 py-2.5 rounded-xl text-sm font-medium",
                "border border-gray-200 dark:border-[#262626]",
                copied
                  ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                  : "bg-white dark:bg-[#111111] text-gray-700 dark:text-gray-300",
                "hover:bg-gray-50 dark:hover:bg-[#1a1a1a]",
                "transition-colors"
              )}
            >
              {copied ? (
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copy
                </span>
              )}
            </button>
          </div>

          {/* Social Share Buttons */}
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
              Share on social media
            </p>
            <div className="flex gap-3">
              {/* Twitter */}
              <a
                href={shareLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl",
                  "bg-black text-white",
                  "hover:bg-gray-800 transition-colors"
                )}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span className="font-medium">X</span>
              </a>

              {/* LinkedIn */}
              <a
                href={shareLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl",
                  "bg-[#0A66C2] text-white",
                  "hover:bg-[#004182] transition-colors"
                )}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                <span className="font-medium">LinkedIn</span>
              </a>

              {/* Facebook */}
              <a
                href={shareLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl",
                  "bg-[#1877F2] text-white",
                  "hover:bg-[#0D65D9] transition-colors"
                )}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className="font-medium">Facebook</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
