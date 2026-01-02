"use client";

/**
 * New Group Modal
 *
 * Modal for creating a new group conversation.
 * Allows setting group name, description, and initial members.
 */

import { useState, useEffect } from "react";
import { cn } from "@/lib/design-system";
import { AccessibleModal } from "@/components/accessible-modal";
import { createGroupConversation } from "@/app/actions/group-chat";

interface NewGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (conversationId: string) => void;
}

export function NewGroupModal({
  isOpen,
  onClose,
  onGroupCreated,
}: NewGroupModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName("");
      setDescription("");
      setError(null);
      setIsCreating(false);
    }
  }, [isOpen]);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Group name is required");
      return;
    }

    if (name.length > 100) {
      setError("Group name must be 100 characters or less");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const result = await createGroupConversation(
        name.trim(),
        description.trim() || undefined
      );

      if (result.success && result.conversationId) {
        onGroupCreated(result.conversationId);
        onClose();
      } else {
        setError(result.error || "Failed to create group");
      }
    } catch (err) {
      console.error("Error creating group:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title="New Group"
      size="md"
      description="Create a group to chat with multiple people"
    >
      <div className="space-y-4">
        {/* Group name */}
        <div>
          <label
            htmlFor="group-name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Group Name <span className="text-red-500">*</span>
          </label>
          <input
            id="group-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Project Team, Study Group"
            autoFocus
            maxLength={100}
            className={cn(
              "w-full px-4 py-2.5 rounded-lg text-sm",
              "bg-gray-100 dark:bg-gray-800",
              "text-gray-900 dark:text-white",
              "placeholder-gray-500",
              "border-0 focus:ring-2 focus:ring-blue-500"
            )}
          />
          <p className="mt-1 text-xs text-gray-500">
            {name.length}/100 characters
          </p>
        </div>

        {/* Description (optional) */}
        <div>
          <label
            htmlFor="group-description"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Description <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            id="group-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this group about?"
            rows={3}
            maxLength={500}
            className={cn(
              "w-full px-4 py-2.5 rounded-lg text-sm resize-none",
              "bg-gray-100 dark:bg-gray-800",
              "text-gray-900 dark:text-white",
              "placeholder-gray-500",
              "border-0 focus:ring-2 focus:ring-blue-500"
            )}
          />
        </div>

        {/* Info note */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <InfoIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 dark:text-blue-300">
            After creating the group, you can invite members from the group settings.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
            <ErrorIcon className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isCreating}
            className={cn(
              "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium",
              "border border-gray-200 dark:border-[#262626]",
              "text-gray-700 dark:text-gray-300",
              "hover:bg-gray-50 dark:hover:bg-[#1a1a1a]",
              "transition-colors",
              "disabled:opacity-50"
            )}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isCreating || !name.trim()}
            className={cn(
              "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium",
              "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
              "text-white shadow-lg shadow-blue-500/25",
              "hover:shadow-blue-500/40 transition-all",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isCreating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </span>
            ) : (
              "Create Group"
            )}
          </button>
        </div>
      </div>
    </AccessibleModal>
  );
}

// ============================================================================
// Icons
// ============================================================================

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" d="M12 16v-4m0-4h.01" />
    </svg>
  );
}

function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
    </svg>
  );
}
