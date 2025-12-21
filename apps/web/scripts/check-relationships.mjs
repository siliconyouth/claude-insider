import './lib/env.mjs';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env vars manually
const envContent = readFileSync(join(__dirname, '..', '.env.local'), 'utf-8');
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && !key.startsWith('#')) {
    process.env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  console.log('Checking database tables...\n');

  // Check doc_resource_relationships columns
  const { data: colData, error: colError } = await supabase
    .from('doc_resource_relationships')
    .select('*')
    .limit(1);

  if (colData?.[0]) {
    console.log('Table columns:', Object.keys(colData[0]));
  }
  if (colError) {
    console.log('Column check error:', colError.message);
  }

  // Test the exact query that getResourcesForDoc runs
  console.log('\nTesting getResourcesForDoc query for "getting-started/installation":');

  const { data: queryResult, error: queryError } = await supabase
    .from('doc_resource_relationships')
    .select(`
      resource_id,
      relationship_type,
      confidence_score,
      ai_reasoning,
      resources (
        id,
        slug,
        title,
        description,
        category,
        url,
        icon_url,
        github_stars
      )
    `)
    .eq('doc_slug', 'getting-started/installation')
    .eq('is_active', true)
    .order('confidence_score', { ascending: false })
    .limit(6);

  console.log('Query result:', queryResult?.length ?? 0, 'resources');
  if (queryError) {
    console.log('Query error:', queryError.message);
  } else if (queryResult) {
    console.log(JSON.stringify(queryResult, null, 2));
  }

  // Check getting-started specifically
  const { count: gsCount } = await supabase
    .from('doc_resource_relationships')
    .select('*', { count: 'exact', head: true })
    .ilike('doc_slug', 'getting-started%');

  console.log('\nGetting-started relationships count:', gsCount ?? 0);

  // Check resources count
  const { count: resCount } = await supabase
    .from('resources')
    .select('*', { count: 'exact', head: true });
  console.log('\nresources count:', resCount ?? 0);

  // Check documentation count
  const { count: docCount } = await supabase
    .from('documentation')
    .select('*', { count: 'exact', head: true });
  console.log('documentation count:', docCount ?? 0);

  // Check if documentation has any entries
  if (docCount > 0) {
    const { data: docData } = await supabase
      .from('documentation')
      .select('slug, title, category')
      .limit(5);
    console.log('\nSample documentation:');
    console.log(JSON.stringify(docData, null, 2));
  }
}

check().catch(console.error);
