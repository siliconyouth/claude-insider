import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { cn } from "@/lib/design-system";
import { UserSearch } from "@/components/users/user-search";

export const metadata: Metadata = {
  title: "Search Users | Claude Insider",
  description: "Find and connect with other Claude Insider users",
};

export default async function SearchUsersPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/search/users");
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Search Users
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Find other users to follow and connect with
        </p>
      </div>

      {/* Search */}
      <div
        className={cn(
          "p-6 rounded-2xl",
          "bg-white dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]"
        )}
      >
        <UserSearch
          placeholder="Search by name or username..."
          showActions={true}
          className="w-full"
        />

        {/* Hint */}
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
          Type at least 2 characters to search
        </p>
      </div>

      {/* Quick Tips */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div
          className={cn(
            "p-4 rounded-xl",
            "bg-gray-50 dark:bg-[#0a0a0a]",
            "border border-gray-200 dark:border-[#262626]"
          )}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white">Follow Users</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Follow users to see their activity in your feed
          </p>
        </div>

        <div
          className={cn(
            "p-4 rounded-xl",
            "bg-gray-50 dark:bg-[#0a0a0a]",
            "border border-gray-200 dark:border-[#262626]"
          )}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-violet-600 dark:text-violet-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white">View Profiles</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Click on a user to see their public profile
          </p>
        </div>
      </div>
    </div>
  );
}
