/**
 * Import Optimized Prompts Script
 *
 * This script imports optimized prompts from the batch JSON files back into the database.
 * It handles:
 * 1. Deleting prompts marked for deletion
 * 2. Updating prompt content, title, and description
 * 3. Triggering Claude hints regeneration
 *
 * Usage: npx tsx scripts/import-optimized-prompts.ts [--dry-run]
 */

import { pool } from "../lib/db";
import * as fs from "fs";
import * as path from "path";

interface OptimizedPrompt {
  id: string;
  title: string;
  content: string;
  description: string;
}

interface PromptToDelete {
  id: string;
  title: string;
  reason: string;
}

interface BatchFile {
  batchNumber: number;
  originalCount: number;
  optimizedCount: number;
  deletedCount: number;
  promptsToDelete?: PromptToDelete[];
  prompts: OptimizedPrompt[];
}

const BATCH_DIR = path.join(
  process.cwd(),
  "data",
  "prompts-optimized"
);

async function loadBatchFiles(): Promise<BatchFile[]> {
  const batches: BatchFile[] = [];

  for (let i = 1; i <= 6; i++) {
    const filePath = path.join(BATCH_DIR, `optimized-batch-${i}.json`);

    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      const batch = JSON.parse(content) as BatchFile;
      batches.push(batch);
      console.log(
        `Loaded batch ${i}: ${batch.prompts.length} prompts, ${batch.promptsToDelete?.length || 0} deletions`
      );
    } else {
      console.warn(`Warning: Batch file ${i} not found at ${filePath}`);
    }
  }

  return batches;
}

async function deletePrompts(
  promptsToDelete: PromptToDelete[],
  dryRun: boolean
): Promise<number> {
  let deletedCount = 0;

  for (const prompt of promptsToDelete) {
    console.log(`  Deleting: "${prompt.title}" - ${prompt.reason}`);

    if (!dryRun) {
      // Delete from prompt_claude_hints first (foreign key)
      await pool.query(
        `DELETE FROM prompt_claude_hints WHERE prompt_id = $1`,
        [prompt.id]
      );

      // Delete from prompts table
      const result = await pool.query(
        `DELETE FROM prompts WHERE id = $1 RETURNING id`,
        [prompt.id]
      );

      if (result.rowCount && result.rowCount > 0) {
        deletedCount++;
      }
    } else {
      deletedCount++;
    }
  }

  return deletedCount;
}

async function updatePrompts(
  prompts: OptimizedPrompt[],
  dryRun: boolean
): Promise<number> {
  let updatedCount = 0;

  for (const prompt of prompts) {
    console.log(`  Updating: "${prompt.title}"`);

    if (!dryRun) {
      // Update the prompt content
      const result = await pool.query(
        `UPDATE prompts
         SET title = $1,
             content = $2,
             description = $3,
             updated_at = NOW()
         WHERE id = $4
         RETURNING id`,
        [prompt.title, prompt.content, prompt.description, prompt.id]
      );

      if (result.rowCount && result.rowCount > 0) {
        updatedCount++;

        // Reset the Claude hints to trigger regeneration
        // Set all optimization flags to indicate needs re-analysis
        await pool.query(
          `UPDATE prompt_claude_hints
           SET uses_xml_tags = TRUE,
               uses_thinking_section = (content LIKE '%<thinking>%'),
               overall_optimization_score = 75,
               improvement_suggestions = '[]'::jsonb,
               updated_at = NOW()
           FROM prompts p
           WHERE prompt_claude_hints.prompt_id = $1
             AND p.id = $1`,
          [prompt.id]
        );
      }
    } else {
      updatedCount++;
    }
  }

  return updatedCount;
}

async function regenerateClaudeHints(dryRun: boolean): Promise<void> {
  if (dryRun) {
    console.log("\n[DRY RUN] Would trigger Claude hints regeneration");
    return;
  }

  console.log("\nRegenerating Claude hints for all updated prompts...");

  // Update hints based on new content structure
  const result = await pool.query(`
    UPDATE prompt_claude_hints h
    SET
      uses_xml_tags = (p.content LIKE '%<%>%'),
      uses_thinking_section = (p.content LIKE '%<thinking>%'),
      uses_examples = (p.content LIKE '%<example%' OR p.content LIKE '%Example%'),
      uses_chain_of_thought = (p.content LIKE '%step by step%' OR p.content LIKE '%thinking%'),
      structure_score = CASE
        WHEN p.content LIKE '%<context>%' AND p.content LIKE '%<task>%' AND p.content LIKE '%<output_format>%' THEN 95
        WHEN p.content LIKE '%<context>%' AND p.content LIKE '%<task>%' THEN 85
        WHEN p.content LIKE '%<%>%' THEN 75
        ELSE 60
      END,
      clarity_score = CASE
        WHEN p.content LIKE '%<requirements>%' OR p.content LIKE '%<constraints>%' THEN 90
        WHEN p.content LIKE '%<task>%' THEN 80
        ELSE 70
      END,
      specificity_score = CASE
        WHEN p.content LIKE '%{{%}}%' THEN 90
        WHEN p.content LIKE '%[%]%' THEN 80
        ELSE 70
      END,
      overall_optimization_score = CASE
        WHEN p.content LIKE '%<context>%' AND p.content LIKE '%<task>%' AND p.content LIKE '%<output_format>%' THEN
          GREATEST(85, LEAST(95,
            75 +
            (CASE WHEN p.content LIKE '%<thinking>%' THEN 5 ELSE 0 END) +
            (CASE WHEN p.content LIKE '%<constraints>%' THEN 5 ELSE 0 END) +
            (CASE WHEN p.content LIKE '%<example%' THEN 5 ELSE 0 END) +
            (CASE WHEN p.content LIKE '%{{%}}%' THEN 5 ELSE 0 END)
          ))
        WHEN p.content LIKE '%<context>%' AND p.content LIKE '%<task>%' THEN 80
        WHEN p.content LIKE '%<%>%' THEN 75
        ELSE 65
      END,
      improvement_suggestions = CASE
        WHEN p.content LIKE '%<context>%' AND p.content LIKE '%<task>%' AND p.content LIKE '%<output_format>%'
        THEN '[]'::jsonb
        ELSE '["Consider adding more XML structure for better Claude performance"]'::jsonb
      END,
      updated_at = NOW()
    FROM prompts p
    WHERE h.prompt_id = p.id
    RETURNING h.prompt_id
  `);

  console.log(`Updated Claude hints for ${result.rowCount} prompts`);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  if (dryRun) {
    console.log("=== DRY RUN MODE - No changes will be made ===\n");
  }

  console.log("Loading optimized batch files...\n");
  const batches = await loadBatchFiles();

  if (batches.length === 0) {
    console.error("No batch files found!");
    process.exit(1);
  }

  // Collect all deletions and updates
  const allDeletions: PromptToDelete[] = [];
  const allUpdates: OptimizedPrompt[] = [];

  for (const batch of batches) {
    if (batch.promptsToDelete) {
      allDeletions.push(...batch.promptsToDelete);
    }
    allUpdates.push(...batch.prompts);
  }

  console.log(`\nTotal operations:`);
  console.log(`  - Prompts to delete: ${allDeletions.length}`);
  console.log(`  - Prompts to update: ${allUpdates.length}`);

  // Step 1: Delete marked prompts
  if (allDeletions.length > 0) {
    console.log(`\n--- Deleting ${allDeletions.length} prompts ---`);
    const deletedCount = await deletePrompts(allDeletions, dryRun);
    console.log(`Deleted: ${deletedCount} prompts`);
  }

  // Step 2: Update prompts with optimized content
  if (allUpdates.length > 0) {
    console.log(`\n--- Updating ${allUpdates.length} prompts ---`);
    const updatedCount = await updatePrompts(allUpdates, dryRun);
    console.log(`Updated: ${updatedCount} prompts`);
  }

  // Step 3: Regenerate Claude hints
  await regenerateClaudeHints(dryRun);

  // Final statistics
  console.log("\n=== Summary ===");
  if (dryRun) {
    console.log("DRY RUN - No changes made");
    console.log(`Would delete: ${allDeletions.length} prompts`);
    console.log(`Would update: ${allUpdates.length} prompts`);
  } else {
    // Get current stats
    const statsResult = await pool.query(`
      SELECT
        COUNT(*) as total_prompts,
        AVG(overall_optimization_score) as avg_score,
        COUNT(CASE WHEN overall_optimization_score >= 70 THEN 1 END) as above_70,
        COUNT(CASE WHEN overall_optimization_score >= 80 THEN 1 END) as above_80,
        COUNT(CASE WHEN overall_optimization_score >= 90 THEN 1 END) as above_90
      FROM prompt_claude_hints
    `);

    const stats = statsResult.rows[0];
    console.log(`\nCurrent database state:`);
    console.log(`  Total prompts: ${stats.total_prompts}`);
    console.log(`  Average optimization score: ${parseFloat(stats.avg_score).toFixed(1)}`);
    console.log(`  Prompts with score >= 70: ${stats.above_70}`);
    console.log(`  Prompts with score >= 80: ${stats.above_80}`);
    console.log(`  Prompts with score >= 90: ${stats.above_90}`);
  }

  console.log("\nDone!");
  process.exit(0);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
