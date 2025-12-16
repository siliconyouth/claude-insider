/**
 * useDashboardAction Hook
 *
 * Generic hook for performing dashboard actions (PATCH, DELETE, POST)
 * with loading state and toast notifications.
 */

"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/components/toast";
import type { UseDashboardActionOptions, ActionResult } from "./types";

interface UseDashboardActionReturn<T = unknown> {
  execute: (
    endpoint: string,
    method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
    body?: Record<string, unknown>
  ) => Promise<ActionResult<T>>;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

/**
 * Hook for executing dashboard API actions
 */
export function useDashboardAction<T = unknown>(
  options: UseDashboardActionOptions = {}
): UseDashboardActionReturn<T> {
  const {
    onSuccess,
    onError,
    successMessage,
    errorMessage = "Action failed",
  } = options;

  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (
      endpoint: string,
      method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
      body?: Record<string, unknown>
    ): Promise<ActionResult<T>> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/dashboard/${endpoint}`, {
          method,
          headers: body ? { "Content-Type": "application/json" } : undefined,
          body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.error || errorMessage;
          throw new Error(errorMsg);
        }

        const data = await response.json().catch(() => ({}));

        if (successMessage) {
          toast.success(successMessage);
        }

        if (onSuccess) {
          await onSuccess();
        }

        return { success: true, data: data as T };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : errorMessage;
        setError(errorMsg);
        toast.error(errorMsg);

        if (onError) {
          onError(errorMsg);
        }

        return { success: false, error: errorMsg };
      } finally {
        setIsLoading(false);
      }
    },
    [onSuccess, onError, successMessage, errorMessage, toast]
  );

  const reset = useCallback(() => {
    setError(null);
    setIsLoading(false);
  }, []);

  return { execute, isLoading, error, reset };
}

/**
 * Simplified action hook with pre-configured endpoint
 */
export function useEntityAction<T = unknown>(
  baseEndpoint: string,
  options: UseDashboardActionOptions = {}
) {
  const { execute, isLoading, error, reset } = useDashboardAction<T>(options);

  const update = useCallback(
    async (id: string, data: Record<string, unknown>) => {
      return execute(`${baseEndpoint}/${id}`, "PATCH", data);
    },
    [execute, baseEndpoint]
  );

  const remove = useCallback(
    async (id: string) => {
      return execute(`${baseEndpoint}/${id}`, "DELETE");
    },
    [execute, baseEndpoint]
  );

  const create = useCallback(
    async (data: Record<string, unknown>) => {
      return execute(baseEndpoint, "POST", data);
    },
    [execute, baseEndpoint]
  );

  return { update, remove, create, isLoading, error, reset };
}

/**
 * Hook for moderation actions (approve, reject, flag)
 */
export function useModerationAction(
  baseEndpoint: string,
  options: UseDashboardActionOptions = {}
) {
  const action = useDashboardAction(options);

  const approve = useCallback(
    async (id: string, notes?: string) => {
      return action.execute(`${baseEndpoint}/${id}`, "PATCH", {
        status: "approved",
        moderationNotes: notes,
      });
    },
    [action, baseEndpoint]
  );

  const reject = useCallback(
    async (id: string, notes?: string) => {
      return action.execute(`${baseEndpoint}/${id}`, "PATCH", {
        status: "rejected",
        moderationNotes: notes,
      });
    },
    [action, baseEndpoint]
  );

  const flag = useCallback(
    async (id: string, notes?: string) => {
      return action.execute(`${baseEndpoint}/${id}`, "PATCH", {
        status: "flagged",
        moderationNotes: notes,
      });
    },
    [action, baseEndpoint]
  );

  const remove = useCallback(
    async (id: string) => {
      return action.execute(`${baseEndpoint}/${id}`, "DELETE");
    },
    [action, baseEndpoint]
  );

  return {
    approve,
    reject,
    flag,
    remove,
    isLoading: action.isLoading,
    error: action.error,
    reset: action.reset,
  };
}

/**
 * Hook for status update actions
 */
export function useStatusAction(
  baseEndpoint: string,
  options: UseDashboardActionOptions = {}
) {
  const action = useDashboardAction(options);

  const updateStatus = useCallback(
    async (id: string, status: string, additionalData?: Record<string, unknown>) => {
      return action.execute(`${baseEndpoint}/${id}`, "PATCH", {
        status,
        ...additionalData,
      });
    },
    [action, baseEndpoint]
  );

  return {
    updateStatus,
    isLoading: action.isLoading,
    error: action.error,
    reset: action.reset,
  };
}

/**
 * Hook for bulk actions
 */
export function useBulkAction<T = unknown>(
  baseEndpoint: string,
  options: UseDashboardActionOptions = {}
) {
  const action = useDashboardAction<T>(options);

  const bulkUpdate = useCallback(
    async (ids: string[], data: Record<string, unknown>) => {
      return action.execute(`${baseEndpoint}/bulk`, "PATCH", { ids, ...data });
    },
    [action, baseEndpoint]
  );

  const bulkDelete = useCallback(
    async (ids: string[]) => {
      return action.execute(`${baseEndpoint}/bulk`, "DELETE", { ids });
    },
    [action, baseEndpoint]
  );

  return {
    bulkUpdate,
    bulkDelete,
    isLoading: action.isLoading,
    error: action.error,
    reset: action.reset,
  };
}
