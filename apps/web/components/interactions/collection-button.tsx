"use client";

import { useState, useEffect, useTransition } from "react";
import { cn } from "@/lib/design-system";
import { useAuth } from "@/components/providers/auth-provider";
import {
  getUserCollections,
  addToCollection,
  removeFromCollection,
  getResourceCollections,
  type Collection,
} from "@/app/actions/collections";
import { useToast } from "@/components/toast";
import { CollectionModal } from "./collection-modal";

interface CollectionButtonProps {
  resourceType: "resource" | "doc";
  resourceId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function CollectionButton({
  resourceType,
  resourceId,
  size = "md",
  className,
}: CollectionButtonProps) {
  const { isAuthenticated, showSignIn } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [inCollections, setInCollections] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const isInAnyCollection = inCollections.length > 0;

  // Load collections when dropdown opens
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      setIsLoading(true);
      Promise.all([
        getUserCollections(),
        getResourceCollections(resourceType, resourceId),
      ]).then(([collectionsResult, inCollectionsResult]) => {
        if (collectionsResult.data) {
          setCollections(collectionsResult.data);
        }
        if (inCollectionsResult.data) {
          setInCollections(inCollectionsResult.data);
        }
        setIsLoading(false);
      });
    }
  }, [isOpen, isAuthenticated, resourceType, resourceId]);

  const handleClick = () => {
    if (!isAuthenticated) {
      toast.info("Sign in to save to collections");
      showSignIn();
      return;
    }
    setIsOpen(true);
  };

  const handleToggleCollection = (collectionId: string) => {
    const isIn = inCollections.includes(collectionId);

    // Optimistic update
    if (isIn) {
      setInCollections((prev) => prev.filter((id) => id !== collectionId));
    } else {
      setInCollections((prev) => [...prev, collectionId]);
    }

    startTransition(async () => {
      const result = isIn
        ? await removeFromCollection(collectionId, resourceType, resourceId)
        : await addToCollection(collectionId, resourceType, resourceId);

      if (result.error) {
        // Revert on error
        if (isIn) {
          setInCollections((prev) => [...prev, collectionId]);
        } else {
          setInCollections((prev) => prev.filter((id) => id !== collectionId));
        }
        toast.error(result.error);
      } else {
        toast.success(isIn ? "Removed from collection" : "Added to collection");
      }
    });
  };

  const sizeClasses = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-11 w-11",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isPending}
        className={cn(
          "inline-flex items-center justify-center rounded-full",
          "transition-all duration-200",
          "hover:bg-gray-100 dark:hover:bg-gray-800",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          sizeClasses[size],
          isPending && "opacity-50 cursor-not-allowed",
          className
        )}
        aria-label={isInAnyCollection ? "Manage collections" : "Add to collection"}
      >
        <svg
          className={cn(
            iconSizes[size],
            "transition-all duration-200",
            isInAnyCollection
              ? "fill-blue-500 text-blue-500"
              : "fill-none text-gray-400 hover:text-blue-500"
          )}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      <CollectionModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        collections={collections}
        inCollections={inCollections}
        isLoading={isLoading}
        onToggle={handleToggleCollection}
        onCollectionCreated={(collection) => {
          setCollections((prev) => [collection, ...prev]);
        }}
      />
    </>
  );
}
