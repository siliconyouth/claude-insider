"use client";

/**
 * Location & Timezone Step
 *
 * Step 2: Collect user's location (country + city) and timezone.
 * This is a required step (not skippable).
 *
 * Requirements:
 * - Country: Required (dropdown)
 * - City: Optional (text input)
 * - Timezone: Required (auto-detected, editable)
 */

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/design-system";
import { useWizard } from "../wizard-context";
import { WizardNavigation } from "../wizard-navigation";
import { StepWrapper } from "../shared/step-wrapper";
import { COUNTRIES, findCountry, formatLocation } from "@/lib/countries";
import {
  TIMEZONES,
  getTimezoneGroups,
  detectTimezone,
  formatTimeInTimezone,
  findTimezone,
} from "@/lib/timezone";

export function LocationTimezoneStep() {
  const { data, updateData, setError } = useWizard();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

  // Auto-detect timezone on mount if not set
  useEffect(() => {
    if (!data.timezone) {
      const detected = detectTimezone();
      updateData({ timezone: detected });
    }
  }, [data.timezone, updateData]);

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
      if (data.timezone) {
        setCurrentTime(formatTimeInTimezone(data.timezone));
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [data.timezone]);

  // Selected country display
  const selectedCountry = data.countryCode
    ? findCountry(data.countryCode)
    : null;

  // Location preview
  const locationPreview = formatLocation(data.city, data.countryCode);

  const handleCountrySelect = (code: string) => {
    updateData({ countryCode: code });
    setIsCountryDropdownOpen(false);
    setSearchQuery("");
  };

  const handleNext = async (): Promise<boolean> => {
    // Validate country
    if (!data.countryCode) {
      setError("Please select your country");
      return false;
    }

    // Validate timezone
    if (!data.timezone) {
      setError("Please select your timezone");
      return false;
    }

    // Save location and timezone
    try {
      const response = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: formatLocation(data.city, data.countryCode),
          timezone: data.timezone,
          countryCode: data.countryCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save location");
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save location");
      return false;
    }
  };

  return (
    <StepWrapper>
      <div className="space-y-5">
        {/* Country dropdown */}
        <div className="relative">
          <label
            htmlFor="country"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Country <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
            className={cn(
              "w-full px-4 py-2.5 rounded-lg text-left",
              "bg-white dark:bg-gray-900",
              "border border-gray-200 dark:border-gray-700",
              "text-gray-900 dark:text-white",
              "focus:outline-none focus:ring-2 focus:ring-blue-500",
              "transition-colors duration-200",
              "flex items-center justify-between"
            )}
          >
            {selectedCountry ? (
              <span className="flex items-center gap-2">
                <span>{selectedCountry.flag}</span>
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
                "absolute z-50 mt-1 w-full",
                "bg-white dark:bg-gray-900",
                "border border-gray-200 dark:border-gray-700",
                "rounded-lg shadow-lg",
                "max-h-60 overflow-auto"
              )}
            >
              {/* Search input */}
              <div className="sticky top-0 p-2 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search countries..."
                  className={cn(
                    "w-full px-3 py-2 text-sm rounded-md",
                    "bg-gray-50 dark:bg-gray-800",
                    "border border-gray-200 dark:border-gray-700",
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
                        "w-full px-4 py-2 text-left text-sm",
                        "flex items-center gap-2",
                        "hover:bg-gray-50 dark:hover:bg-gray-800",
                        "transition-colors",
                        data.countryCode === country.code &&
                          "bg-blue-50 dark:bg-blue-900/20"
                      )}
                    >
                      <span>{country.flag}</span>
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
          <label
            htmlFor="city"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            City <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="city"
            type="text"
            value={data.city}
            onChange={(e) => updateData({ city: e.target.value })}
            maxLength={100}
            className={cn(
              "w-full px-4 py-2.5 rounded-lg",
              "bg-white dark:bg-gray-900",
              "border border-gray-200 dark:border-gray-700",
              "text-gray-900 dark:text-white",
              "placeholder-gray-400 dark:placeholder-gray-500",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "transition-colors duration-200"
            )}
            placeholder="e.g., Belgrade, New York, Tokyo"
          />
        </div>

        {/* Timezone dropdown */}
        <div>
          <label
            htmlFor="timezone"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Timezone <span className="text-red-500">*</span>
          </label>
          <select
            id="timezone"
            value={data.timezone}
            onChange={(e) => updateData({ timezone: e.target.value })}
            className={cn(
              "w-full px-4 py-2.5 rounded-lg",
              "bg-white dark:bg-gray-900",
              "border border-gray-200 dark:border-gray-700",
              "text-gray-900 dark:text-white",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "transition-colors duration-200"
            )}
          >
            <option value="">Select timezone</option>
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
          <p className="text-xs text-gray-400 mt-1">
            Auto-detected from your browser. You can change it if needed.
          </p>
        </div>

        {/* Preview */}
        {(locationPreview || data.timezone) && (
          <div
            className={cn(
              "p-4 rounded-lg",
              "bg-gradient-to-r from-violet-500/10 via-blue-500/10 to-cyan-500/10",
              "border border-blue-500/20"
            )}
          >
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Preview
            </p>
            <div className="flex items-center gap-3 text-sm">
              {locationPreview && (
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                  <svg
                    className="w-4 h-4"
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
              {locationPreview && data.timezone && (
                <span className="text-gray-400">•</span>
              )}
              {data.timezone && currentTime && (
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                  <svg
                    className="w-4 h-4"
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
                    ({findTimezone(data.timezone)?.label || data.timezone})
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <WizardNavigation onNext={handleNext} />
    </StepWrapper>
  );
}
