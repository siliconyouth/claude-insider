#!/usr/bin/env node

/**
 * Caches external documentation sources for AI context
 * Uses Claude Opus 4.5 to generate intelligent summaries
 *
 * Run with: node scripts/cache-external-sources.cjs
 * Run manually when you want to refresh external source cache
 *
 * Requires: ANTHROPIC_API_KEY environment variable (loaded from .env.local)
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");
const matter = require("gray-matter");

// Load environment variables from .env.local
const envPath = path.join(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

// Cache directory
const CACHE_DIR = path.join(__dirname, "../data/source-cache");
const CACHE_INDEX_PATH = path.join(CACHE_DIR, "index.json");
const CONTENT_DIR = path.join(__dirname, "../content");

// Maximum age for cache entries (7 days)
const MAX_CACHE_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// Rate limiting - delay between requests (2 seconds for web, 1 second for Claude)
const WEB_REQUEST_DELAY_MS = 2000;
const CLAUDE_REQUEST_DELAY_MS = 1000;

// Maximum content size (2MB to handle large documentation pages)
const MAX_CONTENT_SIZE = 2 * 1024 * 1024;

// User agent for requests
const USER_AGENT = "ClaudeInsider-SourceCacher/1.0 (Documentation crawler)";

// Claude Opus 4.5 model
const CLAUDE_MODEL = "claude-opus-4-5-20251101";

/**
 * Initialize Anthropic client
 */
let anthropicClient = null;
async function getAnthropicClient() {
  if (anthropicClient) return anthropicClient;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("⚠️  ANTHROPIC_API_KEY not set - summaries will be skipped");
    return null;
  }

  try {
    const Anthropic = require("@anthropic-ai/sdk").default;
    anthropicClient = new Anthropic({ apiKey });
    return anthropicClient;
  } catch (error) {
    console.warn("⚠️  Failed to initialize Anthropic client:", error.message);
    return null;
  }
}

/**
 * Summarize content using Claude Opus 4.5
 */
async function summarizeWithClaude(content, sourceTitle, sourceUrl) {
  const client = await getAnthropicClient();
  if (!client) return null;

  try {
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `You are summarizing external documentation for an AI assistant's knowledge base about Claude AI and Claude Code.

Source: "${sourceTitle}"
URL: ${sourceUrl}

Content to summarize:
${content.slice(0, 8000)}

Create a comprehensive summary that:
1. Identifies the main topics and key concepts
2. Extracts important settings, options, or configuration details
3. Lists any commands, API endpoints, or code examples mentioned
4. Notes any best practices or recommendations
5. Highlights any caveats or warnings

Format your response as a structured summary that would help an AI assistant answer questions about this documentation. Be specific and include actual values, commands, and settings names when present.

Summary:`
        }
      ]
    });

    const summary = response.content[0]?.text || "";
    return summary.trim();
  } catch (error) {
    console.warn(`  ⚠️  Claude summarization failed: ${error.message}`);
    return null;
  }
}

/**
 * Extract URLs from ContentMeta sources in MDX files
 */
function extractSourceUrls() {
  const urls = new Map();

  function walkDir(dir) {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith(".mdx")) {
        try {
          const content = fs.readFileSync(filePath, "utf-8");

          // Extract sources from ContentMeta component
          const sourceMatches = content.match(/<ContentMeta[\s\S]*?sources=\{?\[?([\s\S]*?)\]?\}?[\s\S]*?\/>/g) || [];

          for (const match of sourceMatches) {
            // Extract URLs from the sources array
            const urlMatches = match.match(/url:\s*["']([^"']+)["']/g) || [];
            const titleMatches = match.match(/title:\s*["']([^"']+)["']/g) || [];

            urlMatches.forEach((urlMatch, i) => {
              const url = urlMatch.match(/url:\s*["']([^"']+)["']/)?.[1];
              const title = titleMatches[i]?.match(/title:\s*["']([^"']+)["']/)?.[1] || "Unknown";

              if (url && isValidUrl(url)) {
                const relativePath = path.relative(CONTENT_DIR, filePath);
                const existingEntry = urls.get(url);

                if (!existingEntry) {
                  urls.set(url, {
                    url,
                    title,
                    referencedFrom: [relativePath]
                  });
                } else {
                  if (!existingEntry.referencedFrom.includes(relativePath)) {
                    existingEntry.referencedFrom.push(relativePath);
                  }
                }
              }
            });
          }
        } catch (error) {
          console.error(`  Error reading ${filePath}:`, error.message);
        }
      }
    }
  }

  walkDir(CONTENT_DIR);
  return Array.from(urls.values());
}

/**
 * Check if URL is valid and should be cached
 */
function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    // Only cache HTTP/HTTPS URLs
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    // Skip certain domains that don't allow scraping
    const blockedDomains = ["github.com", "twitter.com", "x.com", "linkedin.com"];
    if (blockedDomains.some(d => parsed.hostname.includes(d))) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Fetch content from URL
 */
async function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === "https:" ? https : http;

    const options = {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
      },
      timeout: 30000
    };

    const req = client.get(url, options, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, url).href;
        if (isValidUrl(redirectUrl)) {
          fetchUrl(redirectUrl).then(resolve).catch(reject);
          return;
        }
      }

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      const chunks = [];
      let totalSize = 0;

      res.on("data", (chunk) => {
        totalSize += chunk.length;
        if (totalSize > MAX_CONTENT_SIZE) {
          req.destroy();
          reject(new Error("Content too large"));
          return;
        }
        chunks.push(chunk);
      });

      res.on("end", () => {
        resolve(Buffer.concat(chunks).toString("utf-8"));
      });
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
  });
}

/**
 * Extract text content from HTML
 */
function extractTextFromHtml(html) {
  // Remove script and style tags
  let text = html.replace(/<script[\s\S]*?<\/script>/gi, " ");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, " ");
  text = text.replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");

  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, " ");

  // Extract title
  const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "";

  // Extract main content areas
  const mainMatch = text.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
                    text.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
                    text.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

  const mainContent = mainMatch ? mainMatch[1] : text;

  // Remove remaining HTML tags
  let cleanText = mainContent.replace(/<[^>]+>/g, " ");

  // Decode HTML entities
  cleanText = cleanText
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
    .replace(/&[a-z]+;/gi, " ");

  // Clean up whitespace
  cleanText = cleanText.replace(/\s+/g, " ").trim();

  // Limit content length
  const maxLength = 15000;
  if (cleanText.length > maxLength) {
    cleanText = cleanText.slice(0, maxLength) + "...";
  }

  return { title, content: cleanText };
}

/**
 * Load existing cache index
 */
function loadCacheIndex() {
  try {
    if (fs.existsSync(CACHE_INDEX_PATH)) {
      return JSON.parse(fs.readFileSync(CACHE_INDEX_PATH, "utf-8"));
    }
  } catch {
    // Ignore errors
  }
  return { version: "2.0", entries: {}, lastUpdated: null };
}

/**
 * Save cache index
 */
function saveCacheIndex(index) {
  index.lastUpdated = new Date().toISOString();
  fs.writeFileSync(CACHE_INDEX_PATH, JSON.stringify(index, null, 2));
}

/**
 * Generate cache file path from URL
 */
function getCacheFilePath(url) {
  const hash = Buffer.from(url).toString("base64").replace(/[/+=]/g, "_").slice(0, 40);
  return path.join(CACHE_DIR, `${hash}.json`);
}

/**
 * Check if cache entry is valid
 */
function isCacheValid(entry) {
  if (!entry || !entry.cachedAt) return false;
  const age = Date.now() - new Date(entry.cachedAt).getTime();
  return age < MAX_CACHE_AGE_MS;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main function to cache external sources
 */
async function cacheExternalSources() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║  External Source Cacher with Claude Opus 4.5 Summarization   ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  // Check for API key
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
  console.log(`Claude Opus 4.5: ${hasApiKey ? "✓ Enabled" : "✗ Disabled (set ANTHROPIC_API_KEY)"}\n`);

  // Ensure cache directory exists
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  // Extract URLs from documentation
  const sources = extractSourceUrls();
  console.log(`Found ${sources.length} unique source URLs to cache\n`);
  console.log("─".repeat(60) + "\n");

  // Load existing cache
  const cacheIndex = loadCacheIndex();
  cacheIndex.version = "2.0"; // Update version

  let cached = 0;
  let summarized = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    const { url, title, referencedFrom } = source;

    console.log(`[${i + 1}/${sources.length}] ${title}`);
    console.log(`  URL: ${url}`);

    // Check if already cached and valid
    const existingEntry = cacheIndex.entries[url];
    if (isCacheValid(existingEntry) && existingEntry.hasSummary) {
      const ageMinutes = Math.floor((Date.now() - new Date(existingEntry.cachedAt).getTime()) / 1000 / 60);
      console.log(`  ✓ Using cached version (${ageMinutes} minutes old, has summary)\n`);
      skipped++;
      continue;
    }

    try {
      // Fetch content
      console.log("  ⏳ Fetching content...");
      const html = await fetchUrl(url);
      const { title: extractedTitle, content } = extractTextFromHtml(html);

      // Generate AI summary using Claude Opus 4.5
      let summary = null;
      if (hasApiKey && content.length > 100) {
        console.log("  🤖 Generating summary with Claude Opus 4.5...");
        await sleep(CLAUDE_REQUEST_DELAY_MS);
        summary = await summarizeWithClaude(content, title || extractedTitle, url);
        if (summary) {
          summarized++;
          console.log(`  ✨ Summary generated (${summary.length} chars)`);
        }
      }

      // Save to cache file
      const cacheFilePath = getCacheFilePath(url);
      const cacheData = {
        url,
        title: title || extractedTitle,
        content,
        summary,
        referencedFrom,
        cachedAt: new Date().toISOString(),
        contentLength: content.length,
        summaryLength: summary?.length || 0,
        model: summary ? CLAUDE_MODEL : null
      };

      fs.writeFileSync(cacheFilePath, JSON.stringify(cacheData, null, 2));

      // Update index
      cacheIndex.entries[url] = {
        title: cacheData.title,
        cachedAt: cacheData.cachedAt,
        contentLength: cacheData.contentLength,
        summaryLength: cacheData.summaryLength,
        hasSummary: !!summary,
        cacheFile: path.basename(cacheFilePath),
        referencedFrom
      };

      console.log(`  ✓ Cached ${content.length} chars${summary ? " + summary" : ""}\n`);
      cached++;

      // Rate limiting for web requests
      if (i < sources.length - 1) {
        await sleep(WEB_REQUEST_DELAY_MS);
      }
    } catch (error) {
      console.log(`  ✗ Failed: ${error.message}\n`);
      failed++;

      // Mark as failed in index to avoid retrying too soon
      cacheIndex.entries[url] = {
        title,
        error: error.message,
        failedAt: new Date().toISOString(),
        referencedFrom
      };
    }
  }

  // Save index
  saveCacheIndex(cacheIndex);

  console.log("\n" + "═".repeat(60));
  console.log("Source caching complete:");
  console.log(`  ✓ Newly cached: ${cached}`);
  console.log(`  🤖 AI summaries: ${summarized}`);
  console.log(`  ⏭️  Already cached: ${skipped}`);
  console.log(`  ✗ Failed: ${failed}`);
  console.log(`  📊 Total sources: ${sources.length}`);
  console.log(`  📁 Cache directory: ${CACHE_DIR}`);
  console.log("═".repeat(60));
}

/**
 * Generate RAG chunks from cached sources
 */
function generateSourceChunks() {
  const chunks = [];

  if (!fs.existsSync(CACHE_INDEX_PATH)) {
    console.log("  No cached sources found");
    return chunks;
  }

  const cacheIndex = loadCacheIndex();

  for (const [url, entry] of Object.entries(cacheIndex.entries)) {
    // Skip failed entries
    if (entry.error) continue;

    const cacheFilePath = path.join(CACHE_DIR, entry.cacheFile);
    if (!fs.existsSync(cacheFilePath)) continue;

    try {
      const cacheData = JSON.parse(fs.readFileSync(cacheFilePath, "utf-8"));

      // Use AI summary if available, otherwise use content preview
      const contextContent = cacheData.summary || cacheData.content.slice(0, 2000);

      chunks.push({
        id: `source-${Buffer.from(url).toString("base64").slice(0, 20)}`,
        title: `External Source: ${cacheData.title}`,
        section: "External Documentation",
        content: `${cacheData.title}: ${contextContent}`,
        url: url,
        category: "External Sources",
        keywords: [
          "external",
          "source",
          "documentation",
          "reference",
          "anthropic",
          ...cacheData.title.toLowerCase().split(/\s+/).slice(0, 5)
        ],
        isExternalSource: true,
        sourceData: {
          originalUrl: url,
          title: cacheData.title,
          cachedAt: cacheData.cachedAt,
          hasSummary: !!cacheData.summary,
          model: cacheData.model,
          referencedFrom: cacheData.referencedFrom || []
        }
      });
    } catch (error) {
      console.error(`  Error reading cache file for ${url}:`, error.message);
    }
  }

  return chunks;
}

// Export for use by other scripts
module.exports = { cacheExternalSources, generateSourceChunks, extractSourceUrls };

// Run directly if called as main script
if (require.main === module) {
  cacheExternalSources().catch(console.error);
}
