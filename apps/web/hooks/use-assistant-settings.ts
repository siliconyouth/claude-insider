"use client";

/**
 * useAssistantSettings Hook
 *
 * Manages AI assistant settings with database persistence for authenticated users
 * and localStorage fallback for anonymous users. Automatically syncs when user signs in.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";

// Default settings
export const DEFAULT_ASSISTANT_SETTINGS = {
  assistantName: "Claude",
  userDisplayName: null as string | null,
  selectedVoiceId: "EXAVITQu4vr4xnSDxMaL", // Sarah
  autoSpeak: false,
  speechRate: 1.0,
  showSuggestedQuestions: true,
  showConversationHistory: true,
  compactMode: false,
  enableVoiceInput: true,
  enableCodeHighlighting: true,
};

export interface AssistantSettings {
  id?: string;
  userId?: string;
  assistantName: string;
  userDisplayName: string | null;
  selectedVoiceId: string;
  autoSpeak: boolean;
  speechRate: number;
  showSuggestedQuestions: boolean;
  showConversationHistory: boolean;
  compactMode: boolean;
  enableVoiceInput: boolean;
  enableCodeHighlighting: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface VoiceOption {
  id: string;
  name: string;
  accent: string;
  gender: string;
  description: string;
}

const LOCAL_STORAGE_KEY = "claude-insider-assistant-settings";

/**
 * Get settings from localStorage
 */
function getLocalSettings(): Partial<AssistantSettings> {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Save settings to localStorage
 */
function saveLocalSettings(settings: Partial<AssistantSettings>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage errors
  }
}

export function useAssistantSettings() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [settings, setSettings] = useState<AssistantSettings>({
    ...DEFAULT_ASSISTANT_SETTINGS,
  });
  const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Track if we've loaded from DB to avoid re-fetching
  const hasLoadedFromDb = useRef(false);

  // Fetch settings from API for authenticated users
  const fetchSettings = useCallback(async () => {
    if (!isAuthenticated) {
      // Use localStorage for anonymous users
      const localSettings = getLocalSettings();
      setSettings({ ...DEFAULT_ASSISTANT_SETTINGS, ...localSettings });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/user/assistant-settings");
      if (!response.ok) {
        throw new Error("Failed to fetch settings");
      }

      const data = await response.json();
      setSettings(data.settings);
      setAvailableVoices(data.availableVoices || []);
      hasLoadedFromDb.current = true;

      // Sync to localStorage as backup
      saveLocalSettings(data.settings);
    } catch (err) {
      console.error("[Assistant Settings] Error fetching:", err);
      setError(err instanceof Error ? err.message : "Failed to load settings");

      // Fall back to localStorage
      const localSettings = getLocalSettings();
      setSettings({ ...DEFAULT_ASSISTANT_SETTINGS, ...localSettings });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Initial load
  useEffect(() => {
    if (!authLoading) {
      fetchSettings();
    }
  }, [authLoading, fetchSettings]);

  // Re-fetch when auth state changes (user signs in/out)
  useEffect(() => {
    if (!authLoading && isAuthenticated && !hasLoadedFromDb.current) {
      fetchSettings();
    } else if (!authLoading && !isAuthenticated) {
      hasLoadedFromDb.current = false;
      const localSettings = getLocalSettings();
      setSettings({ ...DEFAULT_ASSISTANT_SETTINGS, ...localSettings });
      setIsLoading(false);
    }
  }, [authLoading, isAuthenticated, fetchSettings]);

  // Update a single setting
  const updateSetting = useCallback(
    async <K extends keyof AssistantSettings>(
      key: K,
      value: AssistantSettings[K]
    ): Promise<boolean> => {
      // Optimistically update local state
      setSettings((prev) => {
        const updated = { ...prev, [key]: value };
        saveLocalSettings(updated);
        return updated;
      });

      // If authenticated, persist to database
      if (isAuthenticated) {
        setIsSaving(true);
        try {
          const response = await fetch("/api/user/assistant-settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ [key]: value }),
          });

          if (!response.ok) {
            throw new Error("Failed to save setting");
          }

          const data = await response.json();
          setSettings(data.settings);
          return true;
        } catch (err) {
          console.error("[Assistant Settings] Error saving:", err);
          setError(err instanceof Error ? err.message : "Failed to save");
          return false;
        } finally {
          setIsSaving(false);
        }
      }

      return true;
    },
    [isAuthenticated]
  );

  // Update multiple settings at once
  const updateSettings = useCallback(
    async (updates: Partial<AssistantSettings>): Promise<boolean> => {
      // Optimistically update local state
      setSettings((prev) => {
        const updated = { ...prev, ...updates };
        saveLocalSettings(updated);
        return updated;
      });

      // If authenticated, persist to database
      if (isAuthenticated) {
        setIsSaving(true);
        try {
          const response = await fetch("/api/user/assistant-settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          });

          if (!response.ok) {
            throw new Error("Failed to save settings");
          }

          const data = await response.json();
          setSettings(data.settings);
          return true;
        } catch (err) {
          console.error("[Assistant Settings] Error saving:", err);
          setError(err instanceof Error ? err.message : "Failed to save");
          return false;
        } finally {
          setIsSaving(false);
        }
      }

      return true;
    },
    [isAuthenticated]
  );

  // Reset to defaults
  const resetToDefaults = useCallback(async (): Promise<boolean> => {
    return updateSettings(DEFAULT_ASSISTANT_SETTINGS);
  }, [updateSettings]);

  // Refresh from server
  const refresh = useCallback(() => {
    setIsLoading(true);
    return fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    availableVoices,
    isLoading,
    isSaving,
    error,
    isAuthenticated,
    updateSetting,
    updateSettings,
    resetToDefaults,
    refresh,
  };
}

/**
 * Shorthand getters for commonly used settings
 */
export function useAssistantName() {
  const { settings, updateSetting, isAuthenticated } = useAssistantSettings();
  return {
    name: settings.assistantName,
    setName: (name: string) => updateSetting("assistantName", name),
    isAuthenticated,
  };
}

export function useUserDisplayName() {
  const { settings, updateSetting, isAuthenticated } = useAssistantSettings();
  return {
    name: settings.userDisplayName,
    setName: (name: string | null) => updateSetting("userDisplayName", name),
    isAuthenticated,
  };
}

export function useAutoSpeak() {
  const { settings, updateSetting } = useAssistantSettings();
  return {
    autoSpeak: settings.autoSpeak,
    setAutoSpeak: (value: boolean) => updateSetting("autoSpeak", value),
  };
}

export function useSelectedVoice() {
  const { settings, availableVoices, updateSetting } = useAssistantSettings();
  return {
    voiceId: settings.selectedVoiceId,
    voices: availableVoices,
    setVoice: (voiceId: string) => updateSetting("selectedVoiceId", voiceId),
    currentVoice: availableVoices.find((v) => v.id === settings.selectedVoiceId),
  };
}
