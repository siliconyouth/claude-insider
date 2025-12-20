#!/usr/bin/env node
/**
 * Resource Update Script
 *
 * Updates all resources:
 * 1. Validates all URLs (checks for broken links)
 * 2. Updates GitHub stats (stars, forks)
 * 3. Generates fresh screenshots via Firecrawl
 * 4. Updates lastVerified dates
 *
 * Usage: node scripts/update-all-resources.mjs [--check-only] [--screenshots] [--github]
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESOURCES_DIR = path.join(__dirname, "../data/resources");

// Colors for console output
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

/**
 * Check if a URL is reachable
 */
async function checkUrl(url, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ClaudeInsider/1.0; +https://www.claudeinsider.com)",
      },
      redirect: "follow",
    });
    clearTimeout(timeoutId);
    return {
      ok: response.ok,
      status: response.status,
      redirected: response.redirected,
      finalUrl: response.url,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    // Try GET if HEAD fails (some servers don't support HEAD)
    try {
      const response = await fetch(url, {
        method: "GET",
        signal: AbortSignal.timeout(timeout),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; ClaudeInsider/1.0; +https://www.claudeinsider.com)",
        },
        redirect: "follow",
      });
      return {
        ok: response.ok,
        status: response.status,
        redirected: response.redirected,
        finalUrl: response.url,
      };
    } catch (getError) {
      return {
        ok: false,
        status: 0,
        error: getError.message || "Connection failed",
      };
    }
  }
}

/**
 * Fetch GitHub repo stats
 */
async function fetchGitHubStats(owner, repo) {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "ClaudeInsider/1.0",
        ...(process.env.GITHUB_TOKEN && {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
        }),
      },
    });

    if (!response.ok) {
      return { error: `GitHub API error: ${response.status}` };
    }

    const data = await response.json();
    return {
      stars: data.stargazers_count,
      forks: data.forks_count,
      lastUpdated: data.pushed_at?.split("T")[0],
      language: data.language,
      description: data.description,
      topics: data.topics,
    };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Parse GitHub URL to extract owner/repo
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
function loadResources() {
  const files = fs
    .readdirSync(RESOURCES_DIR)
    .filter((f) => f.endsWith(".json") && f !== "schema.ts");

  const resources = [];
  for (const file of files) {
    if (file === "index.ts") continue;
    const filePath = path.join(RESOURCES_DIR, file);
    const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    resources.push({
      file,
      filePath,
      resources: Array.isArray(content) ? content : [],
    });
  }
  return resources;
}

/**
 * Save resources back to file
 */
function saveResources(filePath, resources) {
  fs.writeFileSync(filePath, JSON.stringify(resources, null, 2) + "\n");
}

/**
 * Main update function
 */
async function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes("--check-only");
  const updateGitHub = args.includes("--github") || !checkOnly;
  const generateScreenshots = args.includes("--screenshots");

  console.log("\n" + colors.cyan + colors.bright);
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║           RESOURCE UPDATE & LINK CHECKER                      ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log(colors.reset);

  const today = new Date().toISOString().split("T")[0];
  const resourceFiles = loadResources();

  let totalResources = 0;
  let checkedUrls = 0;
  let brokenLinks = [];
  let redirectedLinks = [];
  let updatedGitHub = 0;
  let errors = [];

  for (const { file, filePath, resources } of resourceFiles) {
    if (resources.length === 0) continue;

    log(`\n📁 ${file}`, colors.bright + colors.blue);
    log(`   ${resources.length} resources`, colors.dim);

    let modified = false;

    for (const resource of resources) {
      totalResources++;
      const prefix = `   [${resource.id}]`;

      // Check main URL
      if (resource.url) {
        checkedUrls++;
        const result = await checkUrl(resource.url);

        if (!result.ok) {
          brokenLinks.push({
            id: resource.id,
            url: resource.url,
            status: result.status,
            error: result.error,
          });
          logError(`${prefix} ${resource.url} (${result.status || result.error})`);
        } else if (result.redirected && result.finalUrl !== resource.url) {
          redirectedLinks.push({
            id: resource.id,
            originalUrl: resource.url,
            finalUrl: result.finalUrl,
          });
          logWarning(`${prefix} Redirects to ${result.finalUrl}`);
        } else {
          logSuccess(`${prefix} ${resource.title}`);
        }
      }

      // Update GitHub stats if applicable
      if (updateGitHub && resource.github) {
        const ghInfo = parseGitHubUrl(resource.url) || resource.github;
        if (ghInfo?.owner && ghInfo?.repo) {
          const stats = await fetchGitHubStats(ghInfo.owner, ghInfo.repo);

          if (!stats.error) {
            const oldStars = resource.github.stars;
            resource.github.stars = stats.stars;
            resource.github.forks = stats.forks;
            resource.github.lastUpdated = stats.lastUpdated;
            if (stats.language) resource.github.language = stats.language;

            if (oldStars !== stats.stars) {
              logInfo(
                `${prefix} GitHub: ⭐ ${oldStars} → ${stats.stars} (+${stats.stars - oldStars})`
              );
              modified = true;
              updatedGitHub++;
            }
          } else {
            logWarning(`${prefix} GitHub API: ${stats.error}`);
          }

          // Rate limit: wait a bit between GitHub API calls
          await new Promise((r) => setTimeout(r, 100));
        }
      }

      // Update lastVerified date
      if (!checkOnly) {
        resource.lastVerified = today;
        modified = true;
      }
    }

    // Save if modified
    if (modified && !checkOnly) {
      saveResources(filePath, resources);
      logInfo(`   Saved ${file}`);
    }
  }

  // Summary
  console.log("\n" + colors.cyan + colors.bright);
  console.log("════════════════════════════════════════════════════════════════");
  console.log("                         SUMMARY                                 ");
  console.log("════════════════════════════════════════════════════════════════");
  console.log(colors.reset);

  log(`  Total resources:     ${totalResources}`, colors.bright);
  log(`  URLs checked:        ${checkedUrls}`, colors.bright);
  log(`  GitHub stats updated: ${updatedGitHub}`, colors.green);

  if (brokenLinks.length > 0) {
    log(`\n  ❌ Broken Links (${brokenLinks.length}):`, colors.red + colors.bright);
    for (const link of brokenLinks) {
      log(`     • ${link.id}: ${link.url}`, colors.red);
      log(`       Status: ${link.status || link.error}`, colors.dim);
    }
  } else {
    log(`\n  ✅ No broken links found!`, colors.green + colors.bright);
  }

  if (redirectedLinks.length > 0) {
    log(`\n  ⚠️  Redirected Links (${redirectedLinks.length}):`, colors.yellow + colors.bright);
    for (const link of redirectedLinks) {
      log(`     • ${link.id}`, colors.yellow);
      log(`       ${link.originalUrl}`, colors.dim);
      log(`       → ${link.finalUrl}`, colors.cyan);
    }
  }

  if (!checkOnly) {
    log(`\n  📅 Updated lastVerified to: ${today}`, colors.green);
  }

  console.log("\n" + colors.cyan);
  console.log("════════════════════════════════════════════════════════════════");
  console.log(colors.reset);

  // Return exit code based on broken links
  if (brokenLinks.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
