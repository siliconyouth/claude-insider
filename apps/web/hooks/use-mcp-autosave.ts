/**
 * MCP Auto-Save Hook
 *
 * Automatically saves the current MCP configuration to localStorage.
 * Provides recovery of unsaved work after page refresh.
 */

import { useEffect, useCallback, useRef, useState } from "react";
import {
  getCurrentLocalConfig,
  saveCurrentLocalConfig,
  clearCurrentLocalConfig,
} from "@/lib/mcp/storage";
import type { MCPConfig } from "@/lib/mcp/schema";

interface UseMCPAutoSaveOptions {
  /** Debounce delay in milliseconds (default: 1000) */
  debounceMs?: number;
  /** Callback when config is restored from localStorage */
  onRestore?: (config: MCPConfig) => void;
}

interface UseMCPAutoSaveReturn {
  /** Whether there's a saved config available to restore */
  hasUnsavedWork: boolean;
  /** Restore the saved config */
  restoreConfig: () => MCPConfig | null;
  /** Dismiss the restore prompt */
  dismissRestore: () => void;
  /** Clear the auto-saved config */
  clearAutoSave: () => void;
  /** Manually trigger a save */
  saveNow: (config: MCPConfig) => void;
}

export function useMCPAutoSave(
  currentConfig: string,
  options: UseMCPAutoSaveOptions = {}
): UseMCPAutoSaveReturn {
  const { debounceMs = 1000, onRestore } = options;
  const [hasUnsavedWork, setHasUnsavedWork] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialCheckDone = useRef(false);

  // Check for unsaved work on mount
  useEffect(() => {
    if (initialCheckDone.current) return;
    initialCheckDone.current = true;

    const saved = getCurrentLocalConfig();
    if (saved) {
      // Compare with current config to see if it's different
      try {
        const current = JSON.parse(currentConfig);
        if (JSON.stringify(saved) !== JSON.stringify(current)) {
          setHasUnsavedWork(true);
        }
      } catch {
        // Current config is invalid, offer to restore
        setHasUnsavedWork(true);
      }
    }
  }, [currentConfig]);

  // Auto-save with debounce
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      try {
        const parsed: MCPConfig = JSON.parse(currentConfig);
        // Only save if it's valid MCP config
        if (parsed.mcpServers && typeof parsed.mcpServers === "object") {
          saveCurrentLocalConfig(parsed);
        }
      } catch {
        // Don't save invalid JSON
      }
    }, debounceMs);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [currentConfig, debounceMs]);

  // Restore saved config
  const restoreConfig = useCallback((): MCPConfig | null => {
    const saved = getCurrentLocalConfig();
    if (saved) {
      setHasUnsavedWork(false);
      setDismissed(false);
      onRestore?.(saved);
      return saved;
    }
    return null;
  }, [onRestore]);

  // Dismiss restore prompt
  const dismissRestore = useCallback(() => {
    setDismissed(true);
    setHasUnsavedWork(false);
    // Clear the old saved config since user dismissed
    clearCurrentLocalConfig();
  }, []);

  // Clear auto-saved config
  const clearAutoSave = useCallback(() => {
    clearCurrentLocalConfig();
    setHasUnsavedWork(false);
  }, []);

  // Manual save
  const saveNow = useCallback((config: MCPConfig) => {
    saveCurrentLocalConfig(config);
  }, []);

  return {
    hasUnsavedWork: hasUnsavedWork && !dismissed,
    restoreConfig,
    dismissRestore,
    clearAutoSave,
    saveNow,
  };
}
