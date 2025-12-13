/**
 * Dashboard Layout
 *
 * Protected layout for admin/moderator dashboard pages.
 * Only moderators and admins can access.
 * Provides consistent navigation and styling.
 */

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";
import { DashboardNav } from "./components/dashboard-nav";

export const metadata = {
  title: "Dashboard | Claude Insider",
  description: "Moderator and admin dashboard for Claude Insider",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication and authorization
  const session = await getSession();

  if (!session?.user) {
    redirect("/");
  }

  // Get user role from session
  const userRole = ((session.user as Record<string, unknown>).role as UserRole) || "user";

  // Check if user has at least moderator role
  if (!hasMinRole(userRole, ROLES.MODERATOR)) {
    redirect("/");
  }

  const isAdmin = hasMinRole(userRole, ROLES.ADMIN);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Dashboard Header */}
      <header className="sticky top-0 z-40 border-b border-gray-800 bg-gray-950/80 backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <a
                href="/"
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Site
              </a>
              <div className="h-6 w-px bg-gray-800" />
              <h1 className="text-lg font-semibold text-white">Dashboard</h1>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">
                {session.user.name || session.user.email}
              </span>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  isAdmin
                    ? "bg-cyan-900/30 text-cyan-400"
                    : "bg-violet-900/30 text-violet-400"
                }`}
              >
                {isAdmin ? "Admin" : "Moderator"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <DashboardNav isAdmin={isAdmin} />
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
