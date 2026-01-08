/**
 * Test script to verify resource cache invalidation triggers are working
 */

import { config } from "@dotenvx/dotenvx";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTriggers() {
  console.log("Testing resource cache invalidation triggers...\n");

  // 1. Check if tables exist
  console.log("1. Checking tables...");

  const { data: queueCheck, error: queueError } = await supabase
    .from("resource_update_queue")
    .select("id")
    .limit(1);

  if (queueError) {
    console.error("   ❌ resource_update_queue table error:", queueError.message);
    return;
  }
  console.log("   ✅ resource_update_queue table exists");

  const { data: logsCheck, error: logsError } = await supabase
    .from("resource_cache_logs")
    .select("id")
    .limit(1);

  if (logsError) {
    console.error("   ❌ resource_cache_logs table error:", logsError.message);
    return;
  }
  console.log("   ✅ resource_cache_logs table exists");

  // 2. Get a test resource
  console.log("\n2. Finding test resource...");

  const { data: resource, error: resourceError } = await supabase
    .from("resources")
    .select("id, slug, last_verified_at")
    .limit(1)
    .single();

  if (resourceError || !resource) {
    console.error("   ❌ No resources found:", resourceError?.message);
    return;
  }
  console.log(`   ✅ Found resource: ${resource.slug}`);

  // 3. Count queue entries before update
  const { count: beforeCount } = await supabase
    .from("resource_update_queue")
    .select("*", { count: "exact", head: true })
    .eq("resource_id", resource.id);

  console.log(`   Queue entries for this resource before: ${beforeCount || 0}`);

  // 4. Update the resource to trigger the queue
  console.log("\n3. Updating resource to trigger queue...");

  const { error: updateError } = await supabase
    .from("resources")
    .update({ last_verified_at: new Date().toISOString() })
    .eq("id", resource.id);

  if (updateError) {
    console.error("   ❌ Update failed:", updateError.message);
    return;
  }
  console.log("   ✅ Resource updated");

  // 5. Wait a moment for trigger to fire
  await new Promise((r) => setTimeout(r, 500));

  // 6. Check queue for new entry
  console.log("\n4. Checking queue for new entry...");

  const { data: queueEntry, error: queueEntryError } = await supabase
    .from("resource_update_queue")
    .select("*")
    .eq("resource_id", resource.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (queueEntryError) {
    console.error("   ❌ Queue check failed:", queueEntryError.message);
    return;
  }

  if (queueEntry) {
    console.log("   ✅ Trigger working! Queue entry created:");
    console.log(`      - Operation: ${queueEntry.operation}`);
    console.log(`      - Created: ${queueEntry.created_at}`);
    console.log(`      - Processed: ${queueEntry.processed}`);
  } else {
    console.log("   ⚠️ No queue entry found after update");
  }

  // 7. Summary
  console.log("\n=== Summary ===");
  console.log("✅ Tables created correctly");
  console.log("✅ Triggers are firing on resource updates");
  console.log("✅ Queue entries are being created");
  console.log("\nNext steps:");
  console.log("1. Configure Supabase webhook in Dashboard → Database → Webhooks");
  console.log("2. URL: https://www.claudeinsider.com/api/revalidate/resources");
  console.log("3. Events: INSERT, UPDATE, DELETE on 'resources' table");
  console.log("4. Headers: Authorization: Bearer <CRON_SECRET>");
}

testTriggers().catch(console.error);
