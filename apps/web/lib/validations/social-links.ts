/**
 * Social Links Validation
 *
 * Validators and sanitizers for social media profile links.
 */

import type { SocialLinks, SocialPlatformId } from "@/types/onboarding";

interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitized?: string;
}

/**
 * Validate and sanitize a GitHub username
 */
export function validateGitHub(value: string): ValidationResult {
  if (!value) return { isValid: true, sanitized: "" };

  // Remove URL prefix if present
  const username = value
    .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
    .replace(/^@/, "")
    .trim();

  // GitHub usernames: 1-39 chars, alphanumeric and hyphens, can't start/end with hyphen
  const pattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

  if (!pattern.test(username)) {
    return {
      isValid: false,
      error: "Invalid GitHub username",
    };
  }

  return { isValid: true, sanitized: username };
}

/**
 * Validate and sanitize a Twitter/X handle
 */
export function validateTwitter(value: string): ValidationResult {
  if (!value) return { isValid: true, sanitized: "" };

  // Remove URL prefix and @ if present
  const handle = value
    .replace(/^https?:\/\/(www\.)?(twitter|x)\.com\//i, "")
    .replace(/^@/, "")
    .trim();

  // Twitter handles: 1-15 chars, alphanumeric and underscores
  const pattern = /^[a-zA-Z0-9_]{1,15}$/;

  if (!pattern.test(handle)) {
    return {
      isValid: false,
      error: "Invalid Twitter/X handle (1-15 characters, letters, numbers, underscores)",
    };
  }

  return { isValid: true, sanitized: handle };
}

/**
 * Validate and sanitize a LinkedIn profile URL
 */
export function validateLinkedIn(value: string): ValidationResult {
  if (!value) return { isValid: true, sanitized: "" };

  // Accept full URL or just the path
  let path = value
    .replace(/^https?:\/\/(www\.)?linkedin\.com\//i, "")
    .trim();

  // LinkedIn accepts in/username or company/name
  const pattern = /^(in|company)\/[a-zA-Z0-9-]{3,100}$/;

  if (!pattern.test(path)) {
    // Try just a username
    if (/^[a-zA-Z0-9-]{3,100}$/.test(path)) {
      path = `in/${path}`;
    } else {
      return {
        isValid: false,
        error: "Invalid LinkedIn profile (use format: in/username)",
      };
    }
  }

  return { isValid: true, sanitized: path };
}

/**
 * Validate and sanitize a Bluesky handle
 */
export function validateBluesky(value: string): ValidationResult {
  if (!value) return { isValid: true, sanitized: "" };

  // Remove @ prefix if present
  const handle = value.replace(/^@/, "").trim();

  // Bluesky handles: username.bsky.social or custom domain
  const pattern = /^[a-zA-Z0-9][a-zA-Z0-9-]*(\.[a-zA-Z0-9][a-zA-Z0-9-]*)+$/;

  if (!pattern.test(handle)) {
    return {
      isValid: false,
      error: "Invalid Bluesky handle (e.g., username.bsky.social)",
    };
  }

  return { isValid: true, sanitized: handle };
}

/**
 * Validate and sanitize a Mastodon handle
 */
export function validateMastodon(value: string): ValidationResult {
  if (!value) return { isValid: true, sanitized: "" };

  let handle = value.trim();

  // Mastodon format: @user@instance.social
  const pattern = /^@?[a-zA-Z0-9_]+@[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!pattern.test(handle)) {
    return {
      isValid: false,
      error: "Invalid Mastodon handle (e.g., @user@instance.social)",
    };
  }

  // Ensure it starts with @
  if (!handle.startsWith("@")) {
    handle = `@${handle}`;
  }

  return { isValid: true, sanitized: handle };
}

/**
 * Validate and sanitize a Discord username
 */
export function validateDiscord(value: string): ValidationResult {
  if (!value) return { isValid: true, sanitized: "" };

  const username = value.trim();

  // Discord new usernames: 2-32 chars, lowercase alphanumeric and underscores/periods
  // Or legacy: username#0000
  const newPattern = /^[a-z0-9_.]{2,32}$/;
  const legacyPattern = /^.{2,32}#[0-9]{4}$/;

  if (!newPattern.test(username.toLowerCase()) && !legacyPattern.test(username)) {
    return {
      isValid: false,
      error: "Invalid Discord username",
    };
  }

  return { isValid: true, sanitized: username };
}

/**
 * Validate and sanitize a website URL
 */
export function validateWebsite(value: string): ValidationResult {
  if (!value) return { isValid: true, sanitized: "" };

  let url = value.trim();

  // Add https:// if no protocol
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  try {
    const parsed = new URL(url);

    // Only allow http/https
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return {
        isValid: false,
        error: "Invalid URL protocol",
      };
    }

    // Basic domain validation
    if (!parsed.hostname.includes(".")) {
      return {
        isValid: false,
        error: "Invalid website URL",
      };
    }

    return { isValid: true, sanitized: url };
  } catch {
    return {
      isValid: false,
      error: "Invalid website URL",
    };
  }
}

/**
 * Validate a social link by platform
 */
export function validateSocialLink(platform: SocialPlatformId, value: string): ValidationResult {
  switch (platform) {
    case "github":
      return validateGitHub(value);
    case "twitter":
      return validateTwitter(value);
    case "linkedin":
      return validateLinkedIn(value);
    case "bluesky":
      return validateBluesky(value);
    case "mastodon":
      return validateMastodon(value);
    case "discord":
      return validateDiscord(value);
    case "website":
      return validateWebsite(value);
    default:
      return { isValid: true, sanitized: value };
  }
}

/**
 * Validate all social links and return sanitized version
 */
export function validateAllSocialLinks(links: SocialLinks): {
  isValid: boolean;
  errors: Partial<Record<SocialPlatformId, string>>;
  sanitized: SocialLinks;
} {
  const errors: Partial<Record<SocialPlatformId, string>> = {};
  const sanitized: SocialLinks = {};
  let isValid = true;

  const platforms: SocialPlatformId[] = [
    "github",
    "twitter",
    "linkedin",
    "bluesky",
    "mastodon",
    "discord",
    "website",
  ];

  for (const platform of platforms) {
    const value = links[platform];
    if (value) {
      const result = validateSocialLink(platform, value);
      if (!result.isValid) {
        isValid = false;
        errors[platform] = result.error;
      } else if (result.sanitized) {
        sanitized[platform] = result.sanitized;
      }
    }
  }

  return { isValid, errors, sanitized };
}

/**
 * Get the full URL for a social link
 */
export function getSocialLinkUrl(platform: SocialPlatformId, value: string): string {
  if (!value) return "";

  switch (platform) {
    case "github":
      return `https://github.com/${value}`;
    case "twitter":
      return `https://x.com/${value}`;
    case "linkedin":
      return `https://linkedin.com/${value}`;
    case "bluesky":
      return `https://bsky.app/profile/${value}`;
    case "mastodon": {
      // Parse @user@instance format
      const match = value.match(/@?([^@]+)@(.+)/);
      if (match) {
        return `https://${match[2]}/@${match[1]}`;
      }
      return value;
    }
    case "discord":
      // Discord doesn't have public profile URLs
      return "";
    case "website":
      return value;
    default:
      return value;
  }
}
