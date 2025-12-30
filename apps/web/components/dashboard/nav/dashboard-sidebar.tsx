"use client";

/**
 * Dashboard Sidebar
 *
 * Main navigation sidebar for the admin dashboard.
 * Uses NavGroup and NavItem with collapsible sections and real-time badges.
 *
 * Structure follows Vercel/Stripe dashboard patterns:
 * - Overview (always visible)
 * - Content (8 pages)
 * - Moderation (6 pages)
 * - Analytics (3 pages)
 * - Security (6 pages)
 * - Admin (5 pages)
 * - Settings (5 Payload globals)
 */

import { NavProvider } from "./nav-context";
import { NavGroup } from "./nav-group";
import { NavItem } from "./nav-item";
import { useNavCounts } from "@/hooks/use-nav-counts";
import { cn } from "@/lib/design-system";
import Link from "next/link";

// ============================================
// ICONS
// ============================================

// Dashboard/Overview
function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  );
}

// Content
function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

// Moderation
function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

// Analytics
function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

// Security
function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

// Admin
function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

// Settings
function CogIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

// ============================================
// SIDEBAR CONTENT
// ============================================

function SidebarContent() {
  // Get real-time badge counts
  const { counts } = useNavCounts();

  // Calculate group totals
  const contentTotal = (counts.autoUpdates || 0);
  const moderationTotal =
    (counts.betaApplications || 0) +
    (counts.feedback || 0) +
    (counts.suggestions || 0) +
    (counts.comments || 0) +
    (counts.reports || 0);
  const adminTotal = (counts.notifications || 0);

  return (
    <nav className="flex-1 overflow-y-auto py-4 px-2">
      {/* Overview - Always Visible */}
      <div className="mb-4">
        <NavItem
          href="/dashboard"
          label="Dashboard"
          icon={<DashboardIcon className="w-5 h-5" />}
          exact
        />
      </div>

      <div className="ui-nav-divider" />

      {/* Content Group */}
      <NavGroup
        id="content"
        label="Content"
        icon={<DocumentIcon className="w-4 h-4" />}
        badge={contentTotal}
      >
        <NavItem href="/dashboard/documentation" label="Documentation" />
        <NavItem href="/dashboard/doc-versions" label="Doc Versions" />
        <NavItem href="/dashboard/resources-admin" label="Resources" />
        <NavItem href="/dashboard/prompts" label="Prompts" />
        <NavItem href="/dashboard/relationships" label="Relationships" />
        <NavItem href="/dashboard/discovery" label="Discovery" />
        <NavItem
          href="/dashboard/auto-updates"
          label="Auto-Updates"
          badge={counts.autoUpdates}
        />
        <NavItem href="/dashboard/seo" label="SEO" />
      </NavGroup>

      {/* Moderation Group */}
      <NavGroup
        id="moderation"
        label="Moderation"
        icon={<ShieldIcon className="w-4 h-4" />}
        badge={moderationTotal}
        badgeUrgent={moderationTotal > 5}
      >
        <NavItem
          href="/dashboard/beta"
          label="Beta Applications"
          badge={counts.betaApplications}
          badgeUrgent
        />
        <NavItem href="/dashboard/beta-testers" label="Beta Testers" />
        <NavItem
          href="/dashboard/feedback"
          label="Feedback"
          badge={counts.feedback}
        />
        <NavItem
          href="/dashboard/suggestions"
          label="Edit Suggestions"
          badge={counts.suggestions}
        />
        <NavItem
          href="/dashboard/comments"
          label="Comments"
          badge={counts.comments}
        />
        <NavItem
          href="/dashboard/reports"
          label="Reports"
          badge={counts.reports}
          badgeUrgent
        />
      </NavGroup>

      {/* Analytics Group */}
      <NavGroup
        id="analytics"
        label="Analytics"
        icon={<ChartIcon className="w-4 h-4" />}
      >
        <NavItem href="/dashboard/faq-analytics" label="FAQ Analytics" />
        <NavItem href="/dashboard/search-analytics" label="Search Analytics" />
        <NavItem href="/dashboard/diagnostics" label="Diagnostics" />
      </NavGroup>

      {/* Security Group */}
      <NavGroup
        id="security"
        label="Security"
        icon={<LockIcon className="w-4 h-4" />}
      >
        <NavItem href="/dashboard/security" label="Overview" />
        <NavItem href="/dashboard/security/bots" label="Bot Analytics" />
        <NavItem href="/dashboard/security/logs" label="Logs" />
        <NavItem href="/dashboard/security/visitors" label="Visitors" />
        <NavItem href="/dashboard/security/honeypots" label="Honeypots" />
        <NavItem href="/dashboard/security/settings" label="Settings" />
      </NavGroup>

      {/* Admin Group */}
      <NavGroup
        id="admin"
        label="Admin"
        icon={<UsersIcon className="w-4 h-4" />}
        badge={adminTotal}
      >
        <NavItem href="/dashboard/users" label="Users" />
        <NavItem href="/dashboard/banned-users" label="Banned Users" />
        <NavItem
          href="/dashboard/notifications"
          label="Notifications"
          badge={counts.notifications}
        />
        <NavItem href="/dashboard/donations" label="Donations" />
        <NavItem href="/dashboard/exports" label="Exports" />
      </NavGroup>

      {/* Settings Group - Links to Payload Globals */}
      <NavGroup
        id="settings"
        label="Settings"
        icon={<CogIcon className="w-4 h-4" />}
      >
        <NavItem
          href="/admin/globals/site-settings"
          label="Site Settings"
          external
        />
        <NavItem
          href="/admin/globals/seo-settings"
          label="SEO Settings"
          external
        />
        <NavItem
          href="/admin/globals/cross-link-settings"
          label="Cross-Link Settings"
          external
        />
        <NavItem
          href="/admin/globals/gamification-settings"
          label="Gamification"
          external
        />
        <NavItem
          href="/admin/globals/ai-pipeline-settings"
          label="AI Pipeline"
          external
        />
      </NavGroup>
    </nav>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

interface DashboardSidebarProps {
  className?: string;
}

export function DashboardSidebar({ className }: DashboardSidebarProps) {
  return (
    <NavProvider>
      <aside
        className={cn(
          "flex flex-col w-64 h-full",
          "bg-white dark:bg-[#0a0a0a]",
          "border-r border-gray-200 dark:border-[#262626]",
          className,
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b ui-border">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">Ci</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
              Dashboard
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <SidebarContent />

        {/* Footer */}
        <div className="px-4 py-3 border-t ui-border">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Press{" "}
            <kbd className="ui-cmd-key">⌘</kbd>
            <kbd className="ui-cmd-key">K</kbd>{" "}
            to search
          </p>
        </div>
      </aside>
    </NavProvider>
  );
}
