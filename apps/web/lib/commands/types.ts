/**
 * Command Palette Types
 *
 * Type definitions for the command system.
 */

import type { ReactNode } from "react";

// ============================================
// MODIFIER KEYS
// ============================================

export type ModifierKey = "meta" | "ctrl" | "alt" | "shift";

export interface Shortcut {
  key: string;
  modifiers?: ModifierKey[];
}

// ============================================
// COMMAND CATEGORIES
// ============================================

export type CommandCategory =
  | "navigation"
  | "action"
  | "settings"
  | "recent";

// ============================================
// USER ROLES
// ============================================

export type UserRole =
  | "user"
  | "editor"
  | "moderator"
  | "admin"
  | "superadmin";

// ============================================
// COMMAND CONTEXT
// ============================================

export interface CommandContext {
  /** Current user role */
  userRole: UserRole;
  /** Current pathname */
  pathname: string;
  /** Close the command palette */
  close: () => void;
  /** Router for navigation */
  navigate: (href: string) => void;
}

// ============================================
// COMMAND DEFINITION
// ============================================

export interface Command {
  /** Unique command identifier */
  id: string;
  /** Display label */
  label: string;
  /** Optional description */
  description?: string;
  /** Command category for grouping */
  category: CommandCategory;
  /** Icon component or element */
  icon?: ReactNode;
  /** Keyboard shortcut */
  shortcut?: Shortcut;
  /** Additional search keywords */
  keywords?: string[];
  /** Action to execute */
  action: (context: CommandContext) => void | Promise<void>;
  /** Minimum role required to see/use this command */
  minRole?: UserRole;
  /** Hide from search results (for programmatic use only) */
  hidden?: boolean;
}

// ============================================
// COMMAND GROUP
// ============================================

export interface CommandGroup {
  id: string;
  label: string;
  commands: Command[];
}
