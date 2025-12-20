#!/usr/bin/env node

/**
 * RAG Index Generator for Claude Insider
 *
 * Generates the RAG (Retrieval-Augmented Generation) index at build time
 * for faster AI assistant responses. This pre-computes the document index
 * and TF-IDF scores.
 *
 * Index Sources:
 * - MDX documentation (34 pages across 7 categories)
 * - Project knowledge (20 chunks from generate-project-knowledge.cjs)
 * - Resources (122+ curated tools, SDKs, MCP servers)
 * - Settings/options (voice assistant configuration)
 * - External sources (cached reference documentation)
 * - Code examples (searchable snippets in 16+ languages)
 *
 * Caching:
 * - Computes content hash of all input sources
 * - Skips regeneration if content unchanged from previous build
 * - Use --force to regenerate regardless of cache
 *
 * Run with: node scripts/generate-rag-index.cjs [--force]
 *
 * Built with Claude Code powered by Claude Opus 4.5
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const matter = require("gray-matter");

// Import dynamic project knowledge generator
const { generateProjectKnowledge } = require("./generate-project-knowledge.cjs");
// Import settings/options extractor
const { generateSettingsChunks } = require("./generate-settings-index.cjs");
// Import external source cache (optional)
let generateSourceChunks;
try {
  generateSourceChunks = require("./cache-external-sources.cjs").generateSourceChunks;
} catch {
  generateSourceChunks = () => [];
}
// Import code examples index (optional)
let generateCodeChunks;
try {
  generateCodeChunks = require("./generate-code-examples-index.cjs").generateCodeChunks;
} catch {
  generateCodeChunks = () => [];
}

// ===========================================================================
// CONFIGURATION
// ===========================================================================

const VERBOSE = true;
const VERSION = "6.2"; // Increment when making significant changes - Added changelog support
const FORCE_REGENERATE = process.argv.includes("--force");

// ===========================================================================
// CONTENT HASHING FOR CACHE INVALIDATION
// ===========================================================================

/**
 * Recursively collect all files matching extensions from a directory
 */
function collectFiles(dir, extensions, files = []) {
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(fullPath, extensions, files);
    } else if (extensions.some(ext => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Compute a hash of all content source files
 * This is used to detect if any content has changed since last build
 */
function computeContentHash() {
  const hash = crypto.createHash("sha256");
  const baseDir = path.join(__dirname, "..");

  // Collect all input files that affect the RAG index
  const inputFiles = [
    // MDX documentation files
    ...collectFiles(path.join(baseDir, "content"), [".mdx"]),
    // Resource JSON files
    ...collectFiles(path.join(baseDir, "data/resources"), [".json"]),
    // Generator scripts (if scripts change, regenerate)
    path.join(__dirname, "generate-rag-index.cjs"),
    path.join(__dirname, "generate-project-knowledge.cjs"),
    path.join(__dirname, "generate-settings-index.cjs"),
  ].filter(f => fs.existsSync(f)).sort();

  // Add file contents to hash
  for (const file of inputFiles) {
    try {
      const content = fs.readFileSync(file);
      // Use relative path to ensure consistent hash across environments
      const relativePath = path.relative(baseDir, file);
      hash.update(relativePath);
      hash.update(content);
    } catch {
      // Skip files that can't be read
    }
  }

  // Include version in hash (changing version forces regeneration)
  hash.update(VERSION);

  return hash.digest("hex");
}

/**
 * Check if the RAG index needs to be regenerated
 * Returns { needsRegeneration: boolean, reason: string, currentHash: string }
 */
function checkCacheValidity() {
  const outputPath = path.join(__dirname, "../data/rag-index.json");
  const currentHash = computeContentHash();

  // Force regeneration if flag is set
  if (FORCE_REGENERATE) {
    return { needsRegeneration: true, reason: "--force flag specified", currentHash };
  }

  // Check if output file exists
  if (!fs.existsSync(outputPath)) {
    return { needsRegeneration: true, reason: "RAG index file not found", currentHash };
  }

  // Read existing index and check hash
  try {
    const existingIndex = JSON.parse(fs.readFileSync(outputPath, "utf-8"));

    if (!existingIndex.contentHash) {
      return { needsRegeneration: true, reason: "No content hash in existing index", currentHash };
    }

    if (existingIndex.contentHash !== currentHash) {
      return { needsRegeneration: true, reason: "Content has changed", currentHash };
    }

    // Cache is valid
    return { needsRegeneration: false, reason: "Content unchanged", currentHash };
  } catch (error) {
    return { needsRegeneration: true, reason: `Error reading existing index: ${error.message}`, currentHash };
  }
}

// ===========================================================================
// CONSOLE STYLING
// ===========================================================================

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  red: "\x1b[31m",
  white: "\x1b[37m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logHeader(title) {
  const width = 70;
  const padding = Math.floor((width - title.length - 2) / 2);
  console.log("");
  log("╔" + "═".repeat(width) + "╗", colors.cyan);
  log("║" + " ".repeat(padding) + title + " ".repeat(width - padding - title.length) + "║", colors.cyan + colors.bright);
  log("╚" + "═".repeat(width) + "╝", colors.cyan);
  console.log("");
}

function logSection(title) {
  if (!VERBOSE) return;
  console.log("");
  log(`┌${"─".repeat(60)}┐`, colors.dim);
  log(`│  ${title.padEnd(56)}│`, colors.yellow + colors.bright);
  log(`└${"─".repeat(60)}┘`, colors.dim);
}

function logSubsection(title) {
  if (!VERBOSE) return;
  log(`  ▸ ${title}`, colors.blue);
}

function logProgress(current, total, label) {
  if (!VERBOSE) return;
  const percentage = Math.round((current / total) * 100);
  const barLength = 30;
  const filled = Math.round((current / total) * barLength);
  const bar = "█".repeat(filled) + "░".repeat(barLength - filled);
  log(`    [${bar}] ${percentage}% ${label}`, colors.dim);
}

function logStat(label, value, color = colors.green) {
  log(`    ${label.padEnd(35)} ${color}${value}${colors.reset}`);
}

function logTable(title, data) {
  if (!VERBOSE) return;
  console.log("");
  log(`  ${title}`, colors.white + colors.bright);
  log(`  ${"─".repeat(50)}`, colors.dim);
  Object.entries(data).forEach(([key, value]) => {
    const formattedValue = typeof value === "number" ? value.toLocaleString() : value;
    log(`    ${key.padEnd(30)} ${colors.green}${formattedValue}${colors.reset}`);
  });
}

function logFinalStats(stats) {
  console.log("");
  log("╔══════════════════════════════════════════════════════════════════════╗", colors.green);
  log("║                    RAG INDEX GENERATION COMPLETE                     ║", colors.green + colors.bright);
  log("╠══════════════════════════════════════════════════════════════════════╣", colors.green);
  log(`║  Version: ${stats.version.padEnd(58)}║`, colors.white);
  log(`║  Generated: ${stats.generatedAt.padEnd(55)}║`, colors.white);
  log("╠══════════════════════════════════════════════════════════════════════╣", colors.green);
  log("║  CHUNK BREAKDOWN                                                     ║", colors.yellow + colors.bright);
  log("╠══════════════════════════════════════════════════════════════════════╣", colors.green);

  const chunks = [
    ["Documentation Chunks", stats.documentationChunks],
    ["Project Knowledge", stats.projectKnowledgeCount],
    ["Resource Chunks", stats.resourceChunkCount],
    ["Settings/Options", stats.settingsChunkCount],
    ["External Sources", stats.externalSourceCount],
    ["Code Examples", stats.codeExamplesCount],
  ];

  chunks.forEach(([label, value]) => {
    const valueStr = value.toLocaleString().padStart(8);
    log(`║    ${label.padEnd(30)} ${colors.cyan}${valueStr}${colors.reset}                        ║`);
  });

  log("╠══════════════════════════════════════════════════════════════════════╣", colors.green);
  log(`║  TOTAL CHUNKS: ${colors.green + colors.bright}${stats.totalChunks.toLocaleString().padStart(8)}${colors.reset}                                            ║`);
  log("╠══════════════════════════════════════════════════════════════════════╣", colors.green);
  log(`║  TF-IDF Terms: ${stats.tfidfTerms.toLocaleString().padStart(8)}                                            ║`, colors.white);
  log(`║  File Size: ${stats.fileSizeKB.toLocaleString().padStart(8)} KB                                          ║`, colors.white);
  log("╠══════════════════════════════════════════════════════════════════════╣", colors.green);
  log("║  CATEGORIES                                                          ║", colors.yellow + colors.bright);
  log("╠══════════════════════════════════════════════════════════════════════╣", colors.green);

  stats.categories.forEach((cat) => {
    log(`║    ${cat.padEnd(64)}║`, colors.dim);
  });

  log("╠══════════════════════════════════════════════════════════════════════╣", colors.green);
  log(`║  Output: ${stats.outputPath.padEnd(58)}║`, colors.dim);
  log("╚══════════════════════════════════════════════════════════════════════╝", colors.green);
  console.log("");
}

// ===========================================================================
// RESOURCE CATEGORIES
// ===========================================================================

const RESOURCE_CATEGORIES = {
  official: { name: "Official Resources", description: "Anthropic official documentation and tools" },
  tools: { name: "Development Tools", description: "Tools and utilities for Claude development" },
  "mcp-servers": { name: "MCP Servers", description: "Model Context Protocol server implementations" },
  rules: { name: "CLAUDE.md Rules", description: "Project configuration templates and rules" },
  prompts: { name: "System Prompts", description: "Curated system prompts library" },
  agents: { name: "AI Agents", description: "Agent frameworks and implementations" },
  tutorials: { name: "Tutorials", description: "Learning resources and guides" },
  sdks: { name: "SDKs & Libraries", description: "Client libraries and integrations" },
  showcases: { name: "Showcases", description: "Example projects and demos" },
  community: { name: "Community", description: "Community resources and discussions" },
};

// ===========================================================================
// STOP WORDS
// ===========================================================================

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "as", "is", "was", "are", "were", "been",
  "be", "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "can", "this", "that", "these", "those", "it",
  "its", "you", "your", "we", "our", "they", "their", "he", "she", "his",
  "her", "what", "which", "who", "whom", "when", "where", "why", "how",
  "all", "each", "every", "both", "few", "more", "most", "other", "some",
  "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too",
  "very", "just", "also", "now", "here", "there", "then", "once", "if",
]);

// ===========================================================================
// TOKENIZATION
// ===========================================================================

/**
 * Tokenize text into words for search
 */
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .filter((word) => !STOP_WORDS.has(word));
}

// ===========================================================================
// CHUNK CONTENT
// ===========================================================================

/**
 * Split content into chunks by sections (headers)
 */
function chunkContent(content, title, url, category) {
  const chunks = [];

  // Remove MDX components and code blocks for cleaner text
  const cleanContent = content
    .replace(/<[^>]+>/g, " ")
    .replace(/```[\s\S]*?```/g, "[code block]")
    .replace(/`[^`]+`/g, " ")
    .replace(/\{[^}]+\}/g, " ")
    .replace(/import\s+.*?from\s+['"][^'"]+['"]/g, "")
    .replace(/export\s+/g, "");

  // Split by headers (## or ###)
  const sections = cleanContent.split(/(?=^#{2,3}\s)/m);

  for (let i = 0; i < sections.length; i++) {
    const rawSection = sections[i];
    if (!rawSection) continue;
    const section = rawSection.trim();
    if (!section) continue;

    // Extract section title
    const headerMatch = section.match(/^#{2,3}\s+(.+?)$/m);
    const sectionTitle = headerMatch?.[1]?.trim() ?? title;

    // Get section content (without header)
    const sectionContent = headerMatch
      ? section.replace(/^#{2,3}\s+.+?\n/, "").trim()
      : section;

    if (sectionContent.length < 50) continue; // Skip very short sections

    // Extract keywords from content
    const words = tokenize(sectionContent);
    const wordFreq = new Map();
    words.forEach((word) => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });

    // Get top keywords by frequency
    const keywords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);

    chunks.push({
      id: `${url}#${i}`,
      title,
      section: sectionTitle,
      content: sectionContent.slice(0, 1500), // Limit chunk size
      url,
      category,
      keywords,
    });
  }

  // If no sections found, use the whole content
  if (chunks.length === 0 && cleanContent.length > 50) {
    const words = tokenize(cleanContent);
    const wordFreq = new Map();
    words.forEach((word) => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });

    const keywords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);

    chunks.push({
      id: `${url}#0`,
      title,
      section: title,
      content: cleanContent.slice(0, 1500),
      url,
      category,
      keywords,
    });
  }

  return chunks;
}

// ===========================================================================
// RESOURCE CHUNKS
// ===========================================================================

/**
 * Generate chunks from resources data
 * This allows the AI assistant to recommend specific resources
 */
function generateResourceChunks() {
  const resourcesDir = path.join(__dirname, "../data/resources");
  const chunks = [];
  const stats = { files: 0, resources: 0, byCategory: {} };

  if (!fs.existsSync(resourcesDir)) {
    if (VERBOSE) log("    Resources directory not found, skipping...", colors.yellow);
    return { chunks, stats };
  }

  // Read all JSON files in resources directory
  const files = fs.readdirSync(resourcesDir).filter((f) => f.endsWith(".json"));
  stats.files = files.length;

  for (const file of files) {
    const filePath = path.join(resourcesDir, file);
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const resources = JSON.parse(content);

      for (const resource of resources) {
        // Build rich content for search
        const contentParts = [
          resource.title,
          resource.description,
          resource.subcategory || "",
          (resource.tags || []).join(" "),
          resource.github?.language || "",
          resource.github?.owner || "",
          resource.featuredReason || "",
        ];

        // Include changelog summaries in search content
        if (resource.changelog && Array.isArray(resource.changelog)) {
          for (const entry of resource.changelog.slice(0, 3)) {
            if (entry.summary) {
              contentParts.push(`Updated ${entry.date}: ${entry.summary}`);
            }
          }
        }

        const contentStr = contentParts.filter(Boolean).join(". ");

        // Build keywords from tags and metadata
        const keywords = [
          ...(resource.tags || []),
          resource.category,
          resource.subcategory,
          resource.github?.language,
          resource.status,
        ].filter(Boolean).map((k) => k.toLowerCase());

        // Create a descriptive section title
        const categoryInfo = RESOURCE_CATEGORIES[resource.category] || { name: resource.category };
        const sectionTitle = `${resource.title} - ${categoryInfo.name}`;

        // Build a recommendation-friendly description
        let recommendationText = `${resource.title}: ${resource.description}`;
        if (resource.github?.stars) {
          recommendationText += ` (${resource.github.stars.toLocaleString()} GitHub stars)`;
        }
        if (resource.featured) {
          recommendationText += ` [Featured: ${resource.featuredReason || "Recommended"}]`;
        }
        if (resource.status && resource.status !== "stable") {
          recommendationText += ` [Status: ${resource.status}]`;
        }
        // Add latest update info if available
        if (resource.changelog?.[0]) {
          const latest = resource.changelog[0];
          recommendationText += ` [Last updated ${latest.date}: ${latest.summary || 'Updated'}]`;
        }

        chunks.push({
          id: `resource-${resource.id}`,
          title: resource.title,
          section: sectionTitle,
          content: recommendationText,
          url: resource.url,
          category: "Resources",
          subcategory: categoryInfo.name,
          keywords: [...new Set(keywords)],
          isResource: true,
          resourceData: {
            id: resource.id,
            category: resource.category,
            tags: resource.tags || [],
            featured: resource.featured || false,
            status: resource.status || "stable",
            github: resource.github || null,
            changelog: resource.changelog ? resource.changelog.slice(0, 3) : null,
            lastUpdated: resource.changelog?.[0]?.date || null,
          },
        });

        stats.resources++;
        stats.byCategory[resource.category] = (stats.byCategory[resource.category] || 0) + 1;
      }
    } catch (error) {
      if (VERBOSE) log(`    Error processing ${file}: ${error.message}`, colors.red);
    }
  }

  return { chunks, stats };
}

// ===========================================================================
// TF-IDF INDEX
// ===========================================================================

/**
 * Build TF-IDF index
 */
function buildTfidfIndex(chunks) {
  logSubsection("Computing TF-IDF scores...");

  const tfidfIndex = {};
  const docFreq = new Map();
  let processedCount = 0;

  // Calculate term frequency for each document
  for (const chunk of chunks) {
    const words = tokenize(chunk.content + " " + chunk.title + " " + chunk.section);
    const termFreq = new Map();

    for (const word of words) {
      termFreq.set(word, (termFreq.get(word) || 0) + 1);
    }

    // Normalize by document length
    const maxFreq = Math.max(...termFreq.values()) || 1;
    const normalizedTermFreq = {};
    for (const [term, freq] of termFreq) {
      normalizedTermFreq[term] = freq / maxFreq;
    }

    tfidfIndex[chunk.id] = normalizedTermFreq;

    // Track document frequency
    const uniqueTerms = new Set(words);
    for (const term of uniqueTerms) {
      docFreq.set(term, (docFreq.get(term) || 0) + 1);
    }

    processedCount++;
    if (VERBOSE && processedCount % 200 === 0) {
      logProgress(processedCount, chunks.length, `TF computed for ${processedCount} chunks`);
    }
  }

  // Calculate IDF values
  const idfValues = {};
  const numDocs = chunks.length;
  for (const [term, freq] of docFreq) {
    idfValues[term] = Math.log(numDocs / (1 + freq));
  }

  if (VERBOSE) {
    logProgress(chunks.length, chunks.length, "TF-IDF computation complete");
    logStat("Unique terms indexed:", docFreq.size.toLocaleString());
  }

  return { tfidfIndex, idfValues, termCount: docFreq.size };
}

// ===========================================================================
// MAIN GENERATOR
// ===========================================================================

/**
 * Main function to generate RAG index
 */
function generateRagIndex() {
  const startTime = Date.now();

  logHeader("RAG INDEX GENERATOR v" + VERSION);
  log("  Built with Claude Code powered by Claude Opus 4.5", colors.magenta);
  log("  Generating searchable knowledge base for AI Assistant\n", colors.dim);

  // =========================================================================
  // CHECK CACHE VALIDITY
  // =========================================================================
  logSection("CACHE CHECK");
  logSubsection("Computing content hash...");

  const cacheCheck = checkCacheValidity();

  if (!cacheCheck.needsRegeneration) {
    log("", colors.reset);
    log("╔══════════════════════════════════════════════════════════════════════╗", colors.green);
    log("║                    RAG INDEX CACHE HIT                               ║", colors.green + colors.bright);
    log("╠══════════════════════════════════════════════════════════════════════╣", colors.green);
    log(`║  Status: ${cacheCheck.reason.padEnd(58)}║`, colors.white);
    log(`║  Hash: ${cacheCheck.currentHash.slice(0, 16)}...${cacheCheck.currentHash.slice(-8).padEnd(43)}║`, colors.dim);
    log("╠══════════════════════════════════════════════════════════════════════╣", colors.green);
    log("║  Skipping regeneration - existing index is up to date                ║", colors.cyan);
    log("║  Use --force to regenerate anyway                                    ║", colors.dim);
    log("╚══════════════════════════════════════════════════════════════════════╝", colors.green);
    log("", colors.reset);

    const endTime = Date.now();
    log(`  Cache check completed in ${(endTime - startTime)}ms`, colors.green + colors.bright);
    console.log("");
    return;
  }

  logStat("Reason:", cacheCheck.reason);
  logStat("Content hash:", cacheCheck.currentHash.slice(0, 16) + "...");

  const contentDir = path.join(__dirname, "../content");
  const outputPath = path.join(__dirname, "../data/rag-index.json");

  // Ensure data directory exists
  const dataDir = path.dirname(outputPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const chunks = [];
  const categoryCounts = {};

  // Category mapping for documentation
  const categories = {
    "getting-started": "Getting Started",
    configuration: "Configuration",
    "tips-and-tricks": "Tips & Tricks",
    api: "API Reference",
    integrations: "Integrations",
    tutorials: "Tutorials",
    examples: "Examples",
  };

  // =========================================================================
  // 1. DOCUMENTATION CHUNKS
  // =========================================================================
  logSection("DOCUMENTATION CHUNKS");
  logSubsection("Processing MDX files from content directory...");

  let mdxFileCount = 0;

  function walkDir(dir, category = "") {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        const newCategory = category || file;
        walkDir(filePath, newCategory);
      } else if (file.endsWith(".mdx")) {
        try {
          const content = fs.readFileSync(filePath, "utf-8");
          const { data: frontmatter, content: mdxContent } = matter(content);

          const relativePath = path.relative(contentDir, filePath);
          const slug = relativePath
            .replace(/\.mdx$/, "")
            .replace(/\/index$/, "")
            .replace(/\\/g, "/");

          const url = `/docs/${slug}`;
          const title = frontmatter.title || slug.split("/").pop() || "Untitled";
          const categoryName = categories[category] || category;

          const fileChunks = chunkContent(mdxContent, title, url, categoryName);
          chunks.push(...fileChunks);
          mdxFileCount++;

          categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + fileChunks.length;

          if (VERBOSE && mdxFileCount % 5 === 0) {
            log(`    Processed ${mdxFileCount} MDX files...`, colors.dim);
          }
        } catch (error) {
          if (VERBOSE) log(`    Error processing ${filePath}: ${error.message}`, colors.red);
        }
      }
    }
  }

  walkDir(contentDir);

  const docsChunkCount = chunks.length;

  if (VERBOSE) {
    logStat("MDX files processed:", mdxFileCount.toString());
    logStat("Documentation chunks:", docsChunkCount.toString());
    logTable("Chunks by Category", categoryCounts);
  }

  // =========================================================================
  // 2. PROJECT KNOWLEDGE CHUNKS
  // =========================================================================
  logSection("PROJECT KNOWLEDGE CHUNKS");
  logSubsection("Generating from source documentation files...");

  const projectKnowledge = generateProjectKnowledge();
  chunks.push(...projectKnowledge);

  const projectKnowledgeCount = projectKnowledge.length;

  // =========================================================================
  // 3. RESOURCE CHUNKS
  // =========================================================================
  logSection("RESOURCE CHUNKS");
  logSubsection("Processing curated resources for AI recommendations...");

  const { chunks: resourceChunks, stats: resourceStats } = generateResourceChunks();
  chunks.push(...resourceChunks);

  const resourceChunkCount = resourceChunks.length;

  if (VERBOSE) {
    logStat("Resource JSON files:", resourceStats.files.toString());
    logStat("Total resources:", resourceStats.resources.toString());
    if (Object.keys(resourceStats.byCategory).length > 0) {
      logTable("Resources by Category", resourceStats.byCategory);
    }
  }

  // =========================================================================
  // 4. SETTINGS/OPTIONS CHUNKS
  // =========================================================================
  logSection("SETTINGS/OPTIONS CHUNKS");
  logSubsection("Extracting voice assistant settings and options...");

  const settingsChunks = generateSettingsChunks();
  chunks.push(...settingsChunks);

  const settingsChunkCount = settingsChunks.length;

  if (VERBOSE) {
    logStat("Settings chunks:", settingsChunkCount.toString());
  }

  // =========================================================================
  // 5. EXTERNAL SOURCE CHUNKS
  // =========================================================================
  logSection("EXTERNAL SOURCE CHUNKS");
  logSubsection("Loading cached external documentation...");

  const sourceChunks = generateSourceChunks();
  chunks.push(...sourceChunks);

  const sourceChunkCount = sourceChunks.length;

  if (VERBOSE) {
    logStat("External source chunks:", sourceChunkCount.toString());
  }

  // =========================================================================
  // 6. CODE EXAMPLES CHUNKS
  // =========================================================================
  logSection("CODE EXAMPLES CHUNKS");
  logSubsection("Indexing code snippets from documentation...");

  const codeChunks = generateCodeChunks();
  chunks.push(...codeChunks);

  const codeChunkCount = codeChunks.length;

  // Count languages
  const languageCounts = {};
  codeChunks.forEach((chunk) => {
    if (chunk.language) {
      languageCounts[chunk.language] = (languageCounts[chunk.language] || 0) + 1;
    }
  });

  if (VERBOSE) {
    logStat("Code example chunks:", codeChunkCount.toString());
    if (Object.keys(languageCounts).length > 0) {
      const topLanguages = Object.entries(languageCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {});
      logTable("Top Languages", topLanguages);
    }
  }

  // =========================================================================
  // 7. BUILD TF-IDF INDEX
  // =========================================================================
  logSection("TF-IDF INDEX");

  const { tfidfIndex, idfValues, termCount } = buildTfidfIndex(chunks);

  // =========================================================================
  // 8. CREATE AND WRITE RAG INDEX
  // =========================================================================
  logSection("WRITING OUTPUT");
  logSubsection("Generating JSON output file...");

  const ragIndex = {
    version: VERSION,
    contentHash: cacheCheck.currentHash,
    generatedAt: new Date().toISOString(),
    builtWith: "Claude Code powered by Claude Opus 4.5",
    documentCount: chunks.length,
    documentationChunks: docsChunkCount,
    projectKnowledgeCount: projectKnowledgeCount,
    resourceChunkCount: resourceChunkCount,
    settingsChunkCount: settingsChunkCount,
    externalSourceCount: sourceChunkCount,
    codeExamplesCount: codeChunkCount,
    chunks,
    tfidfIndex,
    idfValues,
  };

  // Write to JSON file
  const jsonOutput = JSON.stringify(ragIndex, null, 2);
  fs.writeFileSync(outputPath, jsonOutput);

  const fileSizeBytes = fs.statSync(outputPath).size;
  const fileSizeKB = Math.round(fileSizeBytes / 1024);

  if (VERBOSE) {
    logStat("Output file:", outputPath);
    logStat("File size:", `${fileSizeKB.toLocaleString()} KB`);
  }

  // =========================================================================
  // FINAL STATISTICS
  // =========================================================================
  const endTime = Date.now();
  const durationMs = endTime - startTime;

  logFinalStats({
    version: VERSION,
    generatedAt: new Date().toISOString(),
    totalChunks: chunks.length,
    documentationChunks: docsChunkCount,
    projectKnowledgeCount: projectKnowledgeCount,
    resourceChunkCount: resourceChunkCount,
    settingsChunkCount: settingsChunkCount,
    externalSourceCount: sourceChunkCount,
    codeExamplesCount: codeChunkCount,
    tfidfTerms: termCount,
    fileSizeKB: fileSizeKB,
    categories: [
      ...Object.keys(categoryCounts),
      "Project",
      "Resources",
      "Settings",
      "Sources",
      "Code",
    ],
    outputPath: outputPath.replace(process.cwd(), "."),
  });

  log(`  Build completed in ${(durationMs / 1000).toFixed(2)}s`, colors.green + colors.bright);
  console.log("");
}

// ===========================================================================
// MAIN EXECUTION
// ===========================================================================

generateRagIndex();
