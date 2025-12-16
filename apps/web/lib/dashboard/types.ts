/**
 * Dashboard Shared Types
 *
 * Common TypeScript types used across dashboard pages.
 */

// =============================================================================
// PAGINATION TYPES
// =============================================================================

export interface PaginationState {
  page: number;
  totalPages: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

// =============================================================================
// FILTER TYPES
// =============================================================================

export interface FilterOption<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

export interface FilterConfig<T extends string = string> {
  key: string;
  options: FilterOption<T>[];
  defaultValue: T;
  label?: string;
}

// =============================================================================
// TABLE COLUMN TYPES
// =============================================================================

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  align?: "left" | "center" | "right";
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

// =============================================================================
// STATUS TYPES
// =============================================================================

export interface StatusStyle {
  bg: string;
  text: string;
  label: string;
  border?: string;
}

export type StatusConfig<T extends string = string> = Record<T, StatusStyle>;

// =============================================================================
// ACTION TYPES
// =============================================================================

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ActionConfig {
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  endpoint: string;
  body?: Record<string, unknown>;
  successMessage?: string;
  errorMessage?: string;
}

// =============================================================================
// MODAL TYPES
// =============================================================================

export interface ModalAction {
  label: string;
  variant: "primary" | "secondary" | "danger" | "ghost";
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
}

// =============================================================================
// COMMON ENTITY TYPES
// =============================================================================

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserInfo {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  username: string | null;
}

// =============================================================================
// HOOK OPTIONS
// =============================================================================

export interface UsePaginatedListOptions {
  limit?: number;
  initialFilters?: Record<string, string>;
  debounceMs?: number;
  enabled?: boolean;
}

export interface UseDashboardActionOptions {
  onSuccess?: () => void | Promise<void>;
  onError?: (error: string) => void;
  successMessage?: string;
  errorMessage?: string;
}
