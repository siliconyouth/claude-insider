/**
 * Sync MDX Documents to Payload CMS
 *
 * This script syncs documentation files from apps/web/content/ to the
 * Payload CMS documents collection for cross-linking management.
 *
 * Run: node scripts/sync-mdx-to-payload.cjs
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CONTENT_DIR = path.join(__dirname, '../content');
const OUTPUT_FILE = path.join(__dirname, '../data/documents-index.json');

// MDX file extensions
const MDX_EXTENSIONS = ['.mdx', '.md'];

// Calculate MD5 hash of file content
function calculateHash(content) {
  return crypto.createHash('md5').update(content).digest('hex');
}

// Parse frontmatter from MDX content
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { title: '', description: '' };

  const frontmatter = match[1];
  const result = {
    title: '',
    description: '',
    tags: [],
    relatedResources: [],
    displayMode: 'both',
    autoMatch: true,
  };

  // Simple YAML parsing
  const titleMatch = frontmatter.match(/title:\s*["']?([^"'\n]+)["']?/);
  const descMatch = frontmatter.match(/description:\s*["']?([^"'\n]+)["']?/);
  const tagsMatch = frontmatter.match(/tags:\s*\[([^\]]+)\]/);
  const resourcesMatch = frontmatter.match(/relatedResources:\s*\[([^\]]+)\]/);
  const displayMatch = frontmatter.match(/displayMode:\s*(\w+)/);
  const autoMatchMatch = frontmatter.match(/autoMatch:\s*(\w+)/);

  if (titleMatch) result.title = titleMatch[1].trim();
  if (descMatch) result.description = descMatch[1].trim();
  if (tagsMatch) {
    result.tags = tagsMatch[1]
      .split(',')
      .map((t) => t.trim().replace(/["']/g, ''))
      .filter(Boolean);
  }
  if (resourcesMatch) {
    result.relatedResources = resourcesMatch[1]
      .split(',')
      .map((r) => r.trim().replace(/["']/g, ''))
      .filter(Boolean);
  }
  if (displayMatch) {
    const mode = displayMatch[1].toLowerCase();
    if (['hover', 'cards', 'both'].includes(mode)) {
      result.displayMode = mode;
    }
  }
  if (autoMatchMatch) {
    result.autoMatch = autoMatchMatch[1].toLowerCase() !== 'false';
  }

  return result;
}

// Extract headings from MDX content
function extractHeadings(content) {
  const headings = [];
  const lines = content.split('\n');
  let order = 0;

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      headings.push({
        id,
        text,
        level,
        order: order++,
      });
    }
  }

  return headings;
}

// Extract code blocks from MDX content
function extractCodeBlocks(content) {
  const blocks = [];
  const regex = /```(\w+)?([^\n]*)\n([\s\S]*?)```/g;
  let match;
  let order = 0;

  while ((match = regex.exec(content)) !== null) {
    const language = match[1] || 'text';
    const meta = match[2].trim();
    const code = match[3];

    // Parse metadata
    const filenameMatch = meta.match(/filename=["']([^"']+)["']/);
    const tagsMatch = meta.match(/tags=["']([^"']+)["']/);
    const resourcesMatch = meta.match(/resources=["']([^"']+)["']/);

    blocks.push({
      id: `code-${order}`,
      language,
      filename: filenameMatch?.[1] || null,
      tags: tagsMatch ? tagsMatch[1].split(',').map((t) => t.trim()) : [],
      resources: resourcesMatch ? resourcesMatch[1].split(',').map((r) => r.trim()) : [],
      lineCount: code.split('\n').length,
      preview: code.substring(0, 200),
      order: order++,
    });
  }

  return blocks;
}

// Calculate document statistics
function calculateStats(content) {
  // Remove frontmatter and code blocks
  const cleanContent = content
    .replace(/^---[\s\S]*?---/, '')
    .replace(/```[\s\S]*?```/g, '');

  const words = cleanContent.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  return {
    wordCount,
    readingTime: `${readingTimeMinutes} min read`,
  };
}

// Recursively get all MDX files
function getMdxFiles(dir, basePath = '') {
  const files = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.join(basePath, entry.name);

    if (entry.isDirectory()) {
      files.push(...getMdxFiles(fullPath, relativePath));
    } else if (MDX_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
      files.push({
        path: fullPath,
        relativePath,
      });
    }
  }

  return files;
}

// Main sync function
async function syncMdxToPayload() {
  console.log('🔄 Syncing MDX documents to index...\n');

  const mdxFiles = getMdxFiles(CONTENT_DIR);
  const documents = [];
  let totalHeadings = 0;
  let totalCodeBlocks = 0;

  for (const file of mdxFiles) {
    const content = fs.readFileSync(file.path, 'utf-8');
    const hash = calculateHash(content);

    // Generate slug from file path
    const slug = file.relativePath
      .replace(/\\/g, '/')
      .replace(/\/index\.(mdx|md)$/, '')
      .replace(/\.(mdx|md)$/, '');

    const docCategory = slug.split('/')[0] || 'general';
    const frontmatter = parseFrontmatter(content);
    const headings = extractHeadings(content);
    const codeBlocks = extractCodeBlocks(content);
    const stats = calculateStats(content);

    totalHeadings += headings.length;
    totalCodeBlocks += codeBlocks.length;

    documents.push({
      slug,
      title: frontmatter.title || formatSlugToTitle(slug),
      description: frontmatter.description,
      docCategory,
      tags: frontmatter.tags,
      relatedResources: frontmatter.relatedResources,
      displayMode: frontmatter.displayMode,
      autoMatchEnabled: frontmatter.autoMatch,
      mdxPath: file.relativePath.replace(/\\/g, '/'),
      contentHash: hash,
      lastSynced: new Date().toISOString(),
      metadata: {
        ...stats,
        headingCount: headings.length,
        codeBlockCount: codeBlocks.length,
      },
      sections: headings,
      codeExamples: codeBlocks,
    });
  }

  // Write index file
  const output = {
    generatedAt: new Date().toISOString(),
    totalDocuments: documents.length,
    totalHeadings,
    totalCodeBlocks,
    documents,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

  // Print summary
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║              Documents Index Generated                        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  console.log(`✓ Total documents: ${documents.length}`);
  console.log(`✓ Total sections: ${totalHeadings}`);
  console.log(`✓ Total code blocks: ${totalCodeBlocks}`);
  console.log(`✓ Output: ${OUTPUT_FILE}\n`);

  // By category
  const byCategory = documents.reduce((acc, doc) => {
    acc[doc.docCategory] = (acc[doc.docCategory] || 0) + 1;
    return acc;
  }, {});

  console.log('By Category:');
  for (const [category, count] of Object.entries(byCategory)) {
    console.log(`  ${category}: ${count}`);
  }
  console.log('');

  return documents;
}

// Format slug to title
function formatSlugToTitle(slug) {
  const name = slug.split('/').pop() || slug;
  return name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Run if called directly
if (require.main === module) {
  syncMdxToPayload().catch(console.error);
}

module.exports = { syncMdxToPayload };
