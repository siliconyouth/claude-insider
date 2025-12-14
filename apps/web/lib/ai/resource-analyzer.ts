/**
 * AI Resource Analyzer
 *
 * Uses Claude Opus 4.5 to analyze URLs and content to extract
 * resource information for the Claude Insider resource directory.
 *
 * Capabilities:
 * - Analyze URLs to extract title, description, category
 * - Suggest appropriate tags and difficulty level
 * - Provide confidence scores for categorization
 * - Detect duplicates by comparing with existing resources
 * - Extract GitHub/npm metadata when applicable
 */

import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// Types for the analyzer
export interface AnalyzeUrlInput {
  url: string;
  content?: string; // Pre-scraped content (optional)
  existingResourceTitles?: string[]; // For duplicate detection
}

export interface AnalyzedResource {
  // Core fields
  title: string;
  description: string;
  suggestedCategory: string;
  suggestedSubcategory?: string;
  suggestedTags: string[];
  suggestedDifficulty: "beginner" | "intermediate" | "advanced";
  suggestedStatus: "official" | "community" | "beta" | "deprecated";

  // GitHub info (if detected)
  github?: {
    owner: string;
    repo: string;
  };

  // Package info (if detected)
  package?: {
    name: string;
    registry: "npm" | "pypi";
  };

  // Analysis scores (0-100)
  analysis: {
    confidenceScore: number;
    relevanceScore: number;
    qualityScore: number;
    reasoning: string;
    suggestedImprovements?: string;
    warnings?: string;
  };

  // Duplicate detection
  possibleDuplicate?: {
    detected: boolean;
    similarTitle?: string;
    reason?: string;
  };
}

// Available categories for the analyzer
const CATEGORIES = [
  {
    slug: "official",
    name: "Official Resources",
    description: "Official Anthropic documentation, guides, and repositories",
  },
  {
    slug: "tools",
    name: "Tools & Extensions",
    description: "IDE plugins, CLI tools, browser extensions, and desktop apps",
  },
  {
    slug: "mcp-servers",
    name: "MCP Servers",
    description:
      "Model Context Protocol servers for extending Claude capabilities",
  },
  {
    slug: "rules",
    name: "CLAUDE.md Rules",
    description: "Project configuration rules and best practices by framework",
  },
  {
    slug: "prompts",
    name: "Prompts",
    description: "System prompts, templates, and prompt engineering resources",
  },
  {
    slug: "agents",
    name: "Agents",
    description:
      "AI agent frameworks, autonomous agents, and agent development tools",
  },
  {
    slug: "tutorials",
    name: "Tutorials & Guides",
    description: "Learning resources, courses, and step-by-step guides",
  },
  {
    slug: "sdks",
    name: "SDKs & Libraries",
    description:
      "Client libraries, SDKs, and integration packages for various languages",
  },
  {
    slug: "showcases",
    name: "Showcases",
    description: "Example projects, demos, and real-world implementations",
  },
  {
    slug: "community",
    name: "Community",
    description:
      "Community forums, Discord servers, newsletters, and discussion groups",
  },
];

// Initialize Claude client
const anthropic = new Anthropic();

/**
 * Build the analysis prompt for Claude
 */
function buildAnalysisPrompt(input: AnalyzeUrlInput): string {
  const categoryList = CATEGORIES.map(
    (c) => `- ${c.slug}: ${c.name} - ${c.description}`
  ).join("\n");

  const existingResourcesNote = input.existingResourceTitles?.length
    ? `
## Existing Resources (check for duplicates)
${input.existingResourceTitles.slice(0, 50).join(", ")}
`
    : "";

  return `You are an expert curator for Claude Insider, a comprehensive resource directory for Claude AI and Anthropic ecosystem tools.

Analyze the following URL and content to extract structured information for our resource directory.

## URL to Analyze
${input.url}

${input.content ? `## Scraped Content\n${input.content.slice(0, 15000)}` : "## Note: No pre-scraped content provided. Base your analysis on the URL structure and any knowledge you have about this resource."}

## Available Categories
${categoryList}

${existingResourcesNote}

## Your Task
Analyze this resource and provide:

1. **Title**: A clear, concise title (e.g., "Claude Desktop", "MCP Server - PostgreSQL")
2. **Description**: A 1-2 sentence description explaining what the resource does
3. **Category**: The most appropriate category slug from the list above
4. **Subcategory**: Optional subcategory within the main category
5. **Tags**: 3-7 relevant tags (e.g., "typescript", "mcp", "vscode", "api")
6. **Difficulty**: beginner, intermediate, or advanced
7. **Status**: official (if from Anthropic), community, beta, or deprecated

8. **GitHub Info**: If this is a GitHub repo, extract owner and repo name
9. **Package Info**: If this is an npm/PyPI package, extract the package name

10. **Analysis Scores** (0-100):
    - Confidence: How confident are you in your categorization?
    - Relevance: How relevant is this to Claude/Anthropic ecosystem?
    - Quality: Based on content/structure, how high-quality is this resource?

11. **Reasoning**: Explain your categorization decisions
12. **Improvements**: Any suggestions for improving the resource listing
13. **Warnings**: Any potential issues (outdated, deprecated, low quality, etc.)

14. **Duplicate Check**: Is this similar to any existing resource in our directory?

## Response Format
Respond with ONLY valid JSON in this exact format:
\`\`\`json
{
  "title": "string",
  "description": "string",
  "suggestedCategory": "category_slug",
  "suggestedSubcategory": "string or null",
  "suggestedTags": ["tag1", "tag2"],
  "suggestedDifficulty": "beginner|intermediate|advanced",
  "suggestedStatus": "official|community|beta|deprecated",
  "github": { "owner": "string", "repo": "string" } | null,
  "package": { "name": "string", "registry": "npm|pypi" } | null,
  "analysis": {
    "confidenceScore": 0-100,
    "relevanceScore": 0-100,
    "qualityScore": 0-100,
    "reasoning": "string",
    "suggestedImprovements": "string or null",
    "warnings": "string or null"
  },
  "possibleDuplicate": {
    "detected": true/false,
    "similarTitle": "string or null",
    "reason": "string or null"
  }
}
\`\`\``;
}

/**
 * Parse Claude's JSON response
 */
function parseAnalysisResponse(response: string): AnalyzedResource {
  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch && jsonMatch[1] ? jsonMatch[1].trim() : response.trim();

  try {
    const parsed = JSON.parse(jsonStr);

    // Validate and return with defaults
    return {
      title: parsed.title || "Untitled Resource",
      description: parsed.description || "",
      suggestedCategory: parsed.suggestedCategory || "community",
      suggestedSubcategory: parsed.suggestedSubcategory || undefined,
      suggestedTags: Array.isArray(parsed.suggestedTags)
        ? parsed.suggestedTags
        : [],
      suggestedDifficulty: parsed.suggestedDifficulty || "intermediate",
      suggestedStatus: parsed.suggestedStatus || "community",
      github: parsed.github || undefined,
      package: parsed.package || undefined,
      analysis: {
        confidenceScore: parsed.analysis?.confidenceScore ?? 50,
        relevanceScore: parsed.analysis?.relevanceScore ?? 50,
        qualityScore: parsed.analysis?.qualityScore ?? 50,
        reasoning: parsed.analysis?.reasoning || "No reasoning provided",
        suggestedImprovements: parsed.analysis?.suggestedImprovements,
        warnings: parsed.analysis?.warnings,
      },
      possibleDuplicate: parsed.possibleDuplicate || {
        detected: false,
      },
    };
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    throw new Error(`Failed to parse AI analysis response: ${error}`);
  }
}

/**
 * Analyze a URL using Claude Opus 4.5
 */
export async function analyzeResourceUrl(
  input: AnalyzeUrlInput
): Promise<AnalyzedResource> {
  const prompt = buildAnalysisPrompt(input);

  try {
    const response = await anthropic.messages.create({
      model: "claude-opus-4-5-20251101", // Claude Opus 4.5
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Extract text from response
    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text content in AI response");
    }

    return parseAnalysisResponse(textContent.text);
  } catch (error) {
    console.error("AI analysis failed:", error);
    throw error;
  }
}

/**
 * Analyze multiple URLs in batch
 */
export async function analyzeResourceUrls(
  inputs: AnalyzeUrlInput[]
): Promise<{ url: string; result: AnalyzedResource | { error: string } }[]> {
  const results = await Promise.allSettled(
    inputs.map(async (input) => {
      const result = await analyzeResourceUrl(input);
      return { url: input.url, result };
    })
  );

  return results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    } else {
      const input = inputs[index];
      return {
        url: input?.url || "unknown",
        result: { error: result.reason?.message || "Unknown error" },
      };
    }
  });
}

/**
 * Quick relevance check - faster, cheaper check if URL is relevant
 * Uses a smaller model for quick triage
 */
export async function quickRelevanceCheck(
  url: string
): Promise<{ relevant: boolean; reason: string }> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514", // Use Sonnet for quick checks
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `Is this URL relevant to Claude AI, Anthropic, MCP (Model Context Protocol), or AI development tools?
URL: ${url}

Respond with JSON only:
{"relevant": true/false, "reason": "brief explanation"}`,
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return { relevant: false, reason: "Failed to get AI response" };
    }

    try {
      const parsed = JSON.parse(textContent.text);
      return {
        relevant: parsed.relevant === true,
        reason: parsed.reason || "No reason provided",
      };
    } catch {
      // If JSON parsing fails, look for keywords
      const text = textContent.text.toLowerCase();
      return {
        relevant: text.includes("yes") || text.includes("relevant"),
        reason: textContent.text,
      };
    }
  } catch (error) {
    console.error("Quick relevance check failed:", error);
    return { relevant: false, reason: `Error: ${error}` };
  }
}
