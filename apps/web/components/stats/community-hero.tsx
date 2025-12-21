"use client";

/**
 * Community Hero Component
 *
 * Hero section for the /stats page with animated user count.
 */

import { useEffect, useState } from "react";
import { cn } from "@/lib/design-system";
import { UsersIcon } from "lucide-react";

interface CommunityHeroProps {
  totalUsers: number;
  className?: string;
}

export function CommunityHero({ totalUsers, className }: CommunityHeroProps) {
  const [displayCount, setDisplayCount] = useState(0);

  // Animate counter on mount
  useEffect(() => {
    const duration = 1500; // 1.5 seconds
    const steps = 60;
    const increment = totalUsers / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= totalUsers) {
        setDisplayCount(totalUsers);
        clearInterval(timer);
      } else {
        setDisplayCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [totalUsers]);

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-gradient-to-br from-violet-600/20 via-blue-600/20 to-cyan-600/20",
        "border border-[#262626]",
        "p-8 md:p-12",
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-cyan-600/10 blur-3xl" />
      </div>

      <div className="relative z-10 text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 mb-6">
          <UsersIcon className="w-8 h-8 text-white" />
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Claude Insider Community
        </h1>

        {/* Subtitle with animated counter */}
        <p className="text-lg md:text-xl text-gray-300">
          Join{" "}
          <span className="font-bold bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
            {displayCount.toLocaleString()}
          </span>{" "}
          users learning Claude AI together
        </p>

        {/* Decorative badges */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <Badge icon="🚀" label="Free to Join" />
          <Badge icon="📚" label="100+ Resources" />
          <Badge icon="🏆" label="50+ Achievements" />
        </div>
      </div>
    </section>
  );
}

function Badge({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
      <span>{icon}</span>
      <span className="text-sm text-gray-300">{label}</span>
    </div>
  );
}
