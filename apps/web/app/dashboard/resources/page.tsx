/**
 * Dashboard Overview Page
 *
 * Shows resource statistics, recent activity, and quick actions.
 */

import { getPayload } from "payload";
import config from "@payload-config";
import Link from "next/link";
import { cn } from "@/lib/design-system";

interface Stats {
  totalResources: number;
  pendingQueue: number;
  approvedToday: number;
  totalSources: number;
}

async function getStats(): Promise<Stats> {
  const payload = await getPayload({ config });

  const [resources, queue, sources] = await Promise.all([
    payload.count({ collection: "resources" }),
    payload.find({
      collection: "resource-discovery-queue",
      where: { status: { equals: "pending" } },
      limit: 0,
    }),
    payload.count({ collection: "resource-sources" }),
  ]);

  // Get today's approved resources
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const approvedToday = await payload.find({
    collection: "resource-discovery-queue",
    where: {
      status: { equals: "approved" },
      reviewedAt: { greater_than: today.toISOString() },
    },
    limit: 0,
  });

  return {
    totalResources: resources.totalDocs,
    pendingQueue: queue.totalDocs,
    approvedToday: approvedToday.totalDocs,
    totalSources: sources.totalDocs,
  };
}

async function getRecentQueue() {
  const payload = await getPayload({ config });

  const queue = await payload.find({
    collection: "resource-discovery-queue",
    where: { status: { equals: "pending" } },
    limit: 5,
    sort: "-createdAt",
  });

  return queue.docs;
}

export default async function DashboardOverviewPage() {
  const [stats, recentQueue] = await Promise.all([getStats(), getRecentQueue()]);

  return (
    <div className="space-y-8 lg:ml-64">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Resource Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage and discover resources for Claude Insider
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Resources"
          value={stats.totalResources}
          description="Published resources"
          icon={<ResourceIcon />}
          href="/admin/collections/resources"
        />
        <StatCard
          title="Pending Review"
          value={stats.pendingQueue}
          description="Awaiting approval"
          icon={<QueueIcon />}
          href="/dashboard/resources/queue"
          highlight={stats.pendingQueue > 0}
        />
        <StatCard
          title="Approved Today"
          value={stats.approvedToday}
          description="Resources approved"
          icon={<CheckIcon />}
        />
        <StatCard
          title="Discovery Sources"
          value={stats.totalSources}
          description="Configured sources"
          icon={<SourceIcon />}
          href="/dashboard/resources/sources"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <div
          className={cn(
            "rounded-xl border p-6",
            "border-gray-200 dark:border-[#262626]",
            "bg-white dark:bg-[#111111]"
          )}
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Quick Actions
          </h2>
          <div className="mt-4 grid gap-3">
            <QuickAction
              title="Discover from URL"
              description="Analyze a URL with Claude Opus 4.5"
              href="/dashboard/resources/discover"
              icon={<SearchIcon />}
            />
            <QuickAction
              title="Review Queue"
              description={`${stats.pendingQueue} items pending review`}
              href="/dashboard/resources/queue"
              icon={<QueueIcon />}
              highlight={stats.pendingQueue > 0}
            />
            <QuickAction
              title="Add Source"
              description="Configure a new discovery source"
              href="/dashboard/resources/sources"
              icon={<PlusIcon />}
            />
            <QuickAction
              title="Manage Resources"
              description="Edit resources in Payload CMS"
              href="/admin/collections/resources"
              icon={<EditIcon />}
              external
            />
          </div>
        </div>

        {/* Recent Queue Items */}
        <div
          className={cn(
            "rounded-xl border p-6",
            "border-gray-200 dark:border-[#262626]",
            "bg-white dark:bg-[#111111]"
          )}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Queue Items
            </h2>
            <Link
              href="/dashboard/resources/queue"
              className="text-sm text-blue-600 dark:text-cyan-400 hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {recentQueue.length > 0 ? (
              recentQueue.map((item) => (
                <QueueItem key={item.id} item={item} />
              ))
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No pending items in queue
                </p>
                <Link
                  href="/dashboard/resources/discover"
                  className={cn(
                    "mt-3 inline-flex items-center gap-2 rounded-lg px-4 py-2",
                    "text-sm font-medium text-white",
                    "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                    "hover:from-violet-500 hover:via-blue-500 hover:to-cyan-500",
                    "transition-all"
                  )}
                >
                  <SearchIcon className="h-4 w-4" />
                  Discover Resources
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Discovery Section */}
      <div
        className={cn(
          "rounded-xl border p-6",
          "border-gray-200 dark:border-[#262626]",
          "bg-gradient-to-r from-violet-500/5 via-blue-500/5 to-cyan-500/5"
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI-Powered Discovery
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Use Claude Opus 4.5 to analyze URLs, GitHub repos, npm packages, and more
            </p>
          </div>
          <Link
            href="/dashboard/resources/discover"
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-6 py-3",
              "text-sm font-medium text-white",
              "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
              "hover:from-violet-500 hover:via-blue-500 hover:to-cyan-500",
              "shadow-lg shadow-blue-500/25",
              "transition-all hover:-translate-y-0.5"
            )}
          >
            <SparkleIcon className="h-5 w-5" />
            Start Discovery
          </Link>
        </div>
      </div>
    </div>
  );
}

// Components

function StatCard({
  title,
  value,
  description,
  icon,
  href,
  highlight,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  href?: string;
  highlight?: boolean;
}) {
  const content = (
    <div
      className={cn(
        "rounded-xl border p-6 transition-all",
        "border-gray-200 dark:border-[#262626]",
        "bg-white dark:bg-[#111111]",
        href && "hover:border-blue-500/50 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer",
        highlight && "ring-2 ring-blue-500/50"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="text-gray-500 dark:text-gray-400">{icon}</div>
        {highlight && (
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
        {value.toLocaleString()}
      </p>
      <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

function QuickAction({
  title,
  description,
  href,
  icon,
  highlight,
  external,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  highlight?: boolean;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-4 rounded-lg p-3 transition-all",
        "hover:bg-gray-50 dark:hover:bg-[#1a1a1a]",
        highlight && "bg-blue-50 dark:bg-blue-900/20"
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          highlight
            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-cyan-400"
            : "bg-gray-100 dark:bg-[#262626] text-gray-600 dark:text-gray-400"
        )}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{description}</p>
      </div>
      {external ? (
        <ExternalIcon className="h-4 w-4 text-gray-400" />
      ) : (
        <ChevronIcon className="h-4 w-4 text-gray-400" />
      )}
    </Link>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function QueueItem({ item }: { item: any }) {
  const title = item.title as string;
  const url = item.url as string;
  const aiAnalysis = item.aiAnalysis as { confidenceScore?: number } | undefined;

  return (
    <Link
      href={`/dashboard/resources/queue?id=${item.id}`}
      className={cn(
        "flex items-center gap-3 rounded-lg p-3 transition-all",
        "hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold",
          aiAnalysis?.confidenceScore && aiAnalysis.confidenceScore >= 80
            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
            : aiAnalysis?.confidenceScore && aiAnalysis.confidenceScore >= 50
            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
            : "bg-gray-100 dark:bg-[#262626] text-gray-600 dark:text-gray-400"
        )}
      >
        {aiAnalysis?.confidenceScore || "?"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {title}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{url}</p>
      </div>
      <ChevronIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
    </Link>
  );
}

// Icons
function ResourceIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  );
}

function QueueIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("h-5 w-5", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function SourceIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("h-5 w-5", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("h-5 w-5", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("h-4 w-4", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function ExternalIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("h-4 w-4", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  );
}
