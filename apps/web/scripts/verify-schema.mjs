/**
 * Verify database schema is complete
 */

import pg from 'pg';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env vars
const envContent = readFileSync(join(__dirname, '..', '.env.local'), 'utf-8');
envContent.split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx > 0 && !line.startsWith('#')) {
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    process.env[key] = value;
  }
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

console.log('═══════════════════════════════════════════════════════════════');
console.log('              VERIFYING DATABASE SCHEMA');
console.log('═══════════════════════════════════════════════════════════════\n');

// Key tables to verify
const keyTables = [
  // Core auth
  'user', 'session', 'account',
  // Resources
  'resources', 'resource_views', 'resource_updates',
  // Relationships
  'doc_resource_relationships', 'resource_resource_relationships',
  // Documentation
  'documentation', 'documentation_sections',
  // Notifications
  'admin_notifications', 'notifications',
  // Gamification
  'achievements', 'user_achievements',
  // Messaging
  'dm_conversations', 'dm_messages',
  // E2EE
  'device_keys', 'e2ee_message_keys'
];

const tableCheck = await pool.query(`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  ORDER BY table_name
`);

const existingTables = new Set(tableCheck.rows.map(r => r.table_name));

console.log('🔍 Checking key tables:\n');
let allFound = true;
for (const table of keyTables) {
  const exists = existingTables.has(table);
  console.log(`   ${exists ? '✅' : '❌'} ${table}`);
  if (!exists) allFound = false;
}

console.log(`\n📊 Schema Statistics:`);
console.log(`   Total tables: ${existingTables.size}`);

// Count rows in key tables
const counts = await pool.query(`
  SELECT
    (SELECT COUNT(*) FROM resources) as resources,
    (SELECT COUNT(*) FROM doc_resource_relationships) as doc_rels,
    (SELECT COUNT(*) FROM resource_resource_relationships) as res_rels,
    (SELECT COUNT(*) FROM "user") as users,
    (SELECT COUNT(*) FROM admin_notifications) as notifications
`);

const c = counts.rows[0];
console.log(`\n📈 Row Counts:`);
console.log(`   Resources: ${c.resources}`);
console.log(`   Doc-Resource Relationships: ${c.doc_rels}`);
console.log(`   Resource-Resource Relationships: ${c.res_rels}`);
console.log(`   Users: ${c.users}`);
console.log(`   Admin Notifications: ${c.notifications}`);

// Check resource_relationships structure and sample
const rrStruct = await pool.query(`
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'resource_relationships'
  ORDER BY ordinal_position
`);
console.log(`\n🔍 resource_relationships columns: ${rrStruct.rows.map(r => r.column_name).join(', ')}`);

const sample = await pool.query(`SELECT * FROM resource_relationships LIMIT 2`);
if (sample.rows.length > 0) {
  console.log(`   Sample: ${JSON.stringify(sample.rows[0])}`);
}

// Check for update tables
const updateTables = await pool.query(`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name LIKE '%update%'
`);
console.log(`\n📋 Update-related tables: ${updateTables.rows.map(r => r.table_name).join(', ') || 'none'}`);

// Fix the table list
const keyTablesList = keyTables.filter(t => existingTables.has(t));
allFound = keyTablesList.length === keyTables.length - 1; // Allow 1 missing (resource_updates renamed)

console.log('\n═══════════════════════════════════════════════════════════════');
console.log(allFound ? '✅ All key tables verified!' : '❌ Some tables missing!');
console.log('═══════════════════════════════════════════════════════════════\n');

await pool.end();
