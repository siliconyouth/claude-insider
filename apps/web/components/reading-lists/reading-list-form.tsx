"use client";

/**
 * Reading List Form Component
 *
 * Create or edit a reading list.
 */

import { useState } from "react";
import { cn } from "@/lib/design-system";
import { createReadingList, updateReadingList } from "@/app/actions/reading-lists";
import type { ReadingList } from "@/app/actions/reading-lists";

interface ReadingListFormProps {
  list?: ReadingList;
  onSuccess?: (list: ReadingList) => void;
  onCancel?: () => void;
  className?: string;
}

const COLORS = [
  "#3b82f6", // Blue
  "#8b5cf6", // Violet
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#ec4899", // Pink
  "#6b7280", // Gray
];

const ICONS = [
  { id: "bookmark", label: "Bookmark" },
  { id: "book", label: "Book" },
  { id: "folder", label: "Folder" },
  { id: "star", label: "Star" },
  { id: "heart", label: "Heart" },
  { id: "lightning", label: "Lightning" },
];

export function ReadingListForm({
  list,
  onSuccess,
  onCancel,
  className,
}: ReadingListFormProps) {
  const [name, setName] = useState(list?.name || "");
  const [description, setDescription] = useState(list?.description || "");
  const [isPublic, setIsPublic] = useState(list?.is_public || false);
  const [color, setColor] = useState<string>(list?.color || "#3b82f6");
  const [icon, setIcon] = useState<string>(list?.icon || "bookmark");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!list;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditing && list) {
        const result = await updateReadingList(list.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          is_public: isPublic,
          color,
          icon,
        });
        if (result.error) {
          setError(result.error);
        } else {
          onSuccess?.({
            ...list,
            name,
            description: description || null,
            is_public: isPublic,
            color,
            icon,
            updated_at: new Date().toISOString(),
          });
        }
      } else if (!isEditing) {
        const result = await createReadingList({
          name: name.trim(),
          description: description.trim() || undefined,
          is_public: isPublic,
          color,
          icon,
        });
        if (result.error) {
          setError(result.error);
        } else if (result.list) {
          onSuccess?.(result.list);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
      {/* Name */}
      <div>
        <label htmlFor="list-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="list-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Must Read, Tutorials"
          maxLength={50}
          className={cn(
            "w-full px-3 py-2 rounded-lg",
            "bg-gray-50 dark:bg-[#0a0a0a]",
            "border border-gray-200 dark:border-[#262626]",
            "text-gray-900 dark:text-white placeholder-gray-400",
            "focus:outline-none focus:ring-2 focus:ring-blue-500"
          )}
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="list-desc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          id="list-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's this list for?"
          rows={2}
          maxLength={200}
          className={cn(
            "w-full px-3 py-2 rounded-lg resize-none",
            "bg-gray-50 dark:bg-[#0a0a0a]",
            "border border-gray-200 dark:border-[#262626]",
            "text-gray-900 dark:text-white placeholder-gray-400",
            "focus:outline-none focus:ring-2 focus:ring-blue-500"
          )}
        />
      </div>

      {/* Color */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Color
        </label>
        <div className="flex items-center gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                "w-8 h-8 rounded-full transition-all",
                color === c && "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#111111]"
              )}
              style={{ backgroundColor: c, outlineColor: color === c ? c : undefined }}
            />
          ))}
        </div>
      </div>

      {/* Icon */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Icon
        </label>
        <div className="flex items-center gap-2">
          {ICONS.map((i) => (
            <button
              key={i.id}
              type="button"
              onClick={() => setIcon(i.id)}
              title={i.label}
              className={cn(
                "p-2 rounded-lg transition-all",
                icon === i.id
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  : "text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
              )}
            >
              <IconSvg name={i.id} />
            </button>
          ))}
        </div>
      </div>

      {/* Public toggle */}
      <div className="flex items-center justify-between py-2">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Make public
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Allow others to view this list
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsPublic(!isPublic)}
          className={cn(
            "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            isPublic ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
              isPublic ? "translate-x-5" : "translate-x-0"
            )}
          />
        </button>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] rounded-lg transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || !name.trim()}
          className={cn(
            "px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all",
            "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
            "hover:shadow-lg hover:shadow-blue-500/25",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create List"}
        </button>
      </div>
    </form>
  );
}

function IconSvg({ name }: { name: string }) {
  const paths: Record<string, string> = {
    bookmark: "M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z",
    book: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
    folder: "M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z",
    star: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z",
    heart: "M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z",
    lightning: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z",
  };

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d={paths[name] || paths.bookmark} />
    </svg>
  );
}
