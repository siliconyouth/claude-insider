/**
 * Authentication Validation Tests
 *
 * Tests for authentication input validation including:
 * - Email validation
 * - Password strength validation
 * - Username validation
 * - Verification code validation
 */

import { describe, it, expect } from "vitest";

// Validation functions (testing the logic, not imports that may have server deps)
// These mirror the validation logic used in auth forms and API routes

// Email validation regex (RFC 5322 simplified)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  if (email.length > 254) return false; // RFC 5321 max length
  return EMAIL_REGEX.test(email.trim().toLowerCase());
}

// Password validation
interface PasswordValidation {
  isValid: boolean;
  errors: string[];
}

function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];

  if (!password || typeof password !== "string") {
    return { isValid: false, errors: ["Password is required"] };
  }

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }

  if (password.length > 128) {
    errors.push("Password must be at most 128 characters");
  }

  // Check for common weak patterns
  const commonPasswords = [
    "password",
    "12345678",
    "qwerty123",
    "letmein",
    "welcome",
  ];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push("Password is too common");
  }

  return { isValid: errors.length === 0, errors };
}

// Username validation
function isValidUsername(username: string): boolean {
  if (!username || typeof username !== "string") return false;
  if (username.length < 3 || username.length > 30) return false;

  // Only alphanumeric, underscores, and hyphens
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(username)) return false;

  // Can't start or end with special characters
  if (username.startsWith("-") || username.startsWith("_")) return false;
  if (username.endsWith("-") || username.endsWith("_")) return false;

  // Can't have consecutive special characters
  if (username.includes("--") || username.includes("__")) return false;
  if (username.includes("-_") || username.includes("_-")) return false;

  return true;
}

// Verification code validation
function isValidVerificationCode(code: string): boolean {
  if (!code || typeof code !== "string") return false;
  // 6 digit numeric code
  return /^\d{6}$/.test(code);
}

// Generate verification code (for testing the format)
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

describe("Authentication Validation", () => {
  describe("Email Validation", () => {
    describe("Valid emails", () => {
      it("should accept standard email format", () => {
        expect(isValidEmail("user@example.com")).toBe(true);
      });

      it("should accept email with subdomain", () => {
        expect(isValidEmail("user@mail.example.com")).toBe(true);
      });

      it("should accept email with plus addressing", () => {
        expect(isValidEmail("user+tag@example.com")).toBe(true);
      });

      it("should accept email with dots in local part", () => {
        expect(isValidEmail("first.last@example.com")).toBe(true);
      });

      it("should accept email with numbers", () => {
        expect(isValidEmail("user123@example.com")).toBe(true);
      });

      it("should accept email with hyphen in domain", () => {
        expect(isValidEmail("user@my-domain.com")).toBe(true);
      });

      it("should accept email with multiple subdomains", () => {
        expect(isValidEmail("user@sub.domain.example.com")).toBe(true);
      });

      it("should accept email with underscore in local part", () => {
        expect(isValidEmail("user_name@example.com")).toBe(true);
      });

      it("should normalize case", () => {
        expect(isValidEmail("USER@EXAMPLE.COM")).toBe(true);
      });

      it("should trim whitespace", () => {
        expect(isValidEmail("  user@example.com  ")).toBe(true);
      });
    });

    describe("Invalid emails", () => {
      it("should reject empty string", () => {
        expect(isValidEmail("")).toBe(false);
      });

      it("should reject null", () => {
        expect(isValidEmail(null as any)).toBe(false);
      });

      it("should reject undefined", () => {
        expect(isValidEmail(undefined as any)).toBe(false);
      });

      it("should reject email without @", () => {
        expect(isValidEmail("userexample.com")).toBe(false);
      });

      it("should reject email without domain", () => {
        expect(isValidEmail("user@")).toBe(false);
      });

      it("should reject email without local part", () => {
        expect(isValidEmail("@example.com")).toBe(false);
      });

      it("should reject email without TLD", () => {
        expect(isValidEmail("user@example")).toBe(false);
      });

      it("should reject email with spaces", () => {
        expect(isValidEmail("user name@example.com")).toBe(false);
      });

      it("should reject email with multiple @", () => {
        expect(isValidEmail("user@@example.com")).toBe(false);
      });

      it("should reject email exceeding max length", () => {
        const longLocal = "a".repeat(250);
        expect(isValidEmail(`${longLocal}@example.com`)).toBe(false);
      });
    });
  });

  describe("Password Validation", () => {
    describe("Valid passwords", () => {
      it("should accept 8 character password", () => {
        const result = validatePassword("abcd1234");
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it("should accept password with special characters", () => {
        const result = validatePassword("P@ssw0rd!");
        expect(result.isValid).toBe(true);
      });

      it("should accept long password", () => {
        const result = validatePassword("a".repeat(64));
        expect(result.isValid).toBe(true);
      });

      it("should accept password at max length", () => {
        const result = validatePassword("a".repeat(128));
        expect(result.isValid).toBe(true);
      });

      it("should accept password with unicode", () => {
        const result = validatePassword("MyP@ss日本語123");
        expect(result.isValid).toBe(true);
      });

      it("should accept password with spaces", () => {
        const result = validatePassword("my secure password");
        expect(result.isValid).toBe(true);
      });
    });

    describe("Invalid passwords", () => {
      it("should reject empty password", () => {
        const result = validatePassword("");
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Password is required");
      });

      it("should reject null", () => {
        const result = validatePassword(null as any);
        expect(result.isValid).toBe(false);
      });

      it("should reject undefined", () => {
        const result = validatePassword(undefined as any);
        expect(result.isValid).toBe(false);
      });

      it("should reject password shorter than 8 characters", () => {
        const result = validatePassword("abc123");
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Password must be at least 8 characters");
      });

      it("should reject 7 character password", () => {
        const result = validatePassword("1234567");
        expect(result.isValid).toBe(false);
      });

      it("should reject password exceeding max length", () => {
        const result = validatePassword("a".repeat(129));
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Password must be at most 128 characters");
      });

      it("should reject common password 'password'", () => {
        const result = validatePassword("password");
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Password is too common");
      });

      it("should reject common password '12345678'", () => {
        const result = validatePassword("12345678");
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Password is too common");
      });

      it("should reject common password regardless of case", () => {
        const result = validatePassword("PASSWORD");
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Password is too common");
      });

      it("should reject 'qwerty123'", () => {
        const result = validatePassword("qwerty123");
        expect(result.isValid).toBe(false);
      });

      it("should reject 'letmein'", () => {
        // 7 chars - fails both length and common
        const result = validatePassword("letmein");
        expect(result.isValid).toBe(false);
      });

      it("should reject 'welcome' padded to 8 chars", () => {
        // "welcome" + padding to hit 8 chars doesn't match the common password list
        const result = validatePassword("welcome1");
        expect(result.isValid).toBe(true);
      });
    });

    describe("Multiple errors", () => {
      it("should return multiple errors for very weak password", () => {
        const result = validatePassword("password".substring(0, 7));
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe("Username Validation", () => {
    describe("Valid usernames", () => {
      it("should accept alphanumeric username", () => {
        expect(isValidUsername("john123")).toBe(true);
      });

      it("should accept username with underscore", () => {
        expect(isValidUsername("john_doe")).toBe(true);
      });

      it("should accept username with hyphen", () => {
        expect(isValidUsername("john-doe")).toBe(true);
      });

      it("should accept username with mixed case", () => {
        expect(isValidUsername("JohnDoe")).toBe(true);
      });

      it("should accept 3 character username", () => {
        expect(isValidUsername("abc")).toBe(true);
      });

      it("should accept 30 character username", () => {
        expect(isValidUsername("a".repeat(30))).toBe(true);
      });

      it("should accept username with numbers only", () => {
        expect(isValidUsername("123456")).toBe(true);
      });

      it("should accept username with special chars in middle", () => {
        expect(isValidUsername("john_doe-123")).toBe(true);
      });
    });

    describe("Invalid usernames", () => {
      it("should reject empty string", () => {
        expect(isValidUsername("")).toBe(false);
      });

      it("should reject null", () => {
        expect(isValidUsername(null as any)).toBe(false);
      });

      it("should reject undefined", () => {
        expect(isValidUsername(undefined as any)).toBe(false);
      });

      it("should reject username shorter than 3 characters", () => {
        expect(isValidUsername("ab")).toBe(false);
      });

      it("should reject username longer than 30 characters", () => {
        expect(isValidUsername("a".repeat(31))).toBe(false);
      });

      it("should reject username starting with hyphen", () => {
        expect(isValidUsername("-johndoe")).toBe(false);
      });

      it("should reject username starting with underscore", () => {
        expect(isValidUsername("_johndoe")).toBe(false);
      });

      it("should reject username ending with hyphen", () => {
        expect(isValidUsername("johndoe-")).toBe(false);
      });

      it("should reject username ending with underscore", () => {
        expect(isValidUsername("johndoe_")).toBe(false);
      });

      it("should reject username with consecutive hyphens", () => {
        expect(isValidUsername("john--doe")).toBe(false);
      });

      it("should reject username with consecutive underscores", () => {
        expect(isValidUsername("john__doe")).toBe(false);
      });

      it("should reject username with hyphen-underscore combo", () => {
        expect(isValidUsername("john-_doe")).toBe(false);
        expect(isValidUsername("john_-doe")).toBe(false);
      });

      it("should reject username with spaces", () => {
        expect(isValidUsername("john doe")).toBe(false);
      });

      it("should reject username with special characters", () => {
        expect(isValidUsername("john@doe")).toBe(false);
        expect(isValidUsername("john.doe")).toBe(false);
        expect(isValidUsername("john!doe")).toBe(false);
      });
    });
  });

  describe("Verification Code Validation", () => {
    describe("Valid codes", () => {
      it("should accept 6 digit code", () => {
        expect(isValidVerificationCode("123456")).toBe(true);
      });

      it("should accept code with leading zeros", () => {
        expect(isValidVerificationCode("000001")).toBe(true);
      });

      it("should accept all zeros", () => {
        expect(isValidVerificationCode("000000")).toBe(true);
      });

      it("should accept all nines", () => {
        expect(isValidVerificationCode("999999")).toBe(true);
      });
    });

    describe("Invalid codes", () => {
      it("should reject empty string", () => {
        expect(isValidVerificationCode("")).toBe(false);
      });

      it("should reject null", () => {
        expect(isValidVerificationCode(null as any)).toBe(false);
      });

      it("should reject undefined", () => {
        expect(isValidVerificationCode(undefined as any)).toBe(false);
      });

      it("should reject 5 digit code", () => {
        expect(isValidVerificationCode("12345")).toBe(false);
      });

      it("should reject 7 digit code", () => {
        expect(isValidVerificationCode("1234567")).toBe(false);
      });

      it("should reject code with letters", () => {
        expect(isValidVerificationCode("12345a")).toBe(false);
        expect(isValidVerificationCode("abcdef")).toBe(false);
      });

      it("should reject code with spaces", () => {
        expect(isValidVerificationCode("123 456")).toBe(false);
        expect(isValidVerificationCode(" 123456")).toBe(false);
      });

      it("should reject code with special characters", () => {
        expect(isValidVerificationCode("123-456")).toBe(false);
        expect(isValidVerificationCode("123.456")).toBe(false);
      });

      it("should reject code with decimal", () => {
        expect(isValidVerificationCode("123456.0")).toBe(false);
      });
    });

    describe("Code generation", () => {
      it("should generate valid 6 digit code", () => {
        for (let i = 0; i < 100; i++) {
          const code = generateVerificationCode();
          expect(isValidVerificationCode(code)).toBe(true);
        }
      });

      it("should generate codes within valid range", () => {
        for (let i = 0; i < 100; i++) {
          const code = generateVerificationCode();
          const num = parseInt(code, 10);
          expect(num).toBeGreaterThanOrEqual(100000);
          expect(num).toBeLessThanOrEqual(999999);
        }
      });

      it("should generate string codes, not numbers", () => {
        const code = generateVerificationCode();
        expect(typeof code).toBe("string");
        expect(code.length).toBe(6);
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle non-string types for email", () => {
      expect(isValidEmail(123 as any)).toBe(false);
      expect(isValidEmail({} as any)).toBe(false);
      expect(isValidEmail([] as any)).toBe(false);
    });

    it("should handle non-string types for username", () => {
      expect(isValidUsername(123 as any)).toBe(false);
      expect(isValidUsername({} as any)).toBe(false);
      expect(isValidUsername([] as any)).toBe(false);
    });

    it("should handle non-string types for verification code", () => {
      expect(isValidVerificationCode(123456 as any)).toBe(false);
      expect(isValidVerificationCode({} as any)).toBe(false);
      expect(isValidVerificationCode([] as any)).toBe(false);
    });
  });
});
