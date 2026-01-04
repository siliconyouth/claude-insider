/**
 * Create Test User for E2E Tests
 *
 * Creates a test user with verified email for Playwright E2E tests.
 * Run with: npx tsx scripts/create-test-user.ts
 */

import { pool } from "../lib/db";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const TEST_EMAIL = process.env.TEST_USER_EMAIL || "test@dukelic.com";
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || "Cl@ud3!ns1d3r_T3st_2026_Secure";
const TEST_NAME = "E2E Test User";

async function createTestUser() {
  console.log("🧪 Creating test user for E2E tests...\n");
  console.log(`   Email: ${TEST_EMAIL}`);
  console.log(`   Name: ${TEST_NAME}`);

  try {
    // Check if user already exists
    const existing = await pool.query('SELECT id FROM "user" WHERE email = $1', [
      TEST_EMAIL.toLowerCase(),
    ]);

    if (existing.rows.length > 0) {
      console.log("\n✓ Test user already exists, updating password...");

      // Hash the password
      const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);

      // Update the existing user's password and ensure email is verified
      await pool.query(
        `UPDATE "user"
         SET "emailVerified" = true,
             name = $2,
             "updatedAt" = NOW()
         WHERE email = $1`,
        [TEST_EMAIL.toLowerCase(), TEST_NAME]
      );

      // Update account password (Better Auth stores password in account table)
      await pool.query(
        `UPDATE account
         SET password = $2
         WHERE "userId" = $1 AND "providerId" = 'credential'`,
        [existing.rows[0].id, hashedPassword]
      );

      console.log("✓ Test user password updated successfully!\n");
    } else {
      console.log("\n Creating new test user...");

      // Generate UUID for user
      const userId = randomUUID();

      // Hash the password
      const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);

      // Create user in Better Auth's user table
      await pool.query(
        `INSERT INTO "user" (
          id,
          email,
          name,
          "emailVerified",
          role,
          "createdAt",
          "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [userId, TEST_EMAIL.toLowerCase(), TEST_NAME, true, "user"]
      );

      // Create credential account in Better Auth's account table
      await pool.query(
        `INSERT INTO account (
          id,
          "userId",
          "accountId",
          "providerId",
          password,
          "createdAt",
          "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [randomUUID(), userId, userId, "credential", hashedPassword]
      );

      // Create user profile
      await pool.query(
        `INSERT INTO profiles (user_id, display_name, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())
         ON CONFLICT (user_id) DO NOTHING`,
        [userId, TEST_NAME]
      );

      console.log("✓ Test user created successfully!\n");
    }

    console.log("📋 Test User Details:");
    console.log("   ─────────────────────────────────────");
    console.log(`   Email:    ${TEST_EMAIL}`);
    console.log(`   Password: ${TEST_PASSWORD}`);
    console.log(`   Role:     user`);
    console.log("   ─────────────────────────────────────");
    console.log("\n🚀 Ready for E2E tests! Run: pnpm test\n");
  } catch (error) {
    console.error("\n❌ Error creating test user:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createTestUser();
