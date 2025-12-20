#!/usr/bin/env node

/**
 * Sync Screenshots from JSON to Database
 *
 * This script reads screenshotUrl from JSON files and updates the
 * database screenshots array column.
 *
 * Usage: node scripts/sync-screenshots-to-db.mjs
 */

import { readdir, readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const { Pool } = pg;

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "..");
const RESOURCES_DIR = join(ROOT_DIR, "data/resources");

/**
 * Parse .env.local file manually
 */
async function loadEnv() {
  try {
    const envPath = join(ROOT_DIR, ".env.local");
    const content = await readFile(envPath, "utf-8");
    const env = {};

    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        env[key] = value;
      }
    }
    return env;
  } catch (err) {
    console.error("Failed to load .env.local:", err.message);
    return {};
  }
}

async function main() {
  console.log("📷 Sync Screenshots from JSON to Database\n");

  // Load environment
  const env = await loadEnv();
  const DATABASE_URL = env.DATABASE_URL;

  if (!DATABASE_URL) {
    console.error("❌ Missing DATABASE_URL in .env.local");
    process.exit(1);
  }

  console.log("🔗 Connecting to database...");
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    // Read all JSON files
    console.log(`\n📂 Reading JSON files from ${RESOURCES_DIR}...`);
    const files = await readdir(RESOURCES_DIR);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    const screenshotUpdates = [];

    for (const file of jsonFiles) {
      const filePath = join(RESOURCES_DIR, file);
      const content = await readFile(filePath, "utf-8");

      try {
        const resources = JSON.parse(content);
        if (!Array.isArray(resources)) continue;

        for (const resource of resources) {
          if (resource.id && resource.screenshotUrl) {
            screenshotUpdates.push({
              id: resource.id,
              screenshotUrl: resource.screenshotUrl,
            });
          }
        }
      } catch (err) {
        console.log(`  ⚠️  Skipping ${file} (invalid JSON)`);
      }
    }

    console.log(`  Found ${screenshotUpdates.length} resources with screenshots`);

    // Update database
    console.log(`\n⬆️  Updating database...\n`);
    let successCount = 0;
    let notFoundCount = 0;
    let errorCount = 0;

    for (const { id, screenshotUrl } of screenshotUpdates) {
      process.stdout.write(`  📝 ${id}... `);

      try {
        // Generate slug from id (resources use id as slug pattern)
        const slug = id;

        // Update screenshots array (replace with single screenshot for now)
        const result = await pool.query(
          `UPDATE resources SET screenshots = $1 WHERE slug = $2`,
          [[screenshotUrl], slug]
        );

        if (result.rowCount > 0) {
          console.log("✅");
          successCount++;
        } else {
          console.log("⚠️  (not in database)");
          notFoundCount++;
        }
      } catch (err) {
        console.log(`❌ ${err.message}`);
        errorCount++;
      }
    }

    console.log(`\n📊 Sync Summary:`);
    console.log(`  ✅ Updated: ${successCount}`);
    console.log(`  ⚠️  Not found: ${notFoundCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);

    console.log(`\n✨ Done!`);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
