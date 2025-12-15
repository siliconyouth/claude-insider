"use client";

/**
 * Chat Sound Effects Hook
 *
 * Provides sound effects for chat events:
 * - New message received
 * - Message sent
 * - User typing
 * - Mention notification
 * - Group invitation
 */

import { useCallback, useEffect, useRef, useState } from "react";

export type SoundType = "message" | "send" | "typing" | "mention" | "invitation" | "join" | "leave";

interface SoundConfig {
  [key: string]: {
    url: string;
    volume: number;
    loop?: boolean;
  };
}

// Sound configurations - uses simple tones generated via Web Audio API
const SOUND_CONFIG: SoundConfig = {
  message: { url: "/sounds/message.mp3", volume: 0.4 },
  send: { url: "/sounds/send.mp3", volume: 0.3 },
  typing: { url: "/sounds/typing.mp3", volume: 0.1, loop: true },
  mention: { url: "/sounds/mention.mp3", volume: 0.6 },
  invitation: { url: "/sounds/invitation.mp3", volume: 0.5 },
  join: { url: "/sounds/join.mp3", volume: 0.3 },
  leave: { url: "/sounds/leave.mp3", volume: 0.2 },
};

// Fallback frequencies for generating sounds if files don't exist
const FALLBACK_FREQUENCIES: Record<SoundType, number[]> = {
  message: [440, 523.25], // A4 -> C5 (pleasant notification)
  send: [523.25, 659.25], // C5 -> E5 (ascending positive)
  typing: [350], // F4 (subtle)
  mention: [659.25, 783.99, 880], // E5 -> G5 -> A5 (attention grabbing)
  invitation: [523.25, 659.25, 783.99], // C5 -> E5 -> G5 (celebratory)
  join: [392, 523.25], // G4 -> C5 (welcoming)
  leave: [523.25, 392], // C5 -> G4 (descending)
};

interface UseChatSoundsOptions {
  enabled?: boolean;
  volume?: number;
}

interface ChatSoundSettings {
  soundEnabled: boolean;
  soundNewMessage: string;
  soundTyping: boolean;
  soundMention: boolean;
  soundInvitation: boolean;
}

const DEFAULT_SETTINGS: ChatSoundSettings = {
  soundEnabled: true,
  soundNewMessage: "message",
  soundTyping: false,
  soundMention: true,
  soundInvitation: true,
};

export function useChatSounds(options: UseChatSoundsOptions = {}) {
  const { enabled = true, volume = 1.0 } = options;
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioElementsRef = useRef<Map<SoundType, HTMLAudioElement>>(new Map());
  const [settings, setSettings] = useState<ChatSoundSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize audio context
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Load saved settings
    const savedSettings = localStorage.getItem("chatSoundSettings");
    if (savedSettings) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
      } catch {
        // Use defaults
      }
    }

    // Initialize audio elements
    const loadAudio = async () => {
      for (const [soundType, config] of Object.entries(SOUND_CONFIG)) {
        const audio = new Audio();
        audio.volume = config.volume * volume;
        audio.loop = config.loop || false;

        // Try to load the audio file
        try {
          audio.src = config.url;
          await audio.load();
          audioElementsRef.current.set(soundType as SoundType, audio);
        } catch {
          // Will use Web Audio API fallback
          console.log(`Sound file ${config.url} not found, using generated sound`);
        }
      }
      setIsLoaded(true);
    };

    loadAudio();

    // Capture ref value for cleanup
    const audioElements = audioElementsRef.current;

    return () => {
      // Cleanup using captured value
      audioElements.forEach((audio) => {
        audio.pause();
        audio.src = "";
      });
      audioElements.clear();
    };
  }, [volume]);

  // Generate sound using Web Audio API as fallback
  const generateSound = useCallback(
    (frequencies: number[], duration: number = 0.15) => {
      if (!enabled || !settings.soundEnabled) return;

      try {
        // Create or resume audio context
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
        }
        const ctx = audioContextRef.current;

        if (ctx.state === "suspended") {
          ctx.resume();
        }

        const now = ctx.currentTime;

        frequencies.forEach((freq, i) => {
          const oscillator = ctx.createOscillator();
          const gainNode = ctx.createGain();

          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(freq, now);
          oscillator.connect(gainNode);
          gainNode.connect(ctx.destination);

          // Envelope for smooth sound
          const startTime = now + i * duration;
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(0.3 * volume, startTime + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

          oscillator.start(startTime);
          oscillator.stop(startTime + duration);
        });
      } catch (error) {
        console.error("Error generating sound:", error);
      }
    },
    [enabled, settings.soundEnabled, volume]
  );

  // Play a sound effect
  const playSound = useCallback(
    async (type: SoundType) => {
      if (!enabled || !settings.soundEnabled) return;

      // Check specific sound settings
      if (type === "typing" && !settings.soundTyping) return;
      if (type === "mention" && !settings.soundMention) return;
      if (type === "invitation" && !settings.soundInvitation) return;

      const audio = audioElementsRef.current.get(type);

      if (audio && audio.src && !audio.error) {
        try {
          audio.currentTime = 0;
          await audio.play();
          return;
        } catch {
          // Fall through to generated sound
        }
      }

      // Fallback to generated sound
      const frequencies = FALLBACK_FREQUENCIES[type];
      if (frequencies) {
        generateSound(frequencies, type === "mention" || type === "invitation" ? 0.2 : 0.15);
      }
    },
    [enabled, settings, generateSound]
  );

  // Stop a looping sound
  const stopSound = useCallback((type: SoundType) => {
    const audio = audioElementsRef.current.get(type);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, []);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<ChatSoundSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem("chatSoundSettings", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Convenience methods for common sounds
  const playMessageReceived = useCallback(() => playSound("message"), [playSound]);
  const playMessageSent = useCallback(() => playSound("send"), [playSound]);
  const playMention = useCallback(() => playSound("mention"), [playSound]);
  const playInvitation = useCallback(() => playSound("invitation"), [playSound]);
  const playUserJoined = useCallback(() => playSound("join"), [playSound]);
  const playUserLeft = useCallback(() => playSound("leave"), [playSound]);

  return {
    playSound,
    stopSound,
    playMessageReceived,
    playMessageSent,
    playMention,
    playInvitation,
    playUserJoined,
    playUserLeft,
    settings,
    updateSettings,
    isLoaded,
  };
}

export default useChatSounds;
