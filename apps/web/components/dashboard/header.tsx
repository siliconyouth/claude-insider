"use client";

/**
 * Dashboard Header
 *
 * Top navigation bar for the admin dashboard.
 */

import Link from "next/link";
import { cn } from "@/lib/design-system";

interface DashboardHeaderProps {
  user: {
    id: number;
    email: string;
    name?: string;
    roles?: string[];
  };
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 h-16 border-b",
        "border-gray-200 dark:border-[#262626]",
        "bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-lg"
      )}
    >
      <div className="flex h-full items-center justify-between px-6">
        {/* Logo & Title */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-8 w-8">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-600" />
              <div className="absolute inset-[2px] rounded-[6px] bg-white dark:bg-[#0a0a0a] flex items-center justify-center">
                <span className="text-sm font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  CI
                </span>
              </div>
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              Dashboard
            </span>
          </Link>
          <span className="hidden sm:inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-violet-500/10 via-blue-500/10 to-cyan-500/10 text-blue-700 dark:text-cyan-400">
            Resource Admin
          </span>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Payload Admin Link */}
          <Link
            href="/admin"
            className={cn(
              "text-sm text-gray-600 dark:text-gray-400",
              "hover:text-gray-900 dark:hover:text-white",
              "transition-colors"
            )}
          >
            Payload CMS →
          </Link>

          {/* User Info */}
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-[#262626]">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 via-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-medium">
              {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user.name || user.email.split("@")[0]}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user.roles?.[0] || "User"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
