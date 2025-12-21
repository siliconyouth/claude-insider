/**
 * Dashboard Layout
 *
 * Protected layout for admin/moderator dashboard pages.
 * Only moderators and admins can access.
 * Provides consistent navigation and styling with site header/footer.
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";
import { DashboardNav } from "./components/dashboard-nav";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Dashboard | Claude Insider",
  description: "Moderator and admin dashboard for Claude Insider",
  robots: {
    index: false,
    follow: false,
  },
};

// Force dynamic rendering - dashboard requires auth
export const dynamic = "force-dynamic";

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
  const isSuperAdmin = userRole === "superadmin";

  // Get role badge styling and label
  const getRoleBadge = () => {
    if (isSuperAdmin) {
      return {
        className: "bg-gradient-to-r from-amber-900/40 to-yellow-900/40 text-amber-400 border border-amber-500/30",
        label: "Super Admin",
      };
    }
    if (isAdmin) {
      return {
        className: "bg-cyan-900/30 text-cyan-400",
        label: "Admin",
      };
    }
    return {
      className: "bg-violet-900/30 text-violet-400",
      label: "Moderator",
    };
  };

  const roleBadge = getRoleBadge();

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Site Header */}
      <Header />

      {/* Dashboard Sub-Header */}
      <div className="border-b border-gray-800 bg-gray-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-12 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
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
              </Link>
              <div className="h-4 w-px bg-gray-700" />
              <h1 className="text-sm font-semibold text-white">Admin Dashboard</h1>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 hidden sm:block">
                {session.user.name || session.user.email}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${roleBadge.className}`}
              >
                {roleBadge.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="flex-1">
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

      {/* Site Footer */}
      <Footer />
    </div>
  );
}
