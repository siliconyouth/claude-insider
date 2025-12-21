#!/usr/bin/env node

/**
 * MDX to Supabase Migration Script
 *
 * Migrates documentation from MDX files to Supabase database.
 *
 * Features:
 * - Parses MDX frontmatter (title, description)
 * - Extracts ContentMeta sources, generatedDate, model
 * - Computes content hash for change detection
 * - Extracts heading structure for documentation_sections
 * - Upserts to documentation and documentation_sections tables
 *
 * Usage:
 *   node scripts/migrate-docs-to-supabase.mjs [--dry-run] [--verbose]
 */

import './lib/env.mjs';
import { createHash } from "crypto";
import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, relative, basename, dirname } from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "..");

// Load environment variables from .env.local
function loadEnv() {
  const envPath = join(ROOT_DIR, ".env.local");
  if (!existsSync(envPath)) {
    console.error("Error: .env.local file not found");
    process.exit(1);
  }

  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    // Remove surrounding quotes if present
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnv();

const { Pool } = pg;

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONTENT_DIR = join(ROOT_DIR, "content");
const DRY_RUN = process.argv.includes("--dry-run");
const VERBOSE = process.argv.includes("--verbose");

// Category display order
const CATEGORY_ORDER = {
  "getting-started": 0,
  configuration: 1,
  "tips-and-tricks": 2,
  api: 3,
  integrations: 4,
  tutorials: 5,
  examples: 6,
};

// =============================================================================
// UTILITIES
// =============================================================================

function log(message, type = "info") {
  const prefix = {
    info: "\x1b[36m[INFO]\x1b[0m",
    success: "\x1b[32m[SUCCESS]\x1b[0m",
    warn: "\x1b[33m[WARN]\x1b[0m",
    error: "\x1b[31m[ERROR]\x1b[0m",
    debug: "\x1b[90m[DEBUG]\x1b[0m",
  };
  if (type === "debug" && !VERBOSE) return;
  console.log(`${prefix[type] || ""} ${message}`);
}

function computeHash(content) {
  return createHash("sha256").update(content).digest("hex");
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .trim();
}

// =============================================================================
// MDX PARSING
// =============================================================================

/**
 * Extract ContentMeta props from MDX content
 * Handles JSX format: <ContentMeta sources={[...]} generatedDate="..." model="..." />
 */
function extractContentMeta(content) {
  const meta = {
    sources: [],
    generatedDate: null,
    model: null,
  };

  // Match ContentMeta component
  const contentMetaMatch = content.match(
    /<ContentMeta[\s\S]*?sources=\{(\[[\s\S]*?\])\}[\s\S]*?\/>/
  );

  if (!contentMetaMatch) {
    log("No ContentMeta found in file", "debug");
    return meta;
  }

  const fullMatch = contentMetaMatch[0];

  // Extract sources array using a more robust approach
  try {
    const sourcesStr = contentMetaMatch[1];

    // Extract individual source objects using regex
    const sourceRegex = /\{\s*title:\s*["']([^"']+)["'],\s*url:\s*["']([^"']+)["']\s*\}/g;
    let sourceMatch;

    while ((sourceMatch = sourceRegex.exec(sourcesStr)) !== null) {
      meta.sources.push({
        title: sourceMatch[1],
        url: sourceMatch[2],
      });
    }

    if (meta.sources.length === 0) {
      log(`No sources extracted from ContentMeta`, "warn");
    }
  } catch (e) {
    log(`Failed to parse sources: ${e.message}`, "warn");
  }

  // Extract generatedDate
  const dateMatch = fullMatch.match(/generatedDate=["']([^"']+)["']/);
  if (dateMatch) {
    meta.generatedDate = dateMatch[1];
  }

  // Extract model
  const modelMatch = fullMatch.match(/model=["']([^"']+)["']/);
  if (modelMatch) {
    meta.model = modelMatch[1];
  }

  return meta;
}

/**
 * Extract headings from MDX content
 * Returns array of { headingId, headingText, headingLevel, orderIndex, contentPreview }
 */
function extractHeadings(content) {
  const headings = [];
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  let match;
  let orderIndex = 0;
  const idCounts = new Map(); // Track duplicate heading IDs

  // Remove code blocks to avoid matching headings inside them
  const contentWithoutCode = content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "");

  while ((match = headingRegex.exec(contentWithoutCode)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    let baseId = slugify(text);

    // Handle duplicate IDs by appending a counter
    const count = idCounts.get(baseId) || 0;
    idCounts.set(baseId, count + 1);
    const id = count === 0 ? baseId : `${baseId}-${count}`;

    // Get content preview (next ~100 chars after heading)
    const afterHeading = contentWithoutCode.slice(match.index + match[0].length);
    const preview = afterHeading
      .replace(/^[\n\r]+/, "")
      .slice(0, 200)
      .split("\n")[0]
      .trim();

    headings.push({
      headingId: id,
      headingText: text,
      headingLevel: level,
      orderIndex: orderIndex++,
      contentPreview: preview || null,
    });
  }

  return headings;
}

/**
 * Calculate reading time in minutes
 */
function calculateReadingTime(content) {
  // Average reading speed: 200 words per minute
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

/**
 * Count words in content
 */
function countWords(content) {
  // Remove MDX/JSX components and markdown syntax
  const cleaned = content
    .replace(/<[^>]+>/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#*_~`]/g, "");

  return cleaned.split(/\s+/).filter((word) => word.length > 0).length;
}

// =============================================================================
// FILE DISCOVERY
// =============================================================================

/**
 * Recursively find all MDX files in content directory
 */
function findMdxFiles(dir, files = []) {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      findMdxFiles(fullPath, files);
    } else if (entry.endsWith(".mdx")) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Parse an MDX file into a documentation record
 */
function parseMdxFile(filePath) {
  const rawContent = readFileSync(filePath, "utf-8");
  const relativePath = relative(CONTENT_DIR, filePath);
  const category = dirname(relativePath).split("/")[0];
  const fileName = basename(filePath, ".mdx");

  // Create slug from path
  const slug = relativePath.replace(/\.mdx$/, "").replace(/\\/g, "/");

  // Parse frontmatter
  const { data: frontmatter, content: mdxContent } = matter(rawContent);

  // Extract ContentMeta
  const contentMeta = extractContentMeta(rawContent);

  // Extract headings
  const headings = extractHeadings(mdxContent);

  // Calculate stats
  const wordCount = countWords(mdxContent);
  const readingTime = calculateReadingTime(mdxContent);

  // Compute content hash
  const contentHash = computeHash(mdxContent);

  // Determine order index
  const orderIndex = fileName === "index" ? 0 : 1;

  return {
    slug,
    title: frontmatter.title || fileName,
    description: frontmatter.description || null,
    content: mdxContent,
    category,
    orderIndex: CATEGORY_ORDER[category] * 100 + orderIndex,
    sources: contentMeta.sources,
    generatedDate: contentMeta.generatedDate,
    aiModel: contentMeta.model,
    wordCount,
    readingTimeMinutes: readingTime,
    contentHash,
    sourceUrls: contentMeta.sources.map((s) => s.url),
    headings,
  };
}

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

async function migrateToSupabase(docs) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    log(`Connecting to database...`);
    await pool.query("SELECT 1");
    log(`Connected successfully`, "success");

    let insertedDocs = 0;
    let updatedDocs = 0;
    let insertedSections = 0;

    for (const doc of docs) {
      log(`Processing: ${doc.slug}`, "debug");

      if (DRY_RUN) {
        log(`[DRY RUN] Would upsert: ${doc.slug}`);
        continue;
      }

      // Upsert documentation
      const existingDoc = await pool.query(
        `SELECT content_hash FROM documentation WHERE slug = $1`,
        [doc.slug]
      );

      const isUpdate = existingDoc.rows.length > 0;

      await pool.query(
        `INSERT INTO documentation (
          slug, title, description, content, category, order_index,
          sources, generated_date, ai_model, word_count, reading_time_minutes,
          content_hash, source_urls, is_published, scrape_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, TRUE, 'success')
        ON CONFLICT (slug) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          content = EXCLUDED.content,
          category = EXCLUDED.category,
          order_index = EXCLUDED.order_index,
          sources = EXCLUDED.sources,
          generated_date = EXCLUDED.generated_date,
          ai_model = EXCLUDED.ai_model,
          word_count = EXCLUDED.word_count,
          reading_time_minutes = EXCLUDED.reading_time_minutes,
          content_hash = EXCLUDED.content_hash,
          source_urls = EXCLUDED.source_urls,
          updated_at = NOW()`,
        [
          doc.slug,
          doc.title,
          doc.description,
          doc.content,
          doc.category,
          doc.orderIndex,
          JSON.stringify(doc.sources),
          doc.generatedDate,
          doc.aiModel,
          doc.wordCount,
          doc.readingTimeMinutes,
          doc.contentHash,
          doc.sourceUrls,
        ]
      );

      if (isUpdate) {
        updatedDocs++;
      } else {
        insertedDocs++;
      }

      // Delete existing sections for this doc
      await pool.query(
        `DELETE FROM documentation_sections WHERE doc_slug = $1`,
        [doc.slug]
      );

      // Insert sections
      for (const heading of doc.headings) {
        await pool.query(
          `INSERT INTO documentation_sections (
            doc_slug, heading_id, heading_text, heading_level, order_index, content_preview
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            doc.slug,
            heading.headingId,
            heading.headingText,
            heading.headingLevel,
            heading.orderIndex,
            heading.contentPreview,
          ]
        );
        insertedSections++;
      }

      log(`  ${isUpdate ? "Updated" : "Inserted"}: ${doc.slug} (${doc.headings.length} sections)`, "success");
    }

    return { insertedDocs, updatedDocs, insertedSections };
  } finally {
    await pool.end();
  }
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("  MDX to Supabase Migration Script");
  console.log("=".repeat(60) + "\n");

  if (DRY_RUN) {
    log("Running in DRY RUN mode - no changes will be made", "warn");
  }

  // Find all MDX files
  log(`Scanning ${CONTENT_DIR} for MDX files...`);
  const mdxFiles = findMdxFiles(CONTENT_DIR);
  log(`Found ${mdxFiles.length} MDX files`, "success");

  // Parse all files
  log(`\nParsing MDX files...`);
  const docs = [];
  for (const filePath of mdxFiles) {
    try {
      const doc = parseMdxFile(filePath);
      docs.push(doc);
      log(`  Parsed: ${doc.slug} (${doc.wordCount} words, ${doc.headings.length} headings)`, "debug");
    } catch (e) {
      log(`  Failed to parse ${filePath}: ${e.message}`, "error");
    }
  }
  log(`Parsed ${docs.length} documents`, "success");

  // Show summary
  console.log("\n" + "-".repeat(60));
  console.log("  Document Summary");
  console.log("-".repeat(60));

  const byCategory = {};
  for (const doc of docs) {
    if (!byCategory[doc.category]) {
      byCategory[doc.category] = [];
    }
    byCategory[doc.category].push(doc);
  }

  for (const [category, categoryDocs] of Object.entries(byCategory)) {
    console.log(`\n  ${category} (${categoryDocs.length} docs):`);
    for (const doc of categoryDocs.slice(0, 5)) {
      console.log(`    - ${doc.title}`);
    }
    if (categoryDocs.length > 5) {
      console.log(`    ... and ${categoryDocs.length - 5} more`);
    }
  }

  console.log("\n" + "-".repeat(60) + "\n");

  // Migrate to database
  log(`Migrating to Supabase...`);
  const stats = await migrateToSupabase(docs);

  // Final summary
  console.log("\n" + "=".repeat(60));
  console.log("  Migration Complete");
  console.log("=".repeat(60));
  console.log(`
  Documents:
    - Inserted: ${stats.insertedDocs}
    - Updated:  ${stats.updatedDocs}
    - Total:    ${docs.length}

  Sections:
    - Total:    ${stats.insertedSections}
  `);

  if (DRY_RUN) {
    log("This was a dry run. Run without --dry-run to apply changes.", "warn");
  }
}

main().catch((error) => {
  log(`Migration failed: ${error.message}`, "error");
  console.error(error);
  process.exit(1);
});
