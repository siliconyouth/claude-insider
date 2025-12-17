"use client";

/**
 * Sound Toggle Component
 *
 * Footer component that allows users to:
 * - Toggle sound effects on/off
 * - View current sound theme
 * - Quick-switch between themes
 *
 * Available for both authenticated and unauthenticated users.
 * Settings are persisted in localStorage for all users,
 * and synced to database for authenticated users.
 */

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/design-system";
import { useSound, THEME_LIST } from "@/hooks/use-sound-effects";

export function SoundToggle() {
  const {
    settings,
    updateSettings,
    currentTheme,
    playToggleOn,
    playToggleOff,
    playSuccess,
  } = useSound();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle master toggle
  const handleToggle = () => {
    if (settings.enabled) {
      playToggleOff();
      setTimeout(() => updateSettings({ enabled: false }), 100);
    } else {
      updateSettings({ enabled: true });
      setTimeout(() => playToggleOn(), 100);
    }
  };

  // Handle theme selection
  const handleThemeSelect = (themeId: string) => {
    updateSettings({ theme: themeId });
    setTimeout(() => playSuccess(), 50);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 text-sm transition-colors",
          "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        )}
        aria-label={settings.enabled ? "Sound settings" : "Sound muted"}
        aria-expanded={isOpen}
      >
        {settings.enabled ? (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
            />
          </svg>
        ) : (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
            />
          </svg>
        )}
        <span className="hidden sm:inline">
          {settings.enabled ? "Sound System" : "Sounds Muted"}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            "absolute bottom-full left-0 mb-2",
            "w-64 p-3 rounded-xl",
            "bg-white dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]",
            "shadow-lg dark:shadow-[0_0_15px_rgba(0,0,0,0.3)]",
            "z-50"
          )}
        >
          {/* Master Toggle */}
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200 dark:border-[#262626]">
            <div className="flex items-center gap-2">
              <span className="text-lg">{currentTheme.icon}</span>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Sound Effects
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {currentTheme.name}
                </p>
              </div>
            </div>
            <button
              onClick={handleToggle}
              className={cn(
                "relative w-10 h-6 rounded-full transition-colors",
                settings.enabled
                  ? "bg-gradient-to-r from-violet-600 to-blue-600"
                  : "bg-gray-300 dark:bg-[#262626]"
              )}
              aria-label={settings.enabled ? "Disable sounds" : "Enable sounds"}
            >
              <span
                className={cn(
                  "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                  settings.enabled ? "left-[18px]" : "left-0.5"
                )}
              />
            </button>
          </div>

          {/* Theme Selection */}
          {settings.enabled && (
            <>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Quick Theme Switch
              </p>
              <div className="grid grid-cols-5 gap-1.5">
                {THEME_LIST.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => handleThemeSelect(theme.id)}
                    title={theme.name}
                    className={cn(
                      "p-1.5 rounded-lg text-base transition-all",
                      "border",
                      settings.theme === theme.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-[#262626] hover:border-blue-300 dark:hover:border-blue-700"
                    )}
                  >
                    {theme.icon}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
