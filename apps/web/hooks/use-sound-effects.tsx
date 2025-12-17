"use client";

/**
 * Site-wide Sound Effects System
 *
 * Provides audio feedback for all user interactions:
 * - Notifications (bell, badge updates)
 * - Success feedback (saves, submits, completions)
 * - Error feedback (failures, validation errors)
 * - UI interactions (clicks, toggles, navigation)
 * - Chat events (messages, typing, mentions)
 *
 * Uses Web Audio API to generate pleasant tones without
 * requiring audio files.
 *
 * Supports 10 built-in sound themes:
 * - Claude Insider (default), Anthropic, Apple, Microsoft, Google
 * - Linux, WhatsApp, Telegram, GitHub, Vercel
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getTheme,
  getThemeSoundDefinition,
  DEFAULT_THEME_ID,
  THEME_LIST,
  BUILT_IN_THEMES,
  type SoundThemeDefinition,
} from "./sound-themes";

// ============================================
// SOUND TYPES
// ============================================

export type SoundType =
  // Notifications
  | "notification"
  | "notification_badge"
  | "notification_urgent"
  // Feedback
  | "success"
  | "error"
  | "warning"
  | "info"
  // UI Interactions
  | "click"
  | "toggle_on"
  | "toggle_off"
  | "hover"
  | "navigation"
  | "open"
  | "close"
  // Chat
  | "message_received"
  | "message_sent"
  | "typing"
  | "mention"
  | "invitation"
  | "user_join"
  | "user_leave"
  // Achievements & Progress
  | "achievement"
  | "level_up"
  | "complete"
  | "progress"
  // Special
  | "welcome"
  | "goodbye";

// ============================================
// SOUND DEFINITIONS
// ============================================

export interface SoundDefinition {
  frequencies: number[];
  duration: number;
  type: OscillatorType;
  volume: number;
  attack?: number;
  decay?: number;
  sustain?: number;
  release?: number;
}

// Re-export theme utilities for convenience
export { THEME_LIST, DEFAULT_THEME_ID, BUILT_IN_THEMES, getTheme, type SoundThemeDefinition };

// ============================================
// SETTINGS INTERFACE
// ============================================

export interface SoundSettings {
  enabled: boolean;
  volume: number;
  theme: string; // Sound theme ID (e.g., 'claude-insider', 'apple', etc.)
  notifications: boolean;
  feedback: boolean;
  ui: boolean;
  chat: boolean;
  achievements: boolean;
}

const DEFAULT_SETTINGS: SoundSettings = {
  enabled: true,
  volume: 0.5,
  theme: DEFAULT_THEME_ID, // 'claude-insider'
  notifications: true,
  feedback: true,
  ui: false, // Subtle UI sounds off by default
  chat: true,
  achievements: true,
};

// ============================================
// SOUND EFFECTS HOOK
// ============================================

export function useSoundEffects() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [settings, setSettings] = useState<SoundSettings>(DEFAULT_SETTINGS);
  const [isReady, setIsReady] = useState(false);

  // Initialize and load settings
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Load saved settings
    const savedSettings = localStorage.getItem("soundSettings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch {
        // Use defaults
      }
    }

    setIsReady(true);

    // Cleanup
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Get or create audio context
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  // Check if a sound category is enabled
  const isCategoryEnabled = useCallback(
    (type: SoundType): boolean => {
      if (!settings.enabled) return false;

      // Map sound types to categories
      if (["notification", "notification_badge", "notification_urgent"].includes(type)) {
        return settings.notifications;
      }
      if (["success", "error", "warning", "info"].includes(type)) {
        return settings.feedback;
      }
      if (["click", "toggle_on", "toggle_off", "hover", "navigation", "open", "close"].includes(type)) {
        return settings.ui;
      }
      if (["message_received", "message_sent", "typing", "mention", "invitation", "user_join", "user_leave"].includes(type)) {
        return settings.chat;
      }
      if (["achievement", "level_up", "complete", "progress"].includes(type)) {
        return settings.achievements;
      }
      return true; // Welcome/goodbye always play if enabled
    },
    [settings]
  );

  // Play a sound effect using current theme
  const play = useCallback(
    (type: SoundType) => {
      if (!isReady || !isCategoryEnabled(type)) return;

      try {
        const ctx = getAudioContext();

        // Resume context if suspended (browser autoplay policy)
        if (ctx.state === "suspended") {
          ctx.resume();
        }

        // Get sound definition from the current theme
        const definition = getThemeSoundDefinition(settings.theme, type);
        if (!definition) return;

        const now = ctx.currentTime;
        const { frequencies, duration, type: oscType, volume, attack, decay, sustain, release } = definition;
        const finalVolume = volume * settings.volume;

        // Use ADSR envelope values or defaults
        const attackTime = attack ?? 0.01;
        const decayTime = decay ?? 0;
        const sustainLevel = sustain ?? 1;
        const releaseTime = release ?? duration * 0.3;

        // Create gain node for volume control
        const masterGain = ctx.createGain();
        masterGain.connect(ctx.destination);
        masterGain.gain.setValueAtTime(finalVolume, now);

        // Play each frequency in sequence
        frequencies.forEach((freq, i) => {
          const oscillator = ctx.createOscillator();
          const gainNode = ctx.createGain();

          oscillator.type = oscType;
          oscillator.frequency.setValueAtTime(freq, now);
          oscillator.connect(gainNode);
          gainNode.connect(masterGain);

          // ADSR envelope for smooth, theme-specific sound
          const startTime = now + i * duration * 0.8;
          const attackEnd = startTime + attackTime;
          const decayEnd = attackEnd + decayTime;
          const sustainEnd = startTime + duration - releaseTime;
          const endTime = startTime + duration;

          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(1, attackEnd);
          gainNode.gain.linearRampToValueAtTime(sustainLevel, decayEnd);
          gainNode.gain.setValueAtTime(sustainLevel, sustainEnd);
          gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);

          oscillator.start(startTime);
          oscillator.stop(endTime);
        });
      } catch (error) {
        // Audio context might not be available (SSR, user gesture required, etc.)
        console.debug("Sound playback failed:", error);
      }
    },
    [isReady, isCategoryEnabled, getAudioContext, settings.volume, settings.theme]
  );

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<SoundSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem("soundSettings", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ============================================
  // CONVENIENCE METHODS
  // ============================================

  // Notifications
  const playNotification = useCallback(() => play("notification"), [play]);
  const playNotificationBadge = useCallback(() => play("notification_badge"), [play]);
  const playNotificationUrgent = useCallback(() => play("notification_urgent"), [play]);

  // Feedback
  const playSuccess = useCallback(() => play("success"), [play]);
  const playError = useCallback(() => play("error"), [play]);
  const playWarning = useCallback(() => play("warning"), [play]);
  const playInfo = useCallback(() => play("info"), [play]);

  // UI
  const playClick = useCallback(() => play("click"), [play]);
  const playToggleOn = useCallback(() => play("toggle_on"), [play]);
  const playToggleOff = useCallback(() => play("toggle_off"), [play]);
  const playHover = useCallback(() => play("hover"), [play]);
  const playNavigation = useCallback(() => play("navigation"), [play]);
  const playOpen = useCallback(() => play("open"), [play]);
  const playClose = useCallback(() => play("close"), [play]);

  // Chat
  const playMessageReceived = useCallback(() => play("message_received"), [play]);
  const playMessageSent = useCallback(() => play("message_sent"), [play]);
  const playTyping = useCallback(() => play("typing"), [play]);
  const playMention = useCallback(() => play("mention"), [play]);
  const playInvitation = useCallback(() => play("invitation"), [play]);
  const playUserJoin = useCallback(() => play("user_join"), [play]);
  const playUserLeave = useCallback(() => play("user_leave"), [play]);

  // Achievements
  const playAchievement = useCallback(() => play("achievement"), [play]);
  const playLevelUp = useCallback(() => play("level_up"), [play]);
  const playComplete = useCallback(() => play("complete"), [play]);
  const playProgress = useCallback(() => play("progress"), [play]);

  // Special
  const playWelcome = useCallback(() => play("welcome"), [play]);
  const playGoodbye = useCallback(() => play("goodbye"), [play]);

  // Get current theme definition
  const currentTheme = getTheme(settings.theme);

  return {
    // Core
    play,
    settings,
    updateSettings,
    isReady,

    // Theme
    currentTheme,
    availableThemes: THEME_LIST,

    // Notifications
    playNotification,
    playNotificationBadge,
    playNotificationUrgent,

    // Feedback
    playSuccess,
    playError,
    playWarning,
    playInfo,

    // UI
    playClick,
    playToggleOn,
    playToggleOff,
    playHover,
    playNavigation,
    playOpen,
    playClose,

    // Chat
    playMessageReceived,
    playMessageSent,
    playTyping,
    playMention,
    playInvitation,
    playUserJoin,
    playUserLeave,

    // Achievements
    playAchievement,
    playLevelUp,
    playComplete,
    playProgress,

    // Special
    playWelcome,
    playGoodbye,
  };
}

// ============================================
// SOUND CONTEXT PROVIDER
// ============================================

import { createContext, useContext, ReactNode } from "react";

const SoundContext = createContext<ReturnType<typeof useSoundEffects> | null>(null);

export function SoundProvider({ children }: { children: ReactNode }) {
  const sounds = useSoundEffects();
  return <SoundContext.Provider value={sounds}>{children}</SoundContext.Provider>;
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) {
    // Return a no-op version if not in provider
    return {
      play: () => {},
      settings: DEFAULT_SETTINGS,
      updateSettings: () => {},
      isReady: false,
      currentTheme: getTheme(DEFAULT_THEME_ID),
      availableThemes: THEME_LIST,
      playNotification: () => {},
      playNotificationBadge: () => {},
      playNotificationUrgent: () => {},
      playSuccess: () => {},
      playError: () => {},
      playWarning: () => {},
      playInfo: () => {},
      playClick: () => {},
      playToggleOn: () => {},
      playToggleOff: () => {},
      playHover: () => {},
      playNavigation: () => {},
      playOpen: () => {},
      playClose: () => {},
      playMessageReceived: () => {},
      playMessageSent: () => {},
      playTyping: () => {},
      playMention: () => {},
      playInvitation: () => {},
      playUserJoin: () => {},
      playUserLeave: () => {},
      playAchievement: () => {},
      playLevelUp: () => {},
      playComplete: () => {},
      playProgress: () => {},
      playWelcome: () => {},
      playGoodbye: () => {},
    };
  }
  return context;
}

export default useSoundEffects;
