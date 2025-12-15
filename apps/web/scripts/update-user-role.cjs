const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read env file manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // Find Milica Ristic
  const { data: user, error: findError } = await supabase
    .from('user')
    .select('id, name, email, role')
    .ilike('name', '%Milica%')
    .single();

  if (findError) {
    console.log('Error finding user:', findError);
    process.exit(1);
  }

  console.log('Found user:', user);

  // Update role to beta_tester
  const { data: updated, error: updateError } = await supabase
    .from('user')
    .update({ role: 'beta_tester' })
    .eq('id', user.id)
    .select('id, name, role')
    .single();

  if (updateError) {
    console.log('Error updating:', updateError);
    process.exit(1);
  }

  console.log('Updated user:', updated);
}

main();
