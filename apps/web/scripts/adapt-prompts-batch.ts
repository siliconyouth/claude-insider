#!/usr/bin/env npx tsx
/**
 * Batch Prompt Adaptation Script
 *
 * Adapts prompts using rule-based logic (no API costs).
 * Applies Claude best practices: XML tags, structure, variables.
 *
 * Usage: npx tsx scripts/adapt-prompts-batch.ts
 *
 * Options:
 *   --input=prompts-adaptation     Input directory
 *   --output=prompts-adapted       Output directory
 *   --batch=0                      Process specific batch (0 = all)
 */

import * as fs from "fs";
import * as path from "path";

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name: string, defaultValue: string): string => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split("=")[1] ?? defaultValue : defaultValue;
};

const INPUT_DIR = getArg("input", "prompts-adaptation");
const OUTPUT_DIR = getArg("output", "prompts-adapted");
const SPECIFIC_BATCH = parseInt(getArg("batch", "0"));

interface InputPrompt {
  id: number;
  title: string;
  content: string;
  source: string;
  sourceUrl: string;
  suggestedCategory: string;
}

interface AdaptedPrompt {
  originalId: number;
  adaptedTitle: string;
  adaptedContent: string;
  description: string;
  suggestedCategory: string;
  variables: Array<{
    name: string;
    description?: string;
    default_value?: string;
    required?: boolean;
    input_type?: string;
  }>;
  tags: string[];
  source: string;
  sourceUrl: string;
}

/**
 * Clean and validate prompt title
 */
function cleanTitle(title: string): string {
  // Remove common prefixes
  let cleaned = title
    .replace(/^(Act as |As a |Be a |I want you to act as )/i, "")
    .replace(/^(The |A |An )/i, "")
    .trim();

  // Skip if title looks like content (too long or starts with "My first")
  if (cleaned.length > 100 || cleaned.toLowerCase().startsWith("my first")) {
    return "";
  }

  // Capitalize first letter of each word
  cleaned = cleaned
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  return cleaned;
}

/**
 * Check if prompt is valid (not a parsing artifact)
 */
function isValidPrompt(prompt: InputPrompt): boolean {
  // Skip if title looks like content
  if (prompt.title.length > 100) return false;
  if (prompt.title.toLowerCase().startsWith("my first")) return false;

  // Skip if content is too short or is a boolean
  if (prompt.content.length < 20) return false;
  if (prompt.content === "TRUE" || prompt.content === "FALSE") return false;

  // Skip if content starts with common artifacts
  if (prompt.content.startsWith("I will")) return false;

  return true;
}

/**
 * Extract variables from content
 */
function extractVariables(
  content: string
): Array<{ name: string; description?: string; default_value?: string; required?: boolean; input_type?: string }> {
  const variables: Array<{
    name: string;
    description?: string;
    default_value?: string;
    required?: boolean;
    input_type?: string;
  }> = [];
  const seen = new Set<string>();

  // Pattern 1: ${Variable:Default}
  const dollarPattern = /\$\{([^:}]+)(?::([^}]*))?\}/g;
  let match;
  while ((match = dollarPattern.exec(content)) !== null) {
    const name = (match[1] ?? "").trim();
    const defaultValue = match[2]?.trim();
    if (!seen.has(name.toLowerCase())) {
      seen.add(name.toLowerCase());
      variables.push({
        name,
        description: `Enter your ${name.toLowerCase().replace(/_/g, " ")}`,
        default_value: defaultValue || undefined,
        required: !defaultValue,
        input_type: name.toLowerCase().includes("text") ? "textarea" : "text",
      });
    }
  }

  // Pattern 2: {{variable}}
  const curlyPattern = /\{\{([^}]+)\}\}/g;
  while ((match = curlyPattern.exec(content)) !== null) {
    const name = (match[1] ?? "").trim();
    if (!seen.has(name.toLowerCase())) {
      seen.add(name.toLowerCase());
      variables.push({
        name,
        description: `Enter your ${name.toLowerCase().replace(/_/g, " ")}`,
        required: true,
        input_type: name.toLowerCase().includes("text") || name.toLowerCase().includes("content") ? "textarea" : "text",
      });
    }
  }

  // Pattern 3: [placeholder]
  const bracketPattern = /\[([A-Z][A-Z_\s]+[A-Z])\]/g;
  while ((match = bracketPattern.exec(content)) !== null) {
    const name = (match[1] ?? "").trim();
    if (!seen.has(name.toLowerCase())) {
      seen.add(name.toLowerCase());
      variables.push({
        name: name.toLowerCase().replace(/\s+/g, "_"),
        description: `Enter your ${name.toLowerCase().replace(/_/g, " ")}`,
        required: true,
        input_type: "text",
      });
    }
  }

  // Pattern 4: {character} or {topic} style
  const simplePattern = /\{([a-z_]+)\}/gi;
  while ((match = simplePattern.exec(content)) !== null) {
    const name = (match[1] ?? "").trim();
    if (!seen.has(name.toLowerCase()) && name.length > 2) {
      seen.add(name.toLowerCase());
      variables.push({
        name,
        description: `Enter the ${name.toLowerCase().replace(/_/g, " ")}`,
        required: true,
        input_type: "text",
      });
    }
  }

  return variables;
}

/**
 * Generate tags from content
 */
function generateTags(title: string, content: string, category: string): string[] {
  const tags = new Set<string>();
  tags.add(category);

  const text = `${title} ${content}`.toLowerCase();

  // Add relevant tags based on keywords
  const tagMap: Record<string, string[]> = {
    ai: ["artificial intelligence", "machine learning", "neural", "model"],
    writing: ["write", "essay", "article", "blog", "content"],
    coding: ["code", "programming", "developer", "script", "function"],
    creative: ["creative", "story", "fiction", "imagination"],
    business: ["business", "startup", "entrepreneur", "company"],
    education: ["teach", "learn", "student", "lesson", "tutor"],
    analysis: ["analyze", "research", "data", "statistics"],
    roleplay: ["act as", "pretend", "character", "persona"],
    translation: ["translate", "language", "multilingual"],
    productivity: ["productivity", "organize", "schedule", "workflow"],
  };

  for (const [tag, keywords] of Object.entries(tagMap)) {
    if (keywords.some((k) => text.includes(k))) {
      tags.add(tag);
    }
  }

  return Array.from(tags).slice(0, 5);
}

/**
 * Generate description from content
 */
function generateDescription(title: string, content: string): string {
  // Extract first meaningful sentence
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 20);
  const firstSentence = sentences[0]?.trim() || "";

  // Build description
  let description = `${title} - `;

  if (firstSentence.length > 100) {
    description += firstSentence.slice(0, 100) + "...";
  } else if (firstSentence) {
    description += firstSentence + ".";
  } else {
    description += `A Claude prompt for ${title.toLowerCase()} tasks.`;
  }

  return description.slice(0, 200);
}

/**
 * Adapt prompt content to Claude best practices
 */
function adaptContent(title: string, content: string, category: string): string {
  let adapted = content;

  // Normalize variable formats to {{variable}}
  adapted = adapted.replace(/\$\{([^:}]+)(?::[^}]*)?\}/g, "{{$1}}");
  adapted = adapted.replace(/\{([a-z_]+)\}/gi, "{{$1}}");

  // Check if already has XML structure
  const hasXML = /<(context|task|instructions|output|format)/i.test(adapted);

  if (!hasXML) {
    // Add XML structure for complex prompts
    const isComplex =
      adapted.length > 200 ||
      adapted.includes("step") ||
      adapted.includes("multiple") ||
      adapted.includes("analyze") ||
      adapted.includes("research");

    if (isComplex) {
      // Wrap with appropriate XML tags
      const lines = adapted.split("\n").filter((l) => l.trim());

      // Try to identify sections
      const roleMatch = adapted.match(/^(I want you to |You are |Act as |Be )([^.!]+[.!])/i);
      const role = roleMatch ? roleMatch[0] : "";
      const instructions = role ? adapted.replace(role, "").trim() : adapted;

      if (role) {
        adapted = `<role>\n${role.trim()}\n</role>\n\n<instructions>\n${instructions}\n</instructions>`;
      } else {
        adapted = `<task>\n${adapted}\n</task>`;
      }

      // Add output format hint if needed
      if (!adapted.includes("<output") && (category === "coding" || category === "analysis" || category === "writing")) {
        adapted += `\n\n<output_format>\nProvide a clear, well-structured response.\n</output_format>`;
      }
    }
  }

  // Add thinking encouragement for analytical tasks
  if (
    (category === "analysis" || category === "coding" || category === "business") &&
    !adapted.includes("think") &&
    !adapted.includes("reason")
  ) {
    adapted += "\n\nThink through your response step by step before providing the final answer.";
  }

  return adapted;
}

/**
 * Adapt a single prompt
 */
function adaptPrompt(prompt: InputPrompt): AdaptedPrompt | null {
  // Validate
  if (!isValidPrompt(prompt)) {
    return null;
  }

  const cleanedTitle = cleanTitle(prompt.title);
  if (!cleanedTitle) {
    return null;
  }

  // Extract variables first (before adapting content)
  const variables = extractVariables(prompt.content);

  // Adapt content
  const adaptedContent = adaptContent(cleanedTitle, prompt.content, prompt.suggestedCategory);

  // Generate metadata
  const tags = generateTags(cleanedTitle, adaptedContent, prompt.suggestedCategory);
  const description = generateDescription(cleanedTitle, prompt.content);

  return {
    originalId: prompt.id,
    adaptedTitle: cleanedTitle,
    adaptedContent,
    description,
    suggestedCategory: prompt.suggestedCategory,
    variables,
    tags,
    source: prompt.source,
    sourceUrl: prompt.sourceUrl,
  };
}

/**
 * Main adaptation function
 */
async function adaptBatches() {
  console.log("=".repeat(60));
  console.log("Batch Prompt Adaptation (Rule-Based)");
  console.log("=".repeat(60));
  console.log(`Input: data/${INPUT_DIR}/`);
  console.log(`Output: data/${OUTPUT_DIR}/`);
  console.log(`Specific batch: ${SPECIFIC_BATCH || "all"}`);
  console.log("");

  // Setup directories
  const inputPath = path.join(process.cwd(), "data", INPUT_DIR);
  const outputPath = path.join(process.cwd(), "data", OUTPUT_DIR);

  if (!fs.existsSync(inputPath)) {
    console.error(`Error: Input directory not found: ${inputPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  // Find batch files
  const files = fs.readdirSync(inputPath).filter((f) => f.endsWith(".json") && f.includes("batch"));

  if (files.length === 0) {
    console.error("Error: No batch files found");
    process.exit(1);
  }

  console.log(`Found ${files.length} batch files`);
  console.log("");

  // Process batches
  let totalProcessed = 0;
  let totalAdapted = 0;
  let totalSkipped = 0;

  for (const file of files.sort()) {
    const batchMatch = file.match(/batch-(\d+)/);
    const batchNum = batchMatch?.[1] ? parseInt(batchMatch[1]) : 0;

    if (SPECIFIC_BATCH > 0 && batchNum !== SPECIFIC_BATCH) {
      continue;
    }

    console.log(`Processing ${file}...`);

    const inputFilePath = path.join(inputPath, file);
    const content = fs.readFileSync(inputFilePath, "utf-8");

    let batch: { prompts: InputPrompt[] };
    try {
      batch = JSON.parse(content);
    } catch {
      console.error(`  Error: Invalid JSON in ${file}`);
      continue;
    }

    const adaptedPrompts: AdaptedPrompt[] = [];

    for (const prompt of batch.prompts) {
      totalProcessed++;
      const adapted = adaptPrompt(prompt);
      if (adapted) {
        adaptedPrompts.push(adapted);
        totalAdapted++;
      } else {
        totalSkipped++;
      }
    }

    // Write adapted batch
    const outputFilePath = path.join(outputPath, `adapted-batch-${batchNum}.json`);
    fs.writeFileSync(
      outputFilePath,
      JSON.stringify(
        {
          batchNumber: batchNum,
          promptsInBatch: adaptedPrompts.length,
          prompts: adaptedPrompts,
        },
        null,
        2
      )
    );

    console.log(`  Adapted: ${adaptedPrompts.length}/${batch.prompts.length} prompts`);
  }

  console.log("");
  console.log("=".repeat(60));
  console.log("Adaptation Complete!");
  console.log("=".repeat(60));
  console.log(`Total processed: ${totalProcessed}`);
  console.log(`Total adapted: ${totalAdapted}`);
  console.log(`Total skipped: ${totalSkipped}`);
  console.log("");
  console.log("Next step: Run import-adapted-prompts.ts to import to database");
}

// Run
adaptBatches().catch(console.error);
