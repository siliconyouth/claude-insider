#!/usr/bin/env npx tsx
/**
 * Import Adapted Prompts
 *
 * Imports prompts that have been adapted by Claude Code into the database.
 *
 * Usage: npx dotenvx run -f .env.local -- npx tsx scripts/import-adapted-prompts.ts
 *
 * Options:
 *   --input=prompts-adapted   Input directory name (under data/)
 *   --dry-run                 Show what would be imported without making changes
 *   --skip-existing           Skip prompts that already exist (by title)
 *   --batch=0                 Import only a specific batch (0 = all)
 *
 * Expected input format:
 *   data/prompts-adapted/adapted-batch-1.json
 *   Each file contains:
 *   {
 *     "prompts": [
 *       {
 *         "originalId": 1,
 *         "adaptedTitle": "...",
 *         "adaptedContent": "...",
 *         "description": "...",
 *         "suggestedCategory": "coding",
 *         "variables": [...],
 *         "tags": [...],
 *         "source": "awesome-chatgpt-prompts",
 *         "sourceUrl": "..."
 *       }
 *     ]
 *   }
 */

import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import {
  analyzePrompt,
  extractVariables,
  generateTags,
  classifyPrompt,
} from "../lib/prompt-adaptation";

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name: string, defaultValue: string): string => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split("=")[1] ?? defaultValue : defaultValue;
};
const hasFlag = (name: string): boolean => args.includes(`--${name}`);

const INPUT_DIR = getArg("input", "prompts-adapted");
const DRY_RUN = hasFlag("dry-run");
const SKIP_EXISTING = hasFlag("skip-existing");
const SPECIFIC_BATCH = parseInt(getArg("batch", "0"));

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Missing Supabase credentials");
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface AdaptedPrompt {
  originalId: number;
  adaptedTitle: string;
  adaptedContent: string;
  description: string;
  suggestedCategory: string;
  variables?: Array<{
    name: string;
    description?: string;
    default_value?: string;
    required?: boolean;
    input_type?: string;
  }>;
  tags?: string[];
  source: string;
  sourceUrl: string;
}

interface BatchFile {
  batchNumber: number;
  prompts: AdaptedPrompt[];
}

/**
 * Generate a unique slug from title
 */
function generateSlug(title: string, existingSlugs: Set<string>): string {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);

  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.has(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  existingSlugs.add(slug);
  return slug;
}

/**
 * Get category ID from slug
 */
async function getCategoryMap(): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from("prompt_categories")
    .select("id, slug");

  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }

  const map = new Map<string, string>();
  for (const cat of data || []) {
    map.set(cat.slug, cat.id);
  }

  return map;
}

/**
 * Get existing prompt titles
 */
async function getExistingTitles(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("prompts")
    .select("title");

  if (error) {
    throw new Error(`Failed to fetch existing prompts: ${error.message}`);
  }

  return new Set((data || []).map((p) => p.title.toLowerCase()));
}

/**
 * Get existing slugs
 */
async function getExistingSlugs(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("prompts")
    .select("slug");

  if (error) {
    throw new Error(`Failed to fetch existing slugs: ${error.message}`);
  }

  return new Set((data || []).map((p) => p.slug));
}

/**
 * Import a single prompt
 */
async function importPrompt(
  prompt: AdaptedPrompt,
  categoryMap: Map<string, string>,
  existingSlugs: Set<string>,
  existingTitles: Set<string>
): Promise<{ success: boolean; slug?: string; error?: string }> {
  // Check for duplicate
  if (SKIP_EXISTING && existingTitles.has(prompt.adaptedTitle.toLowerCase())) {
    return { success: false, error: "Already exists (skipped)" };
  }

  // Generate slug
  const slug = generateSlug(prompt.adaptedTitle, existingSlugs);

  // Get category ID
  const categoryId = categoryMap.get(prompt.suggestedCategory) || categoryMap.get("conversation");

  if (!categoryId) {
    return { success: false, error: `Unknown category: ${prompt.suggestedCategory}` };
  }

  // Extract or use provided variables
  const variables = prompt.variables && prompt.variables.length > 0
    ? prompt.variables
    : extractVariables(prompt.adaptedContent);

  // Generate or use provided tags
  const tags = prompt.tags && prompt.tags.length > 0
    ? prompt.tags
    : generateTags(prompt.adaptedTitle, prompt.adaptedContent, prompt.suggestedCategory);

  // Analyze prompt for hints
  const hints = analyzePrompt(prompt.adaptedContent);

  if (DRY_RUN) {
    return { success: true, slug };
  }

  // Insert prompt
  const { data: promptData, error: promptError } = await supabase
    .from("prompts")
    .insert({
      slug,
      title: prompt.adaptedTitle,
      description: prompt.description,
      content: prompt.adaptedContent,
      category_id: categoryId,
      tags,
      variables: JSON.stringify(variables),
      visibility: "public",
      is_featured: false,
      is_system: false,
      status: "active",
      source_type: "imported",
      source_url: prompt.sourceUrl,
      source_attribution: prompt.source,
    })
    .select("id")
    .single();

  if (promptError) {
    return { success: false, error: promptError.message };
  }

  // Insert Claude hints
  const { error: hintsError } = await supabase.from("prompt_claude_hints").insert({
    prompt_id: promptData.id,
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

  if (hintsError) {
    console.warn(`  Warning: Failed to insert hints for ${slug}: ${hintsError.message}`);
  }

  // Track in import log
  const { error: logError } = await supabase.from("prompt_imports").upsert(
    {
      source_name: prompt.source,
      source_url: prompt.sourceUrl,
      status: "completed",
      total_prompts: 1,
      imported_count: 1,
    },
    { onConflict: "source_name" }
  );

  if (logError) {
    console.warn(`  Warning: Failed to log import: ${logError.message}`);
  }

  return { success: true, slug };
}

/**
 * Main import function
 */
async function importAdaptedPrompts() {
  console.log("=".repeat(60));
  console.log("Import Adapted Prompts");
  console.log("=".repeat(60));
  console.log(`Input directory: data/${INPUT_DIR}/`);
  console.log(`Dry run: ${DRY_RUN}`);
  console.log(`Skip existing: ${SKIP_EXISTING}`);
  console.log(`Specific batch: ${SPECIFIC_BATCH || "all"}`);
  console.log("");

  // Check input directory exists
  const inputPath = path.join(process.cwd(), "data", INPUT_DIR);
  if (!fs.existsSync(inputPath)) {
    console.error(`Error: Input directory not found: ${inputPath}`);
    console.error("");
    console.error("Please run the adaptation workflow first:");
    console.error("1. npx tsx scripts/export-prompts-for-adaptation.ts");
    console.error("2. Have Claude Code adapt the batches");
    console.error("3. Save adapted prompts to data/prompts-adapted/");
    process.exit(1);
  }

  // Find batch files
  const files = fs.readdirSync(inputPath).filter((f) => f.endsWith(".json") && f.includes("batch"));

  if (files.length === 0) {
    console.error("Error: No batch files found in input directory");
    process.exit(1);
  }

  console.log(`Found ${files.length} batch files`);

  // Load category map
  const categoryMap = await getCategoryMap();
  console.log(`Loaded ${categoryMap.size} categories`);

  // Load existing data
  const existingSlugs = await getExistingSlugs();
  const existingTitles = await getExistingTitles();
  console.log(`Found ${existingTitles.size} existing prompts`);
  console.log("");

  // Process each batch
  let totalImported = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const file of files.sort()) {
    // Check if we should process this batch
    const batchMatch = file.match(/batch-(\d+)/);
    const batchNum = batchMatch?.[1] ? parseInt(batchMatch[1]) : 0;

    if (SPECIFIC_BATCH > 0 && batchNum !== SPECIFIC_BATCH) {
      continue;
    }

    console.log(`Processing ${file}...`);

    const filepath = path.join(inputPath, file);
    const content = fs.readFileSync(filepath, "utf-8");

    let batch: BatchFile;
    try {
      batch = JSON.parse(content);
    } catch {
      console.error(`  Error: Invalid JSON in ${file}`);
      totalErrors++;
      continue;
    }

    for (const prompt of batch.prompts) {
      const result = await importPrompt(prompt, categoryMap, existingSlugs, existingTitles);

      if (result.success) {
        totalImported++;
        if (!DRY_RUN) {
          existingTitles.add(prompt.adaptedTitle.toLowerCase());
        }
      } else if (result.error?.includes("skipped")) {
        totalSkipped++;
      } else {
        totalErrors++;
        console.error(`  Error importing "${prompt.adaptedTitle}": ${result.error}`);
      }
    }

    console.log(`  Batch complete: ${batch.prompts.length} prompts processed`);
  }

  console.log("");
  console.log("=".repeat(60));
  console.log("Import Complete!");
  console.log("=".repeat(60));
  console.log(`Total imported: ${totalImported}`);
  console.log(`Total skipped: ${totalSkipped}`);
  console.log(`Total errors: ${totalErrors}`);

  if (DRY_RUN) {
    console.log("");
    console.log("This was a DRY RUN. No changes were made to the database.");
    console.log("Remove --dry-run to actually import the prompts.");
  }
}

// Run import
importAdaptedPrompts().catch(console.error);
