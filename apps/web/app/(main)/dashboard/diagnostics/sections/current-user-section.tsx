/**
 * Current User Section
 *
 * Displays information about the currently authenticated user.
 */

import { cn } from "@/lib/design-system";

interface User {
  id?: string;
  name?: string | null;
  email?: string;
  role?: string;
}

interface CurrentUserSectionProps {
  authLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
}

export function CurrentUserSection({
  authLoading,
  isAuthenticated,
  user,
}: CurrentUserSectionProps) {
  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Current User</h3>
      {authLoading ? (
        <div className="animate-pulse h-20 bg-gray-800 rounded-lg" />
      ) : isAuthenticated && user ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-gray-500 uppercase">Name</label>
            <p className="text-white">{user.name || "—"}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase">Email</label>
            <p className="text-white">{user.email}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase">Role</label>
            <p
              className={cn(
                "font-semibold",
                user.role === "admin"
                  ? "text-red-400"
                  : user.role === "moderator"
                    ? "text-violet-400"
                    : user.role === "editor"
                      ? "text-blue-400"
                      : "text-gray-400"
              )}
            >
              {user.role || "user"}
            </p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase">User ID</label>
            <p className="text-white font-mono text-sm">
              {user.id?.substring(0, 12)}...
            </p>
          </div>
        </div>
      ) : (
        <p className="text-yellow-400">Not authenticated</p>
      )}
    </section>
  );
}
