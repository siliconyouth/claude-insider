/**
 * Role Permission Simulator Section
 *
 * Interactive role permission matrix showing access levels for different user roles.
 */

import { cn } from "@/lib/design-system";
import { type UserRole } from "@/lib/roles";

interface User {
  role?: string;
}

interface RoleSimulatorSectionProps {
  simulatedRole: UserRole | "actual";
  setSimulatedRole: (role: UserRole | "actual") => void;
  user: User | null;
}

const ROLE_PERMISSIONS = [
  {
    role: "superadmin",
    label: "🔱 Super Admin",
    colorClass: "text-rose-400",
    bgSelected: "bg-rose-500/10 border-rose-500/50",
    badgeClass: "bg-rose-500/30 text-rose-300",
    permissions: [
      { text: "View private user data", allowed: true },
      { text: "See emails & names", allowed: true },
      { text: "Delete anything", allowed: true },
      { text: "Assign admin roles", allowed: true },
      { text: "All admin perms", allowed: true },
    ],
  },
  {
    role: "admin",
    label: "👑 Admin",
    colorClass: "text-cyan-400",
    bgSelected: "bg-cyan-500/10 border-cyan-500/50",
    badgeClass: "bg-cyan-500/30 text-cyan-300",
    permissions: [
      { text: "Manage all users", allowed: true },
      { text: "View private data", allowed: false },
      { text: "View diagnostics", allowed: true },
      { text: "Send notifications", allowed: true },
      { text: "All moderator perms", allowed: true },
    ],
  },
  {
    role: "moderator",
    label: "🛡️ Moderator",
    colorClass: "text-violet-400",
    bgSelected: "bg-violet-500/10 border-violet-500/50",
    badgeClass: "bg-violet-500/30 text-violet-300",
    permissions: [
      { text: "View dashboard stats", allowed: true },
      { text: "Manage feedback", allowed: true },
      { text: "Review beta apps", allowed: true },
      { text: "Moderate comments", allowed: true },
      { text: "All editor perms", allowed: true },
    ],
  },
  {
    role: "editor",
    label: "✏️ Editor",
    colorClass: "text-blue-400",
    bgSelected: "bg-blue-500/10 border-blue-500/50",
    badgeClass: "bg-blue-500/30 text-blue-300",
    permissions: [
      { text: "Edit suggestions", allowed: true },
      { text: "Manage FAQ", allowed: true },
      { text: "Add resources", allowed: true },
      { text: "No dashboard access", allowed: false },
      { text: "All user perms", allowed: true },
    ],
  },
  {
    role: "user",
    label: "👤 User",
    colorClass: "text-gray-400",
    bgSelected: "bg-gray-500/10 border-gray-500/50",
    badgeClass: "bg-gray-500/30 text-gray-300",
    permissions: [
      { text: "View docs & resources", allowed: true },
      { text: "Favorites & ratings", allowed: true },
      { text: "Submit feedback", allowed: true },
      { text: "Leave comments", allowed: true },
      { text: "Use AI assistant", allowed: true },
    ],
  },
];

const API_ENDPOINTS = [
  {
    endpoint: "/api/dashboard/stats",
    access: { user: false, editor: false, moderator: true, admin: true, superadmin: true },
  },
  {
    endpoint: "/api/dashboard/users",
    access: { user: false, editor: false, moderator: false, admin: true, superadmin: true },
    superadminExtra: "🔓",
  },
  {
    endpoint: "/api/dashboard/feedback",
    access: { user: false, editor: false, moderator: true, admin: true, superadmin: true },
  },
  {
    endpoint: "/api/notifications",
    access: { user: true, editor: true, moderator: true, admin: true, superadmin: true },
  },
  {
    endpoint: "/api/resources",
    access: { user: true, editor: true, moderator: true, admin: true, superadmin: true },
  },
  {
    endpoint: "/api/debug/link-check",
    access: { user: false, editor: false, moderator: false, admin: true, superadmin: true },
  },
];

export function RoleSimulatorSection({
  simulatedRole,
  setSimulatedRole,
  user,
}: RoleSimulatorSectionProps) {
  const isRoleSelected = (role: string) => {
    if (simulatedRole === "actual") {
      if (role === "user") return user?.role === "user" || !user?.role;
      return user?.role === role;
    }
    return simulatedRole === role;
  };

  return (
    <section className="rounded-xl border-2 border-violet-500/30 bg-gradient-to-r from-violet-900/10 via-blue-900/10 to-cyan-900/10 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>🎭</span>
            Role Permission Simulator
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            View what each role can access across the application
          </p>
        </div>
        <select
          value={simulatedRole}
          onChange={(e) =>
            setSimulatedRole(e.target.value as UserRole | "actual")
          }
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="actual">Current Role ({user?.role || "user"})</option>
          <option value="superadmin">Super Admin (Ultimate Access)</option>
          <option value="admin">Admin (Full Access)</option>
          <option value="moderator">Moderator</option>
          <option value="editor">Editor</option>
          <option value="user">User (Basic)</option>
        </select>
      </div>

      {/* Permission Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {ROLE_PERMISSIONS.map(
          ({ role, label, colorClass, bgSelected, badgeClass, permissions }) => (
            <div
              key={role}
              className={cn(
                "p-4 rounded-lg border",
                isRoleSelected(role)
                  ? bgSelected
                  : "bg-gray-800/30 border-gray-700"
              )}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={cn("font-bold text-sm", colorClass)}>
                  {label}
                </span>
                {isRoleSelected(role) && (
                  <span className={cn("px-2 py-0.5 text-xs rounded", badgeClass)}>
                    Selected
                  </span>
                )}
              </div>
              <ul className="space-y-1.5 text-xs">
                {permissions.map((perm, i) => (
                  <li
                    key={i}
                    className={cn(
                      "flex items-center gap-2",
                      perm.allowed ? "text-emerald-400" : "text-gray-500"
                    )}
                  >
                    <span>{perm.allowed ? "✓" : "✗"}</span> {perm.text}
                  </li>
                ))}
              </ul>
            </div>
          )
        )}
      </div>

      {/* API Access Table */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-300 mb-3">
          API Endpoint Access by Role
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-2 px-3 text-gray-400 font-medium">
                  Endpoint
                </th>
                <th className="text-center py-2 px-3 text-gray-400 font-medium">
                  User
                </th>
                <th className="text-center py-2 px-3 text-gray-400 font-medium">
                  Editor
                </th>
                <th className="text-center py-2 px-3 text-gray-400 font-medium">
                  Mod
                </th>
                <th className="text-center py-2 px-3 text-gray-400 font-medium">
                  Admin
                </th>
                <th className="text-center py-2 px-3 text-rose-400 font-medium">
                  S.Admin
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {API_ENDPOINTS.map(({ endpoint, access, superadminExtra }) => (
                <tr key={endpoint}>
                  <td className="py-2 px-3 text-gray-300 font-mono">
                    {endpoint}
                  </td>
                  <td
                    className={cn(
                      "text-center",
                      access.user ? "text-emerald-400" : "text-red-400"
                    )}
                  >
                    {access.user ? "✓" : "✗"}
                  </td>
                  <td
                    className={cn(
                      "text-center",
                      access.editor ? "text-emerald-400" : "text-red-400"
                    )}
                  >
                    {access.editor ? "✓" : "✗"}
                  </td>
                  <td
                    className={cn(
                      "text-center",
                      access.moderator ? "text-emerald-400" : "text-red-400"
                    )}
                  >
                    {access.moderator ? "✓" : "✗"}
                  </td>
                  <td
                    className={cn(
                      "text-center",
                      access.admin ? "text-emerald-400" : "text-red-400"
                    )}
                  >
                    {access.admin ? "✓" : "✗"}
                  </td>
                  <td className="text-center text-emerald-400">
                    ✓ {superadminExtra || ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-gray-500">
            🔓 = can view unmasked private data (emails, names)
          </p>
        </div>
      </div>
    </section>
  );
}
