/**
 * Payload CMS Access Control Utilities
 *
 * Role-based access control for Payload globals and collections.
 * Follows the hierarchy defined in lib/roles.ts:
 *
 * USER < EDITOR < MODERATOR < ADMIN < SUPERADMIN
 *
 * Each level includes all permissions of levels below it.
 */

import type { User } from '../payload-types';

// Role type from our system
export type UserRole = 'user' | 'editor' | 'moderator' | 'admin' | 'superadmin';

// Role hierarchy (higher number = more privileges)
const ROLE_LEVELS: Record<UserRole, number> = {
  user: 1,
  editor: 2,
  moderator: 3,
  admin: 4,
  superadmin: 5,
};

/**
 * Check if user has at least the specified role level
 */
export function hasMinRole(userRole: string | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false;
  const userLevel = ROLE_LEVELS[userRole as UserRole] ?? 0;
  const requiredLevel = ROLE_LEVELS[requiredRole] ?? 999;
  return userLevel >= requiredLevel;
}

/**
 * Check if user is exactly a specific role
 */
export function isRole(userRole: string | undefined, role: UserRole): boolean {
  return userRole === role;
}

/**
 * Check if user is superadmin
 */
export function isSuperAdmin(userRole: string | undefined): boolean {
  return userRole === 'superadmin';
}

/**
 * Check if user is admin or superadmin
 */
export function isAdmin(userRole: string | undefined): boolean {
  return hasMinRole(userRole, 'admin');
}

/**
 * Check if user is moderator or above
 */
export function isModerator(userRole: string | undefined): boolean {
  return hasMinRole(userRole, 'moderator');
}

/**
 * Check if user is editor or above
 */
export function isEditor(userRole: string | undefined): boolean {
  return hasMinRole(userRole, 'editor');
}

// ─────────────────────────────────────────────────────────────────────────────
// Payload Access Control Functions
// These return functions compatible with Payload's access control system
// ─────────────────────────────────────────────────────────────────────────────

type PayloadAccessArgs = {
  req: {
    user?: User | null;
  };
};

/**
 * Allow anyone (public read)
 */
export const publicRead = () => true;

/**
 * Allow only authenticated users
 */
export const authenticatedOnly = ({ req: { user } }: PayloadAccessArgs) => !!user;

/**
 * Allow editors and above
 */
export const editorAccess = ({ req: { user } }: PayloadAccessArgs) =>
  hasMinRole(user?.role, 'editor');

/**
 * Allow moderators and above
 */
export const moderatorAccess = ({ req: { user } }: PayloadAccessArgs) =>
  hasMinRole(user?.role, 'moderator');

/**
 * Allow admins and above
 */
export const adminAccess = ({ req: { user } }: PayloadAccessArgs) =>
  hasMinRole(user?.role, 'admin');

/**
 * Allow superadmin only
 */
export const superadminAccess = ({ req: { user } }: PayloadAccessArgs) =>
  isSuperAdmin(user?.role);

/**
 * Create a custom access function requiring minimum role
 */
export const requireRole = (minRole: UserRole) => {
  return ({ req: { user } }: PayloadAccessArgs) => hasMinRole(user?.role, minRole);
};

// ─────────────────────────────────────────────────────────────────────────────
// Field-Level Access Patterns
// For conditional read/write on specific fields within a global
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Read access for settings - allow moderators and above
 * Use for fields that moderators need to see but not edit
 */
export const settingsReadAccess = ({ req: { user } }: PayloadAccessArgs) =>
  hasMinRole(user?.role, 'moderator');

/**
 * Write access for settings - admin only
 */
export const settingsWriteAccess = ({ req: { user } }: PayloadAccessArgs) =>
  hasMinRole(user?.role, 'admin');

/**
 * Sensitive settings - superadmin only
 */
export const sensitiveSettingsAccess = ({ req: { user } }: PayloadAccessArgs) =>
  isSuperAdmin(user?.role);
