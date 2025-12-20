/**
 * AI Resource Updater
 *
 * Uses Claude Opus 4.5 to analyze scraped content and compare it with
 * existing resource data to generate proposed updates.
 *
 * Features:
 * - Field-by-field comparison with confidence scores
 * - AI-generated change summaries
 * - Breaking change detection
 * - Smart diffing for complex fields (arrays, objects)
 */

import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// Initialize Claude client
const anthropic = new Anthropic();

/**
 * A single proposed change to a resource field
 */
export interface ProposedChange {
  field: string;
  fieldLabel: string; // Human-readable field name
  oldValue: unknown;
  newValue: unknown;
  confidence: number; // 0.0 to 1.0
  reason: string;
  isBreaking: boolean; // True if this is a breaking change (e.g., deprecation)
}

/**
 * Result of analyzing a resource for updates
 */
export interface UpdateAnalysis {
  proposedChanges: ProposedChange[];
  summary: string;
  overallConfidence: number;
  suggestedTags: string[];
  detectedBreakingChanges: boolean;
  analysisNotes: string;
}

/**
 * Scraped content from a URL
 */
export interface ScrapedContent {
  url: string;
  markdown: string;
  metadata?: {
    title?: string;
    description?: string;
    ogImage?: string;
    [key: string]: unknown;
  };
  scrapedAt: Date;
}

/**
 * Current resource data for comparison
 */
export interface CurrentResource {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  short_description?: string | null;
  official_url?: string | null;
  repo_url?: string | null;
  documentation_url?: string | null;
  pricing_type?: string | null;
  pricing_details?: string | null;
  platforms?: string[] | null;
  languages?: string[] | null;
  features?: string[] | null;
  installation_command?: string | null;
  latest_version?: string | null;
  version_date?: string | null;
  is_deprecated?: boolean | null;
  deprecation_notice?: string | null;
  license?: string | null;
  // Stats (informational, not for updating)
  github_stars?: number | null;
  npm_weekly_downloads?: number | null;
}

/**
 * Fields that can be updated by the AI
 */
const UPDATABLE_FIELDS = [
  { key: "description", label: "Description", priority: 1 },
  { key: "short_description", label: "Short Description", priority: 2 },
  { key: "pricing_type", label: "Pricing Type", priority: 3 },
  { key: "pricing_details", label: "Pricing Details", priority: 4 },
  { key: "platforms", label: "Platforms", priority: 5 },
  { key: "languages", label: "Programming Languages", priority: 6 },
  { key: "features", label: "Features", priority: 7 },
  { key: "installation_command", label: "Installation Command", priority: 8 },
  { key: "latest_version", label: "Latest Version", priority: 9 },
  { key: "version_date", label: "Version Date", priority: 10 },
  { key: "is_deprecated", label: "Deprecated", priority: 11 },
  { key: "deprecation_notice", label: "Deprecation Notice", priority: 12 },
  { key: "license", label: "License", priority: 13 },
];

/**
 * Build the analysis prompt for Claude
 */
function buildUpdatePrompt(
  resource: CurrentResource,
  scrapedContent: ScrapedContent[]
): string {
  // Prepare current resource data (only updatable fields)
  const currentData: Record<string, unknown> = {};
  for (const field of UPDATABLE_FIELDS) {
    const value = resource[field.key as keyof CurrentResource];
    if (value !== undefined) {
      currentData[field.key] = value;
    }
  }

  // Prepare scraped content summary
  const contentSummary = scrapedContent
    .map(
      (c, i) => `
### Source ${i + 1}: ${c.url}
${c.metadata?.title ? `Title: ${c.metadata.title}` : ""}
${c.metadata?.description ? `Meta Description: ${c.metadata.description}` : ""}

Content:
${c.markdown.slice(0, 8000)}
${c.markdown.length > 8000 ? "\n[... content truncated ...]" : ""}
`
    )
    .join("\n---\n");

  return `You are an expert resource curator for Claude Insider, a comprehensive directory of Claude AI and Anthropic ecosystem tools.

## Task
Analyze the scraped content from a resource's official sources and compare it with our current database record. Identify any fields that need to be updated based on the new information.

## Current Resource Data (in our database)
Resource Name: ${resource.name}
Slug: ${resource.slug}

Current Field Values:
\`\`\`json
${JSON.stringify(currentData, null, 2)}
\`\`\`

## Scraped Content from Official Sources
${contentSummary}

## Updatable Fields
The following fields can be updated:
${UPDATABLE_FIELDS.map((f) => `- ${f.key}: ${f.label}`).join("\n")}

## Instructions

1. Compare the scraped content with current field values
2. For each field where you detect a meaningful difference:
   - Propose the new value based on scraped content
   - Provide a confidence score (0.0-1.0) based on how certain you are
   - Explain why this change is needed
   - Flag if this is a "breaking change" (deprecation, major version, removed features)

3. DO NOT propose changes for:
   - Minor wording differences that don't affect meaning
   - Fields where current value is accurate and complete
   - Stats like stars/downloads (these are updated separately via APIs)

4. For array fields (platforms, languages, features):
   - Only propose changes if items are added, removed, or significantly different
   - Maintain existing order where possible

5. Provide an overall summary of what changed and why

## Response Format
Respond with ONLY valid JSON:
\`\`\`json
{
  "proposedChanges": [
    {
      "field": "field_key",
      "fieldLabel": "Human Readable Name",
      "oldValue": <current value or null>,
      "newValue": <proposed new value>,
      "confidence": 0.0-1.0,
      "reason": "Why this change is needed",
      "isBreaking": true/false
    }
  ],
  "summary": "A 2-3 sentence summary of all changes",
  "overallConfidence": 0.0-1.0,
  "suggestedTags": ["any", "new", "tags", "detected"],
  "detectedBreakingChanges": true/false,
  "analysisNotes": "Any caveats or notes about the analysis"
}
\`\`\`

If no changes are needed, return an empty proposedChanges array with a summary explaining that the resource is up to date.`;
}

/**
 * Parse Claude's JSON response
 */
function parseUpdateResponse(response: string): UpdateAnalysis {
  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr =
    jsonMatch && jsonMatch[1] ? jsonMatch[1].trim() : response.trim();

  try {
    const parsed = JSON.parse(jsonStr);

    // Validate and return with defaults
    return {
      proposedChanges: Array.isArray(parsed.proposedChanges)
        ? parsed.proposedChanges.map((change: Partial<ProposedChange>) => ({
            field: change.field || "unknown",
            fieldLabel: change.fieldLabel || change.field || "Unknown Field",
            oldValue: change.oldValue ?? null,
            newValue: change.newValue ?? null,
            confidence: typeof change.confidence === "number" ? change.confidence : 0.5,
            reason: change.reason || "No reason provided",
            isBreaking: change.isBreaking === true,
          }))
        : [],
      summary: parsed.summary || "No summary provided",
      overallConfidence:
        typeof parsed.overallConfidence === "number"
          ? parsed.overallConfidence
          : 0.5,
      suggestedTags: Array.isArray(parsed.suggestedTags)
        ? parsed.suggestedTags
        : [],
      detectedBreakingChanges: parsed.detectedBreakingChanges === true,
      analysisNotes: parsed.analysisNotes || "",
    };
  } catch (error) {
    console.error("Failed to parse AI update response:", error);
    throw new Error(`Failed to parse AI analysis response: ${error}`);
  }
}

/**
 * Analyze a resource for updates using Claude Opus 4.5
 */
export async function analyzeResourceUpdate(
  resource: CurrentResource,
  scrapedContent: ScrapedContent[]
): Promise<UpdateAnalysis> {
  if (scrapedContent.length === 0) {
    return {
      proposedChanges: [],
      summary: "No content to analyze",
      overallConfidence: 0,
      suggestedTags: [],
      detectedBreakingChanges: false,
      analysisNotes: "No scraped content provided",
    };
  }

  const prompt = buildUpdatePrompt(resource, scrapedContent);

  try {
    const response = await anthropic.messages.create({
      model: "claude-opus-4-5-20251101", // Claude Opus 4.5
      max_tokens: 4000,
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

    return parseUpdateResponse(textContent.text);
  } catch (error) {
    console.error("AI update analysis failed:", error);
    throw error;
  }
}

/**
 * Generate a human-readable changelog entry from proposed changes
 */
export function generateChangelogSummary(
  changes: ProposedChange[],
  aiSummary: string
): string {
  if (changes.length === 0) {
    return "No changes applied.";
  }

  const changeList = changes
    .map((c) => {
      const oldStr = formatValue(c.oldValue);
      const newStr = formatValue(c.newValue);
      return `• ${c.fieldLabel}: ${oldStr} → ${newStr}`;
    })
    .join("\n");

  return `${aiSummary}\n\nField changes:\n${changeList}`;
}

/**
 * Format a value for display in changelog
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "(empty)";
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "(none)";
    if (value.length <= 3) return value.join(", ");
    return `${value.slice(0, 3).join(", ")}... (+${value.length - 3} more)`;
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (typeof value === "string") {
    if (value.length > 50) {
      return value.slice(0, 50) + "...";
    }
    return value;
  }
  return String(value);
}

/**
 * Filter proposed changes by minimum confidence threshold
 */
export function filterChangesByConfidence(
  changes: ProposedChange[],
  minConfidence: number = 0.7
): ProposedChange[] {
  return changes.filter((c) => c.confidence >= minConfidence);
}

/**
 * Get high-priority changes (breaking changes or high confidence)
 */
export function getHighPriorityChanges(
  changes: ProposedChange[]
): ProposedChange[] {
  return changes.filter((c) => c.isBreaking || c.confidence >= 0.9);
}
