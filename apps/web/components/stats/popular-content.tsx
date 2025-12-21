"use client";

/**
 * Popular Content Component
 *
 * Lists of popular documentation and resources.
 */

import Link from "next/link";
import { cn } from "@/lib/design-system";
import { FileTextIcon, FolderIcon, EyeIcon, ArrowRightIcon } from "lucide-react";

interface ContentItem {
  slug: string;
  title: string;
  views: number;
}

interface PopularContentProps {
  docs: ContentItem[];
  resources: ContentItem[];
  className?: string;
}

export function PopularContent({
  docs,
  resources,
  className,
}: PopularContentProps) {
  return (
    <div className={cn("grid md:grid-cols-2 gap-4", className)}>
      <ContentList
        title="Popular Documentation"
        icon={FileTextIcon}
        items={docs}
        basePath="/docs"
        iconColor="text-blue-500"
        emptyMessage="No popular docs yet"
      />
      <ContentList
        title="Top Resources"
        icon={FolderIcon}
        items={resources}
        basePath="/resources"
        iconColor="text-violet-500"
        emptyMessage="No popular resources yet"
      />
    </div>
  );
}

interface ContentListProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: ContentItem[];
  basePath: string;
  iconColor: string;
  emptyMessage: string;
}

function ContentList({
  title,
  icon: Icon,
  items,
  basePath,
  iconColor,
  emptyMessage,
}: ContentListProps) {
  return (
    <div className="rounded-xl p-6 bg-[#111111] border border-[#262626]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className={cn("w-5 h-5", iconColor)} />
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <Link
          href={basePath}
          className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          View all
          <ArrowRightIcon className="w-3 h-3" />
        </Link>
      </div>

      {/* Content list */}
      {items.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">{emptyMessage}</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <ContentItem
              key={item.slug}
              item={item}
              rank={index + 1}
              basePath={basePath}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ContentItemProps {
  item: ContentItem;
  rank: number;
  basePath: string;
}

function ContentItem({ item, rank, basePath }: ContentItemProps) {
  const getRankEmoji = (r: number) => {
    switch (r) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return null;
    }
  };

  const emoji = getRankEmoji(rank);

  return (
    <Link
      href={`${basePath}/${item.slug}`}
      className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group"
    >
      {/* Rank */}
      <div className="w-6 text-center">
        {emoji ? (
          <span className="text-lg">{emoji}</span>
        ) : (
          <span className="text-sm font-medium text-gray-500">#{rank}</span>
        )}
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <span className="text-sm text-gray-200 group-hover:text-white transition-colors truncate block">
          {item.title}
        </span>
      </div>

      {/* Views */}
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <EyeIcon className="w-3 h-3" />
        <span>{formatViews(item.views)}</span>
      </div>
    </Link>
  );
}

function formatViews(views: number): string {
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`;
  }
  return views.toString();
}

/**
 * Single column variant for sidebar use
 */
export function PopularContentCompact({
  items,
  title,
  basePath,
  className,
}: {
  items: ContentItem[];
  title: string;
  basePath: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <h4 className="text-sm font-medium text-gray-400">{title}</h4>
      <div className="space-y-1">
        {items.slice(0, 5).map((item, index) => (
          <Link
            key={item.slug}
            href={`${basePath}/${item.slug}`}
            className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-white/5 transition-colors group"
          >
            <span className="text-xs text-gray-500 w-4">{index + 1}.</span>
            <span className="text-sm text-gray-300 group-hover:text-white truncate flex-1">
              {item.title}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
