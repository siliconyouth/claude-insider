const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

// Load .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

async function runMigration() {
  console.log('DATABASE_URL prefix:', process.env.DATABASE_URL?.substring(0, 50) + '...');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to database...');

    // Test connection
    await pool.query('SELECT 1');
    console.log('Connected successfully!\n');

    // Add role column
    console.log('1. Adding role column...');
    await pool.query(`
      ALTER TABLE public."user"
      ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'user'
    `);
    console.log('   Done');

    // Add check constraint
    console.log('2. Adding role constraint...');
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'user_role_check'
        ) THEN
          ALTER TABLE public."user"
          ADD CONSTRAINT user_role_check
          CHECK (role IN ('user', 'editor', 'moderator', 'admin'));
        END IF;
      END $$
    `);
    console.log('   Done');

    // Create index
    console.log('3. Creating role index...');
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_role ON public."user"(role)`);
    console.log('   Done');

    // Create admin_logs table
    console.log('4. Creating admin_logs table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.admin_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
        action TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_id TEXT NOT NULL,
        details JSONB DEFAULT '{}'::jsonb,
        ip_address TEXT,
        user_agent TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('   Done');

    // Create indexes
    console.log('5. Creating admin_logs indexes...');
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON public.admin_logs(admin_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON public.admin_logs(target_type, target_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON public.admin_logs(created_at DESC)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON public.admin_logs(action)`);
    console.log('   Done');

    // Verify
    console.log('\n--- Verification ---');
    const result = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'user' AND column_name = 'role'
    `);
    console.log('Role column:', JSON.stringify(result.rows, null, 2));

    const tableCheck = await pool.query(`
      SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'admin_logs')
    `);
    console.log('admin_logs table exists:', tableCheck.rows[0].exists);

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
