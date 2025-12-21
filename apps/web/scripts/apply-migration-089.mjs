#!/usr/bin/env node

import './lib/env.mjs';
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "..");

function loadEnv() {
  const envPath = join(ROOT_DIR, ".env.local");
  if (!existsSync(envPath)) {
    console.error("Error: .env.local file not found");
    process.exit(1);
  }

  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

const { Pool } = pg;

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log("Applying migration 089_ai_pipeline_settings.sql...\n");
    
    const migrationPath = join(ROOT_DIR, "supabase/migrations/089_ai_pipeline_settings.sql");
    const migrationSQL = readFileSync(migrationPath, "utf-8");
    
    await pool.query(migrationSQL);
    
    console.log("✓ Migration applied successfully!\n");
    
    // Verify tables were created
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('ai_pipeline_settings', 'ai_operation_queue')
    `);
    
    console.log("Created tables:");
    for (const row of tables.rows) {
      console.log(`  - ${row.table_name}`);
    }
    
    // Check settings
    const settings = await pool.query(`SELECT key, description FROM ai_pipeline_settings`);
    console.log("\nDefault settings:");
    for (const row of settings.rows) {
      console.log(`  - ${row.key}: ${row.description}`);
    }
    
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
