#!/usr/bin/env node

/**
 * Ask AI Context Index Generator
 *
 * Generates contextual chunks specifically optimized for the Ask AI system:
 * - FAQ chunks with category metadata
 * - Page context chunks with navigation and suggested questions
 * - Paragraph context chunks for granular content discovery
 * - Code block context with language-specific questions
 * - Resource context with usage patterns and alternatives
 *
 * These chunks enable the AI assistant to:
 * 1. Suggest relevant follow-up questions
 * 2. Understand user's current context
 * 3. Provide contextually appropriate answers
 * 4. Recommend related resources and documentation
 *
 * Built with Claude Code powered by Claude Opus 4.5
 */

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

// ===========================================================================
// CONFIGURATION
// ===========================================================================

const VERBOSE = process.argv.includes("--verbose");

// ===========================================================================
// FAQ CATEGORIES AND DEFAULTS
// ===========================================================================

const FAQ_CATEGORIES = {
  getting_started: "Getting Started",
  installation: "Installation & Setup",
  configuration: "Configuration",
  api: "API & Integration",
  mcp: "MCP Servers",
  prompting: "Prompting Techniques",
  troubleshooting: "Troubleshooting",
  features: "Features & Capabilities",
  general: "General",
};

const DEFAULT_FAQS = [
  {
    question: "What is Claude Code?",
    answer:
      "Claude Code is an AI-powered CLI tool that helps developers with coding tasks. It can read and write files, execute commands, and assist with complex development workflows. Think of it as having an AI pair programmer right in your terminal.",
    category: "general",
    queryCount: 100,
  },
  {
    question: "How do I install Claude Code?",
    answer:
      "You can install Claude Code using npm: `npm install -g @anthropic-ai/claude-code`. After installation, authenticate with your Anthropic API key by running `claude login`. For detailed installation steps, see our Installation guide.",
    category: "installation",
    queryCount: 95,
  },
  {
    question: "What is CLAUDE.md?",
    answer:
      "CLAUDE.md is a project configuration file that gives Claude Code context about your project. It can include coding conventions, project structure, preferred libraries, and specific instructions. Claude reads this file to better understand how to help with your codebase.",
    category: "configuration",
    queryCount: 85,
  },
  {
    question: "What are MCP servers?",
    answer:
      "MCP (Model Context Protocol) servers extend Claude's capabilities by providing access to external systems. They allow Claude to interact with databases, file systems, APIs, and more. Popular MCP servers include filesystem, PostgreSQL, and GitHub integrations.",
    category: "mcp",
    queryCount: 80,
  },
  {
    question: "How do I write effective prompts?",
    answer:
      "Effective prompts are clear, specific, and provide context. Start with the task, include relevant constraints, and specify the desired output format. Break complex tasks into steps, use examples when helpful, and iterate based on results.",
    category: "prompting",
    queryCount: 75,
  },
  {
    question: "What API models are available?",
    answer:
      "Anthropic offers several Claude models: Claude Opus 4.5 (most capable), Claude Sonnet 4 (balanced), and Claude Haiku 3.5 (fast and efficient). Choose based on your needs - Opus for complex tasks, Sonnet for everyday use, Haiku for simple queries.",
    category: "api",
    queryCount: 70,
  },
  {
    question: "How do I handle rate limits?",
    answer:
      "Implement exponential backoff when you hit rate limits. Start with a 1-second delay, then double it on each retry. Most applications benefit from request queuing and batching. Monitor your usage in the Anthropic Console.",
    category: "api",
    queryCount: 65,
  },
  {
    question: "What IDE integrations are available?",
    answer:
      "Claude Code integrates with VS Code, JetBrains IDEs, Neovim, and Sublime Text. The VS Code extension provides inline chat, code actions, and side panel features. JetBrains plugins offer similar functionality for their IDE family.",
    category: "features",
    queryCount: 60,
  },
];

// ===========================================================================
// CONTENT TYPE QUESTION TEMPLATES
// ===========================================================================

const QUESTION_TEMPLATES = {
  code: [
    "Explain this code step by step",
    "How can I modify this for my use case?",
    "What are common issues with this approach?",
    "Show me an alternative implementation",
    "What are the best practices for this pattern?",
    "How do I test this code?",
  ],
  heading: [
    "Tell me more about {title}",
    "Give me a practical example of {title}",
    "What are common mistakes to avoid with {title}?",
    "How does {title} relate to other topics?",
    "What should I know before learning about {title}?",
  ],
  paragraph: [
    "Explain this in simpler terms",
    "Give me a practical example",
    "What should I know first?",
    "What are the best practices?",
    "How does this apply to real projects?",
  ],
  resource: [
    "How do I get started with {title}?",
    "What are the alternatives to {title}?",
    "Show me example usage of {title}",
    "What are the pros and cons of {title}?",
    "Is {title} right for my project?",
    "How do I integrate {title} with my workflow?",
  ],
  setting: [
    "What does this setting do?",
    "What's the recommended value?",
    "How do I configure this in my environment?",
    "What happens if I change this?",
    "What are common configurations?",
  ],
  feature: [
    "How do I use {title}?",
    "What are the requirements for {title}?",
    "Show me examples of {title} in action",
    "What are the limitations of {title}?",
  ],
};

// ===========================================================================
// HELPER FUNCTIONS
// ===========================================================================

function log(message) {
  if (VERBOSE) console.log(message);
}

/**
 * Generate questions from templates, replacing {title} placeholders
 */
function generateQuestions(template, title) {
  return template.map((q) => q.replace(/{title}/g, title || "this"));
}

/**
 * Extract keywords from text
 */
function extractKeywords(text, limit = 10) {
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "as", "is", "was", "are", "were", "been",
    "be", "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "can", "this", "that", "these", "those", "it",
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));

  const freq = new Map();
  words.forEach((word) => freq.set(word, (freq.get(word) || 0) + 1));

  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

/**
 * Detect content type from text patterns
 */
function detectContentType(text) {
  if (/^```|^\s{4,}[\w]/.test(text)) return "code";
  if (/^#{1,6}\s/.test(text)) return "heading";
  if (/install|setup|configure|setting/i.test(text)) return "setting";
  if (/feature|capability|support/i.test(text)) return "feature";
  return "paragraph";
}

// ===========================================================================
// FAQ CHUNK GENERATOR
// ===========================================================================

/**
 * Generate chunks from FAQ content
 */
function generateFAQChunks() {
  const chunks = [];

  log("  Generating FAQ chunks...");

  // Generate chunks from default FAQs
  DEFAULT_FAQS.forEach((faq, index) => {
    const categoryName = FAQ_CATEGORIES[faq.category] || faq.category;

    chunks.push({
      id: `faq-${faq.category}-${index}`,
      title: faq.question,
      section: `FAQ: ${categoryName}`,
      content: `Question: ${faq.question}\n\nAnswer: ${faq.answer}`,
      url: "/faq",
      category: "FAQ",
      subcategory: categoryName,
      keywords: extractKeywords(`${faq.question} ${faq.answer}`),
      isFAQ: true,
      faqData: {
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        categoryName: categoryName,
        popularity: faq.queryCount,
      },
      suggestedQuestions: [
        `Tell me more about ${faq.question.toLowerCase().replace(/\?$/, "")}`,
        "Can you give me an example?",
        "What are the common issues?",
        "How does this relate to other topics?",
      ],
    });
  });

  // Generate category overview chunks
  Object.entries(FAQ_CATEGORIES).forEach(([key, name]) => {
    const categoryFAQs = DEFAULT_FAQS.filter((f) => f.category === key);
    if (categoryFAQs.length === 0) return;

    const questions = categoryFAQs.map((f) => f.question).join("\n- ");

    chunks.push({
      id: `faq-category-${key}`,
      title: `${name} - Frequently Asked Questions`,
      section: `FAQ Category: ${name}`,
      content: `Common questions about ${name}:\n- ${questions}`,
      url: `/faq?category=${key}`,
      category: "FAQ",
      subcategory: name,
      keywords: [key, ...name.toLowerCase().split(" ")],
      isFAQCategory: true,
      faqCategoryData: {
        categoryKey: key,
        categoryName: name,
        questionCount: categoryFAQs.length,
        questions: categoryFAQs.map((f) => f.question),
      },
    });
  });

  log(`    Generated ${chunks.length} FAQ chunks`);
  return chunks;
}

// ===========================================================================
// PAGE CONTEXT CHUNK GENERATOR
// ===========================================================================

/**
 * Generate page context chunks with navigation and suggested questions
 */
function generatePageContextChunks() {
  const chunks = [];
  const contentDir = path.join(__dirname, "../content");

  log("  Generating page context chunks...");

  // Category mappings for breadcrumbs
  const categories = {
    "getting-started": { name: "Getting Started", order: 1 },
    configuration: { name: "Configuration", order: 2 },
    "tips-and-tricks": { name: "Tips & Tricks", order: 3 },
    api: { name: "API Reference", order: 4 },
    integrations: { name: "Integrations", order: 5 },
    tutorials: { name: "Tutorials", order: 6 },
    examples: { name: "Examples", order: 7 },
  };

  function walkDir(dir, category = "") {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        walkDir(filePath, category || file);
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
          const categoryInfo = categories[category] || { name: category, order: 99 };

          // Build breadcrumbs
          const breadcrumbs = ["Docs", categoryInfo.name];
          if (slug.includes("/")) {
            breadcrumbs.push(title);
          }

          // Extract page summary (first paragraph)
          const cleanContent = mdxContent
            .replace(/<[^>]+>/g, " ")
            .replace(/```[\s\S]*?```/g, "")
            .replace(/import\s+.*?from\s+['"][^'"]+['"]/g, "")
            .trim();

          const firstParagraph = cleanContent
            .split(/\n\n/)
            .find((p) => p.length > 50 && !p.startsWith("#"));

          // Generate suggested questions based on page content
          const suggestedQuestions = [
            `What is ${title}?`,
            `How do I use ${title}?`,
            `Give me an example of ${title}`,
            `What are best practices for ${title}?`,
            `What are common issues with ${title}?`,
          ];

          // Add topic-specific questions
          if (/install|setup/i.test(title)) {
            suggestedQuestions.push("What are the system requirements?");
            suggestedQuestions.push("How do I troubleshoot installation issues?");
          }
          if (/config|setting/i.test(title)) {
            suggestedQuestions.push("What are the default settings?");
            suggestedQuestions.push("How do I customize the configuration?");
          }
          if (/api|endpoint/i.test(title)) {
            suggestedQuestions.push("What parameters are available?");
            suggestedQuestions.push("Show me a request example");
          }

          chunks.push({
            id: `page-context-${slug.replace(/\//g, "-")}`,
            title: `Page: ${title}`,
            section: `${categoryInfo.name} - ${title}`,
            content: `Page: ${title}\nCategory: ${categoryInfo.name}\nPath: ${url}\n\n${firstParagraph || frontmatter.description || ""}`,
            url,
            category: "PageContext",
            subcategory: categoryInfo.name,
            keywords: extractKeywords(`${title} ${frontmatter.description || ""} ${firstParagraph || ""}`),
            isPageContext: true,
            pageContextData: {
              title,
              path: url,
              category: category,
              categoryName: categoryInfo.name,
              breadcrumbs,
              description: frontmatter.description || null,
              order: categoryInfo.order,
            },
            suggestedQuestions: suggestedQuestions.slice(0, 6),
          });
        } catch (error) {
          log(`    Error processing ${filePath}: ${error.message}`);
        }
      }
    }
  }

  walkDir(contentDir);

  log(`    Generated ${chunks.length} page context chunks`);
  return chunks;
}

// ===========================================================================
// PARAGRAPH CONTEXT CHUNK GENERATOR
// ===========================================================================

/**
 * Generate paragraph-level chunks for granular content discovery
 */
function generateParagraphChunks() {
  const chunks = [];
  const contentDir = path.join(__dirname, "../content");

  log("  Generating paragraph context chunks...");

  function walkDir(dir, category = "") {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        walkDir(filePath, category || file);
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
          const pageTitle = frontmatter.title || slug.split("/").pop() || "Untitled";

          // Clean content
          const cleanContent = mdxContent
            .replace(/<[^>]+>/g, " ")
            .replace(/import\s+.*?from\s+['"][^'"]+['"]/g, "")
            .replace(/export\s+/g, "")
            .replace(/\{[^}]+\}/g, " ");

          // Split into sections by headers
          const sections = cleanContent.split(/(?=^#{2,4}\s)/m);
          let currentSection = pageTitle;

          sections.forEach((section, sectionIndex) => {
            const headerMatch = section.match(/^(#{2,4})\s+(.+?)$/m);
            if (headerMatch) {
              currentSection = headerMatch[2].trim();
            }

            // Split section into paragraphs
            const paragraphs = section
              .replace(/^#{2,4}\s+.+$/m, "") // Remove header
              .split(/\n\n+/)
              .map((p) => p.trim())
              .filter((p) => p.length > 80 && !p.startsWith("```")); // Skip short and code

            paragraphs.forEach((paragraph, paraIndex) => {
              // Skip code blocks and imports
              if (paragraph.startsWith("```") || paragraph.startsWith("import")) return;

              const contentType = detectContentType(paragraph);
              const questions = generateQuestions(
                QUESTION_TEMPLATES[contentType] || QUESTION_TEMPLATES.paragraph,
                currentSection
              );

              chunks.push({
                id: `para-${slug.replace(/\//g, "-")}-${sectionIndex}-${paraIndex}`,
                title: `${pageTitle}: ${currentSection}`,
                section: currentSection,
                content: paragraph.slice(0, 800),
                url: `${url}#${currentSection.toLowerCase().replace(/\s+/g, "-")}`,
                category: "ParagraphContext",
                subcategory: pageTitle,
                keywords: extractKeywords(paragraph, 8),
                isParagraphContext: true,
                paragraphData: {
                  pageTitle,
                  pagePath: url,
                  sectionTitle: currentSection,
                  contentType,
                  paragraphIndex: paraIndex,
                  wordCount: paragraph.split(/\s+/).length,
                },
                suggestedQuestions: questions.slice(0, 4),
              });
            });
          });
        } catch (error) {
          log(`    Error processing ${filePath}: ${error.message}`);
        }
      }
    }
  }

  walkDir(contentDir);

  log(`    Generated ${chunks.length} paragraph context chunks`);
  return chunks;
}

// ===========================================================================
// CODE BLOCK CONTEXT CHUNK GENERATOR
// ===========================================================================

/**
 * Generate enhanced code block chunks with contextual questions
 */
function generateCodeBlockChunks() {
  const chunks = [];
  const contentDir = path.join(__dirname, "../content");

  log("  Generating code block context chunks...");

  // Language-specific question templates
  const languageQuestions = {
    javascript: [
      "How does this JavaScript code work?",
      "What ES6+ features does this use?",
      "How can I make this async/await?",
      "What are the browser compatibility issues?",
    ],
    typescript: [
      "Explain the TypeScript types used here",
      "How can I improve the type safety?",
      "What TypeScript patterns is this using?",
      "How do I add proper error handling?",
    ],
    python: [
      "Explain this Python code",
      "What Python best practices should I follow?",
      "How can I make this more Pythonic?",
      "What libraries does this require?",
    ],
    bash: [
      "What does this shell command do?",
      "How do I make this work on different systems?",
      "What are the potential security issues?",
      "How can I handle errors in this script?",
    ],
    json: [
      "Explain this JSON structure",
      "What are valid values for these fields?",
      "How do I validate this JSON?",
      "What schema should this follow?",
    ],
    yaml: [
      "Explain this YAML configuration",
      "What are common mistakes with this format?",
      "How do I validate this YAML?",
      "What do these settings control?",
    ],
  };

  function walkDir(dir, category = "") {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        walkDir(filePath, category || file);
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
          const pageTitle = frontmatter.title || slug.split("/").pop() || "Untitled";

          // Find code blocks
          const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
          let match;
          let blockIndex = 0;

          while ((match = codeBlockRegex.exec(mdxContent)) !== null) {
            const language = match[1] || "plaintext";
            const code = match[2].trim();

            if (code.length < 20) continue; // Skip tiny code blocks

            // Get language-specific questions or defaults
            const langQuestions = languageQuestions[language] || QUESTION_TEMPLATES.code;

            // Find surrounding context (section header)
            const beforeMatch = mdxContent.slice(0, match.index);
            const headerMatch = beforeMatch.match(/#{2,4}\s+(.+?)$/m);
            const sectionTitle = headerMatch?.[1]?.trim() || pageTitle;

            chunks.push({
              id: `code-context-${slug.replace(/\//g, "-")}-${blockIndex}`,
              title: `${language.toUpperCase()} Code: ${sectionTitle}`,
              section: sectionTitle,
              content: `Code example (${language}):\n\`\`\`${language}\n${code.slice(0, 1000)}\n\`\`\``,
              url: `${url}#code-${blockIndex}`,
              category: "CodeContext",
              subcategory: language,
              keywords: [language, ...extractKeywords(code, 8)],
              isCodeContext: true,
              codeContextData: {
                language,
                pageTitle,
                pagePath: url,
                sectionTitle,
                lineCount: code.split("\n").length,
                hasImports: /^import\s|^from\s|^require\(/m.test(code),
                hasExports: /^export\s/m.test(code),
                hasAsync: /async|await|Promise/.test(code),
                hasTypes: /:\s*\w+|<\w+>|interface\s|type\s/.test(code),
              },
              suggestedQuestions: [
                ...langQuestions,
                "Explain this code step by step",
                `How do I run this ${language} code?`,
              ].slice(0, 6),
            });

            blockIndex++;
          }
        } catch (error) {
          log(`    Error processing ${filePath}: ${error.message}`);
        }
      }
    }
  }

  walkDir(contentDir);

  log(`    Generated ${chunks.length} code context chunks`);
  return chunks;
}

// ===========================================================================
// RESOURCE CONTEXT CHUNK GENERATOR
// ===========================================================================

/**
 * Generate enhanced resource chunks with Ask AI context
 */
function generateResourceContextChunks() {
  const chunks = [];
  const resourcesDir = path.join(__dirname, "../data/resources");

  log("  Generating resource context chunks...");

  if (!fs.existsSync(resourcesDir)) {
    log("    Resources directory not found");
    return chunks;
  }

  const files = fs.readdirSync(resourcesDir).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(resourcesDir, file), "utf-8");
      const resources = JSON.parse(content);

      for (const resource of resources) {
        // Generate contextual questions for this resource
        const questions = generateQuestions(QUESTION_TEMPLATES.resource, resource.title);

        // Add category-specific questions
        if (resource.category === "mcp-servers") {
          questions.push(
            `How do I configure ${resource.title} MCP server?`,
            `What capabilities does ${resource.title} provide?`
          );
        } else if (resource.category === "tools") {
          questions.push(
            `How do I install ${resource.title}?`,
            `What does ${resource.title} integrate with?`
          );
        } else if (resource.category === "sdks") {
          questions.push(
            `Show me example code using ${resource.title}`,
            `What languages does ${resource.title} support?`
          );
        }

        // Build enhanced content
        const contentParts = [
          `Resource: ${resource.title}`,
          resource.description,
          resource.github?.language ? `Language: ${resource.github.language}` : "",
          resource.tags?.length ? `Tags: ${resource.tags.join(", ")}` : "",
          resource.github?.stars ? `${resource.github.stars.toLocaleString()} GitHub stars` : "",
          resource.featured ? `Featured: ${resource.featuredReason || "Recommended"}` : "",
        ].filter(Boolean);

        chunks.push({
          id: `resource-context-${resource.id}`,
          title: `Resource: ${resource.title}`,
          section: resource.subcategory || resource.category,
          content: contentParts.join("\n"),
          url: resource.url,
          category: "ResourceContext",
          subcategory: resource.category,
          keywords: [
            ...(resource.tags || []),
            resource.category,
            resource.subcategory,
            resource.github?.language,
          ].filter(Boolean).map((k) => k.toLowerCase()),
          isResourceContext: true,
          resourceContextData: {
            id: resource.id,
            title: resource.title,
            category: resource.category,
            subcategory: resource.subcategory,
            tags: resource.tags || [],
            featured: resource.featured || false,
            githubStars: resource.github?.stars || null,
            language: resource.github?.language || null,
            status: resource.status || "stable",
          },
          suggestedQuestions: questions.slice(0, 6),
        });
      }
    } catch (error) {
      log(`    Error processing ${file}: ${error.message}`);
    }
  }

  log(`    Generated ${chunks.length} resource context chunks`);
  return chunks;
}

// ===========================================================================
// MAIN EXPORT
// ===========================================================================

/**
 * Generate all Ask AI context chunks
 */
function generateAskAIContextChunks() {
  console.log("  [Ask AI Context] Generating context-aware chunks...");

  const faqChunks = generateFAQChunks();
  const pageContextChunks = generatePageContextChunks();
  const paragraphChunks = generateParagraphChunks();
  const codeBlockChunks = generateCodeBlockChunks();
  const resourceContextChunks = generateResourceContextChunks();

  const allChunks = [
    ...faqChunks,
    ...pageContextChunks,
    ...paragraphChunks,
    ...codeBlockChunks,
    ...resourceContextChunks,
  ];

  console.log(`  [Ask AI Context] Generated ${allChunks.length} total chunks:`);
  console.log(`    - FAQ chunks: ${faqChunks.length}`);
  console.log(`    - Page context: ${pageContextChunks.length}`);
  console.log(`    - Paragraph context: ${paragraphChunks.length}`);
  console.log(`    - Code block context: ${codeBlockChunks.length}`);
  console.log(`    - Resource context: ${resourceContextChunks.length}`);

  return {
    chunks: allChunks,
    stats: {
      faqCount: faqChunks.length,
      pageContextCount: pageContextChunks.length,
      paragraphCount: paragraphChunks.length,
      codeBlockCount: codeBlockChunks.length,
      resourceContextCount: resourceContextChunks.length,
      totalCount: allChunks.length,
    },
  };
}

module.exports = { generateAskAIContextChunks };

// If run directly, output stats
if (require.main === module) {
  const result = generateAskAIContextChunks();
  console.log("\nAsk AI Context Index Stats:");
  console.log(JSON.stringify(result.stats, null, 2));
}
