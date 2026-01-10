#!/usr/bin/env npx tsx
/**
 * Cleanup Garbage Prompts
 *
 * Identifies and deletes garbage/fragment prompts that aren't real Claude prompts.
 * These are typically image generation prompts or fragments from incorrect parsing.
 *
 * Usage: npx dotenvx run -f .env.local -- npx tsx scripts/cleanup-garbage-prompts.ts
 *
 * Options:
 *   --dry-run    Show what would be deleted without making changes
 */

import { createClient } from "@supabase/supabase-js";

// Parse command line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface PromptRow {
  id: string;
  title: string;
  content: string;
}

/**
 * Determine if a prompt is garbage/fragment
 */
function isGarbage(prompt: PromptRow): boolean {
  const content = prompt.content || "";
  const title = prompt.title || "";
  const contentLen = content.length;

  // Image generation prompts
  if (title.toLowerCase().startsWith("prompt:")) return true;

  // Very short content (likely fragments)
  if (contentLen < 30) return true;

  // Short content that doesn't look like instructions
  if (contentLen < 100) {
    const hasInstructionWords = /\b(you|i want|help|generate|create|write|analyze|provide|explain|act as|describe|list|summarize)\b/i.test(content);
    if (!hasInstructionWords) return true;
  }

  // Content starts with lowercase (sentence fragment)
  if (/^[a-z]/.test(content.trim())) return true;

  // Title looks like a fragment (starts with punctuation, lowercase, or common fragment patterns)
  if (/^[-–—•·]/.test(title.trim())) return true;
  if (/^(the|a|an|in|on|at|for|with|from|by)\s/i.test(title.trim()) && contentLen < 100) return true;

  // Chinese/mixed fragments without clear prompt structure
  if (/^[步骤任务技术]/.test(title) && contentLen < 200 && !content.includes("<task>")) return true;

  // Title ends with punctuation suggesting it's a fragment
  if (/[:,]$/.test(title.trim()) && contentLen < 100) return true;

  return false;
}

async function cleanupGarbagePrompts() {
  console.log("=".repeat(60));
  console.log("Cleanup Garbage Prompts");
  console.log("=".repeat(60));
  console.log(`Dry run: ${DRY_RUN}`);
  console.log("");

  // Fetch all prompts with low scores (those are most likely to be garbage)
  const { data: hints } = await supabase
    .from("prompt_claude_hints")
    .select("prompt_id, overall_optimization_score")
    .lt("overall_optimization_score", 70);

  const lowScoreIds = new Set((hints || []).map((h) => h.prompt_id));
  console.log(`Found ${lowScoreIds.size} low-score prompts to analyze`);

  // Fetch all prompts (with pagination)
  const allPrompts: PromptRow[] = [];
  let offset = 0;
  const batchSize = 1000;

  while (true) {
    const { data: batch } = await supabase
      .from("prompts")
      .select("id, title, content")
      .range(offset, offset + batchSize - 1);

    if (!batch || batch.length === 0) break;
    allPrompts.push(...(batch as PromptRow[]));

    if (batch.length < batchSize) break;
    offset += batchSize;
  }

  console.log(`Total prompts in database: ${allPrompts.length}`);

  // Identify garbage prompts (only from low-score ones)
  const garbagePrompts = allPrompts.filter((p) => lowScoreIds.has(p.id) && isGarbage(p));

  console.log(`Identified ${garbagePrompts.length} garbage prompts`);
  console.log("");

  if (garbagePrompts.length === 0) {
    console.log("No garbage prompts found!");
    return;
  }

  // Show samples
  console.log("Sample garbage prompts:");
  console.log("─".repeat(60));
  garbagePrompts.slice(0, 10).forEach((p) => {
    console.log(`Title: ${p.title?.slice(0, 50)}...`);
    console.log(`Content: ${p.content?.slice(0, 60).replace(/\n/g, " ")}...`);
    console.log("");
  });

  if (DRY_RUN) {
    console.log("=".repeat(60));
    console.log(`DRY RUN: Would delete ${garbagePrompts.length} garbage prompts`);
    console.log("Remove --dry-run to actually delete them");
    return;
  }

  // Delete garbage prompts
  console.log("Deleting garbage prompts...");

  const garbageIds = garbagePrompts.map((p) => p.id);

  // Delete in batches
  let deleted = 0;
  for (let i = 0; i < garbageIds.length; i += 100) {
    const batchIds = garbageIds.slice(i, i + 100);

    // Delete hints first (foreign key)
    await supabase.from("prompt_claude_hints").delete().in("prompt_id", batchIds);

    // Delete versions
    await supabase.from("prompt_versions").delete().in("prompt_id", batchIds);

    // Delete prompts
    const { error } = await supabase.from("prompts").delete().in("id", batchIds);

    if (error) {
      console.error(`Error deleting batch: ${error.message}`);
    } else {
      deleted += batchIds.length;
      console.log(`  Deleted ${deleted}/${garbageIds.length}...`);
    }
  }

  console.log("");
  console.log("=".repeat(60));
  console.log("Cleanup Complete!");
  console.log("=".repeat(60));
  console.log(`Deleted: ${deleted} garbage prompts`);

  // Final count
  const { count } = await supabase.from("prompts").select("*", { count: "exact", head: true });
  console.log(`Remaining prompts: ${count}`);
}

// Run
cleanupGarbagePrompts().catch(console.error);
