/**
 * Fix Test User Onboarding Status
 *
 * Marks the test user as having completed onboarding so E2E tests
 * don't get blocked by the onboarding wizard.
 *
 * Run with: npx tsx scripts/fix-test-user-onboarding.ts
 */

import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";

const TEST_EMAIL = process.env.TEST_USER_EMAIL || "test@dukelic.com";

async function main() {
  console.log("🧭 Fixing test user onboarding status...\n");
  console.log(`   Email: ${TEST_EMAIL}`);

  // Load environment variables
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath) && !process.env.DATABASE_URL) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        if (key && valueParts.length > 0) {
          let value = valueParts.join("=");
          if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
          ) {
            value = value.slice(1, -1);
          }
          process.env[key] = value;
        }
      }
    }
    console.log("   Loaded environment from .env.local");
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("\n❌ DATABASE_URL not found");
    process.exit(1);
  }

  console.log("\n   Connecting to database...");
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 1,
  });

  try {
    // Update user flags AND set username (required for onboarding completion)
    const result = await pool.query(
      `UPDATE "user"
       SET "hasCompletedOnboarding" = true,
           "emailVerified" = true,
           "onboardingStep" = 10,
           username = 'e2etestuser',
           "updatedAt" = NOW()
       WHERE email = $1
       RETURNING id, email, username, "hasCompletedOnboarding", "emailVerified", "onboardingStep"`,
      [TEST_EMAIL.toLowerCase()]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log("\n📋 Updated user:");
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   hasCompletedOnboarding: ${user.hasCompletedOnboarding}`);
      console.log(`   emailVerified: ${user.emailVerified}`);
      console.log(`   onboardingStep: ${user.onboardingStep}`);
      console.log("\n✓ Test user onboarding status fixed!");
    } else {
      console.error(`\n❌ User not found: ${TEST_EMAIL}`);
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
