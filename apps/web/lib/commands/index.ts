/**
 * Command Registry
 *
 * Central registry for all command palette commands.
 * Commands are grouped by category and filtered by user role.
 */

import type { Command, CommandGroup, UserRole } from "./types";
import {
  dashboardNavigationCommands,
  siteNavigationCommands,
  settingsNavigationCommands,
} from "./navigation-commands";
import { actionCommands } from "./action-commands";

// Re-export types
export * from "./types";

// ============================================
// ROLE HIERARCHY
// ============================================

const roleHierarchy: Record<UserRole, number> = {
  user: 0,
  editor: 1,
  moderator: 2,
  admin: 3,
  superadmin: 4,
};

/**
 * Check if a user role meets the minimum role requirement
 */
export function hasMinRole(userRole: UserRole, minRole: UserRole): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[minRole];
}

// ============================================
// ALL COMMANDS
// ============================================

const allCommands: Command[] = [
  ...siteNavigationCommands,
  ...dashboardNavigationCommands,
  ...settingsNavigationCommands,
  ...actionCommands,
];

// ============================================
// FILTERED COMMANDS
// ============================================

/**
 * Get commands filtered by user role
 */
export function getCommandsForRole(userRole: UserRole): Command[] {
  return allCommands.filter((command) => {
    if (command.hidden) return false;
    if (!command.minRole) return true;
    return hasMinRole(userRole, command.minRole);
  });
}

/**
 * Get commands grouped by category
 */
export function getGroupedCommands(userRole: UserRole): CommandGroup[] {
  const commands = getCommandsForRole(userRole);

  const groups: Record<string, Command[]> = {
    navigation: [],
    action: [],
    settings: [],
    recent: [],
  };

  commands.forEach((command) => {
    const category = command.category;
    if (category in groups) {
      groups[category]!.push(command);
    }
  });

  return [
    { id: "navigation", label: "Navigation", commands: groups.navigation ?? [] },
    { id: "action", label: "Actions", commands: groups.action ?? [] },
    { id: "settings", label: "Settings", commands: groups.settings ?? [] },
  ].filter((group) => group.commands.length > 0);
}

/**
 * Find a command by its ID
 */
export function getCommandById(id: string): Command | undefined {
  return allCommands.find((command) => command.id === id);
}

/**
 * Get all commands (for search indexing)
 */
export function getAllCommands(): Command[] {
  return allCommands;
}
