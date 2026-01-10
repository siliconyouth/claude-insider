#!/usr/bin/env npx tsx
/**
 * Export Low-Score Prompts for Optimization
 *
 * Exports prompts with optimization scores below a threshold
 * for Claude Code to optimize using extended thinking.
 *
 * Usage: npx dotenvx run -f .env.local -- npx tsx scripts/export-low-score-prompts.ts
 *
 * Options:
 *   --threshold=70    Score threshold (export prompts below this)
 *   --batch-size=25   Number of prompts per batch file
 *   --output=prompts-to-optimize  Output directory name
 */

import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name: string, defaultValue: string): string => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split("=")[1] ?? defaultValue : defaultValue;
};

const THRESHOLD = parseInt(getArg("threshold", "70"));
const BATCH_SIZE = parseInt(getArg("batch-size", "25"));
const OUTPUT_DIR = getArg("output", "prompts-to-optimize");

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface PromptToOptimize {
  id: string;
  title: string;
  content: string;
  description: string | null;
  category_slug: string;
  tags: string[];
  current_score: number;
}

async function exportLowScorePrompts() {
  console.log("=".repeat(60));
  console.log("Export Low-Score Prompts for Optimization");
  console.log("=".repeat(60));
  console.log(`Threshold: < ${THRESHOLD}`);
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log(`Output: data/${OUTPUT_DIR}/`);
  console.log("");

  // Fetch prompts with low scores
  const { data: lowScoreHints, error: hintsError } = await supabase
    .from("prompt_claude_hints")
    .select("prompt_id, overall_optimization_score")
    .lt("overall_optimization_score", THRESHOLD)
    .order("overall_optimization_score", { ascending: true });

  if (hintsError) {
    console.error("Error fetching hints:", hintsError.message);
    process.exit(1);
  }

  console.log(`Found ${lowScoreHints?.length || 0} prompts below threshold`);

  if (!lowScoreHints || lowScoreHints.length === 0) {
    console.log("No prompts need optimization!");
    return;
  }

  // Fetch prompt details
  const promptIds = lowScoreHints.map((h) => h.prompt_id);
  const scoreMap = new Map(lowScoreHints.map((h) => [h.prompt_id, h.overall_optimization_score]));

  // Fetch in batches due to Supabase limits
  const prompts: PromptToOptimize[] = [];
  for (let i = 0; i < promptIds.length; i += 100) {
    const batchIds = promptIds.slice(i, i + 100);
    const { data: promptBatch, error: promptError } = await supabase
      .from("prompts")
      .select(`
        id,
        title,
        content,
        description,
        tags,
        prompt_categories!inner(slug)
      `)
      .in("id", batchIds);

    if (promptError) {
      console.error("Error fetching prompts:", promptError.message);
      continue;
    }

    for (const p of promptBatch || []) {
      const categoryData = p.prompt_categories as { slug: string } | null;
      prompts.push({
        id: p.id,
        title: p.title,
        content: p.content,
        description: p.description,
        category_slug: categoryData?.slug || "conversation",
        tags: p.tags || [],
        current_score: scoreMap.get(p.id) || 0,
      });
    }
  }

  // Sort by score (worst first)
  prompts.sort((a, b) => a.current_score - b.current_score);

  console.log(`Fetched ${prompts.length} prompt details`);
  console.log("");

  // Create output directory
  const outputPath = path.join(process.cwd(), "data", OUTPUT_DIR);
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  // Split into batches
  const totalBatches = Math.ceil(prompts.length / BATCH_SIZE);

  for (let i = 0; i < totalBatches; i++) {
    const start = i * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, prompts.length);
    const batch = prompts.slice(start, end);

    const filename = `optimize-batch-${i + 1}.json`;
    const filepath = path.join(outputPath, filename);

    fs.writeFileSync(
      filepath,
      JSON.stringify(
        {
          batchNumber: i + 1,
          totalBatches,
          promptsInBatch: batch.length,
          totalPrompts: prompts.length,
          threshold: THRESHOLD,
          prompts: batch,
        },
        null,
        2
      )
    );

    console.log(`Created: data/${OUTPUT_DIR}/${filename} (${batch.length} prompts, scores ${batch[0]?.current_score}-${batch[batch.length - 1]?.current_score})`);
  }

  // Write summary
  const summaryPath = path.join(outputPath, "optimization-summary.json");
  fs.writeFileSync(
    summaryPath,
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        threshold: THRESHOLD,
        totalPrompts: prompts.length,
        totalBatches,
        batchSize: BATCH_SIZE,
        scoreDistribution: {
          "below_50": prompts.filter((p) => p.current_score < 50).length,
          "50_to_59": prompts.filter((p) => p.current_score >= 50 && p.current_score < 60).length,
          "60_to_69": prompts.filter((p) => p.current_score >= 60 && p.current_score < 70).length,
        },
      },
      null,
      2
    )
  );

  console.log("");
  console.log("=".repeat(60));
  console.log("Export Complete!");
  console.log("=".repeat(60));
  console.log(`Files created in: data/${OUTPUT_DIR}/`);
  console.log("");
  console.log("Next: Claude Code will optimize each batch using extended thinking");
}

// Run
exportLowScorePrompts().catch(console.error);
