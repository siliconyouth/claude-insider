#!/usr/bin/env node
/**
 * AI-Powered Resource Updater
 *
 * This script:
 * 1. Crawls all resource URLs using Firecrawl
 * 2. Uses Claude Opus 4.5 to generate/update descriptions and overviews
 * 3. Captures screenshots for resources missing them
 * 4. Updates JSON files with new content
 * 5. Syncs everything to Supabase database
 *
 * Usage: node scripts/ai-update-resources.mjs [--dry-run] [--category=tools]
 *
 * Environment variables required:
 * - ANTHROPIC_API_KEY: Claude API key
 * - FIRECRAWL_API_KEY: Firecrawl API key
 * - DATABASE_URL: PostgreSQL connection string
 * - NEXT_PUBLIC_SUPABASE_URL: Supabase URL
 * - SUPABASE_SERVICE_ROLE_KEY: Supabase service key
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, "..");
const RESOURCES_DIR = path.join(ROOT_DIR, "data/resources");
const SCREENSHOTS_DIR = path.join(ROOT_DIR, "public/images/resources");

// ANSI colors
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(msg, color = "") {
  console.log(`${color}${msg}${colors.reset}`);
}

function logSuccess(msg) {
  log(`  ✓ ${msg}`, colors.green);
}

function logError(msg) {
  log(`  ✗ ${msg}`, colors.red);
}

function logWarning(msg) {
  log(`  ⚠ ${msg}`, colors.yellow);
}

function logInfo(msg) {
  log(`  ℹ ${msg}`, colors.cyan);
}

function logAI(msg) {
  log(`  🤖 ${msg}`, colors.magenta);
}

/**
 * Load environment variables from .env.local
 */
function loadEnv() {
  const envPath = path.join(ROOT_DIR, ".env.local");
  const content = fs.readFileSync(envPath, "utf-8");
  const env = {};

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
  }
  return env;
}

/**
 * Scrape a URL using Firecrawl API or basic fetch fallback
 */
async function scrapeUrl(url, firecrawlApiKey) {
  // If we have Firecrawl API key, use it
  if (firecrawlApiKey) {
    try {
      const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${firecrawlApiKey}`,
        },
        body: JSON.stringify({
          url,
          formats: ["markdown"],
          onlyMainContent: true,
          timeout: 30000,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `HTTP ${response.status}: ${error}` };
      }

      const data = await response.json();
      return {
        success: true,
        markdown: data.data?.markdown || "",
        metadata: data.data?.metadata || {},
        title: data.data?.metadata?.title || "",
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Fallback: basic fetch for HTML content
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ClaudeInsider/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    const html = await response.text();

    // Basic HTML to text conversion (remove tags, decode entities)
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, " ")
      .trim();

    // Extract title from HTML
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";

    return {
      success: true,
      markdown: text.substring(0, 10000), // Limit content
      metadata: {},
      title,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Fetch GitHub README content
 */
async function fetchGitHubReadme(owner, repo) {
  try {
    // Try to get README from API
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/readme`,
      {
        headers: {
          Accept: "application/vnd.github.v3.raw",
          "User-Agent": "ClaudeInsider/1.0",
        },
      }
    );

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    const readme = await response.text();
    return { success: true, readme };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Fetch GitHub repo stats
 */
async function fetchGitHubStats(owner, repo, githubToken) {
  try {
    const headers = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "ClaudeInsider/1.0",
    };
    if (githubToken) {
      headers.Authorization = `token ${githubToken}`;
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      { headers }
    );

    if (!response.ok) {
      return { success: false, error: `GitHub API error: ${response.status}` };
    }

    const data = await response.json();
    return {
      success: true,
      stars: data.stargazers_count,
      forks: data.forks_count,
      lastUpdated: data.pushed_at?.split("T")[0],
      language: data.language,
      description: data.description,
      topics: data.topics || [],
      homepage: data.homepage,
      openIssues: data.open_issues_count,
      license: data.license?.spdx_id,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Generate content with Claude Opus 4.5
 */
async function generateContentWithClaude(anthropic, resource, scrapedContent) {
  const systemPrompt = `You are an expert technical writer creating documentation for Claude Insider, a comprehensive resource hub for Claude AI users.

Your task is to analyze scraped website/repository content and generate high-quality descriptions for a resource entry.

Guidelines:
- Write in a professional, informative tone
- Focus on what the tool/resource does and its key features
- Highlight integration with Claude AI if applicable
- Be concise but comprehensive
- Use technical terminology appropriately
- Avoid marketing fluff and hyperbole`;

  const userPrompt = `Analyze this resource and generate updated content:

**Resource: ${resource.title}**
**Current Description:** ${resource.description}
**URL:** ${resource.url}
**Category:** ${resource.category}
${resource.subcategory ? `**Subcategory:** ${resource.subcategory}` : ""}

**Scraped Content:**
${scrapedContent.substring(0, 8000)}

---

Please provide a JSON response with the following fields:
{
  "description": "A concise 1-2 sentence description (max 200 chars) for display in resource cards",
  "longDescription": "A comprehensive 2-4 paragraph overview (markdown) covering what the tool does, key features, and use cases. Include code examples if relevant.",
  "keyFeatures": ["feature 1", "feature 2", "feature 3"],
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "difficulty": "beginner|intermediate|advanced|expert",
  "confidence": 0.0-1.0
}

Return ONLY valid JSON, no markdown code blocks.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-opus-4-5-20251101",
      max_tokens: 2000,
      messages: [{ role: "user", content: userPrompt }],
      system: systemPrompt,
    });

    const content = response.content[0]?.text || "";

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return { success: true, data: JSON.parse(jsonMatch[0]) };
    }

    return { success: false, error: "No valid JSON in response" };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Parse GitHub URL
 */
function parseGitHubUrl(url) {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/);
  if (match) {
    return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
  }
  return null;
}

/**
 * Load all resource files
 */
function loadResources(filterCategory = null) {
  const files = fs
    .readdirSync(RESOURCES_DIR)
    .filter((f) => f.endsWith(".json") && f !== "index.ts" && f !== "schema.ts");

  const resources = [];
  for (const file of files) {
    const category = file.replace(".json", "");
    if (filterCategory && category !== filterCategory) continue;

    const filePath = path.join(RESOURCES_DIR, file);
    const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    resources.push({
      file,
      filePath,
      category,
      resources: Array.isArray(content) ? content : [],
    });
  }
  return resources;
}

/**
 * Check if resource has screenshot
 */
function hasScreenshot(resource) {
  return !!(resource.screenshotUrl || resource.screenshots?.length > 0);
}

/**
 * Get resources missing screenshots
 */
function getResourcesMissingScreenshots(allResources) {
  const missing = [];
  for (const { resources } of allResources) {
    for (const r of resources) {
      if (!hasScreenshot(r)) {
        missing.push(r);
      }
    }
  }
  return missing;
}

/**
 * Main update function
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const categoryArg = args.find((a) => a.startsWith("--category="));
  const filterCategory = categoryArg ? categoryArg.split("=")[1] : null;
  const skipAI = args.includes("--skip-ai");
  const skipScreenshots = args.includes("--skip-screenshots");

  console.log("\n" + colors.cyan + colors.bright);
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║       AI-POWERED RESOURCE UPDATER (Claude Opus 4.5)          ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log(colors.reset);

  if (dryRun) {
    log("  🔍 DRY RUN MODE - No changes will be saved\n", colors.yellow);
  }

  // Load environment
  const env = loadEnv();
  const ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;
  const FIRECRAWL_API_KEY = env.FIRECRAWL_API_KEY;
  const DATABASE_URL = env.DATABASE_URL;
  const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
  const GITHUB_TOKEN = env.GITHUB_TOKEN;

  // Validate environment
  if (!ANTHROPIC_API_KEY) {
    logError("Missing ANTHROPIC_API_KEY in .env.local");
    process.exit(1);
  }
  if (!FIRECRAWL_API_KEY) {
    logWarning("Missing FIRECRAWL_API_KEY - will use basic fetch for content");
  }
  if (!DATABASE_URL) {
    logError("Missing DATABASE_URL in .env.local");
    process.exit(1);
  }

  log("  ✅ Environment loaded", colors.green);
  log(`  📦 Anthropic API: ...${ANTHROPIC_API_KEY.slice(-8)}`, colors.dim);
  if (FIRECRAWL_API_KEY) {
    log(`  🔥 Firecrawl API: ...${FIRECRAWL_API_KEY.slice(-8)}`, colors.dim);
  }

  // Initialize clients
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  const pool = new pg.Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  const supabase = SUPABASE_URL && SUPABASE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

  // Load resources
  const resourceFiles = loadResources(filterCategory);
  const today = new Date().toISOString().split("T")[0];

  let totalResources = 0;
  let scrapedCount = 0;
  let aiUpdatedCount = 0;
  let githubUpdatedCount = 0;
  let errorCount = 0;

  const allUpdates = []; // Track all updates for database

  for (const { file, filePath, category, resources } of resourceFiles) {
    if (resources.length === 0) continue;

    log(`\n📁 ${file}`, colors.bright + colors.blue);
    log(`   ${resources.length} resources`, colors.dim);

    let modified = false;

    for (const resource of resources) {
      totalResources++;
      const prefix = `   [${resource.id}]`;
      let scrapedContent = "";
      let changes = [];

      log(`\n${prefix} ${resource.title}`, colors.bright);

      // 1. Scrape website content
      logInfo(`Scraping ${resource.url}...`);
      const scrapeResult = await scrapeUrl(resource.url, FIRECRAWL_API_KEY);

      if (scrapeResult.success) {
        scrapedContent += scrapeResult.markdown;
        scrapedCount++;
        logSuccess(`Scraped ${scrapeResult.markdown.length} chars`);
      } else {
        logWarning(`Scrape failed: ${scrapeResult.error}`);
      }

      // 2. Fetch GitHub data if applicable
      const ghInfo = parseGitHubUrl(resource.url) || resource.github;
      if (ghInfo?.owner && ghInfo?.repo) {
        logInfo(`Fetching GitHub data for ${ghInfo.owner}/${ghInfo.repo}...`);

        // Get README
        const readmeResult = await fetchGitHubReadme(ghInfo.owner, ghInfo.repo);
        if (readmeResult.success) {
          scrapedContent += "\n\n## GitHub README\n" + readmeResult.readme;
          logSuccess(`Fetched README (${readmeResult.readme.length} chars)`);
        }

        // Get stats
        const statsResult = await fetchGitHubStats(ghInfo.owner, ghInfo.repo, GITHUB_TOKEN);
        if (statsResult.success) {
          const oldStars = resource.github?.stars || 0;
          const newStars = statsResult.stars;

          if (!resource.github) {
            resource.github = {};
          }

          resource.github.owner = ghInfo.owner;
          resource.github.repo = ghInfo.repo;
          resource.github.stars = newStars;
          resource.github.forks = statsResult.forks;
          resource.github.lastUpdated = statsResult.lastUpdated;
          resource.github.language = statsResult.language;

          if (oldStars !== newStars) {
            const diff = newStars - oldStars;
            logSuccess(`GitHub: ⭐ ${oldStars} → ${newStars} (${diff > 0 ? "+" : ""}${diff})`);
            githubUpdatedCount++;
            modified = true;
            changes.push({
              field: "github.stars",
              oldValue: oldStars,
              newValue: newStars,
            });
          } else {
            logInfo(`GitHub: ⭐ ${newStars} (no change)`);
          }
        } else {
          logWarning(`GitHub API failed: ${statsResult.error}`);
        }

        // Rate limit
        await new Promise((r) => setTimeout(r, 200));
      }

      // 3. Generate content with Claude Opus 4.5
      if (!skipAI && scrapedContent.length > 100) {
        logAI("Generating content with Claude Opus 4.5...");

        const aiResult = await generateContentWithClaude(
          anthropic,
          resource,
          scrapedContent
        );

        if (aiResult.success && aiResult.data) {
          const { description, longDescription, keyFeatures, suggestedTags, difficulty, confidence } =
            aiResult.data;

          logAI(`Confidence: ${(confidence * 100).toFixed(0)}%`);

          // Update description if different and confidence > 0.7
          if (description && confidence > 0.7) {
            const oldDesc = resource.description;
            if (description !== oldDesc && description.length > 20) {
              resource.description = description;
              logSuccess(`Updated description`);
              modified = true;
              aiUpdatedCount++;
              changes.push({
                field: "description",
                oldValue: oldDesc,
                newValue: description,
              });
            }
          }

          // Store long description for database
          if (longDescription) {
            resource._longDescription = longDescription;
            logSuccess(`Generated long description (${longDescription.length} chars)`);
          }

          // Update suggested tags
          if (suggestedTags && suggestedTags.length > 0) {
            resource._suggestedTags = suggestedTags;
            logInfo(`Suggested tags: ${suggestedTags.join(", ")}`);
          }

          // Update difficulty if not set
          if (difficulty && !resource.difficulty) {
            resource.difficulty = difficulty;
            modified = true;
            changes.push({
              field: "difficulty",
              oldValue: null,
              newValue: difficulty,
            });
          }
        } else {
          logWarning(`AI generation failed: ${aiResult.error}`);
          errorCount++;
        }

        // Rate limit for Anthropic API
        await new Promise((r) => setTimeout(r, 1000));
      }

      // Update lastVerified
      resource.lastVerified = today;
      modified = true;

      // Track updates for database
      if (changes.length > 0) {
        allUpdates.push({
          resourceId: resource.id,
          changes,
          longDescription: resource._longDescription,
          suggestedTags: resource._suggestedTags,
        });
      }
    }

    // Save JSON file
    if (modified && !dryRun) {
      // Remove temporary fields before saving
      for (const resource of resources) {
        delete resource._longDescription;
        delete resource._suggestedTags;
      }
      fs.writeFileSync(filePath, JSON.stringify(resources, null, 2) + "\n");
      logInfo(`Saved ${file}`);
    }
  }

  // 4. Sync to database
  if (!dryRun && allUpdates.length > 0) {
    log("\n📊 Syncing to database...", colors.bright + colors.cyan);

    const client = await pool.connect();
    try {
      for (const update of allUpdates) {
        // Update resource
        await client.query(
          `UPDATE resources SET
             updated_at = NOW(),
             last_verified_at = NOW()
           WHERE slug = $1`,
          [update.resourceId]
        );

        // Insert changelog entry
        if (update.changes.length > 0) {
          await client.query(
            `INSERT INTO resource_changelog (
               resource_id, changes, ai_summary, source_type, applied_at
             )
             SELECT id, $2::jsonb, $3, 'auto_update', NOW()
             FROM resources WHERE slug = $1`,
            [
              update.resourceId,
              JSON.stringify(update.changes),
              `AI-generated update for ${update.resourceId}`,
            ]
          );
        }

        logSuccess(`Synced ${update.resourceId}`);
      }
    } finally {
      client.release();
    }
  }

  // 5. Find resources missing screenshots
  if (!skipScreenshots) {
    const resourceFiles2 = loadResources(filterCategory);
    const missingScreenshots = getResourcesMissingScreenshots(resourceFiles2);

    if (missingScreenshots.length > 0) {
      log("\n📸 Resources missing screenshots:", colors.bright + colors.yellow);
      for (const r of missingScreenshots) {
        log(`   • ${r.id}: ${r.url}`, colors.yellow);
      }
      log(
        `\n   Run: node scripts/capture-screenshots.mjs to generate them`,
        colors.dim
      );
    }
  }

  // Summary
  console.log("\n" + colors.cyan + colors.bright);
  console.log("════════════════════════════════════════════════════════════════");
  console.log("                         SUMMARY                                 ");
  console.log("════════════════════════════════════════════════════════════════");
  console.log(colors.reset);

  log(`  Total resources:      ${totalResources}`, colors.bright);
  log(`  URLs scraped:         ${scrapedCount}`, colors.green);
  log(`  GitHub stats updated: ${githubUpdatedCount}`, colors.green);
  log(`  AI content generated: ${aiUpdatedCount}`, colors.magenta);
  log(`  Errors:               ${errorCount}`, errorCount > 0 ? colors.red : colors.green);

  if (dryRun) {
    log("\n  🔍 DRY RUN - No changes were saved", colors.yellow);
  } else {
    log(`\n  📅 Updated lastVerified to: ${today}`, colors.green);
    log(`  💾 Database synced with ${allUpdates.length} updates`, colors.green);
  }

  console.log("\n" + colors.cyan);
  console.log("════════════════════════════════════════════════════════════════");
  console.log(colors.reset);

  await pool.end();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
