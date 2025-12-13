"use client";

import { useState } from "react";
import { cn } from "@/lib/design-system";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/toast";
import { SuggestEditModal } from "./suggest-edit-modal";

interface SuggestEditButtonProps {
  resourceType: "resource" | "doc";
  resourceId: string;
  resourceTitle?: string;
  variant?: "button" | "link" | "icon";
  className?: string;
}

export function SuggestEditButton({
  resourceType,
  resourceId,
  resourceTitle,
  variant = "button",
  className,
}: SuggestEditButtonProps) {
  const { isAuthenticated, showSignIn } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const toast = useToast();

  const handleClick = () => {
    if (!isAuthenticated) {
      toast.info("Sign in to suggest edits");
      showSignIn();
      return;
    }
    setIsOpen(true);
  };

  if (variant === "icon") {
    return (
      <>
        <button
          onClick={handleClick}
          className={cn(
            "inline-flex items-center justify-center",
            "w-8 h-8 rounded-full",
            "text-gray-400 hover:text-blue-600 dark:hover:text-cyan-400",
            "hover:bg-gray-100 dark:hover:bg-gray-800",
            "transition-colors",
            className
          )}
          aria-label="Suggest an edit"
          title="Suggest an edit"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>

        <SuggestEditModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          resourceType={resourceType}
          resourceId={resourceId}
          resourceTitle={resourceTitle}
        />
      </>
    );
  }

  if (variant === "link") {
    return (
      <>
        <button
          onClick={handleClick}
          className={cn(
            "inline-flex items-center gap-1.5 text-sm",
            "text-gray-500 dark:text-gray-400",
            "hover:text-blue-600 dark:hover:text-cyan-400",
            "transition-colors",
            className
          )}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Suggest an edit
        </button>

        <SuggestEditModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          resourceType={resourceType}
          resourceId={resourceId}
          resourceTitle={resourceTitle}
        />
      </>
    );
  }

  // Default button variant
  return (
    <>
      <button
        onClick={handleClick}
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium",
          "rounded-lg border border-gray-200 dark:border-[#262626]",
          "text-gray-700 dark:text-gray-300",
          "hover:bg-gray-50 dark:hover:bg-[#1a1a1a]",
          "hover:border-blue-500/50",
          "transition-colors",
          className
        )}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
        Suggest an Edit
      </button>

      <SuggestEditModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        resourceType={resourceType}
        resourceId={resourceId}
        resourceTitle={resourceTitle}
      />
    </>
  );
}
