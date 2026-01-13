/**
 * Countries Utility Tests
 *
 * Tests for the ISO 3166-1 alpha-2 country codes and names.
 */

import { describe, it, expect } from "vitest";
import { COUNTRIES, type Country } from "@/lib/countries";

describe("COUNTRIES constant", () => {
  it("should be an array", () => {
    expect(Array.isArray(COUNTRIES)).toBe(true);
  });

  it("should have at least 190 countries (most UN member states)", () => {
    expect(COUNTRIES.length).toBeGreaterThanOrEqual(190);
  });

  it("should have valid country structure", () => {
    COUNTRIES.forEach((country) => {
      expect(country).toHaveProperty("code");
      expect(country).toHaveProperty("name");
      expect(country).toHaveProperty("flag");
      expect(typeof country.code).toBe("string");
      expect(typeof country.name).toBe("string");
      expect(typeof country.flag).toBe("string");
    });
  });

  it("should have ISO 3166-1 alpha-2 codes (2 uppercase letters)", () => {
    COUNTRIES.forEach((country) => {
      expect(country.code).toMatch(/^[A-Z]{2}$/);
    });
  });

  it("should have unique country codes", () => {
    const codes = COUNTRIES.map((c) => c.code);
    const uniqueCodes = [...new Set(codes)];
    expect(codes.length).toBe(uniqueCodes.length);
  });

  it("should have non-empty country names", () => {
    COUNTRIES.forEach((country) => {
      expect(country.name.length).toBeGreaterThan(0);
    });
  });

  it("should have flag emojis", () => {
    COUNTRIES.forEach((country) => {
      // Flag emojis are made of regional indicator symbols
      expect(country.flag.length).toBeGreaterThan(0);
    });
  });

  it("should be sorted alphabetically by name", () => {
    const names = COUNTRIES.map((c) => c.name);
    const sortedNames = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sortedNames);
  });
});

describe("Major countries presence", () => {
  it("should include United States", () => {
    const us = COUNTRIES.find((c) => c.code === "US");
    expect(us).toBeDefined();
    expect(us?.name).toBe("United States");
    expect(us?.flag).toBe("🇺🇸");
  });

  it("should include United Kingdom", () => {
    const uk = COUNTRIES.find((c) => c.code === "GB");
    expect(uk).toBeDefined();
    expect(uk?.name).toBe("United Kingdom");
    expect(uk?.flag).toBe("🇬🇧");
  });

  it("should include China", () => {
    const china = COUNTRIES.find((c) => c.code === "CN");
    expect(china).toBeDefined();
    expect(china?.name).toBe("China");
    expect(china?.flag).toBe("🇨🇳");
  });

  it("should include Japan", () => {
    const japan = COUNTRIES.find((c) => c.code === "JP");
    expect(japan).toBeDefined();
    expect(japan?.name).toBe("Japan");
    expect(japan?.flag).toBe("🇯🇵");
  });

  it("should include Germany", () => {
    const germany = COUNTRIES.find((c) => c.code === "DE");
    expect(germany).toBeDefined();
    expect(germany?.name).toBe("Germany");
    expect(germany?.flag).toBe("🇩🇪");
  });

  it("should include France", () => {
    const france = COUNTRIES.find((c) => c.code === "FR");
    expect(france).toBeDefined();
    expect(france?.name).toBe("France");
    expect(france?.flag).toBe("🇫🇷");
  });

  it("should include Canada", () => {
    const canada = COUNTRIES.find((c) => c.code === "CA");
    expect(canada).toBeDefined();
    expect(canada?.name).toBe("Canada");
    expect(canada?.flag).toBe("🇨🇦");
  });

  it("should include Australia", () => {
    const australia = COUNTRIES.find((c) => c.code === "AU");
    expect(australia).toBeDefined();
    expect(australia?.name).toBe("Australia");
    expect(australia?.flag).toBe("🇦🇺");
  });

  it("should include India", () => {
    const india = COUNTRIES.find((c) => c.code === "IN");
    expect(india).toBeDefined();
    expect(india?.name).toBe("India");
    expect(india?.flag).toBe("🇮🇳");
  });

  it("should include Brazil", () => {
    const brazil = COUNTRIES.find((c) => c.code === "BR");
    expect(brazil).toBeDefined();
    expect(brazil?.name).toBe("Brazil");
    expect(brazil?.flag).toBe("🇧🇷");
  });
});

describe("Country regions coverage", () => {
  it("should have African countries", () => {
    const africanCodes = ["ZA", "NG", "EG", "KE", "ET", "GH", "MA"];
    africanCodes.forEach((code) => {
      const country = COUNTRIES.find((c) => c.code === code);
      expect(country).toBeDefined();
    });
  });

  it("should have Asian countries", () => {
    const asianCodes = ["CN", "JP", "IN", "KR", "ID", "TH", "VN", "PH", "SG"];
    asianCodes.forEach((code) => {
      const country = COUNTRIES.find((c) => c.code === code);
      expect(country).toBeDefined();
    });
  });

  it("should have European countries", () => {
    const europeanCodes = ["GB", "DE", "FR", "IT", "ES", "NL", "SE", "NO", "PL"];
    europeanCodes.forEach((code) => {
      const country = COUNTRIES.find((c) => c.code === code);
      expect(country).toBeDefined();
    });
  });

  it("should have North American countries", () => {
    const naCode = ["US", "CA", "MX"];
    naCode.forEach((code) => {
      const country = COUNTRIES.find((c) => c.code === code);
      expect(country).toBeDefined();
    });
  });

  it("should have South American countries", () => {
    const saCodes = ["BR", "AR", "CO", "CL", "PE", "VE"];
    saCodes.forEach((code) => {
      const country = COUNTRIES.find((c) => c.code === code);
      expect(country).toBeDefined();
    });
  });

  it("should have Oceanian countries", () => {
    const oceaniaCodes = ["AU", "NZ", "FJ"];
    oceaniaCodes.forEach((code) => {
      const country = COUNTRIES.find((c) => c.code === code);
      expect(country).toBeDefined();
    });
  });
});

describe("Country type", () => {
  it("should have correct type shape", () => {
    const testCountry: Country = {
      code: "XX",
      name: "Test Country",
      flag: "🏳️",
    };

    expect(testCountry.code).toBe("XX");
    expect(testCountry.name).toBe("Test Country");
    expect(testCountry.flag).toBe("🏳️");
  });
});

describe("Special cases", () => {
  it("should handle countries with special characters in names", () => {
    // Côte d'Ivoire (Ivory Coast)
    const ivoryCoast = COUNTRIES.find((c) => c.code === "CI");
    expect(ivoryCoast).toBeDefined();

    // São Tomé and Príncipe might be in the list
    const saoTome = COUNTRIES.find((c) => c.code === "ST");
    if (saoTome) {
      expect(saoTome.name.length).toBeGreaterThan(0);
    }
  });

  it("should handle countries with long names", () => {
    // Democratic Republic of the Congo
    const drc = COUNTRIES.find((c) => c.code === "CD");
    expect(drc).toBeDefined();

    // United Arab Emirates
    const uae = COUNTRIES.find((c) => c.code === "AE");
    expect(uae).toBeDefined();
  });
});

describe("Flag emoji validation", () => {
  it("should have matching flag emoji for US", () => {
    const us = COUNTRIES.find((c) => c.code === "US");
    // US flag is made of regional indicator U + S
    expect(us?.flag).toBe("🇺🇸");
  });

  it("should have matching flag emoji for Japan", () => {
    const jp = COUNTRIES.find((c) => c.code === "JP");
    expect(jp?.flag).toBe("🇯🇵");
  });

  it("should have matching flag emoji for Serbia", () => {
    const rs = COUNTRIES.find((c) => c.code === "RS");
    expect(rs).toBeDefined();
    expect(rs?.flag).toBe("🇷🇸");
  });
});
