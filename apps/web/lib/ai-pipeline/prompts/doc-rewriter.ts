/**
 * Documentation Rewriter Prompts
 *
 * Prompts for Claude Opus 4.5 to rewrite documentation based on scraped sources.
 */

import type { DocRewriteInput, DocRewriteOutput } from "../types";

export const DOC_REWRITER_SYSTEM_PROMPT = `You are an expert technical writer for Claude Insider, a documentation hub for Claude AI. Your task is to rewrite documentation pages to be accurate, comprehensive, and up-to-date based on the latest source material.

## Your Role
- You are updating existing MDX documentation with information from official sources
- Preserve the existing structure and style when possible
- Add new information discovered in the sources
- Remove outdated information that no longer applies
- Maintain a professional, educational tone

## Writing Guidelines
1. **Accuracy First**: Only include information you can verify from the sources
2. **MDX Format**: Use proper MDX syntax with React components where appropriate
3. **Code Examples**: Include practical code examples from the sources
4. **Headings**: Use proper heading hierarchy (##, ###, ####)
5. **Clarity**: Explain concepts clearly for developers of varying skill levels

## Available MDX Components
You can use these custom components:
- \`<ContentMeta sources={[{title, url}]} generatedDate="YYYY-MM-DD" model="Claude Opus 4.5" />\` - REQUIRED at the end
- \`<Callout type="info|warning|tip|note">content</Callout>\` - For important notes
- \`<CodeBlock language="typescript" filename="example.ts">code</CodeBlock>\` - For code examples
- \`<Tabs items={["Tab1", "Tab2"]}><Tab>content</Tab></Tabs>\` - For tabbed content

## Constraints
- Maximum content length: 15,000 characters
- Keep frontmatter format: just title and description
- Always end with ContentMeta component
- Do not invent features or capabilities not in the sources
- If sources conflict, prefer Anthropic's official documentation`;

export const DOC_REWRITER_USER_PROMPT = (input: DocRewriteInput): string => {
  const sourcesFormatted = input.scrapedSources
    .map(
      (s, i) => `
### Source ${i + 1}: ${s.metadata?.title || s.url}
URL: ${s.url}
${s.metadata?.lastModified ? `Last Modified: ${s.metadata.lastModified}` : ""}

${s.markdown.slice(0, 12000)}${s.markdown.length > 12000 ? "\n[...truncated]" : ""}`
    )
    .join("\n\n");

  return `## Current Documentation

**Slug**: ${input.currentDoc.slug}
**Title**: ${input.currentDoc.title}
**Description**: ${input.currentDoc.description || "(none)"}

### Current Content
\`\`\`mdx
${input.currentDoc.content}
\`\`\`

### Current Sources
${
  input.currentDoc.sources.length > 0
    ? input.currentDoc.sources.map((s) => `- [${s.title}](${s.url})`).join("\n")
    : "(none)"
}

---

## Scraped Source Content

${sourcesFormatted}

---

## Your Task

Rewrite the documentation above using the scraped source content. Create an improved, accurate, and comprehensive version.

Respond with a JSON object (and ONLY the JSON object, no markdown fences) in this exact format:

{
  "title": "string - the page title",
  "description": "string - a one-sentence description for SEO",
  "content": "string - the full MDX content including ContentMeta at the end",
  "sources": [{"title": "string", "url": "string"}],
  "summary": "string - 2-3 sentence summary of what changed",
  "keyChanges": ["string array of major changes made"],
  "confidence": 0.0-1.0,
  "warnings": ["string array of any concerns or limitations"]
}`;
};

export function parseDocRewriteResponse(response: string): DocRewriteOutput {
  // Try to parse directly first
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

export function validateDocRewriteOutput(output: DocRewriteOutput): string[] {
  const errors: string[] = [];

  if (!output.title || output.title.length < 5) {
    errors.push("Title is missing or too short");
  }

  if (!output.description || output.description.length < 20) {
    errors.push("Description is missing or too short");
  }

  if (!output.content || output.content.length < 100) {
    errors.push("Content is missing or too short");
  }

  if (!output.content.includes("<ContentMeta")) {
    errors.push("Content is missing ContentMeta component");
  }

  if (!Array.isArray(output.sources)) {
    errors.push("Sources must be an array");
  }

  if (typeof output.confidence !== "number" || output.confidence < 0 || output.confidence > 1) {
    errors.push("Confidence must be a number between 0 and 1");
  }

  if (!output.summary) {
    errors.push("Summary is required");
  }

  if (!Array.isArray(output.keyChanges) || output.keyChanges.length === 0) {
    errors.push("At least one key change must be specified");
  }

  return errors;
}

/**
 * Generate a unified diff between old and new content
 */
export function generateContentDiff(oldContent: string, newContent: string): string {
  const oldLines = oldContent.split("\n");
  const newLines = newContent.split("\n");

  const diff: string[] = [];
  diff.push("--- original");
  diff.push("+++ proposed");

  // Simple line-by-line diff (not a full diff algorithm, but useful for review)
  let i = 0,
    j = 0;
  let contextLines = 0;
  const contextBuffer: string[] = [];

  while (i < oldLines.length || j < newLines.length) {
    if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
      // Lines match - store as context
      if (contextBuffer.length > 0) {
        // Flush previous changes
        diff.push(...contextBuffer);
        contextBuffer.length = 0;
      }
      contextLines++;
      if (contextLines <= 3) {
        diff.push(` ${oldLines[i]}`);
      }
      i++;
      j++;
    } else {
      contextLines = 0;

      // Find next matching point
      let foundMatch = false;
      for (let look = 1; look < 5 && !foundMatch; look++) {
        if (i + look < oldLines.length && oldLines[i + look] === newLines[j]) {
          // Removed lines
          for (let k = 0; k < look; k++) {
            diff.push(`-${oldLines[i + k]}`);
          }
          i += look;
          foundMatch = true;
        } else if (j + look < newLines.length && oldLines[i] === newLines[j + look]) {
          // Added lines
          for (let k = 0; k < look; k++) {
            diff.push(`+${newLines[j + k]}`);
          }
          j += look;
          foundMatch = true;
        }
      }

      if (!foundMatch) {
        // Can't find match - treat as change
        if (i < oldLines.length) {
          diff.push(`-${oldLines[i]}`);
          i++;
        }
        if (j < newLines.length) {
          diff.push(`+${newLines[j]}`);
          j++;
        }
      }
    }
  }

  return diff.join("\n");
}
