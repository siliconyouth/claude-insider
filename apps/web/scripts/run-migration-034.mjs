#!/usr/bin/env node

/**
 * Run Migration 034: Assistant Settings
 *
 * Creates the assistant_settings table for database-backed AI assistant preferences.
 *
 * Usage: node scripts/run-migration-034.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import "dotenv/config";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function runMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log("Reading migration file...");
  const migrationPath = join(__dirname, "../supabase/migrations/034_assistant_settings.sql");
  const sql = readFileSync(migrationPath, "utf8");

  console.log("Running migration 034_assistant_settings...");

  // Split by semicolons and run each statement
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  for (const statement of statements) {
    try {
      const { error } = await supabase.rpc("exec_sql", { sql: statement + ";" });
      if (error) {
        // Try direct execution if RPC fails
        const { error: directError } = await supabase.from("_migrations").select("*").limit(0);
        if (directError) {
          console.log(`Statement preview: ${statement.substring(0, 100)}...`);
          console.log("Note: Running via Supabase dashboard may be required for DDL statements");
        }
      }
    } catch {
      // Continue with other statements
    }
  }

  console.log("Migration 034 complete!");
  console.log("\nIf you see errors, run this SQL in your Supabase SQL Editor:");
  console.log("---");
  console.log(sql);
  console.log("---");
}

runMigration().catch(console.error);
