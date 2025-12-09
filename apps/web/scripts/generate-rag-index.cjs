#!/usr/bin/env node

/**
 * Generates RAG index at build time for faster AI assistant responses
 * This pre-computes the document index and TF-IDF scores
 * Run with: node scripts/generate-rag-index.cjs
 *
 * Now also includes project knowledge chunks for self-awareness about:
 * - The Claude Insider project itself
 * - Author information (Vladimir Dukelic)
 * - Tech stack and architecture
 * - Voice assistant capabilities
 */

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

// Project knowledge chunks for self-awareness (mirrored from data/system-prompt.ts)
const PROJECT_KNOWLEDGE_CHUNKS = [
  {
    id: "project-overview",
    title: "About Claude Insider",
    section: "Project Overview",
    content: "Claude Insider is a comprehensive documentation website for Claude AI, Claude Code, and the Anthropic ecosystem. Version 0.16.2. Built by Vladimir Dukelic (@siliconyouth) using Claude Code powered by Claude Opus 4.5. The site is live at https://www.claudeinsider.com and the source code is available at https://github.com/siliconyouth/claude-insider. It features 34 documentation pages across 7 categories, a voice-powered AI assistant with 42 premium voices, fuzzy search, dark/light themes, and full accessibility compliance.",
    url: "/",
    category: "Project",
    keywords: ["claude insider", "documentation", "vladimir dukelic", "anthropic", "claude ai"],
  },
  {
    id: "project-author",
    title: "About the Creator",
    section: "Vladimir Dukelic",
    content: "Claude Insider was created by Vladimir Dukelic, a developer based in Serbia. His GitHub profile is https://github.com/siliconyouth (username: @siliconyouth). The entire project was built using Claude Code powered by Claude Opus 4.5, demonstrating the power of AI-assisted development. Vladimir built this as a comprehensive resource for the Claude AI community, providing documentation, tips, tutorials, and examples for working with Claude Code and the Anthropic API.",
    url: "/",
    category: "Project",
    keywords: ["vladimir dukelic", "creator", "author", "siliconyouth", "github"],
  },
  {
    id: "project-tech-stack",
    title: "Technical Architecture",
    section: "Tech Stack",
    content: "Claude Insider is built with Next.js 16.0.7 using App Router, API Routes, Server Components. The codebase is written in TypeScript 5.9.2 with React 19.2.0 for the UI. Styling uses Tailwind CSS 4.1.5. The monorepo is managed with Turborepo 2.6.3. AI features use @anthropic-ai/sdk from Anthropic. Voice features powered by ElevenLabs with 42 voices. Search uses Fuse.js for Fuzzy search with Cmd/Ctrl+K. RAG system uses TF-IDF with 423 indexed chunks. Hosted on Vercel.",
    url: "/",
    category: "Project",
    keywords: ["next.js", "typescript", "react", "tailwind", "turborepo", "anthropic", "elevenlabs", "vercel"],
  },
  {
    id: "project-assistant",
    title: "Voice Assistant Features",
    section: "AI Assistant",
    content: "The Claude Insider Assistant is powered by Claude Sonnet 4 (claude-sonnet-4-20250514). It features voice interaction with the wake word 'Hey Insider'. Speech-to-text uses Web Speech API. Text-to-speech uses ElevenLabs Turbo v2.5 with 42 premium voices. Default voice is Sarah. Audio format is MP3 44100Hz 128kbps. Features include: Streaming text responses, Voice starts after first sentence for fast feedback, 42 premium voice options with preview, Auto-speak toggle for hands-free use, Conversation export, Context-aware responses using RAG. Available in Popup window and Fullscreen overlay modes.",
    url: "/assistant",
    category: "Project",
    keywords: ["voice assistant", "hey insider", "elevenlabs", "claude sonnet", "streaming", "tts"],
  },
  {
    id: "project-documentation",
    title: "Documentation Structure",
    section: "Content Overview",
    content: "Claude Insider contains 34 documentation pages across 7 categories: Getting Started (5 pages), Configuration (5 pages), Tips & Tricks (5 pages), API Reference (7 pages), Integrations (7 pages), Tutorials (4 pages), Examples (2 pages). Each page includes reading time estimates, table of contents, edit on GitHub links, and source citations. Legal pages include Privacy Policy, Terms of Service, Disclaimer, Accessibility. Utility pages include Changelog, RSS Feed, Sitemap. All content is searchable via Cmd/Ctrl+K or search button.",
    url: "/docs",
    category: "Project",
    keywords: ["documentation", "getting started", "configuration", "api", "integrations", "tutorials", "examples"],
  },
  {
    id: "project-features",
    title: "Website Features",
    section: "Features Overview",
    content: "Claude Insider features: Search with Cmd/Ctrl+K or search button using Fuzzy search with Fuse.js. Theme support for Dark (default), Light, System. Code blocks with 33 language syntax highlighting and Syntax highlighting, Copy button, Language badges. WCAG 2.1 AA accessibility compliance with Skip links, ARIA labels, Keyboard navigation, Screen reader support. Documentation features: Table of contents with scroll spy, Reading time estimates, Edit on GitHub links, Source citations, Breadcrumb navigation.",
    url: "/",
    category: "Project",
    keywords: ["search", "themes", "accessibility", "code highlighting", "table of contents"],
  },
];

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

  // Add project knowledge chunks for self-awareness
  chunks.push(...PROJECT_KNOWLEDGE_CHUNKS);

  // Build TF-IDF index
  const { tfidfIndex, idfValues } = buildTfidfIndex(chunks);

  // Create the RAG index object
  const ragIndex = {
    version: "1.1",
    generatedAt: new Date().toISOString(),
    documentCount: chunks.length,
    projectKnowledgeCount: PROJECT_KNOWLEDGE_CHUNKS.length,
    chunks,
    tfidfIndex,
    idfValues,
  };

  // Write to JSON file
  fs.writeFileSync(outputPath, JSON.stringify(ragIndex, null, 2));

  console.log(`✓ Generated RAG index: ${chunks.length} document chunks`);
  console.log(`  - Documentation chunks: ${chunks.length - PROJECT_KNOWLEDGE_CHUNKS.length}`);
  console.log(`  - Project knowledge chunks: ${PROJECT_KNOWLEDGE_CHUNKS.length}`);
  console.log(`  Output: ${outputPath}`);
  console.log(`  Categories: ${Object.values(categories).join(", ")}, Project`);
}

// Run the generator
generateRagIndex();
