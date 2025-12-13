#!/usr/bin/env node

/**
 * Generates RAG index at build time for faster AI assistant responses
 * This pre-computes the document index and TF-IDF scores
 * Run with: node scripts/generate-rag-index.cjs
 *
 * Project knowledge is now dynamically generated from source files:
 * - README.md, CLAUDE.md, REQUIREMENTS.md, CHANGELOG.md
 * - Reads fresh data on each build for always up-to-date knowledge
 * - Includes: project overview, author, tech stack, voice features, architecture, etc.
 */

const fs = require("fs");
const path = require("path");
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

// Resources category metadata
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

// Common stop words to filter out
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

/**
 * Generate chunks from resources data
 * This allows the AI assistant to recommend specific resources
 */
function generateResourceChunks() {
  const resourcesDir = path.join(__dirname, "../data/resources");
  const chunks = [];

  if (!fs.existsSync(resourcesDir)) {
    console.log("  Resources directory not found, skipping...");
    return chunks;
  }

  // Read all JSON files in resources directory
  const files = fs.readdirSync(resourcesDir).filter((f) => f.endsWith(".json"));

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

        const content = contentParts.filter(Boolean).join(". ");

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
          },
        });
      }
    } catch (error) {
      console.error(`  Error processing ${file}:`, error.message);
    }
  }

  return chunks;
}

/**
 * Build TF-IDF index
 */
function buildTfidfIndex(chunks) {
  const tfidfIndex = {};
  const docFreq = new Map();

  // Calculate term frequency for each document
  for (const chunk of chunks) {
    const words = tokenize(chunk.content + " " + chunk.title + " " + chunk.section);
    const termFreq = new Map();

    for (const word of words) {
      termFreq.set(word, (termFreq.get(word) || 0) + 1);
    }

    // Normalize by document length
    const maxFreq = Math.max(...termFreq.values());
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
  }

  // Calculate IDF values
  const idfValues = {};
  const numDocs = chunks.length;
  for (const [term, freq] of docFreq) {
    idfValues[term] = Math.log(numDocs / (1 + freq));
  }

  return { tfidfIndex, idfValues };
}

/**
 * Main function to generate RAG index
 */
function generateRagIndex() {
  const contentDir = path.join(__dirname, "../content");
  const outputPath = path.join(__dirname, "../data/rag-index.json");

  // Ensure data directory exists
  const dataDir = path.dirname(outputPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const chunks = [];

  // Category mapping
  const categories = {
    "getting-started": "Getting Started",
    configuration: "Configuration",
    "tips-and-tricks": "Tips & Tricks",
    api: "API Reference",
    integrations: "Integrations",
    tutorials: "Tutorials",
    examples: "Examples",
  };

  // Recursively find all MDX files
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
        } catch (error) {
          console.error(`Error processing ${filePath}:`, error);
        }
      }
    }
  }

  walkDir(contentDir);

  const docsChunkCount = chunks.length;

  // Generate and add project knowledge chunks dynamically from source files
  console.log("\nGenerating project knowledge from documentation files...");
  const projectKnowledge = generateProjectKnowledge();
  chunks.push(...projectKnowledge);

  const projectKnowledgeCount = projectKnowledge.length;

  // Generate and add resource chunks for AI assistant recommendations
  console.log("\nGenerating resource chunks for AI recommendations...");
  const resourceChunks = generateResourceChunks();
  chunks.push(...resourceChunks);

  const resourceChunkCount = resourceChunks.length;

  // Generate and add settings/options chunks for precise AI answers
  console.log("\nGenerating settings and options chunks...");
  const settingsChunks = generateSettingsChunks();
  chunks.push(...settingsChunks);

  const settingsChunkCount = settingsChunks.length;

  // Generate and add external source chunks if cache exists
  console.log("\nAdding external source chunks (if cached)...");
  const sourceChunks = generateSourceChunks();
  chunks.push(...sourceChunks);

  const sourceChunkCount = sourceChunks.length;

  // Generate and add code examples chunks
  console.log("\nGenerating code examples index...");
  const codeChunks = generateCodeChunks();
  chunks.push(...codeChunks);

  const codeChunkCount = codeChunks.length;

  // Build TF-IDF index
  const { tfidfIndex, idfValues } = buildTfidfIndex(chunks);

  // Create the RAG index object
  const ragIndex = {
    version: "5.0",
    generatedAt: new Date().toISOString(),
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
  fs.writeFileSync(outputPath, JSON.stringify(ragIndex, null, 2));

  console.log(`\n✓ Generated RAG index: ${chunks.length} total chunks`);
  console.log(`  - Documentation chunks: ${docsChunkCount}`);
  console.log(`  - Project knowledge chunks: ${projectKnowledgeCount} (dynamically generated)`);
  console.log(`  - Resource chunks: ${resourceChunkCount} (for AI recommendations)`);
  console.log(`  - Settings/options chunks: ${settingsChunkCount} (for precise answers)`);
  console.log(`  - External source chunks: ${sourceChunkCount} (cached references)`);
  console.log(`  - Code examples chunks: ${codeChunkCount} (searchable snippets)`);
  console.log(`  Output: ${outputPath}`);
  console.log(`  Categories: ${Object.values(categories).join(", ")}, Project, Resources, Settings, Sources, Code`);
}

// Run the generator
generateRagIndex();
