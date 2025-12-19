/**
 * Timezone Utilities
 *
 * Provides timezone list, formatting, and display utilities.
 * Uses IANA timezone names which are natively supported by JavaScript's Intl API.
 */

export interface TimezoneOption {
  value: string;
  label: string;
  offset: string;
  region: string;
}

export interface TimezoneGroup {
  region: string;
  timezones: TimezoneOption[];
}

/**
 * Common timezones grouped by region
 * Includes most populated cities and major business centers
 */
export const TIMEZONES: TimezoneOption[] = [
  // UTC
  { value: "UTC", label: "UTC (Coordinated Universal Time)", offset: "+00:00", region: "UTC" },

  // Africa
  { value: "Africa/Cairo", label: "Cairo", offset: "+02:00", region: "Africa" },
  { value: "Africa/Johannesburg", label: "Johannesburg", offset: "+02:00", region: "Africa" },
  { value: "Africa/Lagos", label: "Lagos", offset: "+01:00", region: "Africa" },
  { value: "Africa/Nairobi", label: "Nairobi", offset: "+03:00", region: "Africa" },

  // America
  { value: "America/Anchorage", label: "Anchorage", offset: "-09:00", region: "America" },
  { value: "America/Chicago", label: "Chicago (Central)", offset: "-06:00", region: "America" },
  { value: "America/Denver", label: "Denver (Mountain)", offset: "-07:00", region: "America" },
  { value: "America/Los_Angeles", label: "Los Angeles (Pacific)", offset: "-08:00", region: "America" },
  { value: "America/New_York", label: "New York (Eastern)", offset: "-05:00", region: "America" },
  { value: "America/Phoenix", label: "Phoenix (Arizona)", offset: "-07:00", region: "America" },
  { value: "America/Sao_Paulo", label: "São Paulo", offset: "-03:00", region: "America" },
  { value: "America/Toronto", label: "Toronto", offset: "-05:00", region: "America" },
  { value: "America/Vancouver", label: "Vancouver", offset: "-08:00", region: "America" },
  { value: "America/Mexico_City", label: "Mexico City", offset: "-06:00", region: "America" },
  { value: "America/Buenos_Aires", label: "Buenos Aires", offset: "-03:00", region: "America" },
  { value: "America/Bogota", label: "Bogota", offset: "-05:00", region: "America" },
  { value: "America/Lima", label: "Lima", offset: "-05:00", region: "America" },
  { value: "America/Santiago", label: "Santiago", offset: "-04:00", region: "America" },

  // Asia
  { value: "Asia/Bangkok", label: "Bangkok", offset: "+07:00", region: "Asia" },
  { value: "Asia/Dubai", label: "Dubai", offset: "+04:00", region: "Asia" },
  { value: "Asia/Hong_Kong", label: "Hong Kong", offset: "+08:00", region: "Asia" },
  { value: "Asia/Jakarta", label: "Jakarta", offset: "+07:00", region: "Asia" },
  { value: "Asia/Jerusalem", label: "Jerusalem", offset: "+02:00", region: "Asia" },
  { value: "Asia/Kolkata", label: "Kolkata (India)", offset: "+05:30", region: "Asia" },
  { value: "Asia/Manila", label: "Manila", offset: "+08:00", region: "Asia" },
  { value: "Asia/Seoul", label: "Seoul", offset: "+09:00", region: "Asia" },
  { value: "Asia/Shanghai", label: "Shanghai", offset: "+08:00", region: "Asia" },
  { value: "Asia/Singapore", label: "Singapore", offset: "+08:00", region: "Asia" },
  { value: "Asia/Tokyo", label: "Tokyo", offset: "+09:00", region: "Asia" },
  { value: "Asia/Taipei", label: "Taipei", offset: "+08:00", region: "Asia" },
  { value: "Asia/Ho_Chi_Minh", label: "Ho Chi Minh City", offset: "+07:00", region: "Asia" },
  { value: "Asia/Kuala_Lumpur", label: "Kuala Lumpur", offset: "+08:00", region: "Asia" },

  // Australia & Pacific
  { value: "Australia/Sydney", label: "Sydney", offset: "+11:00", region: "Pacific" },
  { value: "Australia/Melbourne", label: "Melbourne", offset: "+11:00", region: "Pacific" },
  { value: "Australia/Brisbane", label: "Brisbane", offset: "+10:00", region: "Pacific" },
  { value: "Australia/Perth", label: "Perth", offset: "+08:00", region: "Pacific" },
  { value: "Pacific/Auckland", label: "Auckland", offset: "+13:00", region: "Pacific" },
  { value: "Pacific/Honolulu", label: "Honolulu (Hawaii)", offset: "-10:00", region: "Pacific" },

  // Europe
  { value: "Europe/Amsterdam", label: "Amsterdam", offset: "+01:00", region: "Europe" },
  { value: "Europe/Athens", label: "Athens", offset: "+02:00", region: "Europe" },
  { value: "Europe/Belgrade", label: "Belgrade", offset: "+01:00", region: "Europe" },
  { value: "Europe/Berlin", label: "Berlin", offset: "+01:00", region: "Europe" },
  { value: "Europe/Brussels", label: "Brussels", offset: "+01:00", region: "Europe" },
  { value: "Europe/Bucharest", label: "Bucharest", offset: "+02:00", region: "Europe" },
  { value: "Europe/Budapest", label: "Budapest", offset: "+01:00", region: "Europe" },
  { value: "Europe/Copenhagen", label: "Copenhagen", offset: "+01:00", region: "Europe" },
  { value: "Europe/Dublin", label: "Dublin", offset: "+00:00", region: "Europe" },
  { value: "Europe/Helsinki", label: "Helsinki", offset: "+02:00", region: "Europe" },
  { value: "Europe/Istanbul", label: "Istanbul", offset: "+03:00", region: "Europe" },
  { value: "Europe/Kiev", label: "Kyiv", offset: "+02:00", region: "Europe" },
  { value: "Europe/Lisbon", label: "Lisbon", offset: "+00:00", region: "Europe" },
  { value: "Europe/London", label: "London", offset: "+00:00", region: "Europe" },
  { value: "Europe/Madrid", label: "Madrid", offset: "+01:00", region: "Europe" },
  { value: "Europe/Moscow", label: "Moscow", offset: "+03:00", region: "Europe" },
  { value: "Europe/Oslo", label: "Oslo", offset: "+01:00", region: "Europe" },
  { value: "Europe/Paris", label: "Paris", offset: "+01:00", region: "Europe" },
  { value: "Europe/Prague", label: "Prague", offset: "+01:00", region: "Europe" },
  { value: "Europe/Rome", label: "Rome", offset: "+01:00", region: "Europe" },
  { value: "Europe/Stockholm", label: "Stockholm", offset: "+01:00", region: "Europe" },
  { value: "Europe/Vienna", label: "Vienna", offset: "+01:00", region: "Europe" },
  { value: "Europe/Warsaw", label: "Warsaw", offset: "+01:00", region: "Europe" },
  { value: "Europe/Zurich", label: "Zurich", offset: "+01:00", region: "Europe" },
];

/**
 * Group timezones by region for dropdown display
 */
export function getTimezoneGroups(): TimezoneGroup[] {
  const groups: Record<string, TimezoneOption[]> = {};

  for (const tz of TIMEZONES) {
    const regionTimezones = groups[tz.region];
    if (!regionTimezones) {
      groups[tz.region] = [tz];
    } else {
      regionTimezones.push(tz);
    }
  }

  // Order regions logically
  const regionOrder = ["UTC", "America", "Europe", "Asia", "Africa", "Pacific"];

  return regionOrder
    .filter((region) => region in groups)
    .map((region) => {
      const timezones = groups[region] ?? [];
      return {
        region,
        timezones: timezones.sort((a, b) => a.label.localeCompare(b.label)),
      };
    });
}

/**
 * Detect user's timezone from browser
 */
export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

/**
 * Format time for a specific timezone
 * @param timezone IANA timezone name
 * @param format 'short' for "3:45 PM", 'long' for "3:45:30 PM"
 */
export function formatTimeInTimezone(
  timezone: string,
  format: "short" | "long" = "short"
): string {
  try {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: timezone,
    };

    if (format === "long") {
      options.second = "2-digit";
    }

    return new Intl.DateTimeFormat("en-US", options).format(now);
  } catch {
    return "—";
  }
}

/**
 * Get the current UTC offset for a timezone (handles DST)
 * @returns Offset string like "+02:00" or "-05:00"
 */
export function getTimezoneOffset(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "shortOffset",
    });

    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find((p) => p.type === "timeZoneName");

    if (offsetPart?.value) {
      // Convert "GMT+2" to "+02:00"
      const match = offsetPart.value.match(/GMT([+-]?)(\d+)?(?::(\d+))?/);
      if (match) {
        const sign = match[1] || "+";
        const hours = (match[2] || "0").padStart(2, "0");
        const minutes = (match[3] || "0").padStart(2, "0");
        return `${sign}${hours}:${minutes}`;
      }
    }

    return "+00:00";
  } catch {
    return "+00:00";
  }
}

/**
 * Get a display label for a timezone with current time
 * @returns "3:45 PM (Europe/Belgrade)"
 */
export function getTimezoneDisplayLabel(timezone: string): string {
  const time = formatTimeInTimezone(timezone);
  const tz = TIMEZONES.find((t) => t.value === timezone);
  const label = tz?.label || timezone.split("/").pop()?.replace(/_/g, " ") || timezone;
  return `${time} (${label})`;
}

/**
 * Find timezone by value
 */
export function findTimezone(value: string): TimezoneOption | undefined {
  return TIMEZONES.find((tz) => tz.value === value);
}

/**
 * Validate if a timezone string is valid IANA timezone
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}
