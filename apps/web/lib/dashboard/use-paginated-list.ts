/**
 * usePaginatedList Hook
 *
 * Generic hook for fetching paginated data with filters.
 * Replaces the repeated fetch pattern across dashboard pages.
 */

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useToast } from "@/components/toast";
import type { UsePaginatedListOptions } from "./types";

interface UsePaginatedListResult<T> {
  // Data
  items: T[];
  total: number;

  // Pagination
  page: number;
  totalPages: number;
  setPage: (page: number) => void;

  // Loading state
  isLoading: boolean;

  // Filters
  filters: Record<string, string>;
  setFilter: (key: string, value: string) => void;
  setFilters: (filters: Record<string, string>) => void;
  clearFilters: () => void;

  // Search (special filter with debounce)
  search: string;
  setSearch: (search: string) => void;

  // Actions
  refetch: () => Promise<void>;

  // Extra data from response (e.g., stats, counts)
  extra: Record<string, unknown>;
}

export function usePaginatedList<T>(
  endpoint: string,
  options: UsePaginatedListOptions = {}
): UsePaginatedListResult<T> {
  const {
    limit = 20,
    initialFilters = {},
    debounceMs = 300,
    enabled = true,
  } = options;

  const toast = useToast();

  // State
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFiltersState] = useState<Record<string, string>>(initialFilters);
  const [search, setSearchState] = useState("");
  const [extra, setExtra] = useState<Record<string, unknown>>({});

  // Debounce ref
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);

    try {
      // Build query params
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      // Add filters (skip empty values and "all")
      for (const [key, value] of Object.entries(filters)) {
        if (value && value !== "all") {
          params.set(key, value);
        }
      }

      // Add search
      if (search) {
        params.set("search", search);
      }

      const response = await fetch(`/api/dashboard/${endpoint}?${params}`);

      if (!isMountedRef.current) return;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to load ${endpoint}`);
      }

      const data = await response.json();

      if (!isMountedRef.current) return;

      // Handle different response formats
      // Format 1: { items: [...], totalPages: n, total: n }
      // Format 2: { [entityName]: [...], totalPages: n }
      // Format 3: Direct array

      if (Array.isArray(data)) {
        setItems(data);
        setTotal(data.length);
        setTotalPages(1);
      } else if (data.items) {
        setItems(data.items);
        setTotal(data.total ?? data.items.length);
        setTotalPages(data.totalPages ?? 1);

        // Store extra data (stats, counts, etc.)
        const { items: _items, total: _total, totalPages: _totalPages, page: _page, ...rest } = data;
        setExtra(rest);
      } else {
        // Try to find the array in the response
        const arrayKey = Object.keys(data).find(key => Array.isArray(data[key]));
        if (arrayKey) {
          setItems(data[arrayKey]);
          setTotal(data.total ?? data[arrayKey].length);
          setTotalPages(data.totalPages ?? 1);

          const { [arrayKey]: _arr, total: _total, totalPages: _totalPages, page: _page, ...rest } = data;
          setExtra(rest);
        } else {
          setItems([]);
          setTotal(0);
          setTotalPages(1);
        }
      }
    } catch (error) {
      if (isMountedRef.current) {
        console.error(`[usePaginatedList] Error fetching ${endpoint}:`, error);
        toast.error(error instanceof Error ? error.message : `Failed to load ${endpoint}`);
        setItems([]);
        setTotal(0);
        setTotalPages(1);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [endpoint, page, limit, filters, search, enabled, toast]);

  // Effect: Fetch on mount and when dependencies change (except search)
  useEffect(() => {
    isMountedRef.current = true;

    // For non-search changes, fetch immediately
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    fetchData();

    return () => {
      isMountedRef.current = false;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [fetchData]);

  // Set single filter
  const setFilter = useCallback((key: string, value: string) => {
    setFiltersState(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filter changes
  }, []);

  // Set multiple filters at once
  const setFilters = useCallback((newFilters: Record<string, string>) => {
    setFiltersState(newFilters);
    setPage(1);
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFiltersState(initialFilters);
    setSearchState("");
    setPage(1);
  }, [initialFilters]);

  // Set search with debounce
  const setSearch = useCallback((value: string) => {
    setSearchState(value);
    setPage(1);

    // Debounce the actual fetch
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      // The useEffect will handle the fetch
    }, debounceMs);
  }, [debounceMs]);

  // Manual refetch
  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    items,
    total,
    page,
    totalPages,
    setPage,
    isLoading,
    filters,
    setFilter,
    setFilters,
    clearFilters,
    search,
    setSearch,
    refetch,
    extra,
  };
}

/**
 * Simple version without pagination for smaller lists
 */
export function useSimpleList<T>(
  endpoint: string,
  filters: Record<string, string> = {},
  enabled = true
) {
  const toast = useToast();
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);

    try {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(filters)) {
        if (value && value !== "all") {
          params.set(key, value);
        }
      }

      const url = params.toString()
        ? `/api/dashboard/${endpoint}?${params}`
        : `/api/dashboard/${endpoint}`;

      const response = await fetch(url);

      if (!isMountedRef.current) return;

      if (!response.ok) {
        throw new Error(`Failed to load ${endpoint}`);
      }

      const data = await response.json();

      if (!isMountedRef.current) return;

      if (Array.isArray(data)) {
        setItems(data);
      } else if (data.items) {
        setItems(data.items);
      } else {
        const arrayKey = Object.keys(data).find(key => Array.isArray(data[key]));
        setItems(arrayKey ? data[arrayKey] : []);
      }
    } catch (error) {
      if (isMountedRef.current) {
        toast.error(error instanceof Error ? error.message : `Failed to load ${endpoint}`);
        setItems([]);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [endpoint, filters, enabled, toast]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchData();
    return () => { isMountedRef.current = false; };
  }, [fetchData]);

  return { items, isLoading, refetch: fetchData, setItems };
}
