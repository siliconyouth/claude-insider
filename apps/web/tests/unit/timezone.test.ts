/**
 * Timezone Utilities Tests
 *
 * Tests for timezone list, formatting, and display utilities.
 * Uses IANA timezone names which are natively supported by JavaScript's Intl API.
 */

import { describe, it, expect } from "vitest";
import {
  TIMEZONES,
  getTimezoneGroups,
  detectTimezone,
  formatTimeInTimezone,
  getTimezoneOffset,
  getTimezoneDisplayLabel,
  findTimezone,
  isValidTimezone,
  type TimezoneOption,
  type TimezoneGroup,
} from "@/lib/timezone";

describe("TIMEZONES constant", () => {
  it("should have all expected regions", () => {
    const regions = [...new Set(TIMEZONES.map((tz) => tz.region))];

    expect(regions).toContain("UTC");
    expect(regions).toContain("Africa");
    expect(regions).toContain("America");
    expect(regions).toContain("Asia");
    expect(regions).toContain("Europe");
    expect(regions).toContain("Pacific");
  });

  it("should have valid timezone option structure", () => {
    TIMEZONES.forEach((tz) => {
      expect(tz).toHaveProperty("value");
      expect(tz).toHaveProperty("label");
      expect(tz).toHaveProperty("offset");
      expect(tz).toHaveProperty("region");
      expect(typeof tz.value).toBe("string");
      expect(typeof tz.label).toBe("string");
      expect(typeof tz.offset).toBe("string");
      expect(typeof tz.region).toBe("string");
    });
  });

  it("should have offset in correct format", () => {
    TIMEZONES.forEach((tz) => {
      // Offset should match +/-HH:MM format
      expect(tz.offset).toMatch(/^[+-]\d{2}:\d{2}$/);
    });
  });

  it("should have non-empty labels", () => {
    TIMEZONES.forEach((tz) => {
      expect(tz.label.length).toBeGreaterThan(0);
    });
  });

  it("should have unique values (no duplicates)", () => {
    const values = TIMEZONES.map((tz) => tz.value);
    const uniqueValues = [...new Set(values)];
    expect(values.length).toBe(uniqueValues.length);
  });

  it("should contain major world timezones", () => {
    const values = TIMEZONES.map((tz) => tz.value);

    expect(values).toContain("UTC");
    expect(values).toContain("America/New_York");
    expect(values).toContain("America/Los_Angeles");
    expect(values).toContain("Europe/London");
    expect(values).toContain("Europe/Paris");
    expect(values).toContain("Asia/Tokyo");
    expect(values).toContain("Asia/Singapore");
    expect(values).toContain("Australia/Sydney");
  });

  it("should have at least 50 timezones", () => {
    expect(TIMEZONES.length).toBeGreaterThanOrEqual(50);
  });
});

describe("getTimezoneGroups", () => {
  it("should return groups in correct order", () => {
    const groups = getTimezoneGroups();
    const regionOrder = groups.map((g) => g.region);

    expect(regionOrder).toEqual(["UTC", "America", "Europe", "Asia", "Africa", "Pacific"]);
  });

  it("should have correct group structure", () => {
    const groups = getTimezoneGroups();

    groups.forEach((group) => {
      expect(group).toHaveProperty("region");
      expect(group).toHaveProperty("timezones");
      expect(typeof group.region).toBe("string");
      expect(Array.isArray(group.timezones)).toBe(true);
    });
  });

  it("should have timezones sorted alphabetically within each group", () => {
    const groups = getTimezoneGroups();

    groups.forEach((group) => {
      const labels = group.timezones.map((tz) => tz.label);
      const sortedLabels = [...labels].sort((a, b) => a.localeCompare(b));
      expect(labels).toEqual(sortedLabels);
    });
  });

  it("should include all timezones from original list", () => {
    const groups = getTimezoneGroups();
    const allTimezonesInGroups = groups.flatMap((g) => g.timezones);

    expect(allTimezonesInGroups.length).toBe(TIMEZONES.length);
  });

  it("should have UTC as first group with single timezone", () => {
    const groups = getTimezoneGroups();
    const utcGroup = groups[0];

    expect(utcGroup?.region).toBe("UTC");
    expect(utcGroup?.timezones.length).toBe(1);
    expect(utcGroup?.timezones[0]?.value).toBe("UTC");
  });
});

describe("detectTimezone", () => {
  it("should return a string", () => {
    const tz = detectTimezone();
    expect(typeof tz).toBe("string");
  });

  it("should return a valid IANA timezone", () => {
    const tz = detectTimezone();
    // Should be valid if we can use it with Intl
    expect(() => {
      new Intl.DateTimeFormat(undefined, { timeZone: tz });
    }).not.toThrow();
  });
});

describe("formatTimeInTimezone", () => {
  it("should format time in short format", () => {
    const time = formatTimeInTimezone("UTC", "short");

    // Should match pattern like "3:45 PM" or "12:00 AM"
    expect(time).toMatch(/^\d{1,2}:\d{2}\s(?:AM|PM)$/);
  });

  it("should format time in long format with seconds", () => {
    const time = formatTimeInTimezone("UTC", "long");

    // Should match pattern like "3:45:30 PM"
    expect(time).toMatch(/^\d{1,2}:\d{2}:\d{2}\s(?:AM|PM)$/);
  });

  it("should default to short format", () => {
    const time = formatTimeInTimezone("UTC");

    // Should match short format
    expect(time).toMatch(/^\d{1,2}:\d{2}\s(?:AM|PM)$/);
  });

  it("should handle different timezones", () => {
    const nyTime = formatTimeInTimezone("America/New_York");
    const tokyoTime = formatTimeInTimezone("Asia/Tokyo");

    // Both should be valid times
    expect(nyTime).toMatch(/^\d{1,2}:\d{2}\s(?:AM|PM)$/);
    expect(tokyoTime).toMatch(/^\d{1,2}:\d{2}\s(?:AM|PM)$/);
  });

  it("should return dash for invalid timezone", () => {
    const time = formatTimeInTimezone("Invalid/Timezone");
    expect(time).toBe("—");
  });
});

describe("getTimezoneOffset", () => {
  it("should return offset in +/-HH:MM format", () => {
    const offset = getTimezoneOffset("UTC");
    expect(offset).toMatch(/^[+-]\d{2}:\d{2}$/);
  });

  it("should return +00:00 for UTC", () => {
    const offset = getTimezoneOffset("UTC");
    expect(offset).toBe("+00:00");
  });

  it("should handle various timezones", () => {
    // These should all return valid offset formats
    const offsets = [
      getTimezoneOffset("America/New_York"),
      getTimezoneOffset("Asia/Tokyo"),
      getTimezoneOffset("Europe/London"),
    ];

    offsets.forEach((offset) => {
      expect(offset).toMatch(/^[+-]\d{2}:\d{2}$/);
    });
  });

  it("should return +00:00 for invalid timezone", () => {
    const offset = getTimezoneOffset("Invalid/Timezone");
    expect(offset).toBe("+00:00");
  });

  it("should handle timezones with half-hour offsets", () => {
    const offset = getTimezoneOffset("Asia/Kolkata");
    // India is UTC+05:30
    expect(offset).toMatch(/^[+-]\d{2}:\d{2}$/);
  });
});

describe("getTimezoneDisplayLabel", () => {
  it("should return formatted display label", () => {
    const label = getTimezoneDisplayLabel("Europe/London");

    // Should contain time and location
    expect(label).toMatch(/\d{1,2}:\d{2}\s(?:AM|PM)/);
    expect(label).toContain("London");
  });

  it("should use label from TIMEZONES constant when available", () => {
    const label = getTimezoneDisplayLabel("America/New_York");

    // The label should contain "New York (Eastern)" from TIMEZONES
    expect(label).toContain("New York (Eastern)");
  });

  it("should handle timezone not in TIMEZONES constant", () => {
    const label = getTimezoneDisplayLabel("Africa/Addis_Ababa");

    // Should fall back to extracting city from value
    expect(label).toMatch(/\d{1,2}:\d{2}\s(?:AM|PM)/);
    expect(label).toContain("Addis Ababa");
  });
});

describe("findTimezone", () => {
  it("should find timezone by value", () => {
    const tz = findTimezone("Europe/London");

    expect(tz).toBeDefined();
    expect(tz?.value).toBe("Europe/London");
    expect(tz?.label).toBe("London");
    expect(tz?.region).toBe("Europe");
  });

  it("should return undefined for non-existent timezone", () => {
    const tz = findTimezone("Invalid/Timezone");
    expect(tz).toBeUndefined();
  });

  it("should find UTC timezone", () => {
    const tz = findTimezone("UTC");

    expect(tz).toBeDefined();
    expect(tz?.value).toBe("UTC");
    expect(tz?.region).toBe("UTC");
  });

  it("should be case-sensitive", () => {
    const tz = findTimezone("europe/london");
    expect(tz).toBeUndefined();
  });
});

describe("isValidTimezone", () => {
  it("should return true for valid IANA timezones", () => {
    expect(isValidTimezone("UTC")).toBe(true);
    expect(isValidTimezone("America/New_York")).toBe(true);
    expect(isValidTimezone("Europe/London")).toBe(true);
    expect(isValidTimezone("Asia/Tokyo")).toBe(true);
    expect(isValidTimezone("Pacific/Auckland")).toBe(true);
  });

  it("should return true for timezones not in TIMEZONES constant", () => {
    // These are valid IANA timezones but not in our curated list
    expect(isValidTimezone("Africa/Addis_Ababa")).toBe(true);
    expect(isValidTimezone("Asia/Kathmandu")).toBe(true);
    expect(isValidTimezone("Pacific/Fiji")).toBe(true);
  });

  it("should return false for invalid timezones", () => {
    expect(isValidTimezone("Invalid/Timezone")).toBe(false);
    expect(isValidTimezone("NotARealTimezone")).toBe(false);
    expect(isValidTimezone("")).toBe(false);
    expect(isValidTimezone("America/Fake_City")).toBe(false);
  });

  it("should return false for partially correct timezone names", () => {
    expect(isValidTimezone("America")).toBe(false);
    expect(isValidTimezone("Europe/")).toBe(false);
    expect(isValidTimezone("/London")).toBe(false);
  });
});

describe("Type Exports", () => {
  it("should export TimezoneOption type with correct shape", () => {
    const option: TimezoneOption = {
      value: "test",
      label: "Test",
      offset: "+00:00",
      region: "UTC",
    };

    expect(option.value).toBe("test");
    expect(option.label).toBe("Test");
    expect(option.offset).toBe("+00:00");
    expect(option.region).toBe("UTC");
  });

  it("should export TimezoneGroup type with correct shape", () => {
    const group: TimezoneGroup = {
      region: "Test",
      timezones: [],
    };

    expect(group.region).toBe("Test");
    expect(Array.isArray(group.timezones)).toBe(true);
  });
});
