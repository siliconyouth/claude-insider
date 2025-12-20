/**
 * Relationship Analyzer Prompts
 *
 * Prompts for Claude Opus 4.5 to discover relationships between
 * documentation pages and resources.
 */

import type {
  RelationshipAnalysisInput,
  RelationshipAnalysisOutput,
  DocResourceRelationType,
  ResourceRelationType,
} from "../types";

export const RELATIONSHIP_ANALYZER_SYSTEM_PROMPT = `You are an expert at analyzing relationships between technical documentation and software resources for Claude Insider, a documentation hub for Claude AI.

## Your Role
Analyze the source item and candidate items to identify meaningful relationships. You should identify:
1. Which candidates are genuinely related to the source
2. What type of relationship exists
3. How confident you are in each relationship (0.0 to 1.0)
4. A brief explanation of why the relationship exists

## Relationship Types

### Documentation to Resource Relationships
- \`related\`: General relevance between doc and resource
- \`mentioned\`: Resource is explicitly mentioned in documentation
- \`example\`: Resource demonstrates concepts from the documentation
- \`required\`: Resource is required to follow the documentation
- \`recommended\`: Resource is recommended but not required
- \`alternative\`: Resource provides an alternative approach
- \`extends\`: Resource extends concepts covered in documentation
- \`implements\`: Resource implements what the documentation describes

### Resource to Resource Relationships
- \`similar\`: Resources have similar purpose or functionality
- \`alternative\`: Resource can replace another (drop-in replacement)
- \`complement\`: Resources work well together
- \`prerequisite\`: One resource should be used before another
- \`successor\`: One resource is a newer version or evolution
- \`uses\`: One resource uses another internally
- \`integrates\`: Resources have official integration
- \`fork\`: One is a fork of the other
- \`inspired_by\`: One was inspired by another

## Confidence Guidelines
- 0.9-1.0: Explicitly stated relationship (mentioned by name, official integration)
- 0.7-0.89: Strong implicit relationship (same category, shared concepts)
- 0.5-0.69: Moderate relationship (related topics, similar audience)
- 0.3-0.49: Weak relationship (tangential connection)
- Below 0.3: Too weak to report

## Rules
1. Only report relationships with confidence >= 0.5
2. Prefer fewer high-confidence relationships over many low-confidence ones
3. Consider the target audience when determining relevance
4. Don't create relationships based solely on shared general tags like "ai" or "tool"
5. For resources, consider category, functionality, and technical stack`;

export const RELATIONSHIP_ANALYZER_USER_PROMPT = (
  input: RelationshipAnalysisInput
): string => {
  const sourceDesc = `
## Source ${input.source.type === "doc" ? "Documentation" : "Resource"}

**ID**: ${input.source.id}
**Title**: ${input.source.title}
**Description**: ${input.source.description}
${input.source.category ? `**Category**: ${input.source.category}` : ""}
${input.source.tags?.length ? `**Tags**: ${input.source.tags.join(", ")}` : ""}
${input.source.content ? `\n**Content Preview**:\n${input.source.content.slice(0, 2000)}...` : ""}
`;

  const candidatesDesc = input.candidates
    .map(
      (c, i) => `
### Candidate ${i + 1}: ${c.title}
- **Type**: ${c.type}
- **ID**: ${c.id}
- **Description**: ${c.description}
${c.category ? `- **Category**: ${c.category}` : ""}
${c.tags?.length ? `- **Tags**: ${c.tags.join(", ")}` : ""}`
    )
    .join("\n");

  return `${sourceDesc}

---

## Candidate Items to Analyze

${candidatesDesc}

---

## Your Task

Analyze the source and each candidate to identify meaningful relationships. For each relationship you find (confidence >= 0.5), include it in the output.

Respond with a JSON object (and ONLY the JSON object, no markdown fences):

{
  "relationships": [
    {
      "targetId": "string - the candidate's ID",
      "relationshipType": "string - one of the valid relationship types",
      "confidence": 0.0-1.0,
      "reasoning": "string - brief explanation (1-2 sentences)",
      "sharedTags": ["array of tags both items share"] // optional
    }
  ],
  "tokensUsed": 0
}

If no relationships meet the confidence threshold, return an empty relationships array.`;
};

export function parseRelationshipResponse(
  response: string
): RelationshipAnalysisOutput {
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

export function validateRelationshipOutput(
  output: RelationshipAnalysisOutput,
  sourceType: "doc" | "resource",
  targetType: "doc" | "resource"
): string[] {
  const errors: string[] = [];

  if (!Array.isArray(output.relationships)) {
    errors.push("Relationships must be an array");
    return errors;
  }

  const validDocResourceTypes: DocResourceRelationType[] = [
    "related",
    "mentioned",
    "example",
    "required",
    "recommended",
    "alternative",
    "extends",
    "implements",
  ];

  const validResourceTypes: ResourceRelationType[] = [
    "similar",
    "alternative",
    "complement",
    "prerequisite",
    "successor",
    "uses",
    "integrates",
    "fork",
    "inspired_by",
  ];

  const validTypes =
    sourceType === "doc" || targetType === "doc"
      ? validDocResourceTypes
      : validResourceTypes;

  for (const rel of output.relationships) {
    if (!rel.targetId) {
      errors.push("Relationship missing targetId");
    }

    if (!rel.relationshipType) {
      errors.push(`Relationship to ${rel.targetId} missing type`);
    } else if (!validTypes.includes(rel.relationshipType as never)) {
      errors.push(
        `Invalid relationship type "${rel.relationshipType}" for ${rel.targetId}`
      );
    }

    if (
      typeof rel.confidence !== "number" ||
      rel.confidence < 0 ||
      rel.confidence > 1
    ) {
      errors.push(`Invalid confidence score for ${rel.targetId}`);
    }

    if (!rel.reasoning) {
      errors.push(`Relationship to ${rel.targetId} missing reasoning`);
    }
  }

  return errors;
}

/**
 * Batch candidates into groups for efficient API calls
 * Each batch aims for roughly 4000 tokens of candidate descriptions
 */
export function batchCandidates<T extends { id: string; title: string; description: string }>(
  candidates: T[],
  maxPerBatch = 20
): T[][] {
  const batches: T[][] = [];
  let currentBatch: T[] = [];
  let currentTokenEstimate = 0;

  for (const candidate of candidates) {
    // Rough token estimate: ~4 chars per token
    const candidateTokens = Math.ceil(
      (candidate.title.length + candidate.description.length + 100) / 4
    );

    if (
      currentBatch.length >= maxPerBatch ||
      (currentTokenEstimate + candidateTokens > 4000 && currentBatch.length > 0)
    ) {
      batches.push(currentBatch);
      currentBatch = [];
      currentTokenEstimate = 0;
    }

    currentBatch.push(candidate);
    currentTokenEstimate += candidateTokens;
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}

/**
 * Filter relationships by minimum confidence
 */
export function filterByConfidence<T extends { confidence: number }>(
  relationships: T[],
  minConfidence: number
): T[] {
  return relationships.filter((r) => r.confidence >= minConfidence);
}

/**
 * Sort relationships by confidence descending
 */
export function sortByConfidence<T extends { confidence: number }>(
  relationships: T[]
): T[] {
  return [...relationships].sort((a, b) => b.confidence - a.confidence);
}
