/**
 * Sound Themes / Templates System
 *
 * Defines 10 distinct sound themes, each synthesized via Web Audio API.
 * All sounds are original compositions to ensure legal compliance.
 *
 * Themes:
 * 1. Claude Insider - Warm, professional (default)
 * 2. Anthropic - Soft, AI assistant aesthetic
 * 3. Apple - Crystal clear, glass-like
 * 4. Microsoft - Orchestral, warm brass
 * 5. Google - Playful, Material Design
 * 6. Linux - Functional, utility-focused
 * 7. WhatsApp - Messaging-style pops
 * 8. Telegram - Quick, sharp, modern
 * 9. GitHub - Mechanical, developer-focused
 * 10. Vercel - Futuristic, minimal
 */

import type { SoundType } from "./use-sound-effects";

// ============================================
// TYPES
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

export interface SoundThemeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  colorScheme: "warm" | "cool" | "neutral" | "vibrant";
  mood: "professional" | "playful" | "minimalist" | "ambient" | "technical";
  sounds: Record<SoundType, SoundDefinition>;
}

// ============================================
// MUSICAL NOTES (Equal Temperament)
// ============================================

export const NOTES = {
  // Octave 3 (lower)
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  // Octave 4
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  // Octave 5
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
  // Octave 6 (higher)
  C6: 1046.50, D6: 1174.66, E6: 1318.51, F6: 1396.91, G6: 1567.98, A6: 1760.00,
  // Sharp notes (common ones)
  "F#4": 369.99, "G#4": 415.30, "A#4": 466.16,
  "F#5": 739.99, "G#5": 830.61, "A#5": 932.33,
};

// ============================================
// THEME 1: CLAUDE INSIDER (Default)
// ============================================

const claudeInsiderTheme: SoundThemeDefinition = {
  id: "claude-insider",
  name: "Claude Insider",
  description: "Warm, professional tones designed for Claude Insider",
  icon: "🎵",
  colorScheme: "warm",
  mood: "professional",
  sounds: {
    // Notifications - tri-tone sequences
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

    // Feedback - C major chord variations
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

    // UI - subtle
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

    // Chat
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

    // Achievements
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
  },
};

// ============================================
// THEME 2: ANTHROPIC
// ============================================

const anthropicTheme: SoundThemeDefinition = {
  id: "anthropic",
  name: "Anthropic",
  description: "Soft, AI assistant aesthetic - calm and helpful",
  icon: "🤖",
  colorScheme: "warm",
  mood: "professional",
  sounds: {
    // Notifications - soft perfect fifths
    notification: {
      frequencies: [NOTES.C5, NOTES.G5],
      duration: 0.18,
      type: "sine",
      volume: 0.35,
    },
    notification_badge: {
      frequencies: [NOTES.G4, NOTES.D5],
      duration: 0.14,
      type: "sine",
      volume: 0.28,
    },
    notification_urgent: {
      frequencies: [NOTES.E5, NOTES.B5],
      duration: 0.16,
      type: "sine",
      volume: 0.4,
    },

    // Feedback - warm and rounded
    success: {
      frequencies: [NOTES.G4, NOTES.B4, NOTES.D5],
      duration: 0.14,
      type: "sine",
      volume: 0.32,
    },
    error: {
      frequencies: [NOTES.D4, NOTES.A3],
      duration: 0.2,
      type: "triangle",
      volume: 0.35,
    },
    warning: {
      frequencies: [NOTES.E4, NOTES.B3],
      duration: 0.16,
      type: "triangle",
      volume: 0.3,
    },
    info: {
      frequencies: [NOTES.A4, NOTES.E4],
      duration: 0.12,
      type: "sine",
      volume: 0.22,
    },

    // UI - very subtle
    click: {
      frequencies: [NOTES.A4],
      duration: 0.04,
      type: "sine",
      volume: 0.12,
    },
    toggle_on: {
      frequencies: [NOTES.G4, NOTES.D5],
      duration: 0.1,
      type: "sine",
      volume: 0.18,
    },
    toggle_off: {
      frequencies: [NOTES.D5, NOTES.G4],
      duration: 0.1,
      type: "sine",
      volume: 0.18,
    },
    hover: {
      frequencies: [NOTES.D5],
      duration: 0.03,
      type: "sine",
      volume: 0.08,
    },
    navigation: {
      frequencies: [NOTES.E4],
      duration: 0.06,
      type: "sine",
      volume: 0.12,
    },
    open: {
      frequencies: [NOTES.G4, NOTES.C5],
      duration: 0.12,
      type: "sine",
      volume: 0.18,
    },
    close: {
      frequencies: [NOTES.C5, NOTES.G4],
      duration: 0.12,
      type: "sine",
      volume: 0.16,
    },

    // Chat - gentle pulses
    message_received: {
      frequencies: [NOTES.D5, NOTES.A4],
      duration: 0.14,
      type: "sine",
      volume: 0.3,
    },
    message_sent: {
      frequencies: [NOTES.A4, NOTES.D5],
      duration: 0.1,
      type: "sine",
      volume: 0.22,
    },
    typing: {
      frequencies: [NOTES.E4],
      duration: 0.04,
      type: "sine",
      volume: 0.06,
    },
    mention: {
      frequencies: [NOTES.G5, NOTES.B5, NOTES.D6],
      duration: 0.16,
      type: "sine",
      volume: 0.45,
    },
    invitation: {
      frequencies: [NOTES.G4, NOTES.B4, NOTES.D5, NOTES.G5],
      duration: 0.18,
      type: "sine",
      volume: 0.4,
    },
    user_join: {
      frequencies: [NOTES.D4, NOTES.A4],
      duration: 0.12,
      type: "sine",
      volume: 0.22,
    },
    user_leave: {
      frequencies: [NOTES.A4, NOTES.D4],
      duration: 0.12,
      type: "sine",
      volume: 0.18,
    },

    // Achievements - warm celebration
    achievement: {
      frequencies: [NOTES.G4, NOTES.B4, NOTES.D5, NOTES.G5],
      duration: 0.22,
      type: "sine",
      volume: 0.45,
    },
    level_up: {
      frequencies: [NOTES.D4, NOTES.G4, NOTES.B4, NOTES.D5, NOTES.G5],
      duration: 0.2,
      type: "sine",
      volume: 0.5,
    },
    complete: {
      frequencies: [NOTES.A4, NOTES.D5, NOTES.F5],
      duration: 0.14,
      type: "sine",
      volume: 0.32,
    },
    progress: {
      frequencies: [NOTES.G4, NOTES.A4],
      duration: 0.08,
      type: "sine",
      volume: 0.18,
    },

    // Special
    welcome: {
      frequencies: [NOTES.G4, NOTES.B4, NOTES.D5],
      duration: 0.22,
      type: "sine",
      volume: 0.35,
    },
    goodbye: {
      frequencies: [NOTES.D5, NOTES.B4, NOTES.G4],
      duration: 0.22,
      type: "sine",
      volume: 0.28,
    },
  },
};

// ============================================
// THEME 3: APPLE
// ============================================

const appleTheme: SoundThemeDefinition = {
  id: "apple",
  name: "Apple",
  description: "Crystal clear, glass-like tones inspired by macOS/iOS",
  icon: "🍎",
  colorScheme: "cool",
  mood: "minimalist",
  sounds: {
    // Notifications - crystal clear, higher register
    notification: {
      frequencies: [NOTES.G5, NOTES.C6],
      duration: 0.12,
      type: "sine",
      volume: 0.38,
    },
    notification_badge: {
      frequencies: [NOTES.E5, NOTES.A5],
      duration: 0.1,
      type: "sine",
      volume: 0.3,
    },
    notification_urgent: {
      frequencies: [NOTES.C6, NOTES.E6],
      duration: 0.1,
      type: "sine",
      volume: 0.45,
    },

    // Feedback - sparkle chords
    success: {
      frequencies: [NOTES.E5, NOTES.G5, NOTES.B5],
      duration: 0.1,
      type: "sine",
      volume: 0.32,
    },
    error: {
      frequencies: [NOTES.G4, NOTES.E4],
      duration: 0.15,
      type: "sine",
      volume: 0.35,
    },
    warning: {
      frequencies: [NOTES.A4, NOTES.F4],
      duration: 0.12,
      type: "sine",
      volume: 0.3,
    },
    info: {
      frequencies: [NOTES.C5, NOTES.G4],
      duration: 0.1,
      type: "sine",
      volume: 0.25,
    },

    // UI - glass-like
    click: {
      frequencies: [NOTES.G5],
      duration: 0.04,
      type: "sine",
      volume: 0.14,
    },
    toggle_on: {
      frequencies: [NOTES.E5, NOTES.A5],
      duration: 0.08,
      type: "sine",
      volume: 0.2,
    },
    toggle_off: {
      frequencies: [NOTES.A5, NOTES.E5],
      duration: 0.08,
      type: "sine",
      volume: 0.18,
    },
    hover: {
      frequencies: [NOTES.A5],
      duration: 0.025,
      type: "sine",
      volume: 0.08,
    },
    navigation: {
      frequencies: [NOTES.C5],
      duration: 0.05,
      type: "sine",
      volume: 0.14,
    },
    open: {
      frequencies: [NOTES.G5, NOTES.D6],
      duration: 0.1,
      type: "sine",
      volume: 0.2,
    },
    close: {
      frequencies: [NOTES.D6, NOTES.G5],
      duration: 0.1,
      type: "sine",
      volume: 0.18,
    },

    // Chat - glass ping
    message_received: {
      frequencies: [NOTES.B5, NOTES.E5],
      duration: 0.1,
      type: "sine",
      volume: 0.32,
    },
    message_sent: {
      frequencies: [NOTES.E5, NOTES.B5],
      duration: 0.08,
      type: "sine",
      volume: 0.25,
    },
    typing: {
      frequencies: [NOTES.A4],
      duration: 0.04,
      type: "sine",
      volume: 0.06,
    },
    mention: {
      frequencies: [NOTES.A5, NOTES.C6, NOTES.E6],
      duration: 0.12,
      type: "sine",
      volume: 0.48,
    },
    invitation: {
      frequencies: [NOTES.E5, NOTES.G5, NOTES.B5, NOTES.E6],
      duration: 0.14,
      type: "sine",
      volume: 0.42,
    },
    user_join: {
      frequencies: [NOTES.C5, NOTES.G5],
      duration: 0.1,
      type: "sine",
      volume: 0.22,
    },
    user_leave: {
      frequencies: [NOTES.G5, NOTES.C5],
      duration: 0.1,
      type: "sine",
      volume: 0.18,
    },

    // Achievements - sparkle cascade
    achievement: {
      frequencies: [NOTES.E5, NOTES.G5, NOTES.B5, NOTES.E6],
      duration: 0.18,
      type: "sine",
      volume: 0.48,
    },
    level_up: {
      frequencies: [NOTES.G4, NOTES.B4, NOTES.D5, NOTES.G5, NOTES.B5],
      duration: 0.16,
      type: "sine",
      volume: 0.52,
    },
    complete: {
      frequencies: [NOTES.C5, NOTES.E5, NOTES.G5],
      duration: 0.1,
      type: "sine",
      volume: 0.32,
    },
    progress: {
      frequencies: [NOTES.G5, NOTES.A5],
      duration: 0.06,
      type: "sine",
      volume: 0.18,
    },

    // Special
    welcome: {
      frequencies: [NOTES.E5, NOTES.G5, NOTES.B5],
      duration: 0.18,
      type: "sine",
      volume: 0.38,
    },
    goodbye: {
      frequencies: [NOTES.B5, NOTES.G5, NOTES.E5],
      duration: 0.18,
      type: "sine",
      volume: 0.3,
    },
  },
};

// ============================================
// THEME 4: MICROSOFT
// ============================================

const microsoftTheme: SoundThemeDefinition = {
  id: "microsoft",
  name: "Microsoft",
  description: "Orchestral hints, warm brass-like tones inspired by Windows 11",
  icon: "🪟",
  colorScheme: "warm",
  mood: "professional",
  sounds: {
    // Notifications - orchestral
    notification: {
      frequencies: [NOTES.F4, NOTES.A4, NOTES.C5],
      duration: 0.16,
      type: "triangle",
      volume: 0.4,
    },
    notification_badge: {
      frequencies: [NOTES.A4, NOTES.C5],
      duration: 0.12,
      type: "triangle",
      volume: 0.32,
    },
    notification_urgent: {
      frequencies: [NOTES.D5, NOTES.F5, NOTES.A5],
      duration: 0.14,
      type: "triangle",
      volume: 0.48,
    },

    // Feedback - brass fanfare
    success: {
      frequencies: [NOTES.F4, NOTES.A4, NOTES.C5, NOTES.F5],
      duration: 0.14,
      type: "triangle",
      volume: 0.38,
    },
    error: {
      frequencies: [NOTES.D4, NOTES.B3],
      duration: 0.18,
      type: "triangle",
      volume: 0.4,
    },
    warning: {
      frequencies: [NOTES.G4, NOTES.E4],
      duration: 0.14,
      type: "triangle",
      volume: 0.35,
    },
    info: {
      frequencies: [NOTES.C5, NOTES.A4],
      duration: 0.12,
      type: "triangle",
      volume: 0.28,
    },

    // UI - refined
    click: {
      frequencies: [NOTES.F4],
      duration: 0.05,
      type: "triangle",
      volume: 0.16,
    },
    toggle_on: {
      frequencies: [NOTES.A4, NOTES.C5],
      duration: 0.1,
      type: "triangle",
      volume: 0.22,
    },
    toggle_off: {
      frequencies: [NOTES.C5, NOTES.A4],
      duration: 0.1,
      type: "triangle",
      volume: 0.2,
    },
    hover: {
      frequencies: [NOTES.C5],
      duration: 0.03,
      type: "triangle",
      volume: 0.1,
    },
    navigation: {
      frequencies: [NOTES.A4],
      duration: 0.06,
      type: "triangle",
      volume: 0.15,
    },
    open: {
      frequencies: [NOTES.F4, NOTES.C5],
      duration: 0.12,
      type: "triangle",
      volume: 0.22,
    },
    close: {
      frequencies: [NOTES.C5, NOTES.F4],
      duration: 0.12,
      type: "triangle",
      volume: 0.2,
    },

    // Chat - bright chime
    message_received: {
      frequencies: [NOTES.C5, NOTES.F5],
      duration: 0.12,
      type: "triangle",
      volume: 0.35,
    },
    message_sent: {
      frequencies: [NOTES.A4, NOTES.C5],
      duration: 0.1,
      type: "triangle",
      volume: 0.28,
    },
    typing: {
      frequencies: [NOTES.G4],
      duration: 0.05,
      type: "triangle",
      volume: 0.08,
    },
    mention: {
      frequencies: [NOTES.F5, NOTES.A5, NOTES.C6],
      duration: 0.14,
      type: "triangle",
      volume: 0.5,
    },
    invitation: {
      frequencies: [NOTES.F4, NOTES.A4, NOTES.C5, NOTES.F5],
      duration: 0.16,
      type: "triangle",
      volume: 0.45,
    },
    user_join: {
      frequencies: [NOTES.A4, NOTES.F5],
      duration: 0.12,
      type: "triangle",
      volume: 0.25,
    },
    user_leave: {
      frequencies: [NOTES.F5, NOTES.A4],
      duration: 0.12,
      type: "triangle",
      volume: 0.2,
    },

    // Achievements - fanfare
    achievement: {
      frequencies: [NOTES.F4, NOTES.A4, NOTES.C5, NOTES.F5],
      duration: 0.22,
      type: "triangle",
      volume: 0.52,
    },
    level_up: {
      frequencies: [NOTES.C4, NOTES.F4, NOTES.A4, NOTES.C5, NOTES.F5],
      duration: 0.2,
      type: "triangle",
      volume: 0.55,
    },
    complete: {
      frequencies: [NOTES.A4, NOTES.C5, NOTES.F5],
      duration: 0.12,
      type: "triangle",
      volume: 0.35,
    },
    progress: {
      frequencies: [NOTES.F4, NOTES.A4],
      duration: 0.08,
      type: "triangle",
      volume: 0.2,
    },

    // Special
    welcome: {
      frequencies: [NOTES.F4, NOTES.A4, NOTES.C5],
      duration: 0.2,
      type: "triangle",
      volume: 0.4,
    },
    goodbye: {
      frequencies: [NOTES.C5, NOTES.A4, NOTES.F4],
      duration: 0.2,
      type: "triangle",
      volume: 0.32,
    },
  },
};

// ============================================
// THEME 5: GOOGLE (Material Design)
// ============================================

const googleTheme: SoundThemeDefinition = {
  id: "google",
  name: "Google",
  description: "Playful, bouncy tones inspired by Material Design",
  icon: "🔍",
  colorScheme: "vibrant",
  mood: "playful",
  sounds: {
    // Notifications - bouncy blips
    notification: {
      frequencies: [NOTES.G4, NOTES.A4, NOTES.B4],
      duration: 0.12,
      type: "sine",
      volume: 0.42,
    },
    notification_badge: {
      frequencies: [NOTES.D5, NOTES.E5],
      duration: 0.1,
      type: "sine",
      volume: 0.35,
    },
    notification_urgent: {
      frequencies: [NOTES.A4, NOTES.B4, NOTES.D5, NOTES.E5],
      duration: 0.12,
      type: "sine",
      volume: 0.5,
    },

    // Feedback - playful arpeggios
    success: {
      frequencies: [NOTES.G4, NOTES.A4, NOTES.B4, NOTES.D5],
      duration: 0.1,
      type: "sine",
      volume: 0.38,
    },
    error: {
      frequencies: [NOTES.E4, NOTES.D4, NOTES.C4],
      duration: 0.14,
      type: "sine",
      volume: 0.4,
    },
    warning: {
      frequencies: [NOTES.D4, NOTES.E4, NOTES.D4],
      duration: 0.12,
      type: "sine",
      volume: 0.35,
    },
    info: {
      frequencies: [NOTES.A4, NOTES.B4],
      duration: 0.1,
      type: "sine",
      volume: 0.28,
    },

    // UI - energetic
    click: {
      frequencies: [NOTES.D5],
      duration: 0.04,
      type: "sine",
      volume: 0.16,
    },
    toggle_on: {
      frequencies: [NOTES.A4, NOTES.D5],
      duration: 0.08,
      type: "sine",
      volume: 0.22,
    },
    toggle_off: {
      frequencies: [NOTES.D5, NOTES.A4],
      duration: 0.08,
      type: "sine",
      volume: 0.2,
    },
    hover: {
      frequencies: [NOTES.B4],
      duration: 0.03,
      type: "sine",
      volume: 0.1,
    },
    navigation: {
      frequencies: [NOTES.E4],
      duration: 0.05,
      type: "sine",
      volume: 0.15,
    },
    open: {
      frequencies: [NOTES.G4, NOTES.D5],
      duration: 0.1,
      type: "sine",
      volume: 0.22,
    },
    close: {
      frequencies: [NOTES.D5, NOTES.G4],
      duration: 0.1,
      type: "sine",
      volume: 0.2,
    },

    // Chat - quick blip
    message_received: {
      frequencies: [NOTES.G4, NOTES.B4],
      duration: 0.1,
      type: "sine",
      volume: 0.38,
    },
    message_sent: {
      frequencies: [NOTES.D5, NOTES.E5],
      duration: 0.08,
      type: "sine",
      volume: 0.28,
    },
    typing: {
      frequencies: [NOTES.A4],
      duration: 0.04,
      type: "sine",
      volume: 0.08,
    },
    mention: {
      frequencies: [NOTES.G4, NOTES.B4, NOTES.D5, NOTES.G5],
      duration: 0.14,
      type: "sine",
      volume: 0.5,
    },
    invitation: {
      frequencies: [NOTES.A4, NOTES.B4, NOTES.D5, NOTES.E5],
      duration: 0.14,
      type: "sine",
      volume: 0.45,
    },
    user_join: {
      frequencies: [NOTES.G4, NOTES.D5],
      duration: 0.1,
      type: "sine",
      volume: 0.25,
    },
    user_leave: {
      frequencies: [NOTES.D5, NOTES.A4],
      duration: 0.1,
      type: "sine",
      volume: 0.2,
    },

    // Achievements - celebratory bounce
    achievement: {
      frequencies: [NOTES.G4, NOTES.A4, NOTES.B4, NOTES.D5, NOTES.G5],
      duration: 0.18,
      type: "sine",
      volume: 0.52,
    },
    level_up: {
      frequencies: [NOTES.D4, NOTES.G4, NOTES.A4, NOTES.B4, NOTES.D5, NOTES.G5],
      duration: 0.16,
      type: "sine",
      volume: 0.55,
    },
    complete: {
      frequencies: [NOTES.G4, NOTES.B4, NOTES.D5],
      duration: 0.1,
      type: "sine",
      volume: 0.38,
    },
    progress: {
      frequencies: [NOTES.A4, NOTES.B4],
      duration: 0.06,
      type: "sine",
      volume: 0.2,
    },

    // Special
    welcome: {
      frequencies: [NOTES.G4, NOTES.A4, NOTES.B4, NOTES.D5],
      duration: 0.18,
      type: "sine",
      volume: 0.42,
    },
    goodbye: {
      frequencies: [NOTES.D5, NOTES.B4, NOTES.A4, NOTES.G4],
      duration: 0.18,
      type: "sine",
      volume: 0.35,
    },
  },
};

// ============================================
// THEME 6: LINUX
// ============================================

const linuxTheme: SoundThemeDefinition = {
  id: "linux",
  name: "Linux",
  description: "Functional, utility-focused tones inspired by freedesktop",
  icon: "🐧",
  colorScheme: "neutral",
  mood: "minimalist",
  sounds: {
    // Notifications - simple and functional
    notification: {
      frequencies: [NOTES.C5],
      duration: 0.14,
      type: "sine",
      volume: 0.4,
    },
    notification_badge: {
      frequencies: [NOTES.G4],
      duration: 0.1,
      type: "sine",
      volume: 0.32,
    },
    notification_urgent: {
      frequencies: [NOTES.A5, NOTES.A5],
      duration: 0.12,
      type: "square",
      volume: 0.45,
    },

    // Feedback - clear tones
    success: {
      frequencies: [NOTES.C5, NOTES.G5],
      duration: 0.12,
      type: "sine",
      volume: 0.35,
    },
    error: {
      frequencies: [NOTES.E4],
      duration: 0.2,
      type: "square",
      volume: 0.4,
    },
    warning: {
      frequencies: [NOTES.F4, NOTES.F4],
      duration: 0.14,
      type: "square",
      volume: 0.35,
    },
    info: {
      frequencies: [NOTES.A4],
      duration: 0.1,
      type: "sine",
      volume: 0.28,
    },

    // UI - utility
    click: {
      frequencies: [NOTES.C5],
      duration: 0.04,
      type: "square",
      volume: 0.14,
    },
    toggle_on: {
      frequencies: [NOTES.G4, NOTES.C5],
      duration: 0.08,
      type: "sine",
      volume: 0.2,
    },
    toggle_off: {
      frequencies: [NOTES.C5, NOTES.G4],
      duration: 0.08,
      type: "sine",
      volume: 0.18,
    },
    hover: {
      frequencies: [NOTES.G4],
      duration: 0.03,
      type: "sine",
      volume: 0.08,
    },
    navigation: {
      frequencies: [NOTES.E4],
      duration: 0.05,
      type: "sine",
      volume: 0.14,
    },
    open: {
      frequencies: [NOTES.C4, NOTES.G4],
      duration: 0.1,
      type: "sine",
      volume: 0.2,
    },
    close: {
      frequencies: [NOTES.G4, NOTES.C4],
      duration: 0.1,
      type: "sine",
      volume: 0.18,
    },

    // Chat - utility beep
    message_received: {
      frequencies: [NOTES.A4, NOTES.E5],
      duration: 0.1,
      type: "sine",
      volume: 0.35,
    },
    message_sent: {
      frequencies: [NOTES.E4, NOTES.A4],
      duration: 0.08,
      type: "sine",
      volume: 0.25,
    },
    typing: {
      frequencies: [NOTES.C4],
      duration: 0.04,
      type: "square",
      volume: 0.06,
    },
    mention: {
      frequencies: [NOTES.A5, NOTES.E5],
      duration: 0.14,
      type: "sine",
      volume: 0.48,
    },
    invitation: {
      frequencies: [NOTES.C5, NOTES.G5, NOTES.C6],
      duration: 0.14,
      type: "sine",
      volume: 0.42,
    },
    user_join: {
      frequencies: [NOTES.G4, NOTES.C5],
      duration: 0.1,
      type: "sine",
      volume: 0.22,
    },
    user_leave: {
      frequencies: [NOTES.C5, NOTES.G4],
      duration: 0.1,
      type: "sine",
      volume: 0.18,
    },

    // Achievements - functional celebration
    achievement: {
      frequencies: [NOTES.C5, NOTES.E5, NOTES.G5],
      duration: 0.16,
      type: "sine",
      volume: 0.48,
    },
    level_up: {
      frequencies: [NOTES.C4, NOTES.E4, NOTES.G4, NOTES.C5],
      duration: 0.14,
      type: "sine",
      volume: 0.5,
    },
    complete: {
      frequencies: [NOTES.G4, NOTES.C5],
      duration: 0.1,
      type: "sine",
      volume: 0.35,
    },
    progress: {
      frequencies: [NOTES.C5],
      duration: 0.06,
      type: "sine",
      volume: 0.18,
    },

    // Special
    welcome: {
      frequencies: [NOTES.C5, NOTES.G5],
      duration: 0.16,
      type: "sine",
      volume: 0.38,
    },
    goodbye: {
      frequencies: [NOTES.G5, NOTES.C5],
      duration: 0.16,
      type: "sine",
      volume: 0.3,
    },
  },
};

// ============================================
// THEME 7: WHATSAPP
// ============================================

const whatsappTheme: SoundThemeDefinition = {
  id: "whatsapp",
  name: "WhatsApp",
  description: "Two-tone pops inspired by messaging apps",
  icon: "💬",
  colorScheme: "vibrant",
  mood: "playful",
  sounds: {
    // Notifications - distinctive pop
    notification: {
      frequencies: [NOTES.D5, NOTES.A5],
      duration: 0.1,
      type: "sine",
      volume: 0.45,
    },
    notification_badge: {
      frequencies: [NOTES.F5, NOTES.B5],
      duration: 0.08,
      type: "sine",
      volume: 0.38,
    },
    notification_urgent: {
      frequencies: [NOTES.A5, NOTES.D6, NOTES.A5],
      duration: 0.1,
      type: "sine",
      volume: 0.52,
    },

    // Feedback - double pop
    success: {
      frequencies: [NOTES.E5, NOTES.A5],
      duration: 0.08,
      type: "sine",
      volume: 0.4,
    },
    error: {
      frequencies: [NOTES.D4, NOTES.G3],
      duration: 0.12,
      type: "sine",
      volume: 0.42,
    },
    warning: {
      frequencies: [NOTES.F4, NOTES.C4],
      duration: 0.1,
      type: "sine",
      volume: 0.38,
    },
    info: {
      frequencies: [NOTES.G4, NOTES.C5],
      duration: 0.08,
      type: "sine",
      volume: 0.3,
    },

    // UI - tap sounds
    click: {
      frequencies: [NOTES.E5],
      duration: 0.04,
      type: "sine",
      volume: 0.18,
    },
    toggle_on: {
      frequencies: [NOTES.D5, NOTES.G5],
      duration: 0.06,
      type: "sine",
      volume: 0.22,
    },
    toggle_off: {
      frequencies: [NOTES.G5, NOTES.D5],
      duration: 0.06,
      type: "sine",
      volume: 0.2,
    },
    hover: {
      frequencies: [NOTES.F5],
      duration: 0.025,
      type: "sine",
      volume: 0.1,
    },
    navigation: {
      frequencies: [NOTES.A4],
      duration: 0.04,
      type: "sine",
      volume: 0.15,
    },
    open: {
      frequencies: [NOTES.E5, NOTES.A5],
      duration: 0.08,
      type: "sine",
      volume: 0.22,
    },
    close: {
      frequencies: [NOTES.A5, NOTES.E5],
      duration: 0.08,
      type: "sine",
      volume: 0.2,
    },

    // Chat - iconic two-tone
    message_received: {
      frequencies: [NOTES.D5, NOTES.A5],
      duration: 0.08,
      type: "sine",
      volume: 0.45,
    },
    message_sent: {
      frequencies: [NOTES.A4, NOTES.D5],
      duration: 0.06,
      type: "sine",
      volume: 0.32,
    },
    typing: {
      frequencies: [NOTES.E4],
      duration: 0.04,
      type: "sine",
      volume: 0.08,
    },
    mention: {
      frequencies: [NOTES.D5, NOTES.A5, NOTES.D6],
      duration: 0.1,
      type: "sine",
      volume: 0.52,
    },
    invitation: {
      frequencies: [NOTES.E5, NOTES.A5, NOTES.D6],
      duration: 0.12,
      type: "sine",
      volume: 0.48,
    },
    user_join: {
      frequencies: [NOTES.G4, NOTES.D5],
      duration: 0.08,
      type: "sine",
      volume: 0.28,
    },
    user_leave: {
      frequencies: [NOTES.D5, NOTES.G4],
      duration: 0.08,
      type: "sine",
      volume: 0.22,
    },

    // Achievements - pop celebration
    achievement: {
      frequencies: [NOTES.D5, NOTES.A5, NOTES.D6],
      duration: 0.14,
      type: "sine",
      volume: 0.52,
    },
    level_up: {
      frequencies: [NOTES.A4, NOTES.D5, NOTES.A5, NOTES.D6],
      duration: 0.14,
      type: "sine",
      volume: 0.55,
    },
    complete: {
      frequencies: [NOTES.E5, NOTES.A5],
      duration: 0.08,
      type: "sine",
      volume: 0.4,
    },
    progress: {
      frequencies: [NOTES.D5, NOTES.F5],
      duration: 0.05,
      type: "sine",
      volume: 0.22,
    },

    // Special
    welcome: {
      frequencies: [NOTES.D5, NOTES.A5, NOTES.D6],
      duration: 0.14,
      type: "sine",
      volume: 0.45,
    },
    goodbye: {
      frequencies: [NOTES.A5, NOTES.D5, NOTES.A4],
      duration: 0.14,
      type: "sine",
      volume: 0.35,
    },
  },
};

// ============================================
// THEME 8: TELEGRAM
// ============================================

const telegramTheme: SoundThemeDefinition = {
  id: "telegram",
  name: "Telegram",
  description: "Quick, sharp, modern notification sounds",
  icon: "✈️",
  colorScheme: "cool",
  mood: "minimalist",
  sounds: {
    // Notifications - sharp and quick
    notification: {
      frequencies: [NOTES.A5],
      duration: 0.08,
      type: "sine",
      volume: 0.42,
    },
    notification_badge: {
      frequencies: [NOTES.E5],
      duration: 0.06,
      type: "sine",
      volume: 0.35,
    },
    notification_urgent: {
      frequencies: [NOTES.C6, NOTES.A5],
      duration: 0.08,
      type: "sine",
      volume: 0.5,
    },

    // Feedback - fast arpeggios
    success: {
      frequencies: [NOTES.A5, NOTES.C6, NOTES.E6],
      duration: 0.08,
      type: "sine",
      volume: 0.38,
    },
    error: {
      frequencies: [NOTES.E5, NOTES.C5],
      duration: 0.1,
      type: "sine",
      volume: 0.4,
    },
    warning: {
      frequencies: [NOTES.G5, NOTES.D5],
      duration: 0.08,
      type: "sine",
      volume: 0.35,
    },
    info: {
      frequencies: [NOTES.D5, NOTES.A4],
      duration: 0.06,
      type: "sine",
      volume: 0.28,
    },

    // UI - quick tick
    click: {
      frequencies: [NOTES.A5],
      duration: 0.03,
      type: "sine",
      volume: 0.16,
    },
    toggle_on: {
      frequencies: [NOTES.E5, NOTES.A5],
      duration: 0.06,
      type: "sine",
      volume: 0.22,
    },
    toggle_off: {
      frequencies: [NOTES.A5, NOTES.E5],
      duration: 0.06,
      type: "sine",
      volume: 0.2,
    },
    hover: {
      frequencies: [NOTES.C6],
      duration: 0.02,
      type: "sine",
      volume: 0.08,
    },
    navigation: {
      frequencies: [NOTES.G5],
      duration: 0.04,
      type: "sine",
      volume: 0.14,
    },
    open: {
      frequencies: [NOTES.A5, NOTES.E6],
      duration: 0.08,
      type: "sine",
      volume: 0.22,
    },
    close: {
      frequencies: [NOTES.E6, NOTES.A5],
      duration: 0.08,
      type: "sine",
      volume: 0.2,
    },

    // Chat - quick tick
    message_received: {
      frequencies: [NOTES.A5, NOTES.C6],
      duration: 0.06,
      type: "sine",
      volume: 0.42,
    },
    message_sent: {
      frequencies: [NOTES.E5, NOTES.A5],
      duration: 0.05,
      type: "sine",
      volume: 0.3,
    },
    typing: {
      frequencies: [NOTES.G4],
      duration: 0.03,
      type: "sine",
      volume: 0.06,
    },
    mention: {
      frequencies: [NOTES.A5, NOTES.C6, NOTES.E6],
      duration: 0.1,
      type: "sine",
      volume: 0.5,
    },
    invitation: {
      frequencies: [NOTES.E5, NOTES.A5, NOTES.C6, NOTES.E6],
      duration: 0.1,
      type: "sine",
      volume: 0.48,
    },
    user_join: {
      frequencies: [NOTES.D5, NOTES.A5],
      duration: 0.06,
      type: "sine",
      volume: 0.26,
    },
    user_leave: {
      frequencies: [NOTES.A5, NOTES.D5],
      duration: 0.06,
      type: "sine",
      volume: 0.2,
    },

    // Achievements - fast cascade
    achievement: {
      frequencies: [NOTES.E5, NOTES.A5, NOTES.C6, NOTES.E6],
      duration: 0.12,
      type: "sine",
      volume: 0.5,
    },
    level_up: {
      frequencies: [NOTES.A4, NOTES.E5, NOTES.A5, NOTES.C6, NOTES.E6],
      duration: 0.12,
      type: "sine",
      volume: 0.55,
    },
    complete: {
      frequencies: [NOTES.A5, NOTES.C6, NOTES.E6],
      duration: 0.08,
      type: "sine",
      volume: 0.38,
    },
    progress: {
      frequencies: [NOTES.E5, NOTES.A5],
      duration: 0.05,
      type: "sine",
      volume: 0.2,
    },

    // Special
    welcome: {
      frequencies: [NOTES.E5, NOTES.A5, NOTES.C6],
      duration: 0.12,
      type: "sine",
      volume: 0.4,
    },
    goodbye: {
      frequencies: [NOTES.C6, NOTES.A5, NOTES.E5],
      duration: 0.12,
      type: "sine",
      volume: 0.32,
    },
  },
};

// ============================================
// THEME 9: GITHUB
// ============================================

const githubTheme: SoundThemeDefinition = {
  id: "github",
  name: "GitHub",
  description: "Mechanical, developer-focused sounds",
  icon: "🐙",
  colorScheme: "neutral",
  mood: "technical",
  sounds: {
    // Notifications - typewriter bell
    notification: {
      frequencies: [NOTES.C4, NOTES.G4],
      duration: 0.12,
      type: "square",
      volume: 0.35,
    },
    notification_badge: {
      frequencies: [NOTES.E4],
      duration: 0.08,
      type: "square",
      volume: 0.28,
    },
    notification_urgent: {
      frequencies: [NOTES.G4, NOTES.C5, NOTES.G4],
      duration: 0.1,
      type: "square",
      volume: 0.42,
    },

    // Feedback - commit sounds
    success: {
      frequencies: [NOTES.G4, NOTES.B4, NOTES.D5],
      duration: 0.1,
      type: "square",
      volume: 0.32,
    },
    error: {
      frequencies: [NOTES.C4, NOTES.G3],
      duration: 0.14,
      type: "square",
      volume: 0.38,
    },
    warning: {
      frequencies: [NOTES.E4, NOTES.C4],
      duration: 0.1,
      type: "square",
      volume: 0.32,
    },
    info: {
      frequencies: [NOTES.A4, NOTES.E4],
      duration: 0.08,
      type: "square",
      volume: 0.25,
    },

    // UI - keyboard clicks
    click: {
      frequencies: [NOTES.C4],
      duration: 0.035,
      type: "square",
      volume: 0.14,
    },
    toggle_on: {
      frequencies: [NOTES.G3, NOTES.C4],
      duration: 0.07,
      type: "square",
      volume: 0.18,
    },
    toggle_off: {
      frequencies: [NOTES.C4, NOTES.G3],
      duration: 0.07,
      type: "square",
      volume: 0.16,
    },
    hover: {
      frequencies: [NOTES.E4],
      duration: 0.025,
      type: "square",
      volume: 0.08,
    },
    navigation: {
      frequencies: [NOTES.G3],
      duration: 0.05,
      type: "square",
      volume: 0.12,
    },
    open: {
      frequencies: [NOTES.C4, NOTES.E4],
      duration: 0.08,
      type: "square",
      volume: 0.18,
    },
    close: {
      frequencies: [NOTES.E4, NOTES.C4],
      duration: 0.08,
      type: "square",
      volume: 0.16,
    },

    // Chat - terminal sounds
    message_received: {
      frequencies: [NOTES.E4, NOTES.G4],
      duration: 0.08,
      type: "square",
      volume: 0.32,
    },
    message_sent: {
      frequencies: [NOTES.G4, NOTES.B4],
      duration: 0.06,
      type: "square",
      volume: 0.25,
    },
    typing: {
      frequencies: [NOTES.C4],
      duration: 0.03,
      type: "square",
      volume: 0.06,
    },
    mention: {
      frequencies: [NOTES.G4, NOTES.B4, NOTES.D5],
      duration: 0.1,
      type: "square",
      volume: 0.42,
    },
    invitation: {
      frequencies: [NOTES.C4, NOTES.E4, NOTES.G4, NOTES.C5],
      duration: 0.12,
      type: "square",
      volume: 0.38,
    },
    user_join: {
      frequencies: [NOTES.E4, NOTES.G4],
      duration: 0.08,
      type: "square",
      volume: 0.22,
    },
    user_leave: {
      frequencies: [NOTES.G4, NOTES.E4],
      duration: 0.08,
      type: "square",
      volume: 0.18,
    },

    // Achievements - commit celebration
    achievement: {
      frequencies: [NOTES.G4, NOTES.B4, NOTES.D5, NOTES.G5],
      duration: 0.14,
      type: "square",
      volume: 0.42,
    },
    level_up: {
      frequencies: [NOTES.C4, NOTES.E4, NOTES.G4, NOTES.B4, NOTES.D5],
      duration: 0.14,
      type: "square",
      volume: 0.45,
    },
    complete: {
      frequencies: [NOTES.E4, NOTES.G4, NOTES.B4],
      duration: 0.08,
      type: "square",
      volume: 0.32,
    },
    progress: {
      frequencies: [NOTES.G4, NOTES.A4],
      duration: 0.05,
      type: "square",
      volume: 0.18,
    },

    // Special
    welcome: {
      frequencies: [NOTES.C4, NOTES.E4, NOTES.G4],
      duration: 0.14,
      type: "square",
      volume: 0.35,
    },
    goodbye: {
      frequencies: [NOTES.G4, NOTES.E4, NOTES.C4],
      duration: 0.14,
      type: "square",
      volume: 0.28,
    },
  },
};

// ============================================
// THEME 10: VERCEL
// ============================================

const vercelTheme: SoundThemeDefinition = {
  id: "vercel",
  name: "Vercel",
  description: "Futuristic, minimal sounds for modern deployment",
  icon: "▲",
  colorScheme: "cool",
  mood: "minimalist",
  sounds: {
    // Notifications - quick sweeps
    notification: {
      frequencies: [NOTES.A4, NOTES.E5],
      duration: 0.1,
      type: "sine",
      volume: 0.38,
    },
    notification_badge: {
      frequencies: [NOTES.D5, NOTES.A5],
      duration: 0.08,
      type: "sine",
      volume: 0.32,
    },
    notification_urgent: {
      frequencies: [NOTES.E5, NOTES.B5, NOTES.E6],
      duration: 0.1,
      type: "sine",
      volume: 0.45,
    },

    // Feedback - deployment sounds
    success: {
      frequencies: [NOTES.E5, NOTES.A5, NOTES.E6],
      duration: 0.1,
      type: "sine",
      volume: 0.38,
    },
    error: {
      frequencies: [NOTES.D5, NOTES.A4],
      duration: 0.12,
      type: "sine",
      volume: 0.4,
    },
    warning: {
      frequencies: [NOTES.G5, NOTES.D5],
      duration: 0.1,
      type: "sine",
      volume: 0.35,
    },
    info: {
      frequencies: [NOTES.A4, NOTES.E5],
      duration: 0.08,
      type: "sine",
      volume: 0.28,
    },

    // UI - edge-like
    click: {
      frequencies: [NOTES.E5],
      duration: 0.035,
      type: "sine",
      volume: 0.15,
    },
    toggle_on: {
      frequencies: [NOTES.A4, NOTES.E5],
      duration: 0.07,
      type: "sine",
      volume: 0.2,
    },
    toggle_off: {
      frequencies: [NOTES.E5, NOTES.A4],
      duration: 0.07,
      type: "sine",
      volume: 0.18,
    },
    hover: {
      frequencies: [NOTES.A5],
      duration: 0.025,
      type: "sine",
      volume: 0.08,
    },
    navigation: {
      frequencies: [NOTES.D5],
      duration: 0.05,
      type: "sine",
      volume: 0.14,
    },
    open: {
      frequencies: [NOTES.E5, NOTES.B5],
      duration: 0.08,
      type: "sine",
      volume: 0.2,
    },
    close: {
      frequencies: [NOTES.B5, NOTES.E5],
      duration: 0.08,
      type: "sine",
      volume: 0.18,
    },

    // Chat - fast pulse
    message_received: {
      frequencies: [NOTES.A4, NOTES.E5],
      duration: 0.08,
      type: "sine",
      volume: 0.35,
    },
    message_sent: {
      frequencies: [NOTES.E5, NOTES.A5],
      duration: 0.06,
      type: "sine",
      volume: 0.28,
    },
    typing: {
      frequencies: [NOTES.D5],
      duration: 0.03,
      type: "sine",
      volume: 0.06,
    },
    mention: {
      frequencies: [NOTES.E5, NOTES.A5, NOTES.E6],
      duration: 0.1,
      type: "sine",
      volume: 0.48,
    },
    invitation: {
      frequencies: [NOTES.A4, NOTES.E5, NOTES.A5, NOTES.E6],
      duration: 0.12,
      type: "sine",
      volume: 0.45,
    },
    user_join: {
      frequencies: [NOTES.D5, NOTES.A5],
      duration: 0.07,
      type: "sine",
      volume: 0.24,
    },
    user_leave: {
      frequencies: [NOTES.A5, NOTES.D5],
      duration: 0.07,
      type: "sine",
      volume: 0.2,
    },

    // Achievements - deploy celebration
    achievement: {
      frequencies: [NOTES.E5, NOTES.A5, NOTES.E6],
      duration: 0.14,
      type: "sine",
      volume: 0.48,
    },
    level_up: {
      frequencies: [NOTES.A4, NOTES.E5, NOTES.A5, NOTES.E6],
      duration: 0.14,
      type: "sine",
      volume: 0.52,
    },
    complete: {
      frequencies: [NOTES.E5, NOTES.A5, NOTES.E6],
      duration: 0.1,
      type: "sine",
      volume: 0.38,
    },
    progress: {
      frequencies: [NOTES.A4, NOTES.E5],
      duration: 0.05,
      type: "sine",
      volume: 0.2,
    },

    // Special
    welcome: {
      frequencies: [NOTES.E5, NOTES.A5, NOTES.E6],
      duration: 0.14,
      type: "sine",
      volume: 0.4,
    },
    goodbye: {
      frequencies: [NOTES.E6, NOTES.A5, NOTES.E5],
      duration: 0.14,
      type: "sine",
      volume: 0.32,
    },
  },
};

// ============================================
// EXPORTS
// ============================================

export const BUILT_IN_THEMES: Record<string, SoundThemeDefinition> = {
  "claude-insider": claudeInsiderTheme,
  anthropic: anthropicTheme,
  apple: appleTheme,
  microsoft: microsoftTheme,
  google: googleTheme,
  linux: linuxTheme,
  whatsapp: whatsappTheme,
  telegram: telegramTheme,
  github: githubTheme,
  vercel: vercelTheme,
};

export const THEME_LIST: SoundThemeDefinition[] = Object.values(BUILT_IN_THEMES);

export const DEFAULT_THEME_ID = "claude-insider";

/**
 * Get a theme by ID, falling back to Claude Insider if not found
 */
export function getTheme(themeId: string): SoundThemeDefinition {
  const theme = BUILT_IN_THEMES[themeId];
  if (theme) return theme;
  // Always fall back to Claude Insider (guaranteed to exist)
  return BUILT_IN_THEMES[DEFAULT_THEME_ID] as SoundThemeDefinition;
}

/**
 * Get sound definition for a specific type from a theme
 */
export function getThemeSoundDefinition(
  themeId: string,
  soundType: SoundType
): SoundDefinition {
  const theme = getTheme(themeId);
  return theme.sounds[soundType];
}
