"use client";

/**
 * Location & Timezone Settings
 *
 * Allows users to update their location and timezone from settings.
 * Shows live preview of current local time.
 */

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/design-system";
import { useToast } from "@/components/toast";
import { COUNTRIES, findCountry, formatLocation } from "@/lib/countries";
import {
  getTimezoneGroups,
  formatTimeInTimezone,
  findTimezone,
} from "@/lib/timezone";

interface LocationTimezoneSettingsProps {
  initialLocation?: string;
  initialTimezone?: string;
  initialCountryCode?: string;
  onUpdate?: () => void;
}

export function LocationTimezoneSettings({
  initialLocation,
  initialTimezone,
  initialCountryCode,
  onUpdate,
}: LocationTimezoneSettingsProps) {
  const toast = useToast();

  // Parse city from location string (e.g., "Belgrade, Serbia" -> "Belgrade")
  const parseCity = (location: string | undefined): string => {
    if (!location) return "";
    const parts = location.split(",");
    return parts.length > 1 ? (parts[0]?.trim() ?? "") : "";
  };

  const [city, setCity] = useState(parseCity(initialLocation));
  const [countryCode, setCountryCode] = useState(initialCountryCode || "");
  const [timezone, setTimezone] = useState(initialTimezone || "UTC");
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Track changes
  useEffect(() => {
    const locationChanged =
      formatLocation(city, countryCode) !== initialLocation;
    const timezoneChanged = timezone !== (initialTimezone || "UTC");
    setHasChanges(locationChanged || timezoneChanged);
  }, [city, countryCode, timezone, initialLocation, initialTimezone]);

  // Filter countries based on search
  const filteredCountries = useMemo(() => {
    if (!searchQuery) return COUNTRIES;
    const query = searchQuery.toLowerCase();
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.code.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Get timezone groups for dropdown
  const timezoneGroups = useMemo(() => getTimezoneGroups(), []);

  // Current time preview
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      if (timezone) {
        setCurrentTime(formatTimeInTimezone(timezone));
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [timezone]);

  // Selected country display
  const selectedCountry = countryCode ? findCountry(countryCode) : null;

  // Location preview
  const locationPreview = formatLocation(city, countryCode);

  const handleCountrySelect = (code: string) => {
    setCountryCode(code);
    setIsCountryDropdownOpen(false);
    setSearchQuery("");
  };

  const handleSave = async () => {
    if (!countryCode) {
      toast.error("Please select your country");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: formatLocation(city, countryCode),
          timezone,
          countryCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save");
      }

      toast.success("Location & timezone updated");
      setHasChanges(false);
      onUpdate?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save location"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Country dropdown */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Country
        </label>
        <button
          type="button"
          onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
          className={cn(
            "w-full px-4 py-3 rounded-xl text-left",
            "bg-gray-50 dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]",
            "text-gray-900 dark:text-white",
            "hover:border-blue-500/50 dark:hover:border-blue-500/50",
            "focus:outline-none focus:ring-2 focus:ring-blue-500",
            "transition-colors duration-200",
            "flex items-center justify-between"
          )}
        >
          {selectedCountry ? (
            <span className="flex items-center gap-2">
              <span className="text-xl">{selectedCountry.flag}</span>
              <span>{selectedCountry.name}</span>
            </span>
          ) : (
            <span className="text-gray-400">Select your country</span>
          )}
          <svg
            className={cn(
              "w-5 h-5 text-gray-400 transition-transform",
              isCountryDropdownOpen && "rotate-180"
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Country dropdown */}
        {isCountryDropdownOpen && (
          <div
            className={cn(
              "absolute z-50 mt-2 w-full",
              "bg-white dark:bg-[#111111]",
              "border border-gray-200 dark:border-[#262626]",
              "rounded-xl shadow-lg",
              "max-h-64 overflow-auto"
            )}
          >
            {/* Search input */}
            <div className="sticky top-0 p-3 bg-white dark:bg-[#111111] border-b border-gray-100 dark:border-gray-800">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search countries..."
                className={cn(
                  "w-full px-3 py-2 text-sm rounded-lg",
                  "bg-gray-50 dark:bg-[#0a0a0a]",
                  "border border-gray-200 dark:border-[#262626]",
                  "text-gray-900 dark:text-white",
                  "placeholder-gray-400",
                  "focus:outline-none focus:ring-1 focus:ring-blue-500"
                )}
                autoFocus
              />
            </div>

            {/* Country list */}
            <div className="py-1">
              {filteredCountries.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  No countries found
                </div>
              ) : (
                filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountrySelect(country.code)}
                    className={cn(
                      "w-full px-4 py-2.5 text-left text-sm",
                      "flex items-center gap-3",
                      "hover:bg-gray-50 dark:hover:bg-[#1a1a1a]",
                      "transition-colors",
                      countryCode === country.code &&
                        "bg-blue-50 dark:bg-blue-900/20"
                    )}
                  >
                    <span className="text-xl">{country.flag}</span>
                    <span className="text-gray-900 dark:text-white">
                      {country.name}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* City input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          City{" "}
          <span className="text-gray-400 font-normal text-xs">(optional)</span>
        </label>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          maxLength={100}
          className={cn(
            "w-full px-4 py-3 rounded-xl",
            "bg-gray-50 dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]",
            "text-gray-900 dark:text-white",
            "placeholder-gray-400 dark:placeholder-gray-500",
            "hover:border-blue-500/50 dark:hover:border-blue-500/50",
            "focus:outline-none focus:ring-2 focus:ring-blue-500",
            "transition-colors duration-200"
          )}
          placeholder="e.g., Belgrade, New York, Tokyo"
        />
      </div>

      {/* Timezone dropdown */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Timezone
        </label>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className={cn(
            "w-full px-4 py-3 rounded-xl",
            "bg-gray-50 dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]",
            "text-gray-900 dark:text-white",
            "hover:border-blue-500/50 dark:hover:border-blue-500/50",
            "focus:outline-none focus:ring-2 focus:ring-blue-500",
            "transition-colors duration-200"
          )}
        >
          {timezoneGroups.map((group) => (
            <optgroup key={group.region} label={group.region}>
              {group.timezones.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label} ({tz.offset})
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Preview */}
      {(locationPreview || timezone) && (
        <div
          className={cn(
            "p-4 rounded-xl",
            "bg-gradient-to-r from-violet-500/5 via-blue-500/5 to-cyan-500/5",
            "border border-blue-500/10"
          )}
        >
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Preview on Profile
          </p>
          <div className="flex items-center gap-3 text-sm">
            {locationPreview && (
              <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>{locationPreview}</span>
              </div>
            )}
            {locationPreview && timezone && (
              <span className="text-gray-300 dark:text-gray-600">•</span>
            )}
            {timezone && currentTime && (
              <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{currentTime}</span>
                <span className="text-gray-400 text-xs">
                  ({findTimezone(timezone)?.label || timezone})
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className={cn(
            "px-6 py-2.5 rounded-xl text-sm font-medium",
            "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
            "text-white",
            "hover:opacity-90",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            "transition-all duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>

        {hasChanges && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            You have unsaved changes
          </span>
        )}
      </div>
    </div>
  );
}
