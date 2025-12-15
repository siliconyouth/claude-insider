"use client";

/**
 * NotificationContent Component
 *
 * Renders notification text with:
 * 1. HTML tag support (e.g., <strong> renders as bold)
 * 2. User mentions (@username) linkified with hover cards
 */

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import {
  ProfileHoverCard,
  type ProfileHoverCardUser,
} from "@/components/users/profile-hover-card";

interface NotificationContentProps {
  /** The text content to render */
  content: string;
  /** CSS classes for the container */
  className?: string;
  /** Actor info for the notification (shown in hover card) */
  actor?: {
    id?: string;
    name: string;
    username?: string | null;
    image?: string | null;
  } | null;
}

interface UserMention {
  username: string;
  user?: ProfileHoverCardUser;
}

// Cache for fetched user data
const userCache = new Map<string, ProfileHoverCardUser>();

/**
 * Parse text and extract user mentions (@username)
 */
function extractMentions(text: string): string[] {
  const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
  const mentions: string[] = [];
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    const username = match[1];
    if (username && !mentions.includes(username)) {
      mentions.push(username);
    }
  }
  return mentions;
}

/**
 * Renders a user mention with hover card
 */
function UserMentionLink({
  username,
  user,
}: {
  username: string;
  user?: ProfileHoverCardUser;
}) {
  const [userData, setUserData] = useState<ProfileHoverCardUser | undefined>(
    user || userCache.get(username)
  );
  const [isLoading, setIsLoading] = useState(!userData);

  useEffect(() => {
    if (userData || !username) return;

    // Check cache first
    const cached = userCache.get(username);
    if (cached) {
      setUserData(cached);
      setIsLoading(false);
      return;
    }

    // Fetch user data
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/users/${username}`);
        if (res.ok) {
          const data = await res.json();
          const fetchedUser: ProfileHoverCardUser = {
            id: data.id,
            name: data.name,
            username: data.username,
            image: data.image,
            bio: data.bio,
            role: data.role,
            joinedAt: data.createdAt,
            stats: {
              followers: data.followerCount,
              following: data.followingCount,
              contributions: data.contributionCount,
            },
          };
          userCache.set(username, fetchedUser);
          setUserData(fetchedUser);
        }
      } catch (error) {
        console.error("[NotificationContent] Failed to fetch user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [username, userData]);

  const linkContent = (
    <Link
      href={`/users/${username}`}
      className={cn(
        "font-medium text-blue-600 dark:text-cyan-400",
        "hover:underline"
      )}
    >
      @{username}
    </Link>
  );

  // Show hover card if we have user data
  if (userData) {
    return (
      <ProfileHoverCard user={userData} disabled={isLoading}>
        {linkContent}
      </ProfileHoverCard>
    );
  }

  // Just show the link while loading or if fetch failed
  return linkContent;
}

/**
 * Parse and render content with HTML and mentions
 */
export function NotificationContent({
  content,
  className,
  actor,
}: NotificationContentProps) {
  // Pre-populate cache with actor data if available
  useMemo(() => {
    if (actor?.username && actor.name) {
      userCache.set(actor.username, {
        id: actor.id || "",
        name: actor.name,
        username: actor.username,
        image: actor.image,
      });
    }
  }, [actor]);

  // Parse the content into segments
  const segments = useMemo(() => {
    const result: Array<{
      type: "text" | "html" | "mention";
      content: string;
      tag?: string;
    }> = [];

    // Split by HTML tags and mentions
    // Match: <tag>content</tag> or @username
    const pattern = /(<(strong|b|em|i|u|code)>(.+?)<\/\2>)|(@([a-zA-Z0-9_-]+))/g;

    let lastIndex = 0;
    let match;

    while ((match = pattern.exec(content)) !== null) {
      // Add text before this match
      if (match.index > lastIndex) {
        result.push({
          type: "text",
          content: content.slice(lastIndex, match.index),
        });
      }

      if (match[1] && match[2] && match[3]) {
        // HTML tag match
        result.push({
          type: "html",
          content: match[3],
          tag: match[2],
        });
      } else if (match[4] && match[5]) {
        // Mention match
        result.push({
          type: "mention",
          content: match[5],
        });
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      result.push({
        type: "text",
        content: content.slice(lastIndex),
      });
    }

    return result;
  }, [content]);

  return (
    <span className={className}>
      {segments.map((segment, index) => {
        switch (segment.type) {
          case "html":
            switch (segment.tag) {
              case "strong":
              case "b":
                return (
                  <strong key={index} className="font-semibold">
                    {segment.content}
                  </strong>
                );
              case "em":
              case "i":
                return <em key={index}>{segment.content}</em>;
              case "u":
                return (
                  <u key={index} className="underline">
                    {segment.content}
                  </u>
                );
              case "code":
                return (
                  <code
                    key={index}
                    className="px-1 py-0.5 bg-gray-100 dark:bg-[#1a1a1a] rounded text-sm font-mono"
                  >
                    {segment.content}
                  </code>
                );
              default:
                return segment.content;
            }
          case "mention":
            return (
              <UserMentionLink
                key={index}
                username={segment.content}
                user={
                  actor?.username === segment.content
                    ? {
                        id: actor.id || "",
                        name: actor.name,
                        username: actor.username,
                        image: actor.image,
                      }
                    : undefined
                }
              />
            );
          case "text":
          default:
            return segment.content;
        }
      })}
    </span>
  );
}
