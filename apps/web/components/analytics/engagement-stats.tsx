"use client";

/**
 * Engagement Stats Component
 *
 * Shows user contributions and community impact metrics.
 */

import { cn } from "@/lib/design-system";
import {
  MessageSquareIcon,
  StarIcon,
  LightbulbIcon,
  FolderIcon,
  HeartIcon,
  ThumbsUpIcon,
  UsersIcon,
  UserPlusIcon,
  EyeIcon,
} from "lucide-react";

interface ContributionData {
  comments: number;
  reviews: number;
  suggestions: number;
  collections: number;
  favorites: number;
}

interface ImpactData {
  helpfulVotes: number;
  commentLikes: number;
  profileViews: number;
  followers: number;
  following: number;
}

interface EngagementStatsProps {
  contributions: ContributionData;
  impact: ImpactData;
  className?: string;
}

export function EngagementStats({
  contributions,
  impact,
  className,
}: EngagementStatsProps) {
  const contributionItems = [
    {
      label: "Comments",
      value: contributions.comments,
      icon: MessageSquareIcon,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Reviews",
      value: contributions.reviews,
      icon: StarIcon,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Suggestions",
      value: contributions.suggestions,
      icon: LightbulbIcon,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
    },
    {
      label: "Collections",
      value: contributions.collections,
      icon: FolderIcon,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
    {
      label: "Favorites",
      value: contributions.favorites,
      icon: HeartIcon,
      color: "text-pink-400",
      bgColor: "bg-pink-500/10",
    },
  ];

  const impactItems = [
    {
      label: "Helpful Votes",
      value: impact.helpfulVotes,
      icon: ThumbsUpIcon,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Comment Likes",
      value: impact.commentLikes,
      icon: HeartIcon,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
    },
    {
      label: "Profile Views",
      value: impact.profileViews,
      icon: EyeIcon,
      color: "text-violet-400",
      bgColor: "bg-violet-500/10",
    },
    {
      label: "Followers",
      value: impact.followers,
      icon: UsersIcon,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Following",
      value: impact.following,
      icon: UserPlusIcon,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
    },
  ];

  const totalContributions = Object.values(contributions).reduce(
    (a, b) => a + b,
    0
  );
  const totalImpact =
    impact.helpfulVotes + impact.commentLikes + impact.followers;

  return (
    <div className={cn("grid md:grid-cols-2 gap-4", className)}>
      {/* Contributions Card */}
      <div className="rounded-xl p-6 bg-[#111111] border border-[#262626]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Your Contributions</h3>
          <div className="text-2xl font-bold text-blue-400">
            {totalContributions}
          </div>
        </div>

        <div className="space-y-3">
          {contributionItems.map((item) => (
            <StatRow key={item.label} {...item} />
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-[#262626]">
          <p className="text-xs text-gray-500 text-center">
            Keep contributing to grow your reputation!
          </p>
        </div>
      </div>

      {/* Impact Card */}
      <div className="rounded-xl p-6 bg-[#111111] border border-[#262626]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Community Impact</h3>
          <div className="text-2xl font-bold text-green-400">{totalImpact}</div>
        </div>

        <div className="space-y-3">
          {impactItems.map((item) => (
            <StatRow key={item.label} {...item} />
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-[#262626]">
          <p className="text-xs text-gray-500 text-center">
            Your contributions are making a difference!
          </p>
        </div>
      </div>
    </div>
  );
}

interface StatRowProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

function StatRow({ label, value, icon: Icon, color, bgColor }: StatRowProps) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("p-2 rounded-lg", bgColor)}>
        <Icon className={cn("w-4 h-4", color)} />
      </div>
      <span className="flex-1 text-sm text-gray-300">{label}</span>
      <span className="text-sm font-medium text-white">
        {value.toLocaleString()}
      </span>
    </div>
  );
}
