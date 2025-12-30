"use client";

/**
 * Dashboard Providers
 *
 * Client component that wraps dashboard with required providers.
 * This bridges the Server Component layout with Client Component providers.
 */

import type { ReactNode } from "react";
import { QueryProvider } from "@/components/providers/query-provider";
import {
  CommandPaletteProvider,
  CommandPaletteModal,
} from "@/components/command-palette";
import type { UserRole } from "@/lib/roles";
import type { UserRole as CommandUserRole } from "@/lib/commands";

interface DashboardProvidersProps {
  children: ReactNode;
  userRole: UserRole;
}

// Map the full UserRole to the command palette's subset
function toCommandRole(role: UserRole): CommandUserRole {
  if (role === "ai_assistant") return "user";
  return role as CommandUserRole;
}

export function DashboardProviders({
  children,
  userRole,
}: DashboardProvidersProps) {
  return (
    <QueryProvider>
      <CommandPaletteProvider>
        {children}
        <CommandPaletteModal userRole={toCommandRole(userRole)} />
      </CommandPaletteProvider>
    </QueryProvider>
  );
}
