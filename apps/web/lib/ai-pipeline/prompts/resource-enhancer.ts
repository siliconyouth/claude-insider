/**
 * Resource Enhancer Prompts
 *
 * Prompts for Claude Opus 4.5 to generate enhanced content for resources
 * including summaries, features, pros/cons, and use cases.
 */

import type { ResourceEnhancementInput, ResourceEnhancementOutput } from "../types";

export const RESOURCE_ENHANCER_SYSTEM_PROMPT = `You are an expert at analyzing software tools and resources for Claude Insider, a documentation hub for Claude AI. Your task is to generate helpful, accurate, and insightful content about developer tools and resources.

## Your Role
Analyze the provided resource information and generate:
1. A concise summary for card displays (max 150 chars)
2. A longer MDX-formatted overview (2-4 paragraphs)
3. Key features list (3-7 items)
4. Use cases (2-5 specific scenarios)
5. Pros and cons (2-4 each)
6. Target audience (2-4 segments)
7. Prerequisites (if any)
8. Suggested additional tags

## Writing Guidelines
1. **Be Specific**: Avoid generic descriptions like "a useful tool"
2. **Be Accurate**: Only state facts you can verify from the provided info
3. **Be Helpful**: Focus on what developers need to know
4. **Be Balanced**: Include both pros and cons fairly
5. **Be Concise**: Every word should add value

## Format Requirements
- Summary: One sentence, max 150 characters, no period at end
- Overview: MDX format, 2-4 paragraphs, can include callouts
- Features: Array of strings, each 10-60 characters
- Use cases: Array of strings, each describes a specific scenario
- Pros/Cons: Arrays of strings, each a brief point (not full sentences)
- Target audience: Array of strings like "Python developers", "AI researchers"
- Prerequisites: Array of required skills/tools, or empty if none
- Suggested tags: Additional relevant tags not already present

## Category Context
Consider the resource's category when generating content:
- \`tools\`: Focus on functionality, workflow integration
- \`mcp-servers\`: Focus on capabilities, Claude integration
- \`sdks\`: Focus on language support, API coverage
- \`tutorials\`: Focus on learning outcomes, difficulty
- \`agents\`: Focus on automation, autonomy features`;

export const RESOURCE_ENHANCER_USER_PROMPT = (
  input: ResourceEnhancementInput
): string => {
  const githubInfo = input.resource.githubInfo
    ? `
**GitHub Info**:
- Repository: ${input.resource.githubInfo.owner}/${input.resource.githubInfo.repo}
- Stars: ${input.resource.githubInfo.stars.toLocaleString()}
- Language: ${input.resource.githubInfo.language || "Not specified"}`
    : "";

  const scrapedInfo = input.scrapedContent
    ? `
## Scraped Content from URL

${input.scrapedContent.slice(0, 8000)}${input.scrapedContent.length > 8000 ? "\n[...truncated]" : ""}`
    : "";

  return `## Resource to Analyze

**ID**: ${input.resource.id}
**Slug**: ${input.resource.slug}
**Title**: ${input.resource.title}
**URL**: ${input.resource.url}
**Category**: ${input.resource.category}
**Current Description**: ${input.resource.description}
**Current Tags**: ${input.resource.tags.join(", ")}
${githubInfo}
${scrapedInfo}

---

## Your Task

Generate enhanced content for this resource. Be specific and insightful based on the information provided.

Respond with a JSON object (and ONLY the JSON object, no markdown fences):

{
  "aiSummary": "string - one sentence, max 150 chars, no period at end",
  "aiOverview": "string - 2-4 paragraphs in MDX format",
  "keyFeatures": ["string array - 3-7 features, each 10-60 chars"],
  "useCases": ["string array - 2-5 specific use case scenarios"],
  "pros": ["string array - 2-4 advantages"],
  "cons": ["string array - 2-4 disadvantages or limitations"],
  "targetAudience": ["string array - 2-4 audience segments"],
  "prerequisites": ["string array - required skills/tools, or empty"],
  "suggestedTags": ["string array - additional relevant tags"],
  "confidence": 0.0-1.0
}`;
};

export function parseResourceEnhancementResponse(
  response: string
): ResourceEnhancementOutput {
  try {
    return JSON.parse(response);
  } catch {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch?.[1]) {
      return JSON.parse(jsonMatch[1].trim());
    }

    // Try to find JSON object pattern
    const objectMatch = response.match(/\{[\s\S]*\}/);
    if (objectMatch?.[0]) {
      return JSON.parse(objectMatch[0]);
    }

    throw new Error("Could not parse AI response as JSON");
  }
}

export function validateResourceEnhancementOutput(
  output: ResourceEnhancementOutput
): string[] {
  const errors: string[] = [];

  // Summary validation
  if (!output.aiSummary) {
    errors.push("AI summary is required");
  } else if (output.aiSummary.length > 150) {
    errors.push(`AI summary too long (${output.aiSummary.length}/150 chars)`);
  }

  // Overview validation
  if (!output.aiOverview || output.aiOverview.length < 100) {
    errors.push("AI overview is required and should be at least 100 characters");
  }

  // Features validation
  if (!Array.isArray(output.keyFeatures)) {
    errors.push("Key features must be an array");
  } else if (output.keyFeatures.length < 3) {
    errors.push("At least 3 key features are required");
  } else if (output.keyFeatures.length > 7) {
    errors.push("Maximum 7 key features allowed");
  }

  // Use cases validation
  if (!Array.isArray(output.useCases)) {
    errors.push("Use cases must be an array");
  } else if (output.useCases.length < 2) {
    errors.push("At least 2 use cases are required");
  }

  // Pros/cons validation
  if (!Array.isArray(output.pros) || output.pros.length < 2) {
    errors.push("At least 2 pros are required");
  }
  if (!Array.isArray(output.cons) || output.cons.length < 2) {
    errors.push("At least 2 cons are required");
  }

  // Target audience validation
  if (!Array.isArray(output.targetAudience) || output.targetAudience.length < 2) {
    errors.push("At least 2 target audience segments are required");
  }

  // Confidence validation
  if (
    typeof output.confidence !== "number" ||
    output.confidence < 0 ||
    output.confidence > 1
  ) {
    errors.push("Confidence must be a number between 0 and 1");
  }

  return errors;
}

/**
 * Clean up AI-generated tags (lowercase, remove duplicates, limit length)
 */
export function cleanTags(
  suggestedTags: string[],
  existingTags: string[]
): string[] {
  const normalized = suggestedTags
    .map((tag) =>
      tag
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]/g, "")
    )
    .filter((tag) => tag.length >= 2 && tag.length <= 30);

  const existingSet = new Set(existingTags.map((t) => t.toLowerCase()));
  const unique = [...new Set(normalized)].filter((tag) => !existingSet.has(tag));

  return unique.slice(0, 10); // Max 10 new tags
}

/**
 * Truncate summary if needed, adding ellipsis
 */
export function truncateSummary(summary: string, maxLength = 150): string {
  if (summary.length <= maxLength) {
    return summary.replace(/\.+$/, ""); // Remove trailing periods
  }

  // Find last complete word before limit
  const truncated = summary.slice(0, maxLength - 3);
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > maxLength * 0.7) {
    return truncated.slice(0, lastSpace) + "...";
  }

  return truncated + "...";
}
