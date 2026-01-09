#!/usr/bin/env npx tsx
/**
 * Prompt Import Pipeline
 *
 * Imports prompts from external sources (awesome-chatgpt-prompts, etc.),
 * adapts them for Claude best practices, generates hints, and inserts into database.
 *
 * Usage: npx dotenvx run -f .env.local -- npx tsx scripts/import-prompts.ts
 *
 * Options:
 *   --source=awesome-chatgpt   Source to import from (default: awesome-chatgpt)
 *   --limit=10                 Process only N prompts
 *   --dry-run                  Show what would be imported
 *   --skip-adaptation         Skip Claude AI adaptation (faster, for testing)
 *   --skip=50                  Skip first N prompts
 *   --concurrency=5           Number of parallel AI adaptations (default: 5)
 */

import Anthropic from "@anthropic-ai/sdk";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import PQueue from "p-queue";

// Configuration
const DEFAULT_CONCURRENCY = 5;
const ANTHROPIC_MODEL = "claude-sonnet-4-20250514";

// CSV URL for awesome-chatgpt-prompts
const SOURCES = {
  "awesome-chatgpt": {
    name: "awesome-chatgpt-prompts",
    url: "https://raw.githubusercontent.com/f/awesome-chatgpt-prompts/main/prompts.csv",
    type: "csv",
  },
} as const;

// Category mapping based on keywords and content analysis
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  coding: [
    "code", "programming", "developer", "javascript", "python", "api",
    "software", "debug", "algorithm", "terminal", "console", "sql",
    "database", "git", "regex", "compiler", "syntax", "function", "class",
    "ethereum", "solidity", "blockchain", "smart contract", "web3"
  ],
  devops: [
    "linux", "docker", "kubernetes", "ci/cd", "deployment", "server",
    "infrastructure", "aws", "cloud", "bash", "shell", "nginx", "devops"
  ],
  writing: [
    "writer", "essay", "article", "blog", "content", "copywriting",
    "storyteller", "novelist", "poet", "screenwriter", "journalist", "editor"
  ],
  creative: [
    "creative", "art", "music", "song", "compose", "design", "imaginative",
    "fantasy", "story", "character", "world-building", "roleplay"
  ],
  business: [
    "business", "startup", "entrepreneur", "marketing", "sales", "ceo",
    "manager", "consultant", "strategy", "product", "customer", "career"
  ],
  marketing: [
    "advertiser", "seo", "social media", "campaign", "branding", "copywriter",
    "influencer", "content strategy", "promotion"
  ],
  education: [
    "teacher", "tutor", "instructor", "lesson", "curriculum", "student",
    "learning", "educational", "academy", "course", "training"
  ],
  translation: [
    "translator", "language", "translate", "multilingual", "localization",
    "interpreter", "pronunciation", "vocabulary", "grammar"
  ],
  analysis: [
    "analyst", "data", "statistics", "research", "evaluate", "assess",
    "review", "critique", "examine", "investigate"
  ],
  legal: [
    "legal", "lawyer", "attorney", "contract", "law", "compliance",
    "regulatory", "court", "litigation"
  ],
  healthcare: [
    "doctor", "medical", "health", "patient", "diagnosis", "treatment",
    "nutrition", "fitness", "wellness", "therapy", "mental health"
  ],
  security: [
    "security", "cybersecurity", "hacker", "vulnerability", "penetration",
    "encryption", "firewall", "authentication"
  ],
  research: [
    "academic", "journal", "paper", "citation", "thesis", "dissertation",
    "scholar", "bibliography", "literature review"
  ],
  productivity: [
    "productivity", "time management", "organize", "schedule", "efficiency",
    "workflow", "task", "todo", "planner"
  ],
  conversation: [
    "chat", "conversation", "dialogue", "interview", "communication",
    "debate", "discussion", "assistant"
  ],
  roleplay: [
    "act as", "pretend", "role", "character", "persona", "simulation",
    "scenario", "impersonate"
  ],
  learning: [
    "learn", "study", "understand", "explain", "teach me", "beginner",
    "guide", "introduction", "basics"
  ],
  design: [
    "ui", "ux", "interface", "layout", "wireframe", "prototype",
    "figma", "sketch", "visual", "graphic"
  ],
};

interface ParsedPrompt {
  title: string;
  content: string;
  forDevs: boolean;
  type: string;
  contributor: string;
}

interface PromptVariable {
  name: string;
  description: string;
  default_value?: string;
  required: boolean;
}

interface AdaptedPrompt {
  title: string;
  originalContent: string;
  adaptedContent: string;
  description: string;
  category: string;
  tags: string[];
  variables: PromptVariable[];
  difficulty: "beginner" | "intermediate" | "advanced";
  hints: {
    usesXmlTags: boolean;
    usesThinkingSection: boolean;
    usesExamples: boolean;
    usesChainOfThought: boolean;
    usesSystemContext: boolean;
    usesOutputFormat: boolean;
    structureScore: number;
    clarityScore: number;
    specificityScore: number;
    overallScore: number;
    recommendedModel: "opus" | "sonnet" | "haiku";
    estimatedTokens: number;
    complexityLevel: "simple" | "moderate" | "complex";
    improvementSuggestions: { type: string; description: string; priority: "high" | "medium" | "low" }[];
  };
  contributor: string;
}

interface ImportResult {
  title: string;
  success: boolean;
  promptId?: string;
  error?: string;
}

// Parse command line arguments
function parseArgs(): {
  source: string;
  limit?: number;
  dryRun: boolean;
  skipAdaptation: boolean;
  skip?: number;
  concurrency: number;
} {
  const args = process.argv.slice(2);
  const options = {
    source: "awesome-chatgpt",
    dryRun: false,
    skipAdaptation: false,
    concurrency: DEFAULT_CONCURRENCY,
  } as ReturnType<typeof parseArgs>;

  for (const arg of args) {
    if (arg.startsWith("--source=")) {
      const value = arg.split("=")[1];
      if (value) options.source = value;
    } else if (arg.startsWith("--limit=")) {
      const value = arg.split("=")[1];
      if (value) options.limit = parseInt(value, 10);
    } else if (arg.startsWith("--skip=")) {
      const value = arg.split("=")[1];
      if (value) options.skip = parseInt(value, 10);
    } else if (arg.startsWith("--concurrency=")) {
      const value = arg.split("=")[1];
      if (value) options.concurrency = parseInt(value, 10);
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--skip-adaptation") {
      options.skipAdaptation = true;
    }
  }

  return options;
}

// Get Supabase client
function getSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
  }

  return createClient(url, key);
}

// Get Anthropic client
function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY required");
  }
  return new Anthropic({ apiKey });
}

// Parse CSV content
function parseCSV(content: string): ParsedPrompt[] {
  const lines = content.split("\n");
  const prompts: ParsedPrompt[] = [];

  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]?.trim();
    if (!line) continue;

    // Parse CSV with proper quote handling
    const parsed = parseCSVLine(line);
    if (parsed.length >= 5) {
      prompts.push({
        title: parsed[0] || "",
        content: parsed[1] || "",
        forDevs: parsed[2]?.toUpperCase() === "TRUE",
        type: parsed[3] || "TEXT",
        contributor: parsed[4] || "",
      });
    }
  }

  return prompts;
}

// Parse a single CSV line handling quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);

  return result;
}

// Extract variables from content (format: ${Name:Default} or ${Name})
function extractVariables(content: string): { cleanContent: string; variables: PromptVariable[] } {
  const variableRegex = /\$\{([^}:]+)(?::([^}]*))?\}/g;
  const variables: PromptVariable[] = [];
  const seenNames = new Set<string>();

  // Extract and dedupe variables
  let match;
  while ((match = variableRegex.exec(content)) !== null) {
    const name = match[1]?.trim() || "";
    const defaultValue = match[2]?.trim();

    if (name && !seenNames.has(name.toLowerCase())) {
      seenNames.add(name.toLowerCase());
      variables.push({
        name: name.replace(/\s+/g, "_").toLowerCase(),
        description: name,
        default_value: defaultValue,
        required: !defaultValue,
      });
    }
  }

  // Convert to {{variable_name}} format
  const cleanContent = content.replace(variableRegex, (_, name: string) => {
    return `{{${name.replace(/\s+/g, "_").toLowerCase()}}}`;
  });

  return { cleanContent, variables };
}

// Determine category based on content analysis
function categorizePrompt(prompt: ParsedPrompt): string {
  const text = `${prompt.title} ${prompt.content}`.toLowerCase();

  // Check for_devs flag first
  if (prompt.forDevs) {
    // Check if it's more devops-specific
    const devopsScore = CATEGORY_KEYWORDS.devops!.filter(kw => text.includes(kw)).length;
    const codingScore = CATEGORY_KEYWORDS.coding!.filter(kw => text.includes(kw)).length;
    if (devopsScore > codingScore) return "devops";
    return "coding";
  }

  // Score each category
  const scores: Record<string, number> = {};
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    scores[category] = keywords.filter(kw => text.includes(kw)).length;
  }

  // Find highest scoring category
  let maxScore = 0;
  let bestCategory = "productivity"; // default

  for (const [category, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestCategory = category;
    }
  }

  return bestCategory;
}

// Generate tags from content
function generateTags(prompt: ParsedPrompt, category: string): string[] {
  const text = `${prompt.title} ${prompt.content}`.toLowerCase();
  const tags: string[] = [category];

  // Add relevant keywords as tags
  const allKeywords = Object.values(CATEGORY_KEYWORDS).flat();
  for (const keyword of allKeywords) {
    if (text.includes(keyword) && !tags.includes(keyword) && tags.length < 8) {
      tags.push(keyword);
    }
  }

  // Add source-specific tags
  if (prompt.forDevs) tags.push("developer");

  return tags.slice(0, 8);
}

// Adapt prompt for Claude using AI
async function adaptPromptWithClaude(
  anthropic: Anthropic,
  prompt: ParsedPrompt,
  category: string
): Promise<Partial<AdaptedPrompt>> {
  const systemPrompt = `You are an expert prompt engineer specializing in Claude AI. Your task is to adapt prompts to follow Claude best practices while preserving their original intent.

Claude best practices include:
1. XML tags for structure (<context>, <task>, <output_format>, <constraints>, <examples>)
2. Explicit, unambiguous instructions
3. Examples when helpful for complex tasks
4. Chain-of-thought guidance for reasoning tasks
5. Clear output format specifications
6. Appropriate thinking sections for complex problems

Return a JSON object with these exact fields:
{
  "adaptedContent": "The Claude-optimized version of the prompt",
  "description": "A 1-2 sentence description of what this prompt does",
  "difficulty": "beginner|intermediate|advanced",
  "hints": {
    "usesXmlTags": true/false,
    "usesThinkingSection": true/false,
    "usesExamples": true/false,
    "usesChainOfThought": true/false,
    "usesSystemContext": true/false,
    "usesOutputFormat": true/false,
    "structureScore": 0-100,
    "clarityScore": 0-100,
    "specificityScore": 0-100,
    "overallScore": 0-100,
    "recommendedModel": "opus|sonnet|haiku",
    "estimatedTokens": number,
    "complexityLevel": "simple|moderate|complex",
    "improvementSuggestions": [{"type": "string", "description": "string", "priority": "high|medium|low"}]
  }
}`;

  const userPrompt = `Adapt this prompt for Claude AI best practices.

Title: ${prompt.title}
Category: ${category}
Original Prompt:
${prompt.content}

Important:
- Preserve the original intent and functionality
- Add XML tags for structure where appropriate
- Extract any {{variables}} and keep them in the adapted version
- Make instructions explicit and unambiguous
- Add thinking sections if the task requires complex reasoning
- Keep it concise - don't over-engineer simple prompts

Return ONLY the JSON object, no markdown.`;

  try {
    const response = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 4096,
      messages: [
        { role: "user", content: userPrompt }
      ],
      system: systemPrompt,
    });

    const text = response.content[0]?.type === "text" ? response.content[0].text : "";

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error(`Failed to adapt "${prompt.title}":`, error);
    // Return basic adaptation without AI
    return {
      adaptedContent: prompt.content,
      description: `${prompt.title} prompt`,
      difficulty: "intermediate",
      hints: {
        usesXmlTags: false,
        usesThinkingSection: false,
        usesExamples: false,
        usesChainOfThought: false,
        usesSystemContext: false,
        usesOutputFormat: false,
        structureScore: 30,
        clarityScore: 50,
        specificityScore: 40,
        overallScore: 40,
        recommendedModel: "sonnet",
        estimatedTokens: Math.ceil(prompt.content.length / 4),
        complexityLevel: "moderate",
        improvementSuggestions: [],
      },
    };
  }
}

// Create slug from title
function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

// Check if prompt already exists
async function promptExists(supabase: SupabaseClient, slug: string): Promise<boolean> {
  const { data } = await supabase
    .from("prompts")
    .select("id")
    .eq("slug", slug)
    .single();

  return !!data;
}

// Get category ID by slug
async function getCategoryId(supabase: SupabaseClient, slug: string): Promise<string | null> {
  const { data } = await supabase
    .from("prompt_categories")
    .select("id")
    .eq("slug", slug)
    .single();

  return data?.id || null;
}

// Create import job record
async function createImportJob(
  supabase: SupabaseClient,
  sourceName: string,
  sourceUrl: string,
  totalPrompts: number
): Promise<string> {
  const { data, error } = await supabase
    .from("prompt_imports")
    .insert({
      source_name: sourceName,
      source_url: sourceUrl,
      status: "running",
      total_prompts: totalPrompts,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

// Update import job progress
async function updateImportJob(
  supabase: SupabaseClient,
  jobId: string,
  updates: {
    imported_count?: number;
    adapted_count?: number;
    skipped_count?: number;
    failed_count?: number;
    status?: string;
    error_log?: unknown[];
  }
): Promise<void> {
  await supabase
    .from("prompt_imports")
    .update({
      ...updates,
      ...(updates.status === "completed" || updates.status === "failed"
        ? { completed_at: new Date().toISOString() }
        : {}),
    })
    .eq("id", jobId);
}

// Insert prompt into database
async function insertPrompt(
  supabase: SupabaseClient,
  adapted: AdaptedPrompt,
  categoryId: string,
  sourceInfo: { name: string; url: string }
): Promise<string> {
  // Insert main prompt
  const { data: promptData, error: promptError } = await supabase
    .from("prompts")
    .insert({
      title: adapted.title,
      slug: createSlug(adapted.title),
      description: adapted.description,
      content: adapted.adaptedContent,
      variables: adapted.variables,
      category_id: categoryId,
      tags: adapted.tags,
      visibility: "public",
      is_system: true, // Mark as curated system prompt
      source_type: "imported",
      source_url: sourceInfo.url,
      source_attribution: adapted.contributor,
      original_content: adapted.originalContent,
      difficulty: adapted.difficulty,
      estimated_tokens: adapted.hints.estimatedTokens,
      use_count: 0,
      current_version: 1,
    })
    .select("id")
    .single();

  if (promptError) throw promptError;
  const promptId = promptData.id;

  // Insert Claude hints
  await supabase.from("prompt_claude_hints").insert({
    prompt_id: promptId,
    uses_xml_tags: adapted.hints.usesXmlTags,
    uses_thinking_section: adapted.hints.usesThinkingSection,
    uses_examples: adapted.hints.usesExamples,
    uses_chain_of_thought: adapted.hints.usesChainOfThought,
    uses_system_context: adapted.hints.usesSystemContext,
    uses_output_format: adapted.hints.usesOutputFormat,
    structure_score: adapted.hints.structureScore,
    clarity_score: adapted.hints.clarityScore,
    specificity_score: adapted.hints.specificityScore,
    overall_optimization_score: adapted.hints.overallScore,
    recommended_model: adapted.hints.recommendedModel,
    estimated_tokens: adapted.hints.estimatedTokens,
    complexity_level: adapted.hints.complexityLevel,
    improvement_suggestions: adapted.hints.improvementSuggestions,
    analyzed_at: new Date().toISOString(),
  });

  // Create initial version
  await supabase.from("prompt_versions").insert({
    prompt_id: promptId,
    version_number: 1,
    content: adapted.adaptedContent,
    variables: adapted.variables,
    change_summary: "Initial import from " + sourceInfo.name,
    claude_adaptation_notes: adapted.originalContent !== adapted.adaptedContent
      ? "Adapted for Claude best practices"
      : "Original content preserved",
  });

  return promptId;
}

// Process a single prompt
async function processPrompt(
  supabase: SupabaseClient,
  anthropic: Anthropic | null,
  prompt: ParsedPrompt,
  sourceInfo: { name: string; url: string },
  skipAdaptation: boolean
): Promise<ImportResult> {
  try {
    const slug = createSlug(prompt.title);

    // Check if already exists
    if (await promptExists(supabase, slug)) {
      return { title: prompt.title, success: false, error: "Already exists" };
    }

    // Extract variables
    const { cleanContent, variables } = extractVariables(prompt.content);

    // Categorize
    const category = categorizePrompt(prompt);
    const categoryId = await getCategoryId(supabase, category);

    if (!categoryId) {
      return { title: prompt.title, success: false, error: `Category not found: ${category}` };
    }

    // Generate tags
    const tags = generateTags(prompt, category);

    // Adapt with Claude AI (or skip)
    let adapted: AdaptedPrompt;
    if (skipAdaptation || !anthropic) {
      // Basic adaptation without AI
      adapted = {
        title: prompt.title,
        originalContent: prompt.content,
        adaptedContent: cleanContent,
        description: `${prompt.title} prompt`,
        category,
        tags,
        variables,
        difficulty: "intermediate",
        hints: {
          usesXmlTags: false,
          usesThinkingSection: false,
          usesExamples: false,
          usesChainOfThought: false,
          usesSystemContext: false,
          usesOutputFormat: false,
          structureScore: 30,
          clarityScore: 50,
          specificityScore: 40,
          overallScore: 40,
          recommendedModel: "sonnet",
          estimatedTokens: Math.ceil(cleanContent.length / 4),
          complexityLevel: "moderate",
          improvementSuggestions: [],
        },
        contributor: prompt.contributor,
      };
    } else {
      // Full AI adaptation
      const aiResult = await adaptPromptWithClaude(anthropic, { ...prompt, content: cleanContent }, category);

      // Re-extract variables from adapted content
      const adaptedVars = extractVariables(aiResult.adaptedContent || cleanContent);

      adapted = {
        title: prompt.title,
        originalContent: prompt.content,
        adaptedContent: adaptedVars.cleanContent,
        description: aiResult.description || `${prompt.title} prompt`,
        category,
        tags,
        variables: adaptedVars.variables.length > 0 ? adaptedVars.variables : variables,
        difficulty: aiResult.difficulty || "intermediate",
        hints: {
          usesXmlTags: aiResult.hints?.usesXmlTags || false,
          usesThinkingSection: aiResult.hints?.usesThinkingSection || false,
          usesExamples: aiResult.hints?.usesExamples || false,
          usesChainOfThought: aiResult.hints?.usesChainOfThought || false,
          usesSystemContext: aiResult.hints?.usesSystemContext || false,
          usesOutputFormat: aiResult.hints?.usesOutputFormat || false,
          structureScore: aiResult.hints?.structureScore || 50,
          clarityScore: aiResult.hints?.clarityScore || 50,
          specificityScore: aiResult.hints?.specificityScore || 50,
          overallScore: aiResult.hints?.overallScore || 50,
          recommendedModel: aiResult.hints?.recommendedModel || "sonnet",
          estimatedTokens: aiResult.hints?.estimatedTokens || Math.ceil(cleanContent.length / 4),
          complexityLevel: aiResult.hints?.complexityLevel || "moderate",
          improvementSuggestions: aiResult.hints?.improvementSuggestions || [],
        },
        contributor: prompt.contributor,
      };
    }

    // Insert into database
    const promptId = await insertPrompt(supabase, adapted, categoryId, sourceInfo);

    return { title: prompt.title, success: true, promptId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { title: prompt.title, success: false, error: message };
  }
}

// Main
async function main() {
  const options = parseArgs();
  const sourceKey = options.source as keyof typeof SOURCES;
  const source = SOURCES[sourceKey];

  if (!source) {
    console.error(`Unknown source: ${options.source}`);
    console.error("Available sources:", Object.keys(SOURCES).join(", "));
    process.exit(1);
  }

  console.log("\n" + "=".repeat(60));
  console.log("Prompt Import Pipeline");
  console.log("=".repeat(60));
  console.log(`Source: ${source.name}`);
  console.log(`Concurrency: ${options.concurrency}`);
  if (options.limit) console.log(`Limit: ${options.limit} prompts`);
  if (options.skip) console.log(`Skip: first ${options.skip} prompts`);
  if (options.dryRun) console.log("Mode: DRY RUN");
  if (options.skipAdaptation) console.log("Mode: SKIP AI ADAPTATION");
  console.log("");

  // Fetch source data
  console.log("Fetching prompts from source...");
  const response = await fetch(source.url);
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }
  const content = await response.text();

  // Parse CSV
  let prompts = parseCSV(content);
  console.log(`Parsed ${prompts.length} prompts from CSV\n`);

  // Apply skip
  if (options.skip && options.skip > 0) {
    prompts = prompts.slice(options.skip);
    console.log(`Skipped first ${options.skip}, ${prompts.length} remaining`);
  }

  // Apply limit
  if (options.limit && options.limit < prompts.length) {
    prompts = prompts.slice(0, options.limit);
    console.log(`Limited to ${prompts.length} prompts`);
  }

  // Category breakdown
  const byCategory: Record<string, number> = {};
  prompts.forEach((p) => {
    const cat = categorizePrompt(p);
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  });

  console.log("\nCategory breakdown:");
  Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => console.log(`  ${cat}: ${count}`));

  if (options.dryRun) {
    console.log("\nDRY RUN - Would import these prompts:\n");
    prompts.slice(0, 20).forEach((p) => {
      const cat = categorizePrompt(p);
      console.log(`  [${cat}] ${p.title}`);
    });
    if (prompts.length > 20) {
      console.log(`  ... and ${prompts.length - 20} more`);
    }
    return;
  }

  // Initialize clients
  const supabase = getSupabaseClient();
  const anthropic = options.skipAdaptation ? null : getAnthropicClient();

  // Create import job
  const jobId = await createImportJob(supabase, source.name, source.url, prompts.length);
  console.log(`\nCreated import job: ${jobId}`);

  // Process prompts
  const queue = new PQueue({ concurrency: options.concurrency });
  const results: ImportResult[] = [];
  let imported = 0;
  let skipped = 0;
  let failed = 0;
  const errors: { title: string; error: string }[] = [];
  const startTime = Date.now();

  console.log(`\nImporting prompts...`);
  if (!options.skipAdaptation) {
    console.log("   (Using Claude AI for adaptation)\n");
  }

  const promises = prompts.map((prompt) =>
    queue.add(async () => {
      const result = await processPrompt(
        supabase,
        anthropic,
        prompt,
        { name: source.name, url: source.url },
        options.skipAdaptation
      );
      results.push(result);

      if (result.success) {
        imported++;
      } else if (result.error === "Already exists") {
        skipped++;
      } else {
        failed++;
        errors.push({ title: result.title, error: result.error || "Unknown" });
      }

      // Progress update every 10
      if ((imported + skipped + failed) % 10 === 0) {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        process.stdout.write(
          `\rProgress: ${imported + skipped + failed}/${prompts.length} | Imported: ${imported} | Skipped: ${skipped} | Failed: ${failed} | Time: ${elapsed}s`
        );

        // Update job progress
        await updateImportJob(supabase, jobId, {
          imported_count: imported,
          skipped_count: skipped,
          failed_count: failed,
        });
      }

      return result;
    })
  );

  await Promise.all(promises);

  // Final job update
  await updateImportJob(supabase, jobId, {
    imported_count: imported,
    skipped_count: skipped,
    failed_count: failed,
    status: "completed",
    error_log: errors,
  });

  const duration = Math.round((Date.now() - startTime) / 1000);

  // Summary
  console.log("\n\n" + "=".repeat(60));
  console.log("Import Summary");
  console.log("=".repeat(60));
  console.log(`Imported: ${imported}`);
  console.log(`Skipped: ${skipped} (already exist)`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${results.length}`);
  console.log(`Duration: ${duration} seconds`);
  console.log(`Rate: ${(results.length / Math.max(duration, 1)).toFixed(1)} prompts/second`);
  console.log("=".repeat(60) + "\n");

  if (errors.length > 0 && errors.length <= 20) {
    console.log("Failed prompts:");
    errors.forEach((e) => console.log(`  ${e.title}: ${e.error}`));
  } else if (errors.length > 20) {
    console.log(`\n${errors.length} prompts failed. First 10:`);
    errors.slice(0, 10).forEach((e) => console.log(`  ${e.title}: ${e.error}`));
  }

  // Verify
  const { count } = await supabase
    .from("prompts")
    .select("*", { count: "exact", head: true })
    .eq("source_type", "imported");

  console.log(`\nTotal imported prompts in database: ${count}`);
}

main().catch(console.error);
