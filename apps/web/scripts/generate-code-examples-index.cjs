#!/usr/bin/env node

/**
 * Code Examples Index Generator
 *
 * Extracts all code blocks from MDX documentation files and creates
 * a searchable index for the AI assistant to provide precise code examples.
 *
 * Features:
 * - Extracts code blocks with language tags
 * - Preserves surrounding context (section title, description)
 * - Indexes by language, purpose, and keywords
 * - Supports all 33 languages from code-block.tsx
 *
 * Run with: node scripts/generate-code-examples-index.cjs
 */

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

// Language configurations (matching code-block.tsx)
const LANGUAGE_FAMILIES = {
  javascript: ["js", "jsx", "javascript"],
  typescript: ["ts", "tsx", "typescript"],
  python: ["py", "python"],
  shell: ["bash", "sh", "zsh", "shell", "terminal"],
  data: ["json", "yaml", "yml", "toml", "xml"],
  web: ["html", "css", "scss", "sass"],
  systems: ["go", "rust", "c", "cpp", "c++"],
  jvm: ["java", "kotlin", "scala", "groovy"],
  config: ["ini", "conf", "env", "dotenv"],
  markup: ["md", "markdown", "mdx"],
  query: ["sql", "graphql", "gql"],
};

// Flatten language families for lookup
const LANGUAGE_LOOKUP = {};
for (const [family, langs] of Object.entries(LANGUAGE_FAMILIES)) {
  for (const lang of langs) {
    LANGUAGE_LOOKUP[lang] = family;
  }
}

// Common code patterns to detect
const CODE_PATTERNS = {
  apiCall: /fetch|axios|anthropic|claude|api\./i,
  authentication: /auth|login|token|api.?key|bearer/i,
  configuration: /config|settings|env|options|setup/i,
  errorHandling: /try|catch|error|throw|exception/i,
  streaming: /stream|chunk|reader|sse|event.?source/i,
  toolUse: /tool|function.?call|tool_use|tools/i,
  prompt: /prompt|system|message|content/i,
  model: /model|claude|sonnet|opus|haiku/i,
  hooks: /use[A-Z]|useState|useEffect|hook/i,
  component: /function\s+[A-Z]|export\s+(default\s+)?function|React\.|jsx/i,
  import: /^import\s|^from\s|require\(/m,
  export: /^export\s/m,
  async: /async|await|Promise|then\(/i,
  cli: /npm|pnpm|yarn|npx|claude|bash|sh/i,
};

/**
 * Extract code blocks from MDX content
 */
function extractCodeBlocks(content, filePath) {
  const codeBlocks = [];

  // Match fenced code blocks with optional language
  const codeBlockRegex = /```(\w+)?\s*\n([\s\S]*?)```/g;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const language = match[1] || "text";
    const code = match[2].trim();

    // Skip very short or empty code blocks
    if (code.length < 10) continue;

    // Find surrounding context (section header before this code block)
    const beforeBlock = content.slice(0, match.index);
    const sectionMatch = beforeBlock.match(/#{2,3}\s+(.+?)$/m);
    const lastSection = beforeBlock.split(/#{2,3}\s+/).pop() || "";

    // Get text immediately before the code block (likely description)
    const lines = beforeBlock.split("\n").filter((l) => l.trim());
    const precedingText = lines.slice(-3).join(" ").trim();

    // Detect code patterns
    const patterns = [];
    for (const [pattern, regex] of Object.entries(CODE_PATTERNS)) {
      if (regex.test(code)) {
        patterns.push(pattern);
      }
    }

    // Extract function/variable names for keywords
    const identifiers = [];
    const funcMatch = code.match(/(?:function|const|let|var|def|func)\s+(\w+)/g);
    if (funcMatch) {
      funcMatch.forEach((m) => {
        const name = m.split(/\s+/).pop();
        if (name && name.length > 2) identifiers.push(name);
      });
    }

    // Extract import names
    const importMatch = code.match(/import\s+\{([^}]+)\}/g);
    if (importMatch) {
      importMatch.forEach((m) => {
        const names = m.match(/\{([^}]+)\}/)?.[1]?.split(",") || [];
        names.forEach((n) => {
          const clean = n.trim().split(/\s+as\s+/)[0].trim();
          if (clean && clean.length > 2) identifiers.push(clean);
        });
      });
    }

    codeBlocks.push({
      language: language.toLowerCase(),
      languageFamily: LANGUAGE_LOOKUP[language.toLowerCase()] || "other",
      code,
      codeLength: code.length,
      lineCount: code.split("\n").length,
      sectionTitle: sectionMatch?.[1]?.trim() || null,
      precedingText: precedingText.slice(0, 200),
      patterns,
      identifiers: [...new Set(identifiers)].slice(0, 10),
      position: match.index,
      filePath,
    });
  }

  return codeBlocks;
}

/**
 * Generate RAG chunks from code blocks
 */
function generateCodeChunks(codeBlocks, pageTitle, pageUrl, category) {
  return codeBlocks.map((block, index) => {
    // Build a searchable description
    const parts = [
      `Code example in ${block.language}`,
      block.sectionTitle ? `from "${block.sectionTitle}" section` : "",
      `in ${pageTitle}`,
      block.patterns.length > 0 ? `(${block.patterns.join(", ")})` : "",
    ];

    const description = parts.filter(Boolean).join(" ");

    // Build keywords from patterns, identifiers, and language
    const keywords = [
      block.language,
      block.languageFamily,
      ...block.patterns,
      ...block.identifiers,
      "code",
      "example",
      "snippet",
    ].filter(Boolean);

    // Build content with code and context
    const content = [
      block.precedingText ? `Context: ${block.precedingText}` : "",
      `Language: ${block.language}`,
      `Code:\n${block.code.slice(0, 1000)}`, // Limit code size
      block.code.length > 1000 ? "... (truncated)" : "",
    ]
      .filter(Boolean)
      .join("\n");

    return {
      id: `code-${pageUrl.replace(/\//g, "-")}#${index}`,
      title: `${block.language.toUpperCase()} Example: ${block.sectionTitle || pageTitle}`,
      section: block.sectionTitle || `Code Example ${index + 1}`,
      content,
      url: pageUrl,
      category,
      keywords: [...new Set(keywords)],
      isCodeExample: true,
      codeData: {
        language: block.language,
        languageFamily: block.languageFamily,
        patterns: block.patterns,
        lineCount: block.lineCount,
        hasImports: block.patterns.includes("import"),
        hasExports: block.patterns.includes("export"),
        isAsync: block.patterns.includes("async"),
      },
    };
  });
}

/**
 * Main function to generate code examples index
 */
function generateCodeExamplesIndex() {
  const contentDir = path.join(__dirname, "../content");
  const outputPath = path.join(__dirname, "../data/code-examples-index.json");

  // Ensure data directory exists
  const dataDir = path.dirname(outputPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const chunks = [];
  const stats = {
    totalCodeBlocks: 0,
    byLanguage: {},
    byPattern: {},
    byCategory: {},
  };

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
          const title =
            frontmatter.title || slug.split("/").pop() || "Untitled";
          const categoryName = categories[category] || category;

          // Extract code blocks
          const codeBlocks = extractCodeBlocks(mdxContent, filePath);

          if (codeBlocks.length > 0) {
            // Generate chunks from code blocks
            const codeChunks = generateCodeChunks(
              codeBlocks,
              title,
              url,
              categoryName
            );
            chunks.push(...codeChunks);

            // Update stats
            stats.totalCodeBlocks += codeBlocks.length;
            stats.byCategory[categoryName] =
              (stats.byCategory[categoryName] || 0) + codeBlocks.length;

            for (const block of codeBlocks) {
              stats.byLanguage[block.language] =
                (stats.byLanguage[block.language] || 0) + 1;
              for (const pattern of block.patterns) {
                stats.byPattern[pattern] =
                  (stats.byPattern[pattern] || 0) + 1;
              }
            }
          }
        } catch (error) {
          console.error(`Error processing ${filePath}:`, error.message);
        }
      }
    }
  }

  console.log("Scanning MDX files for code examples...\n");
  walkDir(contentDir);

  // Create the index object
  const codeIndex = {
    version: "1.0",
    generatedAt: new Date().toISOString(),
    stats: {
      totalExamples: chunks.length,
      totalCodeBlocks: stats.totalCodeBlocks,
      languages: Object.keys(stats.byLanguage).length,
      patterns: Object.keys(stats.byPattern).length,
    },
    byLanguage: stats.byLanguage,
    byPattern: stats.byPattern,
    byCategory: stats.byCategory,
    chunks,
  };

  // Write to JSON file
  fs.writeFileSync(outputPath, JSON.stringify(codeIndex, null, 2));

  // Print summary
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║              Code Examples Index Generated                     ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  console.log(`✓ Total code examples: ${chunks.length}`);
  console.log(`✓ Total code blocks found: ${stats.totalCodeBlocks}`);
  console.log(`✓ Languages: ${Object.keys(stats.byLanguage).length}`);
  console.log(`✓ Output: ${outputPath}\n`);

  console.log("By Language:");
  const sortedLangs = Object.entries(stats.byLanguage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  for (const [lang, count] of sortedLangs) {
    console.log(`  ${lang}: ${count}`);
  }

  console.log("\nBy Pattern:");
  const sortedPatterns = Object.entries(stats.byPattern)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  for (const [pattern, count] of sortedPatterns) {
    console.log(`  ${pattern}: ${count}`);
  }

  console.log("\nBy Category:");
  for (const [cat, count] of Object.entries(stats.byCategory)) {
    console.log(`  ${cat}: ${count}`);
  }

  return chunks;
}

// Export for use in main RAG generator
module.exports = { generateCodeChunks: generateCodeExamplesIndex };

// Run if called directly
if (require.main === module) {
  generateCodeExamplesIndex();
}
