/**
 * Data Masking Unit Tests
 *
 * Tests for PII protection utilities:
 * - maskEmail: Mask email addresses (v*****@e****.com)
 * - maskIP: Mask IPv4/IPv6 addresses
 * - maskPhone: Mask phone numbers (keep last 4 digits)
 * - maskName: Mask full names (J*** D**)
 * - maskUserAgent: Extract browser name only
 * - canViewSensitiveData: Role-based access check
 * - maskUserData: Mask all sensitive fields in object
 */

import { describe, it, expect } from "vitest";
import {
  canViewSensitiveData,
  maskEmail,
  maskIP,
  maskPhone,
  maskName,
  maskUserAgent,
  maskUserData,
  maskUserDataArray,
} from "@/lib/data-masking";
import { ROLES } from "@/lib/roles";

// ============================================
// canViewSensitiveData TESTS
// ============================================

describe("canViewSensitiveData", () => {
  it("should return true for superadmin", () => {
    expect(canViewSensitiveData(ROLES.SUPERADMIN)).toBe(true);
  });

  it("should return false for admin", () => {
    expect(canViewSensitiveData(ROLES.ADMIN)).toBe(false);
  });

  it("should return false for moderator", () => {
    expect(canViewSensitiveData(ROLES.MODERATOR)).toBe(false);
  });

  it("should return false for editor", () => {
    expect(canViewSensitiveData(ROLES.EDITOR)).toBe(false);
  });

  it("should return false for user", () => {
    expect(canViewSensitiveData(ROLES.USER)).toBe(false);
  });

  it("should return false for undefined", () => {
    expect(canViewSensitiveData(undefined)).toBe(false);
  });

  it("should return false for null", () => {
    expect(canViewSensitiveData(null)).toBe(false);
  });
});

// ============================================
// maskEmail TESTS
// ============================================

describe("maskEmail", () => {
  it("should mask standard email addresses", () => {
    expect(maskEmail("vladimir@example.com")).toBe("v*******@e******.com");
    expect(maskEmail("user@domain.org")).toBe("u***@d*****.org");
  });

  it("should handle short local parts", () => {
    expect(maskEmail("a@b.com")).toBe("a***@b***.com");
    expect(maskEmail("ab@cd.io")).toBe("a***@c***.io");
  });

  it("should handle long emails", () => {
    const result = maskEmail("verylongemail@verylongdomain.co.uk");
    expect(result).toMatch(/^v\*+@v\*+\.co\.uk$/);
  });

  it("should handle subdomain emails", () => {
    const result = maskEmail("user@sub.domain.com");
    expect(result).toContain("@s***.");
  });

  it("should return empty string for empty input", () => {
    expect(maskEmail("")).toBe("");
  });

  it("should return fallback for invalid emails", () => {
    expect(maskEmail("notanemail")).toBe("***@***.***");
    expect(maskEmail("@missing.local")).toBe("***@***.***");
    expect(maskEmail("missing@")).toBe("***@***.***");
  });

  it("should handle special characters in local part", () => {
    const result = maskEmail("user.name+tag@example.com");
    expect(result).toMatch(/^u\*+@e\*+\.com$/);
  });
});

// ============================================
// maskIP TESTS
// ============================================

describe("maskIP", () => {
  describe("IPv4 addresses", () => {
    it("should mask last two octets", () => {
      expect(maskIP("192.168.1.100")).toBe("192.168.*.*");
      expect(maskIP("10.0.0.1")).toBe("10.0.*.*");
      expect(maskIP("8.8.8.8")).toBe("8.8.*.*");
    });

    it("should handle different octet values", () => {
      expect(maskIP("255.255.255.255")).toBe("255.255.*.*");
      expect(maskIP("0.0.0.0")).toBe("0.0.*.*");
    });
  });

  describe("IPv6 addresses", () => {
    it("should mask all but first segment", () => {
      expect(maskIP("2001:0db8:85a3:0000:0000:8a2e:0370:7334")).toBe(
        "2001:****:****:****"
      );
    });

    it("should handle shortened IPv6", () => {
      expect(maskIP("2001:db8::1")).toBe("2001:****:****:****");
    });

    it("should handle localhost IPv6", () => {
      expect(maskIP("::1")).toBe("***.***.***.***");
    });
  });

  it("should return empty string for empty input", () => {
    expect(maskIP("")).toBe("");
  });

  it("should return fallback for invalid IPs", () => {
    expect(maskIP("not-an-ip")).toBe("***.***.***.***");
    expect(maskIP("192.168")).toBe("***.***.***.***");
  });
});

// ============================================
// maskPhone TESTS
// ============================================

describe("maskPhone", () => {
  it("should keep last 4 digits", () => {
    expect(maskPhone("+1 (555) 123-4567")).toBe("+* (***) ***-4567");
    expect(maskPhone("555-123-4567")).toBe("***-***-4567");
  });

  it("should handle international formats", () => {
    expect(maskPhone("+44 20 7946 0958")).toBe("+** ** **** 0958");
    expect(maskPhone("+81 3-1234-5678")).toBe("+** *-****-5678");
  });

  it("should handle numbers without formatting", () => {
    expect(maskPhone("5551234567")).toBe("******4567");
  });

  it("should handle short phone numbers", () => {
    expect(maskPhone("1234")).toBe("1234");
    expect(maskPhone("12345")).toBe("*2345");
  });

  it("should return empty string for empty input", () => {
    expect(maskPhone("")).toBe("");
  });
});

// ============================================
// maskName TESTS
// ============================================

describe("maskName", () => {
  it("should mask first and last names", () => {
    expect(maskName("John Doe")).toBe("J*** D**");
    expect(maskName("Alice Smith")).toBe("A*** S***");
  });

  it("should handle single names", () => {
    expect(maskName("Madonna")).toBe("M***");
    expect(maskName("Cher")).toBe("C***");
  });

  it("should handle multiple names", () => {
    expect(maskName("John Paul Jones")).toBe("J*** P*** J***");
    expect(maskName("Mary Jane Watson")).toBe("M*** J*** W***");
  });

  it("should handle short names", () => {
    expect(maskName("Jo")).toBe("J*");
    // Single character parts don't get masked per implementation
    expect(maskName("A B")).toBe("A B");
  });

  it("should handle single character names", () => {
    expect(maskName("J")).toBe("J");
    expect(maskName("J D")).toBe("J D");
  });

  it("should return empty string for empty input", () => {
    expect(maskName("")).toBe("");
  });

  it("should limit asterisks to 3", () => {
    // Long names should still only show 3 asterisks
    expect(maskName("Christopher")).toBe("C***");
    expect(maskName("Elizabeth")).toBe("E***");
  });
});

// ============================================
// maskUserAgent TESTS
// ============================================

describe("maskUserAgent", () => {
  it("should identify Chrome", () => {
    const ua =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    expect(maskUserAgent(ua)).toBe("Chrome/*** (****)");
  });

  it("should identify Firefox", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0";
    expect(maskUserAgent(ua)).toBe("Firefox/*** (****)");
  });

  it("should identify Safari", () => {
    const ua =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15";
    expect(maskUserAgent(ua)).toBe("Safari/*** (****)");
  });

  it("should identify Edge", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.2210.91";
    expect(maskUserAgent(ua)).toBe("Chrome/*** (****)"); // Edge includes Chrome in UA
  });

  it("should identify Opera", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0";
    expect(maskUserAgent(ua)).toBe("Chrome/*** (****)"); // Opera includes Chrome
  });

  it("should identify bots", () => {
    expect(maskUserAgent("Googlebot/2.1")).toBe("Bot/*** (****)");
    expect(maskUserAgent("Bingbot/2.0")).toBe("Bot/*** (****)");
    expect(maskUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(
      "Bot/*** (****)"
    );
    expect(maskUserAgent("Slurp Crawler")).toBe("Bot/*** (****)");
  });

  it("should return Unknown for unrecognized user agents", () => {
    expect(maskUserAgent("SomeRandomAgent/1.0")).toBe("Unknown/*** (****)");
    expect(maskUserAgent("curl/7.68.0")).toBe("Unknown/*** (****)");
  });

  it("should return empty string for empty input", () => {
    expect(maskUserAgent("")).toBe("");
  });
});

// ============================================
// maskUserData TESTS
// ============================================

describe("maskUserData", () => {
  const testData = {
    email: "user@example.com",
    ip: "192.168.1.100",
    ipAddress: "10.0.0.1",
    phone: "+1-555-123-4567",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
    name: "John Doe", // Note: name is not masked by maskUserData
    otherField: "not sensitive",
  };

  it("should not mask anything for superadmin", () => {
    const result = maskUserData(testData, ROLES.SUPERADMIN);
    expect(result.email).toBe("user@example.com");
    expect(result.ip).toBe("192.168.1.100");
    expect(result.ipAddress).toBe("10.0.0.1");
    expect(result.phone).toBe("+1-555-123-4567");
  });

  it("should mask all sensitive fields for regular users", () => {
    const result = maskUserData(testData, ROLES.USER);
    expect(result.email).toBe("u***@e******.com");
    expect(result.ip).toBe("192.168.*.*");
    expect(result.ipAddress).toBe("10.0.*.*");
    expect(result.phone).toBe("+*-***-***-4567");
    expect(result.userAgent).toBe("Chrome/*** (****)");
  });

  it("should mask for admin role", () => {
    const result = maskUserData(testData, ROLES.ADMIN);
    expect(result.email).not.toBe("user@example.com");
    expect(result.ip).not.toBe("192.168.1.100");
  });

  it("should mask for undefined role", () => {
    const result = maskUserData(testData, undefined);
    expect(result.email).not.toBe("user@example.com");
  });

  it("should preserve non-sensitive fields", () => {
    const result = maskUserData(testData, ROLES.USER);
    expect(result.otherField).toBe("not sensitive");
  });

  it("should handle missing fields", () => {
    const partialData = {
      email: "user@example.com",
      otherField: "value",
    };
    const result = maskUserData(partialData, ROLES.USER);
    expect(result.email).toBe("u***@e******.com");
    expect(result.ip).toBeUndefined();
    expect(result.phone).toBeUndefined();
  });

  it("should not mutate original object", () => {
    const original = { email: "user@example.com" };
    maskUserData(original, ROLES.USER);
    expect(original.email).toBe("user@example.com");
  });
});

// ============================================
// maskUserDataArray TESTS
// ============================================

describe("maskUserDataArray", () => {
  const testArray = [
    { email: "user1@example.com", name: "User 1" },
    { email: "user2@example.com", name: "User 2" },
    { email: "user3@example.com", name: "User 3" },
  ];

  it("should mask all items in array for regular users", () => {
    const result = maskUserDataArray(testArray, ROLES.USER);
    expect(result).toHaveLength(3);
    result.forEach((item) => {
      expect(item.email).toMatch(/^u\*+@e\*+\.com$/);
    });
  });

  it("should not mask any items for superadmin", () => {
    const result = maskUserDataArray(testArray, ROLES.SUPERADMIN);
    expect(result[0]?.email).toBe("user1@example.com");
    expect(result[1]?.email).toBe("user2@example.com");
    expect(result[2]?.email).toBe("user3@example.com");
  });

  it("should handle empty array", () => {
    const result = maskUserDataArray([], ROLES.USER);
    expect(result).toEqual([]);
  });

  it("should preserve non-sensitive fields in all items", () => {
    const result = maskUserDataArray(testArray, ROLES.USER);
    expect(result[0]?.name).toBe("User 1");
    expect(result[1]?.name).toBe("User 2");
    expect(result[2]?.name).toBe("User 3");
  });

  it("should not mutate original array", () => {
    const original = [{ email: "test@example.com" }];
    maskUserDataArray(original, ROLES.USER);
    expect(original[0]?.email).toBe("test@example.com");
  });
});
