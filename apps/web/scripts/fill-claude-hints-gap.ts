#!/usr/bin/env npx tsx
/**
 * Fill Claude Hints Gap
 *
 * Generates Claude hints for prompts that are missing them.
 *
 * Usage: npx dotenvx run -f .env.local -- npx tsx scripts/fill-claude-hints-gap.ts
 *
 * Options:
 *   --dry-run    Show what would be done without making changes
 *   --limit=N    Process only N prompts (0 = all)
 */

import { createClient } from "@supabase/supabase-js";
import { analyzePrompt } from "../lib/prompt-adaptation";

// Parse command line arguments
const args = process.argv.slice(2);
const hasFlag = (name: string): boolean => args.includes(`--${name}`);
const getArg = (name: string, defaultValue: string): string => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split("=")[1] ?? defaultValue : defaultValue;
};

const DRY_RUN = hasFlag("dry-run");
const LIMIT = parseInt(getArg("limit", "0"));

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

async function fillHintsGap() {
  console.log("=".repeat(60));
  console.log("Fill Claude Hints Gap");
  console.log("=".repeat(60));
  console.log(`Dry run: ${DRY_RUN}`);
  console.log(`Limit: ${LIMIT || "all"}`);
  console.log("");

  // Get all prompts (handle pagination - Supabase has 1000 row default limit)
  const allPrompts: PromptRow[] = [];
  let offset = 0;
  const batchSize = 1000;

  while (true) {
    const { data: batch, error: batchError } = await supabase
      .from("prompts")
      .select("id, title, content")
      .range(offset, offset + batchSize - 1);

    if (batchError) {
      console.error("Error fetching prompts:", batchError.message);
      process.exit(1);
    }

    if (!batch || batch.length === 0) break;
    allPrompts.push(...(batch as PromptRow[]));

    if (batch.length < batchSize) break;
    offset += batchSize;
  }

  // Get prompts that already have hints
  const { data: existingHints, error: hintsError } = await supabase
    .from("prompt_claude_hints")
    .select("prompt_id");

  if (hintsError) {
    console.error("Error fetching hints:", hintsError.message);
    process.exit(1);
  }

  const promptsWithHints = new Set((existingHints || []).map((h) => h.prompt_id));
  const promptsMissingHints = (allPrompts || []).filter(
    (p) => promptsWithHints.has(p.id) === false
  ) as PromptRow[];

  console.log(`Total prompts: ${allPrompts?.length}`);
  console.log(`Prompts with hints: ${existingHints?.length}`);
  console.log(`Prompts missing hints: ${promptsMissingHints.length}`);
  console.log("");

  if (promptsMissingHints.length === 0) {
    console.log("All prompts have Claude hints! Nothing to do.");
    return;
  }

  // Apply limit if specified
  const toProcess = LIMIT > 0 ? promptsMissingHints.slice(0, LIMIT) : promptsMissingHints;
  console.log(`Processing ${toProcess.length} prompts...`);
  console.log("");

  let processed = 0;
  let errors = 0;

  for (const prompt of toProcess) {
    try {
      // Analyze prompt to generate hints
      const hints = analyzePrompt(prompt.content);

      if (DRY_RUN) {
        console.log(`  Would add hints for: ${prompt.title.slice(0, 40)}...`);
        console.log(`    - Structure Score: ${hints.structure_score}`);
        console.log(`    - Overall Score: ${hints.overall_optimization_score}`);
        processed++;
        continue;
      }

      // Insert hints into database
      const { error: insertError } = await supabase.from("prompt_claude_hints").insert({
        prompt_id: prompt.id,
        uses_xml_tags: hints.uses_xml_tags,
        uses_thinking_section: hints.uses_thinking_section,
        uses_examples: hints.uses_examples,
        uses_chain_of_thought: hints.uses_chain_of_thought,
        uses_system_context: hints.uses_system_context,
        uses_output_format: hints.uses_output_format,
        structure_score: hints.structure_score,
        clarity_score: hints.clarity_score,
        specificity_score: hints.specificity_score,
        overall_optimization_score: hints.overall_optimization_score,
        recommended_model: hints.recommended_model,
        estimated_tokens: hints.estimated_tokens,
        complexity_level: hints.complexity_level,
        improvement_suggestions: JSON.stringify(hints.improvement_suggestions),
      });

      if (insertError) {
        console.error(`  Error for "${prompt.title.slice(0, 30)}": ${insertError.message}`);
        errors++;
      } else {
        processed++;
        if (processed % 50 === 0) {
          console.log(`  Processed ${processed}/${toProcess.length}...`);
        }
      }
    } catch (err) {
      console.error(`  Error analyzing "${prompt.title.slice(0, 30)}":`, err);
      errors++;
    }
  }

  console.log("");
  console.log("=".repeat(60));
  console.log("Complete!");
  console.log("=".repeat(60));
  console.log(`Processed: ${processed}`);
  console.log(`Errors: ${errors}`);

  if (DRY_RUN) {
    console.log("");
    console.log("This was a DRY RUN. No changes were made.");
    console.log("Remove --dry-run to actually fill the hints gap.");
  }

  // Final count
  if (!DRY_RUN) {
    const { count } = await supabase
      .from("prompt_claude_hints")
      .select("*", { count: "exact", head: true });
    console.log("");
    console.log(`Total prompts with hints now: ${count}`);
  }
}

// Run
fillHintsGap().catch(console.error);
