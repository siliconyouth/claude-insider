/**
 * Fix Test User Password for Better Auth
 *
 * Better Auth uses scrypt (not bcrypt) for password hashing.
 * This script generates a scrypt-compatible hash and updates the database.
 *
 * Run with: npx tsx scripts/fix-test-user-password.ts
 */

import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { Pool } from "pg";

// Promisify scrypt
const scryptAsync = promisify(scrypt);

// Better Auth's scrypt config (from node_modules/better-auth/dist/crypto/password.mjs)
const config = {
  N: 16384,
  r: 16,
  p: 1,
  dkLen: 64,
};

// Hex encoding utilities
function bytesToHex(bytes: Uint8Array | Buffer): string {
  return Buffer.from(bytes).toString("hex");
}

// Generate a Better Auth compatible password hash
async function hashPassword(password: string): Promise<string> {
  const salt = bytesToHex(randomBytes(16));
  const key = (await scryptAsync(
    password.normalize("NFKC"),
    salt,
    config.dkLen,
    { N: config.N, r: config.r, p: config.p, maxmem: 128 * config.N * config.r * 2 }
  )) as Buffer;
  return `${salt}:${bytesToHex(key)}`;
}

const TEST_EMAIL = process.env.TEST_USER_EMAIL || "test@dukelic.com";
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || "Cl@ud3!ns1d3r_T3st_2026_Secure";

async function main() {
  console.log("🔐 Fixing test user password for Better Auth (scrypt format)...\n");
  console.log(`   Email: ${TEST_EMAIL}`);
  console.log(`   Password: ${TEST_PASSWORD}`);

  // Generate scrypt hash
  console.log("\n   Generating scrypt hash...");
  const hashedPassword = await hashPassword(TEST_PASSWORD);
  console.log(`   Hash format: salt:key`);
  console.log(`   Hash length: ${hashedPassword.length} chars`);
  console.log(`   Salt length: ${hashedPassword.split(":")[0].length} chars`);
  console.log(`   Key length: ${hashedPassword.split(":")[1].length} chars`);

  // Load environment variables
  const fs = await import("fs");
  const path = await import("path");
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
    console.error("\n❌ DATABASE_URL not found in environment or .env.local");
    process.exit(1);
  }

  console.log("\n   Connecting to database...");
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 1,
  });

  try {
    // Find the test user
    const userResult = await pool.query('SELECT id FROM "user" WHERE email = $1', [
      TEST_EMAIL.toLowerCase(),
    ]);

    if (userResult.rows.length === 0) {
      console.error(`\n❌ Test user not found: ${TEST_EMAIL}`);
      process.exit(1);
    }

    const userId = userResult.rows[0].id;
    console.log(`   Found user: ${userId}`);

    // Update the credential account's password
    const updateResult = await pool.query(
      `UPDATE account
       SET password = $1, "updatedAt" = NOW()
       WHERE "userId" = $2 AND "providerId" = 'credential'
       RETURNING id`,
      [hashedPassword, userId]
    );

    if (updateResult.rows.length === 0) {
      // No credential account exists, create one
      console.log("   No credential account found, creating one...");
      const { randomUUID } = await import("crypto");
      await pool.query(
        `INSERT INTO account (id, "userId", "accountId", "providerId", password, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, 'credential', $4, NOW(), NOW())`,
        [randomUUID(), userId, userId, hashedPassword]
      );
      console.log("   ✓ Created credential account with scrypt password");
    } else {
      console.log(`   ✓ Updated account ${updateResult.rows[0].id} with scrypt password`);
    }

    // Verify the hash was stored correctly
    const verifyResult = await pool.query(
      `SELECT password FROM account WHERE "userId" = $1 AND "providerId" = 'credential'`,
      [userId]
    );

    const storedHash = verifyResult.rows[0]?.password || "";
    const isScryptFormat = storedHash.includes(":") && !storedHash.startsWith("$");

    console.log("\n📋 Verification:");
    console.log(`   Hash is scrypt format: ${isScryptFormat ? "✓ YES" : "✗ NO"}`);
    console.log(`   Hash starts with salt: ${storedHash.substring(0, 32)}...`);

    console.log("\n✓ Test user password fixed successfully!");
    console.log("\n🚀 Ready for E2E tests! Run: pnpm test:e2e\n");
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
