"use client";

/**
 * Ask AI Button Component
 *
 * A contextual button that opens the AI assistant with relevant context.
 */

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/design-system";
import { useAskAI } from "./ask-ai-provider";
import {
  type AIContext,
  extractContextFromElement,
  getPageContext,
} from "@/lib/ai-context";

interface AskAIButtonProps {
  // Direct context (if known)
  context?: Partial<AIContext["content"]>;
  // Custom question to pre-fill
  question?: string;
  // Suggested questions to show
  suggestions?: string[];
  // Styling
  className?: string;
  variant?: "icon" | "text" | "pill" | "inline";
  size?: "sm" | "md" | "lg";
  // Behavior
  showOnHover?: boolean;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "inline";
  // Label
  label?: string;
}

export function AskAIButton({
  context,
  question,
  className,
  variant = "icon",
  size = "sm",
  showOnHover = false,
  position = "top-right",
  label = "Ask AI",
}: AskAIButtonProps) {
  const { openWithContext, openWithQuestion } = useAskAI();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isVisible, setIsVisible] = useState(!showOnHover);

  const handleClick = useCallback(() => {
    if (question) {
      openWithQuestion(question);
      return;
    }

    const pageContext = getPageContext();
    let fullContext: AIContext = { page: pageContext };

    if (context) {
      fullContext.content = context as AIContext["content"];
    } else if (buttonRef.current) {
      // Try to extract context from parent element
      const parent = buttonRef.current.parentElement;
      if (parent) {
        fullContext = extractContextFromElement(parent, pageContext);
      }
    }

    openWithContext(fullContext);
  }, [context, question, openWithContext, openWithQuestion]);

  const sizeClasses = {
    sm: variant === "icon" ? "w-6 h-6" : "px-2 py-1 text-xs",
    md: variant === "icon" ? "w-8 h-8" : "px-3 py-1.5 text-sm",
    lg: variant === "icon" ? "w-10 h-10" : "px-4 py-2 text-base",
  };

  const positionClasses = {
    "top-right": "absolute top-2 right-2",
    "top-left": "absolute top-2 left-2",
    "bottom-right": "absolute bottom-2 right-2",
    "bottom-left": "absolute bottom-2 left-2",
    inline: "relative",
  };

  const baseClasses = cn(
    "inline-flex items-center justify-center gap-1.5",
    "rounded-lg font-medium",
    "transition-all duration-200",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
    showOnHover && !isVisible && "opacity-0 pointer-events-none",
    showOnHover && isVisible && "opacity-100"
  );

  const variantClasses = {
    icon: cn(
      "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
      "text-white shadow-lg shadow-blue-500/25",
      "hover:shadow-xl hover:shadow-blue-500/30",
      "hover:-translate-y-0.5"
    ),
    text: cn(
      "text-blue-600 dark:text-cyan-400",
      "hover:text-blue-700 dark:hover:text-cyan-300",
      "hover:bg-blue-50 dark:hover:bg-blue-900/20"
    ),
    pill: cn(
      "bg-blue-100 dark:bg-blue-900/30",
      "text-blue-700 dark:text-cyan-300",
      "border border-blue-200 dark:border-blue-800/50",
      "hover:bg-blue-200 dark:hover:bg-blue-900/50"
    ),
    inline: cn(
      "text-blue-600 dark:text-cyan-400 underline-offset-2",
      "hover:underline"
    ),
  };

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-5 w-5" : "h-4 w-4";

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      onMouseEnter={() => showOnHover && setIsVisible(true)}
      onMouseLeave={() => showOnHover && setIsVisible(false)}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        position !== "inline" && positionClasses[position],
        className
      )}
      title={label}
      aria-label={label}
    >
      <SparklesIcon className={iconSize} />
      {variant !== "icon" && <span>{label}</span>}
    </button>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}

/**
 * Wrapper component that adds Ask AI button to children
 */
interface AskAIWrapperProps {
  children: React.ReactNode;
  context?: Partial<AIContext["content"]>;
  question?: string;
  className?: string;
  buttonPosition?: AskAIButtonProps["position"];
  buttonVariant?: AskAIButtonProps["variant"];
  showOnHover?: boolean;
}

export function AskAIWrapper({
  children,
  context,
  question,
  className,
  buttonPosition = "top-right",
  buttonVariant = "icon",
  showOnHover = true,
}: AskAIWrapperProps) {
  // Track hover state for potential future enhancements (e.g., delayed show)
  const [_isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn("relative group", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      <AskAIButton
        context={context}
        question={question}
        variant={buttonVariant}
        position={buttonPosition}
        showOnHover={showOnHover}
        className={cn(
          "z-10",
          showOnHover && "group-hover:opacity-100 group-focus-within:opacity-100"
        )}
      />
    </div>
  );
}
