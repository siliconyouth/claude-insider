"use client";

/**
 * Analytics Tabs Component
 *
 * Tab navigation for personal analytics dashboard.
 */

import { cn } from "@/lib/design-system";
import {
  LayoutDashboardIcon,
  BookOpenIcon,
  TrophyIcon,
  HeartIcon,
} from "lucide-react";

export type AnalyticsTab = "overview" | "history" | "achievements" | "engagement";

interface AnalyticsTabsProps {
  activeTab: AnalyticsTab;
  onTabChange: (tab: AnalyticsTab) => void;
  className?: string;
}

const tabs = [
  {
    id: "overview" as const,
    label: "Overview",
    icon: LayoutDashboardIcon,
  },
  {
    id: "history" as const,
    label: "Reading History",
    icon: BookOpenIcon,
  },
  {
    id: "achievements" as const,
    label: "Achievements",
    icon: TrophyIcon,
  },
  {
    id: "engagement" as const,
    label: "Engagement",
    icon: HeartIcon,
  },
];

export function AnalyticsTabs({
  activeTab,
  onTabChange,
  className,
}: AnalyticsTabsProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-2 p-1 rounded-lg",
        "bg-gray-100 dark:bg-[#111111]",
        "border border-gray-200 dark:border-[#262626]",
        className
      )}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium",
              "transition-all duration-200",
              isActive
                ? "bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5"
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
