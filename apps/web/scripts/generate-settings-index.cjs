#!/usr/bin/env node

/**
 * Extracts settings, options, commands, and configuration details from documentation
 * Creates granular chunks for better AI context and precise answers
 *
 * Run with: node scripts/generate-settings-index.cjs
 * Called automatically by generate-rag-index.cjs during prebuild
 */

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

/**
 * Parse markdown tables and extract settings information
 */
function parseMarkdownTable(tableText) {
  const lines = tableText.trim().split("\n").filter(line => line.trim());
  if (lines.length < 2) return null;

  // Parse header
  const headerLine = lines[0];
  const headers = headerLine.split("|")
    .map(h => h.trim())
    .filter(h => h);

  // Skip separator line
  const dataLines = lines.slice(2);

  const rows = [];
  for (const line of dataLines) {
    const cells = line.split("|")
      .map(c => c.trim())
      .filter(c => c !== "");

    if (cells.length === headers.length) {
      const row = {};
      headers.forEach((header, i) => {
        row[header.toLowerCase()] = cells[i];
      });
      rows.push(row);
    }
  }

  return { headers, rows };
}

/**
 * Extract settings from documentation
 */
function extractSettings(content, title, url, category) {
  const chunks = [];

  // Extract tables with settings/options
  const tableRegex = /\|[^\n]+\|\n\|[-:\s|]+\|\n(?:\|[^\n]+\|\n?)+/g;
  const tables = content.match(tableRegex) || [];

  for (const tableText of tables) {
    const table = parseMarkdownTable(tableText);
    if (!table) continue;

    // Check if this is a settings/options table
    const isSettingsTable = table.headers.some(h =>
      /setting|option|variable|model|tool|level|parameter|key|command/i.test(h)
    );

    if (isSettingsTable && table.rows.length > 0) {
      for (const row of table.rows) {
        // Find the main identifier (setting name, variable, tool, etc.)
        const idKeys = ['setting', 'option', 'variable', 'model', 'tool', 'key', 'command', 'level'];
        const idKey = idKeys.find(k => row[k]) || Object.keys(row)[0];
        const settingName = row[idKey] || "";

        if (!settingName) continue;

        // Clean the setting name (remove backticks, etc.)
        const cleanName = settingName.replace(/`/g, "").trim();

        // Build description from other columns
        const descParts = [];
        for (const [key, value] of Object.entries(row)) {
          if (key !== idKey && value) {
            descParts.push(`${key}: ${value}`);
          }
        }
        const description = descParts.join(". ");

        // Create a dedicated chunk for this setting
        chunks.push({
          id: `setting-${url}-${cleanName.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`,
          title: `${title} - ${cleanName}`,
          section: `Setting: ${cleanName}`,
          content: `${cleanName}: ${description}. Found in ${title} documentation.`,
          url,
          category: "Settings & Options",
          subcategory: category,
          keywords: [
            cleanName.toLowerCase(),
            "setting",
            "option",
            "configuration",
            ...cleanName.toLowerCase().split(/[-_\s]+/)
          ].filter(Boolean),
          isConfigOption: true,
          settingData: {
            name: cleanName,
            description,
            sourceDoc: title,
            tableHeaders: table.headers
          }
        });
      }
    }
  }

  // Extract bash commands and their descriptions
  const bashCodeBlocks = content.match(/```bash\n([\s\S]*?)```/g) || [];
  for (const block of bashCodeBlocks) {
    const code = block.replace(/```bash\n/, "").replace(/\n```/, "").trim();
    const commands = code.split("\n").filter(line =>
      !line.startsWith("#") && line.trim()
    );

    for (const command of commands) {
      // Extract the base command
      const cmdMatch = command.match(/^(claude\s+\w+(?:\s+\w+)?)/);
      if (cmdMatch) {
        const baseCmd = cmdMatch[1];

        // Find preceding comment if any
        const lines = code.split("\n");
        const cmdIndex = lines.findIndex(l => l.includes(command));
        let description = "";
        if (cmdIndex > 0 && lines[cmdIndex - 1].startsWith("#")) {
          description = lines[cmdIndex - 1].replace(/^#\s*/, "");
        }

        chunks.push({
          id: `command-${url}-${baseCmd.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`,
          title: `Command: ${baseCmd}`,
          section: `CLI Command`,
          content: `Command: ${command}. ${description}. From: ${title}`,
          url,
          category: "CLI Commands",
          subcategory: category,
          keywords: [
            "command",
            "cli",
            "claude",
            ...baseCmd.toLowerCase().split(/\s+/)
          ],
          isCommand: true,
          commandData: {
            command: command.trim(),
            description,
            sourceDoc: title
          }
        });
      }
    }
  }

  // Extract JSON configuration examples
  const jsonCodeBlocks = content.match(/```json\n([\s\S]*?)```/g) || [];
  for (const block of jsonCodeBlocks) {
    const jsonStr = block.replace(/```json\n/, "").replace(/\n```/, "").trim();
    // Remove comments for JSON parsing
    const cleanJson = jsonStr.replace(/\/\/.*$/gm, "");

    try {
      const config = JSON.parse(cleanJson);
      const keys = Object.keys(config);

      // Create chunk for configuration example
      if (keys.length > 0) {
        const configDesc = keys.map(k => {
          const val = config[k];
          if (typeof val === "object") {
            return `${k} (object with ${Object.keys(val).length} properties)`;
          }
          return `${k}: ${val}`;
        }).join(", ");

        chunks.push({
          id: `config-${url}-${keys.slice(0, 3).join("-")}`.toLowerCase(),
          title: `Configuration Example - ${title}`,
          section: `JSON Configuration`,
          content: `Configuration example with: ${configDesc}. From: ${title}`,
          url,
          category: "Configuration Examples",
          subcategory: category,
          keywords: [
            "config",
            "configuration",
            "json",
            "settings",
            ...keys.map(k => k.toLowerCase())
          ],
          isConfigExample: true,
          configData: {
            keys,
            sourceDoc: title
          }
        });
      }
    } catch {
      // Invalid JSON, skip
    }
  }

  // Extract environment variables
  const envVarRegex = /`([A-Z][A-Z0-9_]+)`\s*[-:]\s*([^`\n]+)/g;
  let envMatch;
  while ((envMatch = envVarRegex.exec(content)) !== null) {
    const varName = envMatch[1];
    const description = envMatch[2].trim();

    if (varName.length > 3) {
      chunks.push({
        id: `env-${varName.toLowerCase()}`,
        title: `Environment Variable: ${varName}`,
        section: `Environment Variable`,
        content: `Environment variable ${varName}: ${description}. Used for Claude Code configuration.`,
        url,
        category: "Environment Variables",
        subcategory: category,
        keywords: [
          "env",
          "environment",
          "variable",
          varName.toLowerCase(),
          ...varName.toLowerCase().split("_")
        ],
        isEnvVar: true,
        envData: {
          name: varName,
          description,
          sourceDoc: title
        }
      });
    }
  }

  return chunks;
}

/**
 * Extract feature descriptions from headings and content
 */
function extractFeatures(content, title, url, category) {
  const chunks = [];

  // Split by h2 and h3 headings
  const sections = content.split(/(?=^##\s|^###\s)/m);

  for (const section of sections) {
    const headerMatch = section.match(/^(##|###)\s+(.+?)$/m);
    if (!headerMatch) continue;

    const level = headerMatch[1];
    const heading = headerMatch[2].trim();
    const sectionContent = section.replace(/^##.*?\n|^###.*?\n/, "").trim();

    // Skip very short sections
    if (sectionContent.length < 100) continue;

    // Check if this section describes a feature
    const featureKeywords = [
      "feature", "capability", "function", "option", "setting", "mode",
      "support", "enable", "configure", "customize", "control"
    ];

    const isFeatureSection = featureKeywords.some(kw =>
      heading.toLowerCase().includes(kw) ||
      sectionContent.toLowerCase().slice(0, 200).includes(kw)
    );

    if (isFeatureSection || level === "###") {
      // Extract first paragraph as description
      const firstPara = sectionContent.split("\n\n")[0] || sectionContent.slice(0, 300);

      chunks.push({
        id: `feature-${url}-${heading.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`,
        title: `${title} - ${heading}`,
        section: heading,
        content: `${heading}: ${firstPara}`,
        url: `${url}#${heading.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        category: "Features",
        subcategory: category,
        keywords: [
          "feature",
          heading.toLowerCase(),
          ...heading.toLowerCase().split(/\s+/)
        ],
        isFeature: true,
        featureData: {
          name: heading,
          description: firstPara.slice(0, 200),
          sourceDoc: title
        }
      });
    }
  }

  return chunks;
}

/**
 * Generate all settings and options chunks from documentation
 */
function generateSettingsChunks() {
  const contentDir = path.join(__dirname, "../content");
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

  // Recursively process all MDX files
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

          // Extract settings, commands, and env vars
          const settingsChunks = extractSettings(mdxContent, title, url, categoryName);
          chunks.push(...settingsChunks);

          // Extract features
          const featureChunks = extractFeatures(mdxContent, title, url, categoryName);
          chunks.push(...featureChunks);

        } catch (error) {
          console.error(`  Error processing ${filePath}:`, error.message);
        }
      }
    }
  }

  walkDir(contentDir);

  // Deduplicate by id
  const seen = new Set();
  const uniqueChunks = chunks.filter(chunk => {
    if (seen.has(chunk.id)) return false;
    seen.add(chunk.id);
    return true;
  });

  return uniqueChunks;
}

// Export for use by other scripts
module.exports = { generateSettingsChunks, parseMarkdownTable, extractSettings, extractFeatures };

// Run directly if called as main script
if (require.main === module) {
  console.log("Generating settings and options index...\n");
  const chunks = generateSettingsChunks();
  console.log(`\nGenerated ${chunks.length} settings/options chunks:`);

  // Group by category
  const byCategory = {};
  for (const chunk of chunks) {
    const cat = chunk.category;
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  }

  for (const [cat, count] of Object.entries(byCategory)) {
    console.log(`  - ${cat}: ${count}`);
  }

  // Output sample
  console.log("\nSample chunks:");
  chunks.slice(0, 3).forEach(c => console.log(`  - ${c.title}: ${c.content.slice(0, 80)}...`));
}
