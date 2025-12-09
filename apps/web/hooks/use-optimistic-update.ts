"use client";

import { useState, useCallback, useTransition } from "react";
import { toast } from "@/components/toast";

/**
 * Options for the useOptimisticUpdate hook
 */
interface OptimisticUpdateOptions<T> {
  /** Callback when update succeeds */
  onSuccess?: (data: T) => void;
  /** Callback when update fails */
  onError?: (error: Error) => void;
  /** Message to show on success (set to null to disable) */
  successMessage?: string | null;
  /** Message to show on error (set to null to disable) */
  errorMessage?: string | null;
  /** Whether to revert to previous data on error (default: true) */
  revertOnError?: boolean;
}

/**
 * Hook for optimistic UI updates with automatic rollback on error
 *
 * @example
 * ```tsx
 * const { data, optimisticUpdate, isUpdating } = useOptimisticUpdate(
 *   initialData,
 *   async (newData) => {
 *     const response = await fetch('/api/update', {
 *       method: 'POST',
 *       body: JSON.stringify(newData),
 *     });
 *     return response.json();
 *   },
 *   { successMessage: 'Saved!', errorMessage: 'Failed to save' }
 * );
 * ```
 */
export function useOptimisticUpdate<T>(
  initialData: T,
  updateFn: (optimisticData: T) => Promise<T>,
  options: OptimisticUpdateOptions<T> = {}
) {
  const [data, setData] = useState<T>(initialData);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [previousData, setPreviousData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const {
    onSuccess,
    onError,
    successMessage = "Updated successfully",
    errorMessage = "Failed to update",
    revertOnError = true,
  } = options;

  const optimisticUpdate = useCallback(
    async (newData: T | ((prev: T) => T)) => {
      const optimisticData =
        typeof newData === "function"
          ? (newData as (prev: T) => T)(data)
          : newData;

      // Store previous data for potential revert
      setPreviousData(data);
      setError(null);

      // Optimistically update UI (using transition for smoother updates)
      startTransition(() => {
        setData(optimisticData);
      });

      setIsUpdating(true);

      try {
        // Perform actual update
        const result = await updateFn(optimisticData);

        // Update with server response
        setData(result);

        // Show success message
        if (successMessage) {
          toast.success(successMessage);
        }

        // Call success callback
        onSuccess?.(result);

        // Clear previous data
        setPreviousData(null);

        return result;
      } catch (err) {
        const error = err as Error;
        console.error("Optimistic update failed:", error);
        setError(error);

        // Revert to previous data if configured
        if (revertOnError && previousData !== null) {
          setData(previousData);
        }

        // Show error message
        if (errorMessage) {
          toast.error(errorMessage);
        }

        // Call error callback
        onError?.(error);

        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [data, updateFn, onSuccess, onError, successMessage, errorMessage, revertOnError, previousData]
  );

  const reset = useCallback(() => {
    if (previousData !== null) {
      setData(previousData);
      setPreviousData(null);
      setError(null);
    }
  }, [previousData]);

  const setDataDirect = useCallback((newData: T | ((prev: T) => T)) => {
    setData((prev) =>
      typeof newData === "function" ? (newData as (prev: T) => T)(prev) : newData
    );
  }, []);

  return {
    data,
    setData: setDataDirect,
    optimisticUpdate,
    isUpdating: isUpdating || isPending,
    isPending,
    error,
    reset,
    previousData,
  };
}

/**
 * Options for list item operations
 */
interface ListHandlers<T> {
  add?: (item: T) => Promise<T>;
  update?: (id: string | number, updates: Partial<T>) => Promise<T>;
  remove?: (id: string | number) => Promise<void>;
}

/**
 * Hook for optimistic list operations (add, update, remove)
 *
 * @example
 * ```tsx
 * const { items, optimisticAdd, optimisticRemove, isUpdating } = useOptimisticList(
 *   initialItems,
 *   {
 *     add: async (item) => fetch('/api/items', { method: 'POST', body: JSON.stringify(item) }).then(r => r.json()),
 *     remove: async (id) => fetch(`/api/items/${id}`, { method: 'DELETE' }),
 *   }
 * );
 * ```
 */
export function useOptimisticList<T extends { id: string | number }>(
  initialItems: T[],
  handlers: ListHandlers<T> = {}
) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [isUpdating, setIsUpdating] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<string | number>>(new Set());

  const optimisticAdd = useCallback(
    async (newItem: T) => {
      if (!handlers.add) {
        throw new Error("Add handler not provided");
      }

      // Optimistically add item
      setItems((prev) => [...prev, newItem]);
      setPendingIds((prev) => new Set(prev).add(newItem.id));
      setIsUpdating(true);

      try {
        const result = await handlers.add(newItem);
        // Replace optimistic item with server response
        setItems((prev) =>
          prev.map((item) => (item.id === newItem.id ? result : item))
        );
        toast.success("Item added");
        return result;
      } catch (error) {
        // Remove optimistic item on error
        setItems((prev) => prev.filter((item) => item.id !== newItem.id));
        toast.error("Failed to add item");
        throw error;
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(newItem.id);
          return next;
        });
        setIsUpdating(false);
      }
    },
    [handlers]
  );

  const optimisticUpdate = useCallback(
    async (id: string | number, updates: Partial<T>) => {
      if (!handlers.update) {
        throw new Error("Update handler not provided");
      }

      // Store original item
      const originalItem = items.find((item) => item.id === id);
      if (!originalItem) throw new Error("Item not found");

      // Optimistically update item
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
      setPendingIds((prev) => new Set(prev).add(id));
      setIsUpdating(true);

      try {
        const result = await handlers.update(id, updates);
        // Update with server response
        setItems((prev) =>
          prev.map((item) => (item.id === id ? result : item))
        );
        toast.success("Item updated");
        return result;
      } catch (error) {
        // Revert to original item on error
        setItems((prev) =>
          prev.map((item) => (item.id === id ? originalItem : item))
        );
        toast.error("Failed to update item");
        throw error;
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setIsUpdating(false);
      }
    },
    [items, handlers]
  );

  const optimisticRemove = useCallback(
    async (id: string | number) => {
      if (!handlers.remove) {
        throw new Error("Remove handler not provided");
      }

      // Store original items for potential revert
      const originalItems = items;
      const removedItem = items.find((item) => item.id === id);

      // Optimistically remove item
      setItems((prev) => prev.filter((item) => item.id !== id));
      setPendingIds((prev) => new Set(prev).add(id));
      setIsUpdating(true);

      try {
        await handlers.remove(id);
        toast.success("Item removed");
      } catch (error) {
        // Restore original items on error
        setItems(originalItems);
        toast.error("Failed to remove item");
        throw error;
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setIsUpdating(false);
      }

      return removedItem;
    },
    [items, handlers]
  );

  const isItemPending = useCallback(
    (id: string | number) => pendingIds.has(id),
    [pendingIds]
  );

  return {
    items,
    setItems,
    optimisticAdd,
    optimisticUpdate,
    optimisticRemove,
    isUpdating,
    pendingIds,
    isItemPending,
  };
}

/**
 * Hook for debounced optimistic updates (useful for search, autocomplete)
 */
export function useDebouncedOptimistic<T>(
  initialValue: T,
  delay: number = 300
) {
  const [value, setValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);
  const [isDebouncing, setIsDebouncing] = useState(false);

  const updateValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      const resolvedValue =
        typeof newValue === "function"
          ? (newValue as (prev: T) => T)(value)
          : newValue;

      setValue(resolvedValue);
      setIsDebouncing(true);

      // Clear existing timeout and set new one
      const timeoutId = setTimeout(() => {
        setDebouncedValue(resolvedValue);
        setIsDebouncing(false);
      }, delay);

      return () => clearTimeout(timeoutId);
    },
    [value, delay]
  );

  return {
    value,
    debouncedValue,
    setValue: updateValue,
    isDebouncing,
  };
}
