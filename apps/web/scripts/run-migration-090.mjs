import './lib/env.mjs';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env vars
const envContent = readFileSync(join(__dirname, '..', '.env.local'), 'utf-8');
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && !key.startsWith('#')) {
    process.env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log('Running migration 090_resource_sources.sql...\n');

  // Read and execute the SQL file using Supabase's SQL execution
  const sqlFile = readFileSync(join(__dirname, '..', 'supabase/migrations/090_resource_sources.sql'), 'utf-8');

  // Use pg pool directly for DDL statements
  const { Pool } = await import('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await pool.query(sqlFile);
    console.log('✅ Migration executed successfully!\n');
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log('⚠️  Tables already exist, skipping...\n');
    } else {
      console.error('Migration error:', err.message);
    }
  } finally {
    await pool.end();
  }

  // Verify tables
  const { data: srcData, error: srcErr } = await supabase.from('resource_sources').select('id').limit(1);
  if (srcErr) {
    console.log('resource_sources:', srcErr.message);
  } else {
    console.log('✅ resource_sources table exists');
  }

  const { data: qData, error: qErr } = await supabase.from('resource_discovery_queue').select('id').limit(1);
  if (qErr) {
    console.log('resource_discovery_queue:', qErr.message);
  } else {
    console.log('✅ resource_discovery_queue table exists');
  }
}

runMigration().catch(console.error);
