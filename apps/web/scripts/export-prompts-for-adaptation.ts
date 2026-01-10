#!/usr/bin/env npx tsx
/**
 * Export Prompts for Adaptation
 *
 * Fetches prompts from external sources and exports them to a JSON file
 * for batch adaptation by Claude Code (without API costs).
 *
 * Usage: npx tsx scripts/export-prompts-for-adaptation.ts
 *
 * Options:
 *   --source=all                Source to export (awesome-chatgpt, awesome-claude, bigprompt, all)
 *   --output=prompts-to-adapt   Output filename (without extension)
 *   --limit=0                   Limit prompts per source (0 = all)
 *   --batch-size=25             Number of prompts per batch file
 *
 * Output:
 *   Creates files like:
 *   - data/prompts-to-adapt-batch-1.json (prompts 1-25)
 *   - data/prompts-to-adapt-batch-2.json (prompts 26-50)
 *   etc.
 */

import * as fs from "fs";
import * as path from "path";

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name: string, defaultValue: string): string => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split("=")[1] ?? defaultValue : defaultValue;
};

const SOURCE = getArg("source", "all");
const OUTPUT_PREFIX = getArg("output", "prompts-to-adapt");
const LIMIT = parseInt(getArg("limit", "0"));
const BATCH_SIZE = parseInt(getArg("batch-size", "25"));

// Source configurations
const SOURCES = {
  "awesome-chatgpt": {
    name: "awesome-chatgpt-prompts",
    url: "https://raw.githubusercontent.com/f/awesome-chatgpt-prompts/main/prompts.csv",
    type: "csv" as const,
    attribution: "https://github.com/f/awesome-chatgpt-prompts",
  },
  "awesome-claude": {
    name: "awesome-claude-prompts",
    url: "https://raw.githubusercontent.com/langgptai/awesome-claude-prompts/main/README.md",
    type: "markdown" as const,
    attribution: "https://github.com/langgptai/awesome-claude-prompts",
  },
  bigprompt: {
    name: "TheBigPromptLibrary",
    url: "https://raw.githubusercontent.com/0xeb/TheBigPromptLibrary/main/SystemPrompts/ChatGPT/prompts.json",
    type: "json" as const,
    attribution: "https://github.com/0xeb/TheBigPromptLibrary",
  },
};

interface RawPrompt {
  title: string;
  content: string;
  source: string;
  sourceUrl: string;
  forDevs?: boolean;
}

interface ExportedPrompt {
  id: number;
  title: string;
  content: string;
  source: string;
  sourceUrl: string;
  suggestedCategory?: string;
}

/**
 * Fetch and parse CSV from awesome-chatgpt-prompts
 */
async function fetchAwesomeChatGPT(): Promise<RawPrompt[]> {
  console.log("Fetching awesome-chatgpt-prompts...");
  const source = SOURCES["awesome-chatgpt"];

  const response = await fetch(source.url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${source.name}: ${response.statusText}`);
  }

  const csvText = await response.text();
  const lines = csvText.split("\n").slice(1); // Skip header

  const prompts: RawPrompt[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    // Parse CSV line (handle quoted fields)
    const match = line.match(/^"([^"]+)","([^"]+)"(?:,(\w+))?/);
    if (match) {
      const [, act, prompt, forDevs] = match;
      if (act && prompt) {
        prompts.push({
          title: act.trim(),
          content: prompt.trim().replace(/\\n/g, "\n"),
          source: source.name,
          sourceUrl: source.attribution,
          forDevs: forDevs === "TRUE",
        });
      }
    } else {
      // Try simpler parsing for non-quoted fields
      const parts = line.split(",");
      if (parts.length >= 2 && parts[0] && parts[1]) {
        prompts.push({
          title: parts[0].replace(/^"|"$/g, "").trim(),
          content: parts[1].replace(/^"|"$/g, "").trim().replace(/\\n/g, "\n"),
          source: source.name,
          sourceUrl: source.attribution,
        });
      }
    }
  }

  console.log(`  Found ${prompts.length} prompts from ${source.name}`);
  return prompts;
}

/**
 * Fetch and parse markdown from awesome-claude-prompts
 */
async function fetchAwesomeClaude(): Promise<RawPrompt[]> {
  console.log("Fetching awesome-claude-prompts...");
  const source = SOURCES["awesome-claude"];

  const response = await fetch(source.url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${source.name}: ${response.statusText}`);
  }

  const markdown = await response.text();
  const prompts: RawPrompt[] = [];

  // Parse markdown sections: ## Title followed by prompt content
  const sections = markdown.split(/^## /m).slice(1);

  for (const section of sections) {
    const lines = section.split("\n");
    const title = lines[0]?.trim();

    if (!title || title.startsWith("Table") || title.startsWith("Contributing")) {
      continue;
    }

    // Find prompt content (usually in a blockquote or code block)
    let content = "";
    const blockquoteMatch = section.match(/^>\s*(.+(?:\n>.*)*)/m);
    const codeBlockMatch = section.match(/```[\s\S]*?\n([\s\S]*?)```/);

    if (codeBlockMatch?.[1]) {
      content = codeBlockMatch[1].trim();
    } else if (blockquoteMatch?.[1]) {
      content = blockquoteMatch[1].replace(/^>\s*/gm, "").trim();
    } else {
      // Try to extract meaningful content
      const contentLines = lines.slice(1).filter(
        (l) => l.trim() && !l.startsWith("#") && !l.startsWith("|") && !l.startsWith("-")
      );
      content = contentLines.join("\n").trim();
    }

    if (content && content.length > 50) {
      prompts.push({
        title,
        content,
        source: source.name,
        sourceUrl: source.attribution,
      });
    }
  }

  console.log(`  Found ${prompts.length} prompts from ${source.name}`);
  return prompts;
}

/**
 * Fetch and parse JSON from TheBigPromptLibrary
 */
async function fetchBigPromptLibrary(): Promise<RawPrompt[]> {
  console.log("Fetching TheBigPromptLibrary...");
  const source = SOURCES.bigprompt;

  try {
    const response = await fetch(source.url);
    if (!response.ok) {
      console.log(`  Warning: Could not fetch ${source.name}, trying alternative...`);
      return fetchBigPromptLibraryAlternative();
    }

    const data = await response.json();
    const prompts: RawPrompt[] = [];

    if (Array.isArray(data)) {
      for (const item of data) {
        if (item.name && item.prompt) {
          prompts.push({
            title: item.name,
            content: item.prompt,
            source: source.name,
            sourceUrl: source.attribution,
          });
        }
      }
    }

    console.log(`  Found ${prompts.length} prompts from ${source.name}`);
    return prompts;
  } catch (error) {
    console.log(`  Warning: Failed to parse ${source.name}, trying alternative...`);
    return fetchBigPromptLibraryAlternative();
  }
}

/**
 * Alternative fetch for TheBigPromptLibrary (different file structure)
 */
async function fetchBigPromptLibraryAlternative(): Promise<RawPrompt[]> {
  const source = SOURCES.bigprompt;
  const baseUrl = "https://api.github.com/repos/0xeb/TheBigPromptLibrary/contents/SystemPrompts";

  try {
    const response = await fetch(baseUrl, {
      headers: { Accept: "application/vnd.github.v3+json" },
    });

    if (!response.ok) {
      console.log(`  Could not fetch directory listing`);
      return [];
    }

    const dirs = await response.json();
    const prompts: RawPrompt[] = [];

    // Fetch first few directories (limited to avoid rate limiting)
    const dirsToFetch = dirs.slice(0, 10);

    for (const dir of dirsToFetch) {
      if (dir.type !== "dir") continue;

      try {
        const filesRes = await fetch(dir.url, {
          headers: { Accept: "application/vnd.github.v3+json" },
        });
        const files = await filesRes.json();

        for (const file of files) {
          if (file.name.endsWith(".md") && file.download_url) {
            const contentRes = await fetch(file.download_url);
            const content = await contentRes.text();

            if (content.length > 100 && content.length < 50000) {
              prompts.push({
                title: dir.name.replace(/_/g, " "),
                content: content.trim(),
                source: source.name,
                sourceUrl: `${source.attribution}/tree/main/SystemPrompts/${dir.name}`,
              });
            }
          }
        }
      } catch {
        // Skip this directory
      }
    }

    console.log(`  Found ${prompts.length} prompts from ${source.name} (alternative)`);
    return prompts;
  } catch (error) {
    console.log(`  Failed to fetch ${source.name}: ${error}`);
    return [];
  }
}

/**
 * Basic category classification
 */
function classifyPrompt(title: string, content: string, forDevs?: boolean): string {
  if (forDevs) return "coding";

  const text = `${title} ${content}`.toLowerCase();

  const categories: [string, string[]][] = [
    ["coding", ["code", "programming", "developer", "javascript", "python", "api", "debug"]],
    ["devops", ["linux", "docker", "kubernetes", "deployment", "server", "bash"]],
    ["writing", ["writer", "essay", "article", "blog", "content", "editor"]],
    ["creative", ["creative", "art", "music", "story", "fantasy"]],
    ["business", ["business", "startup", "entrepreneur", "sales", "ceo", "manager"]],
    ["marketing", ["marketing", "seo", "social media", "campaign", "branding"]],
    ["education", ["teacher", "tutor", "lesson", "curriculum", "student"]],
    ["translation", ["translator", "language", "translate", "multilingual"]],
    ["analysis", ["analyst", "data", "statistics", "research", "evaluate"]],
    ["legal", ["legal", "lawyer", "attorney", "contract", "law"]],
    ["healthcare", ["doctor", "medical", "health", "patient", "diagnosis"]],
    ["security", ["security", "cybersecurity", "hacker", "vulnerability"]],
    ["roleplay", ["roleplay", "character", "persona", "act as", "pretend"]],
    ["productivity", ["productivity", "organize", "schedule", "workflow"]],
  ];

  for (const [category, keywords] of categories) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return category;
      }
    }
  }

  return "conversation";
}

/**
 * Main export function
 */
async function exportPrompts() {
  console.log("=".repeat(60));
  console.log("Prompt Export for Adaptation");
  console.log("=".repeat(60));
  console.log(`Source: ${SOURCE}`);
  console.log(`Limit per source: ${LIMIT || "all"}`);
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log("");

  const allPrompts: RawPrompt[] = [];

  // Fetch from selected sources
  const sourcesToFetch =
    SOURCE === "all"
      ? Object.keys(SOURCES)
      : [SOURCE];

  for (const sourceKey of sourcesToFetch) {
    try {
      let prompts: RawPrompt[] = [];

      switch (sourceKey) {
        case "awesome-chatgpt":
          prompts = await fetchAwesomeChatGPT();
          break;
        case "awesome-claude":
          prompts = await fetchAwesomeClaude();
          break;
        case "bigprompt":
          prompts = await fetchBigPromptLibrary();
          break;
        default:
          console.log(`Unknown source: ${sourceKey}`);
          continue;
      }

      if (LIMIT > 0) {
        prompts = prompts.slice(0, LIMIT);
      }

      allPrompts.push(...prompts);
    } catch (error) {
      console.error(`Error fetching ${sourceKey}:`, error);
    }
  }

  console.log("");
  console.log(`Total prompts to export: ${allPrompts.length}`);

  // Convert to export format
  const exportedPrompts: ExportedPrompt[] = allPrompts.map((p, index) => ({
    id: index + 1,
    title: p.title,
    content: p.content,
    source: p.source,
    sourceUrl: p.sourceUrl,
    suggestedCategory: classifyPrompt(p.title, p.content, p.forDevs),
  }));

  // Create output directory
  const outputDir = path.join(process.cwd(), "data", "prompts-adaptation");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Split into batches and write files
  const totalBatches = Math.ceil(exportedPrompts.length / BATCH_SIZE);

  for (let i = 0; i < totalBatches; i++) {
    const start = i * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, exportedPrompts.length);
    const batch = exportedPrompts.slice(start, end);

    const filename = `${OUTPUT_PREFIX}-batch-${i + 1}.json`;
    const filepath = path.join(outputDir, filename);

    fs.writeFileSync(
      filepath,
      JSON.stringify(
        {
          batchNumber: i + 1,
          totalBatches,
          promptsInBatch: batch.length,
          totalPrompts: exportedPrompts.length,
          prompts: batch,
        },
        null,
        2
      )
    );

    console.log(`  Created: data/prompts-adaptation/${filename} (${batch.length} prompts)`);
  }

  // Write summary file
  const summaryPath = path.join(outputDir, `${OUTPUT_PREFIX}-summary.json`);
  fs.writeFileSync(
    summaryPath,
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        sources: sourcesToFetch,
        totalPrompts: exportedPrompts.length,
        totalBatches,
        batchSize: BATCH_SIZE,
        categories: Object.entries(
          exportedPrompts.reduce((acc, p) => {
            acc[p.suggestedCategory || "unknown"] = (acc[p.suggestedCategory || "unknown"] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        ).sort((a, b) => b[1] - a[1]),
      },
      null,
      2
    )
  );

  console.log("");
  console.log("=".repeat(60));
  console.log("Export Complete!");
  console.log("=".repeat(60));
  console.log("");
  console.log("Next steps:");
  console.log("1. Claude Code will adapt each batch file");
  console.log("2. Adapted prompts will be saved to data/prompts-adapted/");
  console.log("3. Run import-adapted-prompts.ts to import to database");
  console.log("");
  console.log(`Files created in: data/prompts-adaptation/`);
}

// Run export
exportPrompts().catch(console.error);
