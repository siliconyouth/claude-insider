"use client";

/**
 * Share Buttons Component
 *
 * Social sharing buttons for various platforms.
 */

import { useState, useCallback } from "react";
import { cn } from "@/lib/design-system";

interface ShareButtonsProps {
  url?: string;
  title?: string;
  description?: string;
  hashtags?: string[];
  className?: string;
  variant?: "default" | "compact" | "icons-only";
  platforms?: Platform[];
}

type Platform = "twitter" | "linkedin" | "facebook" | "reddit" | "hackernews" | "email" | "copy";

const allPlatforms: Platform[] = ["twitter", "linkedin", "facebook", "reddit", "hackernews", "email", "copy"];

export function ShareButtons({
  url,
  title,
  description,
  hashtags = [],
  className,
  variant = "default",
  platforms = allPlatforms,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const shareTitle = title || (typeof document !== "undefined" ? document.title : "");

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [shareUrl]);

  const getShareUrl = (platform: Platform): string | null => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(shareTitle);
    const encodedDescription = encodeURIComponent(description || "");
    const hashtagString = hashtags.map((h) => h.replace("#", "")).join(",");

    switch (platform) {
      case "twitter":
        return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}${hashtagString ? `&hashtags=${hashtagString}` : ""}`;
      case "linkedin":
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
      case "facebook":
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      case "reddit":
        return `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`;
      case "hackernews":
        return `https://news.ycombinator.com/submitlink?u=${encodedUrl}&t=${encodedTitle}`;
      case "email":
        return `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`;
      case "copy":
        return null;
      default:
        return null;
    }
  };

  const handleShare = (platform: Platform) => {
    if (platform === "copy") {
      handleCopy();
      return;
    }

    const shareLink = getShareUrl(platform);
    if (shareLink) {
      if (platform === "email") {
        // eslint-disable-next-line react-hooks/immutability
        window.location.href = shareLink;
      } else {
        window.open(shareLink, "_blank", "width=600,height=400,noopener,noreferrer");
      }
    }
  };

  const buttonClass = cn(
    "inline-flex items-center justify-center",
    "transition-all duration-200",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
    variant === "default" && "gap-2 px-3 py-2 rounded-lg text-sm font-medium",
    variant === "compact" && "gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium",
    variant === "icons-only" && "p-2 rounded-lg"
  );

  const platformConfig: Record<Platform, { label: string; icon: React.ReactNode; color: string; hoverColor: string }> = {
    twitter: {
      label: "Twitter",
      icon: <TwitterIcon className={variant === "icons-only" ? "h-5 w-5" : "h-4 w-4"} />,
      color: "text-gray-700 dark:text-gray-300",
      hoverColor: "hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2]",
    },
    linkedin: {
      label: "LinkedIn",
      icon: <LinkedInIcon className={variant === "icons-only" ? "h-5 w-5" : "h-4 w-4"} />,
      color: "text-gray-700 dark:text-gray-300",
      hoverColor: "hover:bg-[#0A66C2]/10 hover:text-[#0A66C2]",
    },
    facebook: {
      label: "Facebook",
      icon: <FacebookIcon className={variant === "icons-only" ? "h-5 w-5" : "h-4 w-4"} />,
      color: "text-gray-700 dark:text-gray-300",
      hoverColor: "hover:bg-[#1877F2]/10 hover:text-[#1877F2]",
    },
    reddit: {
      label: "Reddit",
      icon: <RedditIcon className={variant === "icons-only" ? "h-5 w-5" : "h-4 w-4"} />,
      color: "text-gray-700 dark:text-gray-300",
      hoverColor: "hover:bg-[#FF4500]/10 hover:text-[#FF4500]",
    },
    hackernews: {
      label: "Hacker News",
      icon: <HackerNewsIcon className={variant === "icons-only" ? "h-5 w-5" : "h-4 w-4"} />,
      color: "text-gray-700 dark:text-gray-300",
      hoverColor: "hover:bg-[#FF6600]/10 hover:text-[#FF6600]",
    },
    email: {
      label: "Email",
      icon: <EmailIcon className={variant === "icons-only" ? "h-5 w-5" : "h-4 w-4"} />,
      color: "text-gray-700 dark:text-gray-300",
      hoverColor: "hover:bg-blue-500/10 hover:text-blue-500",
    },
    copy: {
      label: copied ? "Copied!" : "Copy Link",
      icon: copied ? (
        <CheckIcon className={variant === "icons-only" ? "h-5 w-5" : "h-4 w-4"} />
      ) : (
        <CopyIcon className={variant === "icons-only" ? "h-5 w-5" : "h-4 w-4"} />
      ),
      color: copied ? "text-green-600 dark:text-green-400" : "text-gray-700 dark:text-gray-300",
      hoverColor: copied ? "" : "hover:bg-gray-100 dark:hover:bg-gray-800",
    },
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {platforms.map((platform) => {
        const config = platformConfig[platform];
        return (
          <button
            key={platform}
            onClick={() => handleShare(platform)}
            className={cn(
              buttonClass,
              "border border-gray-200 dark:border-[#262626]",
              config.color,
              config.hoverColor
            )}
            title={config.label}
            aria-label={`Share on ${config.label}`}
          >
            {config.icon}
            {variant !== "icons-only" && <span>{config.label}</span>}
          </button>
        );
      })}
    </div>
  );
}

// Icon components
function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function RedditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
    </svg>
  );
}

function HackerNewsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M0 0v24h24V0H0zm12.8 14.4v5.6h-1.6v-5.6L7.2 6h1.8l3 6 3-6h1.8l-4 8.4z" />
    </svg>
  );
}

function EmailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
