/**
 * Sound Effects Section
 *
 * Tests the Web Audio API-based sound effects system.
 * Includes theme preview and individual sound testing.
 */

"use client";

import { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/design-system";
import {
  type SoundType,
  THEME_LIST,
  getTheme,
} from "@/hooks/use-sound-effects";
import { SOUND_CATEGORIES } from "../diagnostics.types";

interface SoundEffectsSectionProps {
  playSound: (sound: SoundType) => void;
  currentTheme: string;
  onThemeChange: (themeId: string) => void;
}

// Key sounds to play for theme preview (in order)
const PREVIEW_SOUNDS: SoundType[] = [
  "notification",
  "success",
  "message_received",
  "achievement",
];

export function SoundEffectsSection({
  playSound,
  currentTheme,
  onThemeChange,
}: SoundEffectsSectionProps) {
  const [previewTheme, setPreviewTheme] = useState(currentTheme);
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const playAllTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const selectedTheme = getTheme(previewTheme);

  // Play all preview sounds in sequence
  const handlePlayAll = useCallback(() => {
    if (isPlayingAll) return;

    // Clear any existing timeout
    if (playAllTimeoutRef.current) {
      clearTimeout(playAllTimeoutRef.current);
    }

    setIsPlayingAll(true);

    // Temporarily switch to preview theme
    const originalTheme = currentTheme;
    onThemeChange(previewTheme);

    // Play each preview sound with delay
    PREVIEW_SOUNDS.forEach((sound, index) => {
      setTimeout(() => {
        playSound(sound);
      }, index * 400);
    });

    // Restore original theme and reset state after all sounds played
    playAllTimeoutRef.current = setTimeout(() => {
      onThemeChange(originalTheme);
      setIsPlayingAll(false);
    }, PREVIEW_SOUNDS.length * 400 + 200);
  }, [isPlayingAll, currentTheme, previewTheme, playSound, onThemeChange]);

  // Play a single sound with the preview theme
  const handlePlaySingle = useCallback(
    (sound: SoundType) => {
      // Temporarily switch to preview theme
      const originalTheme = currentTheme;
      onThemeChange(previewTheme);

      // Play the sound
      setTimeout(() => {
        playSound(sound);
      }, 50);

      // Restore original theme
      setTimeout(() => {
        onThemeChange(originalTheme);
      }, 500);
    },
    [currentTheme, previewTheme, playSound, onThemeChange]
  );

  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Sound Effects</h3>

      {/* Theme Selector */}
      <div className="mb-6 p-4 rounded-lg bg-gray-800/50 border border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <label
              htmlFor="theme-select"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Preview Theme
            </label>
            <select
              id="theme-select"
              value={previewTheme}
              onChange={(e) => setPreviewTheme(e.target.value)}
              className={cn(
                "w-full px-3 py-2 rounded-lg",
                "bg-gray-900 border border-gray-700",
                "text-white text-sm",
                "focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
            >
              {THEME_LIST.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.icon} {theme.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePlayAll}
              disabled={isPlayingAll}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg",
                "bg-gradient-to-r from-violet-600 to-cyan-600",
                "text-white shadow-lg shadow-blue-500/25",
                "hover:shadow-xl hover:-translate-y-0.5",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0",
                "transition-all duration-200"
              )}
            >
              {isPlayingAll ? "Playing..." : "▶ Play All"}
            </button>
          </div>
        </div>

        {/* Theme Info */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{selectedTheme.icon}</span>
            <div>
              <p className="font-medium text-white">{selectedTheme.name}</p>
              <p className="text-xs text-gray-400">{selectedTheme.description}</p>
            </div>
          </div>
          <div className="flex gap-4 text-xs text-gray-500">
            <span>
              Color Scheme:{" "}
              <span className="text-gray-300 capitalize">{selectedTheme.colorScheme}</span>
            </span>
            <span>
              Mood:{" "}
              <span className="text-gray-300 capitalize">{selectedTheme.mood}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Sound Categories */}
      <div className="space-y-4">
        {Object.entries(SOUND_CATEGORIES).map(([category, soundTypes]) => (
          <div key={category}>
            <h4 className="text-sm font-medium text-gray-400 mb-2 capitalize">
              {category}
            </h4>
            <div className="flex flex-wrap gap-2">
              {soundTypes.map((soundType) => (
                <button
                  key={soundType}
                  onClick={() => handlePlaySingle(soundType)}
                  className="px-3 py-1.5 text-xs bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors"
                >
                  {soundType.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Theme Quick Grid */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <h4 className="text-sm font-medium text-gray-400 mb-3">Quick Theme Preview</h4>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {THEME_LIST.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setPreviewTheme(theme.id)}
              title={theme.name}
              className={cn(
                "p-2 rounded-lg text-xl transition-all",
                "border",
                previewTheme === theme.id
                  ? "border-blue-500 bg-blue-900/30 shadow-md"
                  : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
              )}
            >
              {theme.icon}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
