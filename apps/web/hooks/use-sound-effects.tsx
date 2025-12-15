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
 */

import { useCallback, useEffect, useRef, useState } from "react";

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

interface SoundDefinition {
  frequencies: number[];
  duration: number;
  type: OscillatorType;
  volume: number;
  attack?: number;
  decay?: number;
  sustain?: number;
  release?: number;
}

// Musical note frequencies for reference
const NOTES = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
  C6: 1046.50,
};

const SOUND_DEFINITIONS: Record<SoundType, SoundDefinition> = {
  // Notifications - attention-grabbing but not harsh
  notification: {
    frequencies: [NOTES.E5, NOTES.G5],
    duration: 0.15,
    type: "sine",
    volume: 0.4,
  },
  notification_badge: {
    frequencies: [NOTES.C5, NOTES.E5],
    duration: 0.12,
    type: "sine",
    volume: 0.3,
  },
  notification_urgent: {
    frequencies: [NOTES.A5, NOTES.E5, NOTES.A5],
    duration: 0.12,
    type: "triangle",
    volume: 0.5,
  },

  // Feedback sounds
  success: {
    frequencies: [NOTES.C5, NOTES.E5, NOTES.G5],
    duration: 0.12,
    type: "sine",
    volume: 0.35,
  },
  error: {
    frequencies: [NOTES.E4, NOTES.C4],
    duration: 0.18,
    type: "triangle",
    volume: 0.4,
  },
  warning: {
    frequencies: [NOTES.F4, NOTES.D4],
    duration: 0.15,
    type: "triangle",
    volume: 0.35,
  },
  info: {
    frequencies: [NOTES.G4, NOTES.E4],
    duration: 0.12,
    type: "sine",
    volume: 0.25,
  },

  // UI Interactions - subtle and non-intrusive
  click: {
    frequencies: [NOTES.C5],
    duration: 0.05,
    type: "sine",
    volume: 0.15,
  },
  toggle_on: {
    frequencies: [NOTES.C5, NOTES.E5],
    duration: 0.08,
    type: "sine",
    volume: 0.2,
  },
  toggle_off: {
    frequencies: [NOTES.E5, NOTES.C5],
    duration: 0.08,
    type: "sine",
    volume: 0.2,
  },
  hover: {
    frequencies: [NOTES.E5],
    duration: 0.03,
    type: "sine",
    volume: 0.1,
  },
  navigation: {
    frequencies: [NOTES.G4],
    duration: 0.06,
    type: "sine",
    volume: 0.15,
  },
  open: {
    frequencies: [NOTES.C5, NOTES.G5],
    duration: 0.1,
    type: "sine",
    volume: 0.2,
  },
  close: {
    frequencies: [NOTES.G5, NOTES.C5],
    duration: 0.1,
    type: "sine",
    volume: 0.2,
  },

  // Chat sounds
  message_received: {
    frequencies: [NOTES.A4, NOTES.C5],
    duration: 0.12,
    type: "sine",
    volume: 0.35,
  },
  message_sent: {
    frequencies: [NOTES.C5, NOTES.E5],
    duration: 0.1,
    type: "sine",
    volume: 0.25,
  },
  typing: {
    frequencies: [NOTES.F4],
    duration: 0.05,
    type: "sine",
    volume: 0.08,
  },
  mention: {
    frequencies: [NOTES.E5, NOTES.G5, NOTES.A5],
    duration: 0.15,
    type: "sine",
    volume: 0.5,
  },
  invitation: {
    frequencies: [NOTES.C5, NOTES.E5, NOTES.G5, NOTES.C6],
    duration: 0.15,
    type: "sine",
    volume: 0.45,
  },
  user_join: {
    frequencies: [NOTES.G4, NOTES.C5],
    duration: 0.12,
    type: "sine",
    volume: 0.25,
  },
  user_leave: {
    frequencies: [NOTES.C5, NOTES.G4],
    duration: 0.12,
    type: "sine",
    volume: 0.2,
  },

  // Achievements & Progress - celebratory
  achievement: {
    frequencies: [NOTES.C5, NOTES.E5, NOTES.G5, NOTES.C6],
    duration: 0.2,
    type: "sine",
    volume: 0.5,
  },
  level_up: {
    frequencies: [NOTES.C4, NOTES.E4, NOTES.G4, NOTES.C5, NOTES.E5],
    duration: 0.18,
    type: "sine",
    volume: 0.55,
  },
  complete: {
    frequencies: [NOTES.G4, NOTES.C5, NOTES.E5],
    duration: 0.12,
    type: "sine",
    volume: 0.35,
  },
  progress: {
    frequencies: [NOTES.C5, NOTES.D5],
    duration: 0.08,
    type: "sine",
    volume: 0.2,
  },

  // Special
  welcome: {
    frequencies: [NOTES.C5, NOTES.E5, NOTES.G5],
    duration: 0.2,
    type: "sine",
    volume: 0.4,
  },
  goodbye: {
    frequencies: [NOTES.G5, NOTES.E5, NOTES.C5],
    duration: 0.2,
    type: "sine",
    volume: 0.3,
  },
};

// ============================================
// SETTINGS INTERFACE
// ============================================

export interface SoundSettings {
  enabled: boolean;
  volume: number;
  notifications: boolean;
  feedback: boolean;
  ui: boolean;
  chat: boolean;
  achievements: boolean;
}

const DEFAULT_SETTINGS: SoundSettings = {
  enabled: true,
  volume: 0.5,
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

  // Play a sound effect
  const play = useCallback(
    (type: SoundType) => {
      if (!isReady || !isCategoryEnabled(type)) return;

      try {
        const ctx = getAudioContext();

        // Resume context if suspended (browser autoplay policy)
        if (ctx.state === "suspended") {
          ctx.resume();
        }

        const definition = SOUND_DEFINITIONS[type];
        if (!definition) return;

        const now = ctx.currentTime;
        const { frequencies, duration, type: oscType, volume } = definition;
        const finalVolume = volume * settings.volume;

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

          // Envelope for smooth sound
          const startTime = now + i * duration * 0.8;
          const attackTime = startTime + 0.01;
          const releaseStart = startTime + duration * 0.7;
          const endTime = startTime + duration;

          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(1, attackTime);
          gainNode.gain.setValueAtTime(1, releaseStart);
          gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);

          oscillator.start(startTime);
          oscillator.stop(endTime);
        });
      } catch (error) {
        // Audio context might not be available (SSR, user gesture required, etc.)
        console.debug("Sound playback failed:", error);
      }
    },
    [isReady, isCategoryEnabled, getAudioContext, settings.volume]
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

  return {
    // Core
    play,
    settings,
    updateSettings,
    isReady,

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
