"use client";

/**
 * Mention Text Component
 *
 * Render text with @mentions as clickable links.
 */

import Link from "next/link";
import { cn } from "@/lib/design-system";
import { parseMentions } from "@/lib/mentions";

interface MentionTextProps {
  text: string;
  className?: string;
}

export function MentionText({ text, className }: MentionTextProps) {
  const parts = parseMentions(text);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (typeof part === "string") {
          return <span key={index}>{part}</span>;
        }

        // Render mention as link
        return (
          <Link
            key={part.key}
            href={`/users/${part.username}`}
            className={cn(
              "inline-flex items-center",
              "text-blue-600 dark:text-cyan-400",
              "hover:underline",
              "font-medium"
            )}
          >
            @{part.username}
          </Link>
        );
      })}
    </span>
  );
}

/**
 * Render text with mentions, preserving line breaks
 */
export function MentionTextMultiline({ text, className }: MentionTextProps) {
  const lines = text.split("\n");

  return (
    <div className={className}>
      {lines.map((line, lineIndex) => (
        <div key={lineIndex}>
          {line ? (
            <MentionText text={line} />
          ) : (
            <br />
          )}
        </div>
      ))}
    </div>
  );
}
