/**
 * LocationTimezoneSettings Component Tests
 *
 * Tests for the location timezone settings component:
 * - Country dropdown
 * - Country search
 * - City input
 * - Timezone selector
 * - Preview section
 * - Save functionality
 * - Change detection
 * - Initial values
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LocationTimezoneSettings } from "@/components/settings/location-timezone-settings";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock toast hook
const mockSuccess = vi.fn();
const mockError = vi.fn();
vi.mock("@/components/toast", () => ({
  useToast: () => ({
    success: mockSuccess,
    error: mockError,
  }),
}));

// Mock countries module
vi.mock("@/lib/countries", () => ({
  COUNTRIES: [
    { code: "US", name: "United States", flag: "🇺🇸" },
    { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
    { code: "RS", name: "Serbia", flag: "🇷🇸" },
    { code: "DE", name: "Germany", flag: "🇩🇪" },
  ],
  findCountry: (code: string) => {
    const countries: Record<string, { code: string; name: string; flag: string }> = {
      US: { code: "US", name: "United States", flag: "🇺🇸" },
      GB: { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
      RS: { code: "RS", name: "Serbia", flag: "🇷🇸" },
      DE: { code: "DE", name: "Germany", flag: "🇩🇪" },
    };
    return countries[code] || null;
  },
  formatLocation: (city: string, countryCode: string) => {
    if (!countryCode) return "";
    const names: Record<string, string> = {
      US: "United States",
      GB: "United Kingdom",
      RS: "Serbia",
      DE: "Germany",
    };
    return city ? `${city}, ${names[countryCode]}` : names[countryCode] || "";
  },
}));

// Mock timezone module
vi.mock("@/lib/timezone", () => ({
  getTimezoneGroups: () => [
    {
      region: "America",
      timezones: [
        { value: "America/New_York", label: "New York", offset: "-05:00" },
        { value: "America/Los_Angeles", label: "Los Angeles", offset: "-08:00" },
      ],
    },
    {
      region: "Europe",
      timezones: [
        { value: "Europe/London", label: "London", offset: "+00:00" },
        { value: "Europe/Belgrade", label: "Belgrade", offset: "+01:00" },
      ],
    },
  ],
  formatTimeInTimezone: () => "12:00 PM",
  findTimezone: (tz: string) => ({ value: tz, label: tz.split("/")[1] }),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("LocationTimezoneSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Country Dropdown", () => {
    it("should show Country label", () => {
      render(<LocationTimezoneSettings />);
      expect(screen.getByText("Country")).toBeInTheDocument();
    });

    it("should show placeholder when no country selected", () => {
      render(<LocationTimezoneSettings />);
      expect(screen.getByText("Select your country")).toBeInTheDocument();
    });

    it("should show selected country with flag", () => {
      render(<LocationTimezoneSettings initialCountryCode="US" />);
      // Country should be shown in the dropdown button
      const countryElements = screen.getAllByText(/United States/);
      expect(countryElements.length).toBeGreaterThan(0);
    });

    it("should open dropdown when clicked", () => {
      render(<LocationTimezoneSettings />);

      fireEvent.click(screen.getByText("Select your country"));

      expect(screen.getByPlaceholderText("Search countries...")).toBeInTheDocument();
    });

    it("should show all countries in dropdown", () => {
      render(<LocationTimezoneSettings />);

      fireEvent.click(screen.getByText("Select your country"));

      expect(screen.getByText("United States")).toBeInTheDocument();
      expect(screen.getByText("United Kingdom")).toBeInTheDocument();
      expect(screen.getByText("Serbia")).toBeInTheDocument();
      expect(screen.getByText("Germany")).toBeInTheDocument();
    });

    it("should select country when clicked", () => {
      render(<LocationTimezoneSettings />);

      fireEvent.click(screen.getByText("Select your country"));
      fireEvent.click(screen.getByText("Serbia"));

      expect(screen.getByText("🇷🇸")).toBeInTheDocument();
    });
  });

  describe("Country Search", () => {
    it("should filter countries by search query", () => {
      render(<LocationTimezoneSettings />);

      fireEvent.click(screen.getByText("Select your country"));
      fireEvent.change(screen.getByPlaceholderText("Search countries..."), {
        target: { value: "United" },
      });

      expect(screen.getByText("United States")).toBeInTheDocument();
      expect(screen.getByText("United Kingdom")).toBeInTheDocument();
      expect(screen.queryByText("Serbia")).not.toBeInTheDocument();
      expect(screen.queryByText("Germany")).not.toBeInTheDocument();
    });

    it("should show no results message when no matches", () => {
      render(<LocationTimezoneSettings />);

      fireEvent.click(screen.getByText("Select your country"));
      fireEvent.change(screen.getByPlaceholderText("Search countries..."), {
        target: { value: "xyz" },
      });

      expect(screen.getByText("No countries found")).toBeInTheDocument();
    });
  });

  describe("City Input", () => {
    it("should show City label", () => {
      render(<LocationTimezoneSettings />);
      expect(screen.getByText(/City/)).toBeInTheDocument();
    });

    it("should show optional indicator", () => {
      render(<LocationTimezoneSettings />);
      expect(screen.getByText("(optional)")).toBeInTheDocument();
    });

    it("should show city placeholder", () => {
      render(<LocationTimezoneSettings />);
      expect(screen.getByPlaceholderText("e.g., Belgrade, New York, Tokyo")).toBeInTheDocument();
    });

    it("should populate city from initial location", () => {
      render(<LocationTimezoneSettings initialLocation="Belgrade, Serbia" />);
      const cityInput = screen.getByPlaceholderText("e.g., Belgrade, New York, Tokyo") as HTMLInputElement;
      expect(cityInput.value).toBe("Belgrade");
    });
  });

  describe("Timezone Selector", () => {
    it("should show Timezone label", () => {
      render(<LocationTimezoneSettings />);
      expect(screen.getByText("Timezone")).toBeInTheDocument();
    });

    it("should show timezone dropdown", () => {
      render(<LocationTimezoneSettings />);
      const select = screen.getByRole("combobox");
      expect(select).toBeInTheDocument();
    });

    it("should have timezone groups", () => {
      const { container } = render(<LocationTimezoneSettings />);
      const optgroups = container.querySelectorAll("optgroup");
      expect(optgroups.length).toBeGreaterThan(0);
    });

    it("should use initial timezone", () => {
      render(<LocationTimezoneSettings initialTimezone="Europe/Belgrade" />);
      const select = screen.getByRole("combobox") as HTMLSelectElement;
      expect(select.value).toBe("Europe/Belgrade");
    });
  });

  describe("Preview Section", () => {
    it("should show Preview on Profile label", () => {
      render(<LocationTimezoneSettings initialCountryCode="RS" initialTimezone="Europe/Belgrade" />);
      expect(screen.getByText("Preview on Profile")).toBeInTheDocument();
    });

    it("should show location in preview", () => {
      render(<LocationTimezoneSettings initialCountryCode="RS" initialLocation="Belgrade, Serbia" />);
      expect(screen.getByText("Belgrade, Serbia")).toBeInTheDocument();
    });

    it("should show current time in preview", () => {
      render(<LocationTimezoneSettings initialTimezone="UTC" />);
      expect(screen.getByText("12:00 PM")).toBeInTheDocument();
    });
  });

  describe("Save Button", () => {
    it("should show Save Changes button", () => {
      render(<LocationTimezoneSettings />);
      expect(screen.getByRole("button", { name: "Save Changes" })).toBeInTheDocument();
    });

    it("should be disabled when no changes", () => {
      render(<LocationTimezoneSettings initialCountryCode="RS" initialTimezone="UTC" initialLocation="Serbia" />);
      const saveButton = screen.getByRole("button", { name: "Save Changes" });
      expect(saveButton).toBeDisabled();
    });

    it("should be enabled when changes made", () => {
      render(<LocationTimezoneSettings initialCountryCode="RS" initialTimezone="UTC" />);

      fireEvent.change(screen.getByPlaceholderText("e.g., Belgrade, New York, Tokyo"), {
        target: { value: "Novi Sad" },
      });

      const saveButton = screen.getByRole("button", { name: "Save Changes" });
      expect(saveButton).not.toBeDisabled();
    });

    it("should show unsaved changes indicator", () => {
      render(<LocationTimezoneSettings initialCountryCode="RS" initialTimezone="UTC" />);

      fireEvent.change(screen.getByPlaceholderText("e.g., Belgrade, New York, Tokyo"), {
        target: { value: "Novi Sad" },
      });

      expect(screen.getByText("You have unsaved changes")).toBeInTheDocument();
    });
  });

  describe("Save Functionality", () => {
    it("should show error if no country selected", async () => {
      render(<LocationTimezoneSettings />);

      // Force enable button for testing
      fireEvent.change(screen.getByPlaceholderText("e.g., Belgrade, New York, Tokyo"), {
        target: { value: "Test" },
      });

      fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

      await waitFor(() => {
        expect(mockError).toHaveBeenCalledWith("Please select your country");
      });
    });

    it("should call API on save", async () => {
      render(<LocationTimezoneSettings initialCountryCode="RS" initialTimezone="UTC" />);

      fireEvent.change(screen.getByPlaceholderText("e.g., Belgrade, New York, Tokyo"), {
        target: { value: "Belgrade" },
      });

      fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/user/update-profile",
          expect.objectContaining({
            method: "POST",
          })
        );
      });
    });

    it("should show Saving... while saving", async () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));
      render(<LocationTimezoneSettings initialCountryCode="RS" initialTimezone="UTC" />);

      fireEvent.change(screen.getByPlaceholderText("e.g., Belgrade, New York, Tokyo"), {
        target: { value: "Belgrade" },
      });

      fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

      expect(screen.getByText("Saving...")).toBeInTheDocument();
    });

    it("should show success toast on save", async () => {
      render(<LocationTimezoneSettings initialCountryCode="RS" initialTimezone="UTC" />);

      fireEvent.change(screen.getByPlaceholderText("e.g., Belgrade, New York, Tokyo"), {
        target: { value: "Belgrade" },
      });

      fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

      await waitFor(() => {
        expect(mockSuccess).toHaveBeenCalledWith("Location & timezone updated");
      });
    });

    it("should show error toast on failure", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: "Update failed" }),
      });

      render(<LocationTimezoneSettings initialCountryCode="RS" initialTimezone="UTC" />);

      fireEvent.change(screen.getByPlaceholderText("e.g., Belgrade, New York, Tokyo"), {
        target: { value: "Belgrade" },
      });

      fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

      await waitFor(() => {
        expect(mockError).toHaveBeenCalledWith("Update failed");
      });
    });

    it("should call onUpdate callback on success", async () => {
      const onUpdate = vi.fn();
      render(
        <LocationTimezoneSettings
          initialCountryCode="RS"
          initialTimezone="UTC"
          onUpdate={onUpdate}
        />
      );

      fireEvent.change(screen.getByPlaceholderText("e.g., Belgrade, New York, Tokyo"), {
        target: { value: "Belgrade" },
      });

      fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalled();
      });
    });
  });
});
