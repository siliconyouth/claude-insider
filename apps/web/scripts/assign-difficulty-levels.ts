#!/usr/bin/env npx tsx
/**
 * Assign Difficulty Levels to Resources
 *
 * This script analyzes resources without difficulty levels and assigns them
 * using intelligent heuristics based on:
 * 1. Category defaults
 * 2. Content analysis (title + description keywords)
 * 3. GitHub complexity indicators (language, stars)
 *
 * Usage: npx dotenvx run -f .env.local -- npx tsx scripts/assign-difficulty-levels.ts
 *
 * Options:
 *   --dry-run    Preview changes without updating database
 *   --category   Only process specific category (e.g., --category=mcp-servers)
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Difficulty levels
type Difficulty = "beginner" | "intermediate" | "advanced" | "expert";

interface Resource {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  subcategory: string | null;
  github_language: string | null;
  github_stars: number;
  tags: string[];
}

interface DifficultyAssignment {
  resource: Resource;
  difficulty: Difficulty;
  reason: string;
}

// Category-based default difficulty
const CATEGORY_DEFAULTS: Record<string, Difficulty> = {
  official: "beginner", // Official docs are well-documented
  tutorials: "beginner", // Learning materials
  prompts: "beginner", // Just copy and use
  showcases: "intermediate", // Examples to learn from
  community: "intermediate", // Community resources vary
  rules: "intermediate", // Configuration knowledge needed
  tools: "intermediate", // Require some setup
  sdks: "intermediate", // Programming required
  "mcp-servers": "intermediate", // MCP understanding needed
  agents: "advanced", // Complex implementations
};

// Keywords that indicate difficulty levels
const DIFFICULTY_KEYWORDS: Record<Difficulty, string[]> = {
  beginner: [
    "getting started",
    "introduction",
    "intro to",
    "basics",
    "basic",
    "simple",
    "easy",
    "starter",
    "template",
    "boilerplate",
    "quickstart",
    "quick start",
    "hello world",
    "first steps",
    "beginner",
    "newbie",
    "101",
    "tutorial",
    "learn",
    "guide",
    "walkthrough",
  ],
  intermediate: [
    "integration",
    "workflow",
    "automation",
    "connector",
    "bridge",
    "adapter",
    "middleware",
    "plugin",
    "extension",
    "toolkit",
    "utility",
    "helper",
    "library",
    "wrapper",
    "client",
  ],
  advanced: [
    "advanced",
    "complex",
    "enterprise",
    "production",
    "scalable",
    "distributed",
    "architecture",
    "framework",
    "platform",
    "infrastructure",
    "orchestration",
    "pipeline",
    "multi-agent",
    "autonomous",
    "self-healing",
  ],
  expert: [
    "expert",
    "cutting-edge",
    "research",
    "experimental",
    "novel",
    "state-of-the-art",
    "breakthrough",
    "pioneering",
  ],
};

// Programming languages and their typical complexity
const LANGUAGE_DIFFICULTY: Record<string, Difficulty> = {
  // Beginner-friendly
  Python: "beginner",
  JavaScript: "beginner",
  TypeScript: "intermediate",
  Shell: "beginner",
  HTML: "beginner",

  // Intermediate
  Go: "intermediate",
  Java: "intermediate",
  "C#": "intermediate",
  PHP: "intermediate",
  Ruby: "intermediate",
  Kotlin: "intermediate",
  Swift: "intermediate",
  Dart: "intermediate",

  // Advanced
  Rust: "advanced",
  "C++": "advanced",
  C: "advanced",
  Haskell: "advanced",
  Scala: "advanced",
  Elixir: "advanced",
};

// Get Supabase client
function getSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"
    );
  }

  return createClient(url, key);
}

// Fetch resources without difficulty
async function fetchResourcesWithoutDifficulty(
  supabase: SupabaseClient,
  category?: string
): Promise<Resource[]> {
  const allResources: Resource[] = [];
  let offset = 0;
  const pageSize = 500;

  while (true) {
    let query = supabase
      .from("resources")
      .select("id, slug, title, description, category, subcategory, github_language, github_stars")
      .is("difficulty", null)
      .eq("is_published", true)
      .order("category")
      .range(offset, offset + pageSize - 1);

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch resources: ${error.message}`);
    }

    if (!data || data.length === 0) {
      break;
    }

    // Fetch tags for these resources
    const resourceIds = data.map((r) => r.id);
    const { data: tagsData } = await supabase
      .from("resource_tags")
      .select("resource_id, tag")
      .in("resource_id", resourceIds);

    const tagsMap = new Map<string, string[]>();
    for (const tag of tagsData || []) {
      const existing = tagsMap.get(tag.resource_id) || [];
      existing.push(tag.tag);
      tagsMap.set(tag.resource_id, existing);
    }

    for (const resource of data) {
      allResources.push({
        ...resource,
        tags: tagsMap.get(resource.id) || [],
      });
    }

    console.log(`  Fetched ${allResources.length} resources...`);

    if (data.length < pageSize) {
      break;
    }

    offset += pageSize;
  }

  return allResources;
}

// Analyze content for difficulty keywords
function analyzeContent(text: string): { difficulty: Difficulty | null; matches: string[] } {
  const lowerText = text.toLowerCase();
  const matches: string[] = [];

  // Check in order: expert > advanced > beginner > intermediate (default)
  // This prioritizes specific indicators over generic ones

  for (const keyword of DIFFICULTY_KEYWORDS.expert) {
    if (lowerText.includes(keyword)) {
      matches.push(`"${keyword}" → expert`);
    }
  }
  if (matches.length > 0) {
    return { difficulty: "expert", matches };
  }

  for (const keyword of DIFFICULTY_KEYWORDS.advanced) {
    if (lowerText.includes(keyword)) {
      matches.push(`"${keyword}" → advanced`);
    }
  }
  if (matches.length > 0) {
    return { difficulty: "advanced", matches };
  }

  for (const keyword of DIFFICULTY_KEYWORDS.beginner) {
    if (lowerText.includes(keyword)) {
      matches.push(`"${keyword}" → beginner`);
    }
  }
  if (matches.length > 0) {
    return { difficulty: "beginner", matches };
  }

  // Check intermediate keywords last (most generic)
  for (const keyword of DIFFICULTY_KEYWORDS.intermediate) {
    if (lowerText.includes(keyword)) {
      matches.push(`"${keyword}" → intermediate`);
    }
  }
  if (matches.length > 0) {
    return { difficulty: "intermediate", matches };
  }

  return { difficulty: null, matches: [] };
}

// Determine difficulty for a resource
function determineDifficulty(resource: Resource): DifficultyAssignment {
  const reasons: string[] = [];

  // 1. Check content keywords (highest priority)
  const contentText = `${resource.title} ${resource.description} ${resource.tags.join(" ")}`;
  const contentAnalysis = analyzeContent(contentText);

  if (contentAnalysis.difficulty) {
    reasons.push(`Content keywords: ${contentAnalysis.matches.slice(0, 2).join(", ")}`);
    return {
      resource,
      difficulty: contentAnalysis.difficulty,
      reason: reasons.join("; "),
    };
  }

  // 2. Check GitHub language complexity
  if (resource.github_language) {
    const langDifficulty = LANGUAGE_DIFFICULTY[resource.github_language];
    if (langDifficulty) {
      reasons.push(`Language: ${resource.github_language}`);

      // Adjust based on stars (popular repos tend to be more accessible)
      if (resource.github_stars > 1000 && langDifficulty !== "beginner") {
        reasons.push(`High stars (${resource.github_stars}) → more accessible`);
        return {
          resource,
          difficulty: langDifficulty === "advanced" ? "intermediate" : langDifficulty,
          reason: reasons.join("; "),
        };
      }

      return {
        resource,
        difficulty: langDifficulty,
        reason: reasons.join("; "),
      };
    }
  }

  // 3. Subcategory-based adjustments
  if (resource.subcategory) {
    const subcat = resource.subcategory.toLowerCase();
    if (subcat.includes("example") || subcat.includes("demo") || subcat.includes("starter")) {
      reasons.push(`Subcategory: ${resource.subcategory}`);
      return {
        resource,
        difficulty: "beginner",
        reason: reasons.join("; "),
      };
    }
    if (subcat.includes("framework") || subcat.includes("platform")) {
      reasons.push(`Subcategory: ${resource.subcategory}`);
      return {
        resource,
        difficulty: "advanced",
        reason: reasons.join("; "),
      };
    }
  }

  // 4. Fall back to category default
  const categoryDefault = CATEGORY_DEFAULTS[resource.category] || "intermediate";
  reasons.push(`Category default: ${resource.category}`);

  return {
    resource,
    difficulty: categoryDefault,
    reason: reasons.join("; "),
  };
}

// Update resources in batches
async function updateDifficulties(
  supabase: SupabaseClient,
  assignments: DifficultyAssignment[],
  dryRun: boolean
): Promise<void> {
  if (dryRun) {
    console.log("\n🔍 DRY RUN - No changes will be made\n");
    return;
  }

  const batchSize = 100;
  let updated = 0;

  for (let i = 0; i < assignments.length; i += batchSize) {
    const batch = assignments.slice(i, i + batchSize);

    for (const assignment of batch) {
      const { error } = await supabase
        .from("resources")
        .update({ difficulty: assignment.difficulty })
        .eq("id", assignment.resource.id);

      if (error) {
        console.error(`❌ Failed to update ${assignment.resource.slug}: ${error.message}`);
      } else {
        updated++;
      }
    }

    console.log(`  Updated ${Math.min(i + batchSize, assignments.length)}/${assignments.length} resources...`);
  }

  console.log(`\n✅ Successfully updated ${updated} resources`);
}

// Print summary statistics
function printSummary(assignments: DifficultyAssignment[]): void {
  const byDifficulty: Record<Difficulty, number> = {
    beginner: 0,
    intermediate: 0,
    advanced: 0,
    expert: 0,
  };

  const byCategory: Record<string, Record<Difficulty, number>> = {};

  for (const assignment of assignments) {
    byDifficulty[assignment.difficulty]++;

    if (!byCategory[assignment.resource.category]) {
      byCategory[assignment.resource.category] = {
        beginner: 0,
        intermediate: 0,
        advanced: 0,
        expert: 0,
      };
    }
    const categoryStats = byCategory[assignment.resource.category];
    if (categoryStats) {
      categoryStats[assignment.difficulty]++;
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log("📊 Difficulty Distribution Summary");
  console.log("=".repeat(70));

  console.log("\n📈 Overall Distribution:");
  console.log(`  🟢 Beginner:     ${byDifficulty.beginner.toString().padStart(5)} (${((byDifficulty.beginner / assignments.length) * 100).toFixed(1)}%)`);
  console.log(`  🟡 Intermediate: ${byDifficulty.intermediate.toString().padStart(5)} (${((byDifficulty.intermediate / assignments.length) * 100).toFixed(1)}%)`);
  console.log(`  🟠 Advanced:     ${byDifficulty.advanced.toString().padStart(5)} (${((byDifficulty.advanced / assignments.length) * 100).toFixed(1)}%)`);
  console.log(`  🔴 Expert:       ${byDifficulty.expert.toString().padStart(5)} (${((byDifficulty.expert / assignments.length) * 100).toFixed(1)}%)`);

  console.log("\n📁 By Category:");
  for (const [category, counts] of Object.entries(byCategory).sort((a, b) => {
    const totalA = Object.values(a[1]).reduce((sum, n) => sum + n, 0);
    const totalB = Object.values(b[1]).reduce((sum, n) => sum + n, 0);
    return totalB - totalA;
  })) {
    const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
    console.log(`  ${category.padEnd(15)} (${total.toString().padStart(4)}): B:${counts.beginner.toString().padStart(4)} I:${counts.intermediate.toString().padStart(4)} A:${counts.advanced.toString().padStart(4)} E:${counts.expert.toString().padStart(3)}`);
  }

  console.log("=".repeat(70));
}

// Print sample assignments for verification
function printSamples(assignments: DifficultyAssignment[], count: number = 10): void {
  console.log(`\n🔍 Sample Assignments (first ${count}):\n`);

  for (let i = 0; i < Math.min(count, assignments.length); i++) {
    const a = assignments[i]!;
    const emoji =
      a.difficulty === "beginner"
        ? "🟢"
        : a.difficulty === "intermediate"
          ? "🟡"
          : a.difficulty === "advanced"
            ? "🟠"
            : "🔴";

    console.log(`${emoji} ${a.resource.title.slice(0, 50).padEnd(50)}`);
    console.log(`   Category: ${a.resource.category}, Difficulty: ${a.difficulty}`);
    console.log(`   Reason: ${a.reason}`);
    console.log("");
  }
}

// Main
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const categoryArg = args.find((a) => a.startsWith("--category="));
  const category = categoryArg?.split("=")[1];

  console.log("\n" + "=".repeat(70));
  console.log("🎯 Assign Difficulty Levels to Resources");
  console.log("=".repeat(70));

  if (dryRun) {
    console.log("⚠️  DRY RUN MODE - No changes will be made");
  }
  if (category) {
    console.log(`📁 Filtering by category: ${category}`);
  }

  const supabase = getSupabaseClient();

  // Fetch resources
  console.log("\n📊 Fetching resources without difficulty...\n");
  const resources = await fetchResourcesWithoutDifficulty(supabase, category);
  console.log(`\nFound ${resources.length} resources without difficulty\n`);

  if (resources.length === 0) {
    console.log("✅ All resources already have difficulty levels assigned!");
    return;
  }

  // Determine difficulty for each resource
  console.log("🧠 Analyzing resources and determining difficulty levels...\n");
  const assignments: DifficultyAssignment[] = resources.map(determineDifficulty);

  // Print summary
  printSummary(assignments);

  // Print samples
  printSamples(assignments);

  // Update database
  console.log("\n💾 Updating database...\n");
  await updateDifficulties(supabase, assignments, dryRun);

  if (!dryRun) {
    console.log("\n📝 Run the following to sync JSON files:");
    console.log("   npx dotenvx run -f .env.local -- npx tsx scripts/sync-resources-to-json.ts\n");
  }
}

main().catch(console.error);
