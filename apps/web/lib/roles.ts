/**
 * Role-Based Access Control (RBAC) System
 *
 * Defines user roles, their hierarchy, and permissions.
 * Roles follow a hierarchical model where higher roles inherit permissions.
 */

/**
 * Available user roles in ascending order of privileges
 */
export const ROLES = {
  USER: "user",
  EDITOR: "editor",
  MODERATOR: "moderator",
  ADMIN: "admin",
  SUPERADMIN: "superadmin",
  AI_ASSISTANT: "ai_assistant",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

// Special system user ID for the AI assistant
export const AI_ASSISTANT_USER_ID = "ai-assistant-claudeinsider";

/**
 * Role hierarchy (index determines privilege level)
 * Higher index = more privileges
 */
export const ROLE_HIERARCHY: UserRole[] = [
  ROLES.USER,
  ROLES.EDITOR,
  ROLES.MODERATOR,
  ROLES.ADMIN,
  ROLES.SUPERADMIN,
];

/**
 * Role metadata for display purposes
 */
export const ROLE_INFO: Record<
  UserRole,
  {
    label: string;
    description: string;
    color: string;
    bgColor: string;
  }
> = {
  [ROLES.USER]: {
    label: "User",
    description: "Standard user with basic access",
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-800",
  },
  [ROLES.EDITOR]: {
    label: "Editor",
    description: "Can review and approve content edits",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  [ROLES.MODERATOR]: {
    label: "Moderator",
    description: "Can manage users and review applications",
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-100 dark:bg-violet-900/30",
  },
  [ROLES.ADMIN]: {
    label: "Admin",
    description: "Full administrative access",
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-100 dark:bg-cyan-900/30",
  },
  [ROLES.SUPERADMIN]: {
    label: "Super Admin",
    description: "Ultimate access with private data visibility and delete powers",
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-100 dark:bg-rose-900/30",
  },
  [ROLES.AI_ASSISTANT]: {
    label: "AI Assistant",
    description: "System AI assistant that responds to @mentions",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
  },
};

/**
 * Actions that can be performed in the system
 */
export const ACTIONS = {
  // Content
  VIEW_CONTENT: "view_content",
  SUGGEST_EDITS: "suggest_edits",
  REVIEW_EDITS: "review_edits",
  APPROVE_EDITS: "approve_edits",

  // Comments
  CREATE_COMMENT: "create_comment",
  EDIT_OWN_COMMENT: "edit_own_comment",
  DELETE_OWN_COMMENT: "delete_own_comment",
  MODERATE_COMMENTS: "moderate_comments",

  // Favorites & Collections
  MANAGE_FAVORITES: "manage_favorites",
  MANAGE_COLLECTIONS: "manage_collections",

  // Feedback
  SUBMIT_FEEDBACK: "submit_feedback",
  VIEW_ALL_FEEDBACK: "view_all_feedback",
  MANAGE_FEEDBACK: "manage_feedback",

  // Beta Program
  APPLY_BETA: "apply_beta",
  REVIEW_BETA_APPS: "review_beta_apps",

  // User Management
  VIEW_USERS: "view_users",
  MANAGE_USERS: "manage_users",
  CHANGE_ROLES: "change_roles",
  BAN_USERS: "ban_users",

  // Admin
  VIEW_ADMIN_DASHBOARD: "view_admin_dashboard",
  VIEW_ADMIN_LOGS: "view_admin_logs",

  // Super Admin exclusive
  VIEW_PRIVATE_USER_DATA: "view_private_user_data",
  DELETE_ANYTHING: "delete_anything",
  MANAGE_SUPERADMINS: "manage_superadmins",
} as const;

export type Action = (typeof ACTIONS)[keyof typeof ACTIONS];

/**
 * Permissions matrix defining which roles can perform which actions
 * true = always allowed
 * false = never allowed
 * 'beta' = only for beta testers
 * 'own' = only for own resources
 */
type PermissionValue = boolean | "beta" | "own";

export const PERMISSIONS: Record<UserRole, Record<Action, PermissionValue>> = {
  [ROLES.USER]: {
    [ACTIONS.VIEW_CONTENT]: true,
    [ACTIONS.SUGGEST_EDITS]: true,
    [ACTIONS.REVIEW_EDITS]: false,
    [ACTIONS.APPROVE_EDITS]: false,
    [ACTIONS.CREATE_COMMENT]: true,
    [ACTIONS.EDIT_OWN_COMMENT]: true,
    [ACTIONS.DELETE_OWN_COMMENT]: true,
    [ACTIONS.MODERATE_COMMENTS]: false,
    [ACTIONS.MANAGE_FAVORITES]: true,
    [ACTIONS.MANAGE_COLLECTIONS]: true,
    [ACTIONS.SUBMIT_FEEDBACK]: "beta",
    [ACTIONS.VIEW_ALL_FEEDBACK]: false,
    [ACTIONS.MANAGE_FEEDBACK]: false,
    [ACTIONS.APPLY_BETA]: true,
    [ACTIONS.REVIEW_BETA_APPS]: false,
    [ACTIONS.VIEW_USERS]: false,
    [ACTIONS.MANAGE_USERS]: false,
    [ACTIONS.CHANGE_ROLES]: false,
    [ACTIONS.BAN_USERS]: false,
    [ACTIONS.VIEW_ADMIN_DASHBOARD]: false,
    [ACTIONS.VIEW_ADMIN_LOGS]: false,
    [ACTIONS.VIEW_PRIVATE_USER_DATA]: false,
    [ACTIONS.DELETE_ANYTHING]: false,
    [ACTIONS.MANAGE_SUPERADMINS]: false,
  },
  [ROLES.EDITOR]: {
    [ACTIONS.VIEW_CONTENT]: true,
    [ACTIONS.SUGGEST_EDITS]: true,
    [ACTIONS.REVIEW_EDITS]: true,
    [ACTIONS.APPROVE_EDITS]: true,
    [ACTIONS.CREATE_COMMENT]: true,
    [ACTIONS.EDIT_OWN_COMMENT]: true,
    [ACTIONS.DELETE_OWN_COMMENT]: true,
    [ACTIONS.MODERATE_COMMENTS]: "own",
    [ACTIONS.MANAGE_FAVORITES]: true,
    [ACTIONS.MANAGE_COLLECTIONS]: true,
    [ACTIONS.SUBMIT_FEEDBACK]: true,
    [ACTIONS.VIEW_ALL_FEEDBACK]: false,
    [ACTIONS.MANAGE_FEEDBACK]: false,
    [ACTIONS.APPLY_BETA]: true,
    [ACTIONS.REVIEW_BETA_APPS]: false,
    [ACTIONS.VIEW_USERS]: false,
    [ACTIONS.MANAGE_USERS]: false,
    [ACTIONS.CHANGE_ROLES]: false,
    [ACTIONS.BAN_USERS]: false,
    [ACTIONS.VIEW_ADMIN_DASHBOARD]: false,
    [ACTIONS.VIEW_ADMIN_LOGS]: false,
    [ACTIONS.VIEW_PRIVATE_USER_DATA]: false,
    [ACTIONS.DELETE_ANYTHING]: false,
    [ACTIONS.MANAGE_SUPERADMINS]: false,
  },
  [ROLES.MODERATOR]: {
    [ACTIONS.VIEW_CONTENT]: true,
    [ACTIONS.SUGGEST_EDITS]: true,
    [ACTIONS.REVIEW_EDITS]: true,
    [ACTIONS.APPROVE_EDITS]: true,
    [ACTIONS.CREATE_COMMENT]: true,
    [ACTIONS.EDIT_OWN_COMMENT]: true,
    [ACTIONS.DELETE_OWN_COMMENT]: true,
    [ACTIONS.MODERATE_COMMENTS]: true,
    [ACTIONS.MANAGE_FAVORITES]: true,
    [ACTIONS.MANAGE_COLLECTIONS]: true,
    [ACTIONS.SUBMIT_FEEDBACK]: true,
    [ACTIONS.VIEW_ALL_FEEDBACK]: true,
    [ACTIONS.MANAGE_FEEDBACK]: true,
    [ACTIONS.APPLY_BETA]: true,
    [ACTIONS.REVIEW_BETA_APPS]: true,
    [ACTIONS.VIEW_USERS]: true,
    [ACTIONS.MANAGE_USERS]: false,
    [ACTIONS.CHANGE_ROLES]: false,
    [ACTIONS.BAN_USERS]: true,
    [ACTIONS.VIEW_ADMIN_DASHBOARD]: true,
    [ACTIONS.VIEW_ADMIN_LOGS]: true,
    [ACTIONS.VIEW_PRIVATE_USER_DATA]: false,
    [ACTIONS.DELETE_ANYTHING]: false,
    [ACTIONS.MANAGE_SUPERADMINS]: false,
  },
  [ROLES.ADMIN]: {
    [ACTIONS.VIEW_CONTENT]: true,
    [ACTIONS.SUGGEST_EDITS]: true,
    [ACTIONS.REVIEW_EDITS]: true,
    [ACTIONS.APPROVE_EDITS]: true,
    [ACTIONS.CREATE_COMMENT]: true,
    [ACTIONS.EDIT_OWN_COMMENT]: true,
    [ACTIONS.DELETE_OWN_COMMENT]: true,
    [ACTIONS.MODERATE_COMMENTS]: true,
    [ACTIONS.MANAGE_FAVORITES]: true,
    [ACTIONS.MANAGE_COLLECTIONS]: true,
    [ACTIONS.SUBMIT_FEEDBACK]: true,
    [ACTIONS.VIEW_ALL_FEEDBACK]: true,
    [ACTIONS.MANAGE_FEEDBACK]: true,
    [ACTIONS.APPLY_BETA]: true,
    [ACTIONS.REVIEW_BETA_APPS]: true,
    [ACTIONS.VIEW_USERS]: true,
    [ACTIONS.MANAGE_USERS]: true,
    [ACTIONS.CHANGE_ROLES]: true,
    [ACTIONS.BAN_USERS]: true,
    [ACTIONS.VIEW_ADMIN_DASHBOARD]: true,
    [ACTIONS.VIEW_ADMIN_LOGS]: true,
    [ACTIONS.VIEW_PRIVATE_USER_DATA]: false, // Super Admin only
    [ACTIONS.DELETE_ANYTHING]: false, // Super Admin only
    [ACTIONS.MANAGE_SUPERADMINS]: false, // Super Admin only
  },
  [ROLES.SUPERADMIN]: {
    [ACTIONS.VIEW_CONTENT]: true,
    [ACTIONS.SUGGEST_EDITS]: true,
    [ACTIONS.REVIEW_EDITS]: true,
    [ACTIONS.APPROVE_EDITS]: true,
    [ACTIONS.CREATE_COMMENT]: true,
    [ACTIONS.EDIT_OWN_COMMENT]: true,
    [ACTIONS.DELETE_OWN_COMMENT]: true,
    [ACTIONS.MODERATE_COMMENTS]: true,
    [ACTIONS.MANAGE_FAVORITES]: true,
    [ACTIONS.MANAGE_COLLECTIONS]: true,
    [ACTIONS.SUBMIT_FEEDBACK]: true,
    [ACTIONS.VIEW_ALL_FEEDBACK]: true,
    [ACTIONS.MANAGE_FEEDBACK]: true,
    [ACTIONS.APPLY_BETA]: true,
    [ACTIONS.REVIEW_BETA_APPS]: true,
    [ACTIONS.VIEW_USERS]: true,
    [ACTIONS.MANAGE_USERS]: true,
    [ACTIONS.CHANGE_ROLES]: true,
    [ACTIONS.BAN_USERS]: true,
    [ACTIONS.VIEW_ADMIN_DASHBOARD]: true,
    [ACTIONS.VIEW_ADMIN_LOGS]: true,
    [ACTIONS.VIEW_PRIVATE_USER_DATA]: true, // Can view emails, personal data
    [ACTIONS.DELETE_ANYTHING]: true, // Can delete any content
    [ACTIONS.MANAGE_SUPERADMINS]: true, // Can assign superadmin role
  },
  // AI Assistant has minimal permissions - only for system messaging
  [ROLES.AI_ASSISTANT]: {
    [ACTIONS.VIEW_CONTENT]: true,
    [ACTIONS.SUGGEST_EDITS]: false,
    [ACTIONS.REVIEW_EDITS]: false,
    [ACTIONS.APPROVE_EDITS]: false,
    [ACTIONS.CREATE_COMMENT]: false,
    [ACTIONS.EDIT_OWN_COMMENT]: false,
    [ACTIONS.DELETE_OWN_COMMENT]: false,
    [ACTIONS.MODERATE_COMMENTS]: false,
    [ACTIONS.MANAGE_FAVORITES]: false,
    [ACTIONS.MANAGE_COLLECTIONS]: false,
    [ACTIONS.SUBMIT_FEEDBACK]: false,
    [ACTIONS.VIEW_ALL_FEEDBACK]: false,
    [ACTIONS.MANAGE_FEEDBACK]: false,
    [ACTIONS.APPLY_BETA]: false,
    [ACTIONS.REVIEW_BETA_APPS]: false,
    [ACTIONS.VIEW_USERS]: false,
    [ACTIONS.MANAGE_USERS]: false,
    [ACTIONS.CHANGE_ROLES]: false,
    [ACTIONS.BAN_USERS]: false,
    [ACTIONS.VIEW_ADMIN_DASHBOARD]: false,
    [ACTIONS.VIEW_ADMIN_LOGS]: false,
    [ACTIONS.VIEW_PRIVATE_USER_DATA]: false,
    [ACTIONS.DELETE_ANYTHING]: false,
    [ACTIONS.MANAGE_SUPERADMINS]: false,
  },
};

/**
 * Get the privilege level of a role (higher = more privileges)
 */
export function getRoleLevel(role: UserRole): number {
  return ROLE_HIERARCHY.indexOf(role);
}

/**
 * Check if a role has at least the specified minimum role level
 */
export function hasMinRole(userRole: UserRole | undefined, minRole: UserRole): boolean {
  if (!userRole) return false;
  return getRoleLevel(userRole) >= getRoleLevel(minRole);
}

/**
 * Check if a user can perform a specific action
 */
export function canPerformAction(
  userRole: UserRole | undefined,
  action: Action,
  context?: {
    isBetaTester?: boolean;
    isOwnResource?: boolean;
  }
): boolean {
  if (!userRole) return false;

  const permission = PERMISSIONS[userRole][action];

  if (typeof permission === "boolean") {
    return permission;
  }

  if (permission === "beta") {
    return context?.isBetaTester ?? false;
  }

  if (permission === "own") {
    return context?.isOwnResource ?? false;
  }

  return false;
}

/**
 * Get all roles a user with the given role can assign to others
 * Users can only assign roles lower than their own
 */
export function getAssignableRoles(userRole: UserRole): UserRole[] {
  if (!hasMinRole(userRole, ROLES.ADMIN)) {
    return [];
  }

  const userLevel = getRoleLevel(userRole);
  return ROLE_HIERARCHY.filter((_, index) => index < userLevel);
}

/**
 * Check if role A can manage role B (A must be higher than B)
 */
export function canManageRole(managerRole: UserRole, targetRole: UserRole): boolean {
  return getRoleLevel(managerRole) > getRoleLevel(targetRole);
}

/**
 * Type guard to check if a string is a valid role
 */
export function isValidRole(role: string): role is UserRole {
  return Object.values(ROLES).includes(role as UserRole);
}

/**
 * Get role info with fallback for invalid roles
 */
export function getRoleInfo(role: UserRole | string) {
  if (isValidRole(role)) {
    return ROLE_INFO[role];
  }
  return ROLE_INFO[ROLES.USER];
}

/**
 * Check if a user is a Super Admin
 * Super Admins have ultimate access including:
 * - Viewing private user data (emails, personal info)
 * - Deleting any content in the system
 * - Managing other Super Admins
 */
export function isSuperAdmin(role: UserRole | undefined): boolean {
  return role === ROLES.SUPERADMIN;
}

/**
 * Check if a user can view private user data
 * Only Super Admins can view emails and personal information
 */
export function canViewPrivateData(role: UserRole | undefined): boolean {
  return canPerformAction(role, ACTIONS.VIEW_PRIVATE_USER_DATA);
}

/**
 * Check if a user can delete anything
 * Only Super Admins can delete any content without restrictions
 */
export function canDeleteAnything(role: UserRole | undefined): boolean {
  return canPerformAction(role, ACTIONS.DELETE_ANYTHING);
}
