/**
 * Prompt Adaptation Library
 *
 * Reusable logic for adapting prompts to Claude best practices.
 * Can be used by:
 * - Import scripts (batch adaptation)
 * - API endpoints (on-demand adaptation)
 * - UI components (real-time suggestions)
 *
 * Claude Best Practices:
 * 1. XML tags for structure (<context>, <task>, <output_format>)
 * 2. Thinking sections for complex reasoning
 * 3. Chain-of-thought prompting
 * 4. Clear examples when helpful
 * 5. Explicit output format specifications
 * 6. Variable extraction ({{variable_name}})
 */

import Anthropic from "@anthropic-ai/sdk";

// Types
export interface PromptToAdapt {
  id?: string;
  title: string;
  content: string;
  category?: string;
  description?: string;
  sourceUrl?: string;
}

export interface AdaptedPrompt {
  originalTitle: string;
  originalContent: string;
  adaptedTitle: string;
  adaptedContent: string;
  description: string;
  variables: PromptVariable[];
  claudeHints: ClaudeHints;
  suggestedCategory: string;
  tags: string[];
}

export interface PromptVariable {
  name: string;
  description: string;
  default_value?: string;
  required: boolean;
  input_type?: "text" | "textarea" | "select" | "number";
  options?: string[];
}

export interface ClaudeHints {
  uses_xml_tags: boolean;
  uses_thinking_section: boolean;
  uses_examples: boolean;
  uses_chain_of_thought: boolean;
  uses_system_context: boolean;
  uses_output_format: boolean;
  structure_score: number;
  clarity_score: number;
  specificity_score: number;
  overall_optimization_score: number;
  recommended_model: "opus" | "sonnet" | "haiku";
  estimated_tokens: number;
  complexity_level: "simple" | "moderate" | "complex";
  improvement_suggestions: ImprovementSuggestion[];
}

export interface ImprovementSuggestion {
  type: "structure" | "clarity" | "examples" | "format" | "variables";
  description: string;
  priority: "high" | "medium" | "low";
  suggestion?: string;
}

// Category keywords for auto-classification
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  coding: [
    "code", "programming", "developer", "javascript", "python", "api",
    "software", "debug", "algorithm", "terminal", "sql", "database",
    "git", "regex", "compiler", "function", "class", "ethereum", "solidity"
  ],
  devops: [
    "linux", "docker", "kubernetes", "ci/cd", "deployment", "server",
    "infrastructure", "aws", "cloud", "bash", "shell", "nginx", "devops"
  ],
  writing: [
    "writer", "essay", "article", "blog", "content", "copywriting",
    "storyteller", "novelist", "poet", "screenwriter", "journalist", "editor"
  ],
  creative: [
    "creative", "art", "music", "song", "compose", "design", "imaginative",
    "fantasy", "story", "character", "world-building"
  ],
  business: [
    "business", "startup", "entrepreneur", "sales", "ceo",
    "manager", "consultant", "strategy", "product", "customer", "career"
  ],
  marketing: [
    "advertiser", "seo", "social media", "campaign", "branding",
    "influencer", "content strategy", "promotion", "marketing"
  ],
  education: [
    "teacher", "tutor", "instructor", "lesson", "curriculum", "student",
    "learning", "educational", "academy", "course", "training"
  ],
  translation: [
    "translator", "language", "translate", "multilingual", "localization",
    "interpreter", "pronunciation", "vocabulary", "grammar"
  ],
  analysis: [
    "analyst", "data", "statistics", "research", "evaluate", "assess",
    "review", "critique", "examine", "investigate"
  ],
  legal: [
    "legal", "lawyer", "attorney", "contract", "law", "compliance",
    "regulatory", "court", "litigation"
  ],
  healthcare: [
    "doctor", "medical", "health", "patient", "diagnosis", "treatment",
    "nutrition", "fitness", "wellness", "therapy", "mental health"
  ],
  security: [
    "security", "cybersecurity", "hacker", "vulnerability", "penetration",
    "encryption", "firewall", "authentication"
  ],
  research: [
    "academic", "journal", "paper", "citation", "thesis", "dissertation",
    "scholar", "bibliography", "literature review"
  ],
  productivity: [
    "productivity", "time management", "organize", "schedule", "efficiency",
    "workflow", "task", "todo", "planner"
  ],
  conversation: [
    "chat", "conversation", "dialogue", "interview", "communication",
    "debate", "discussion", "assistant"
  ],
  roleplay: [
    "roleplay", "character", "persona", "act as", "pretend", "simulation",
    "scenario", "interactive fiction", "impersonate"
  ],
  learning: [
    "learn", "study", "explain", "teach", "understand", "concept",
    "knowledge", "skill", "practice"
  ],
  design: [
    "ui", "ux", "interface", "visual", "layout", "wireframe",
    "prototype", "figma", "sketch", "design system"
  ],
};

/**
 * Classify a prompt into a category based on content
 */
export function classifyPrompt(title: string, content: string): string {
  const text = `${title} ${content}`.toLowerCase();
  const scores: Record<string, number> = {};

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    scores[category] = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        scores[category]++;
      }
    }
  }

  // Find category with highest score
  let maxScore = 0;
  let bestCategory = "conversation"; // Default

  for (const [category, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestCategory = category;
    }
  }

  return bestCategory;
}

/**
 * Extract variables from prompt content
 */
export function extractVariables(content: string): PromptVariable[] {
  const variablePattern = /\{\{(\w+)\}\}/g;
  const matches = content.matchAll(variablePattern);
  const seen = new Set<string>();
  const variables: PromptVariable[] = [];

  for (const match of matches) {
    const name = match[1];
    if (name && !seen.has(name)) {
      seen.add(name);
      variables.push({
        name,
        description: inferVariableDescription(name),
        required: true,
        input_type: inferInputType(name),
      });
    }
  }

  return variables;
}

/**
 * Infer variable description from name
 */
function inferVariableDescription(name: string): string {
  const nameMap: Record<string, string> = {
    topic: "The main topic or subject",
    language: "Programming language or natural language",
    code: "Code snippet to analyze or modify",
    text: "Text content to process",
    url: "URL or web address",
    name: "Name of the person, project, or entity",
    description: "Description or summary",
    context: "Additional context or background",
    format: "Output format preference",
    style: "Writing or coding style",
    audience: "Target audience",
    goal: "Goal or objective",
    input: "Input data or content",
    output: "Expected output type",
    example: "Example to follow",
    constraints: "Constraints or limitations",
    requirements: "Requirements or specifications",
  };

  const lowerName = name.toLowerCase();
  for (const [key, desc] of Object.entries(nameMap)) {
    if (lowerName.includes(key)) {
      return desc;
    }
  }

  // Convert snake_case or camelCase to sentence
  return name
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .toLowerCase()
    .trim();
}

/**
 * Infer input type from variable name
 */
function inferInputType(name: string): "text" | "textarea" | "select" | "number" {
  const lowerName = name.toLowerCase();

  if (
    lowerName.includes("code") ||
    lowerName.includes("text") ||
    lowerName.includes("content") ||
    lowerName.includes("description") ||
    lowerName.includes("context")
  ) {
    return "textarea";
  }

  if (
    lowerName.includes("count") ||
    lowerName.includes("number") ||
    lowerName.includes("amount") ||
    lowerName.includes("limit")
  ) {
    return "number";
  }

  return "text";
}

/**
 * Analyze prompt and generate Claude hints
 */
export function analyzePrompt(content: string): ClaudeHints {
  const usesXmlTags = /<\w+>[\s\S]*?<\/\w+>/.test(content);
  const usesThinkingSection = /think|reason|consider|analyze/i.test(content);
  const usesExamples = /example|e\.g\.|for instance|such as/i.test(content);
  const usesChainOfThought = /step by step|first.*then|1\.|2\./i.test(content);
  const usesSystemContext = /you are|act as|your role|as a/i.test(content);
  const usesOutputFormat = /format|output|response should|return/i.test(content);

  // Calculate scores
  let structureScore = 40;
  if (usesXmlTags) structureScore += 30;
  if (content.includes("\n\n")) structureScore += 15;
  if (/^\d+\.|^-|^\*/m.test(content)) structureScore += 15;

  let clarityScore = 50;
  if (usesSystemContext) clarityScore += 20;
  if (usesOutputFormat) clarityScore += 20;
  if (content.length > 200) clarityScore += 10;

  let specificityScore = 40;
  if (usesExamples) specificityScore += 25;
  if (usesChainOfThought) specificityScore += 20;
  if (/\{\{\w+\}\}/.test(content)) specificityScore += 15;

  const overallScore = Math.round(
    (structureScore + clarityScore + specificityScore) / 3
  );

  // Determine recommended model
  let recommendedModel: "opus" | "sonnet" | "haiku" = "sonnet";
  const tokenEstimate = Math.ceil(content.length / 4);

  if (tokenEstimate < 500 && overallScore > 70) {
    recommendedModel = "haiku";
  } else if (tokenEstimate > 2000 || usesChainOfThought) {
    recommendedModel = "opus";
  }

  // Determine complexity
  let complexityLevel: "simple" | "moderate" | "complex" = "moderate";
  if (content.length < 300 && !usesXmlTags) {
    complexityLevel = "simple";
  } else if (usesXmlTags && usesChainOfThought && usesExamples) {
    complexityLevel = "complex";
  }

  // Generate improvement suggestions
  const suggestions: ImprovementSuggestion[] = [];

  if (!usesXmlTags) {
    suggestions.push({
      type: "structure",
      description: "Add XML tags to structure the prompt",
      priority: "high",
      suggestion: "Wrap sections in <context>, <task>, <output_format> tags",
    });
  }

  if (!usesOutputFormat) {
    suggestions.push({
      type: "format",
      description: "Specify the expected output format",
      priority: "high",
      suggestion: "Add a section describing how the response should be formatted",
    });
  }

  if (!usesExamples && content.length > 500) {
    suggestions.push({
      type: "examples",
      description: "Include examples for clarity",
      priority: "medium",
      suggestion: "Add 1-2 examples showing expected input/output pairs",
    });
  }

  if (!usesSystemContext) {
    suggestions.push({
      type: "clarity",
      description: "Define Claude's role clearly",
      priority: "medium",
      suggestion: "Start with 'You are a...' to establish context",
    });
  }

  if (!/\{\{\w+\}\}/.test(content) && content.length > 200) {
    suggestions.push({
      type: "variables",
      description: "Consider adding variables for customization",
      priority: "low",
      suggestion: "Replace specific values with {{variable_name}} placeholders",
    });
  }

  return {
    uses_xml_tags: usesXmlTags,
    uses_thinking_section: usesThinkingSection,
    uses_examples: usesExamples,
    uses_chain_of_thought: usesChainOfThought,
    uses_system_context: usesSystemContext,
    uses_output_format: usesOutputFormat,
    structure_score: Math.min(100, structureScore),
    clarity_score: Math.min(100, clarityScore),
    specificity_score: Math.min(100, specificityScore),
    overall_optimization_score: Math.min(100, overallScore),
    recommended_model: recommendedModel,
    estimated_tokens: tokenEstimate,
    complexity_level: complexityLevel,
    improvement_suggestions: suggestions,
  };
}

/**
 * Generate tags from prompt content
 */
export function generateTags(title: string, content: string, category: string): string[] {
  const tags = new Set<string>();
  const text = `${title} ${content}`.toLowerCase();

  // Add category as tag
  tags.add(category);

  // Check for common tag keywords
  const tagKeywords = [
    "ai", "claude", "gpt", "chatgpt", "prompt", "assistant",
    "code", "python", "javascript", "typescript", "react", "node",
    "writing", "creative", "business", "marketing", "seo",
    "data", "analysis", "research", "education", "learning",
    "productivity", "automation", "workflow", "template",
  ];

  for (const keyword of tagKeywords) {
    if (text.includes(keyword) && keyword !== category) {
      tags.add(keyword);
    }
  }

  // Limit to 10 tags
  return Array.from(tags).slice(0, 10);
}

/**
 * Build the system prompt for Claude adaptation
 */
export function buildAdaptationSystemPrompt(): string {
  return `You are an expert prompt engineer specializing in Claude AI optimization.

Your task is to adapt prompts to follow Claude best practices while preserving the original intent.

<best_practices>
1. **XML Tags**: Use tags like <context>, <task>, <instructions>, <output_format>, <examples> to structure prompts
2. **Role Definition**: Start with a clear "You are..." statement when defining Claude's persona
3. **Chain of Thought**: For complex tasks, include "Think step by step" or numbered steps
4. **Output Format**: Always specify the expected response format
5. **Examples**: Include 1-2 examples for ambiguous tasks
6. **Variables**: Use {{variable_name}} syntax for customizable parts
7. **Constraints**: Be explicit about limitations and requirements
</best_practices>

<output_format>
Return a JSON object with:
{
  "adaptedTitle": "Clear, descriptive title (max 80 chars)",
  "adaptedContent": "The optimized prompt with XML tags and variables",
  "description": "1-2 sentence description of what this prompt does",
  "variables": [
    {
      "name": "variable_name",
      "description": "What this variable is for",
      "required": true,
      "input_type": "text|textarea|select|number",
      "default_value": "optional default"
    }
  ],
  "suggestedCategory": "one of: coding, devops, writing, creative, business, marketing, education, translation, analysis, legal, healthcare, security, research, productivity, conversation, roleplay, learning, design",
  "tags": ["tag1", "tag2", "tag3"]
}
</output_format>

<rules>
- Preserve the original prompt's purpose and functionality
- Add structure without changing the core instructions
- Extract obvious variables (topics, names, languages, etc.)
- Keep the prompt concise but complete
- Don't add unnecessary complexity
- If the prompt is already well-structured, make minimal changes
</rules>`;
}

/**
 * Build the user prompt for adaptation
 */
export function buildAdaptationUserPrompt(prompt: PromptToAdapt): string {
  return `Adapt this prompt for Claude best practices:

<original_title>${prompt.title}</original_title>

<original_content>
${prompt.content}
</original_content>

${prompt.category ? `<suggested_category>${prompt.category}</suggested_category>` : ""}

Return ONLY the JSON object, no other text.`;
}

/**
 * Adapt a prompt using Claude API
 * Note: This uses API credits. For batch adaptation without credits,
 * use the batch export/import workflow with Claude Code CLI.
 */
export async function adaptPromptWithAPI(
  prompt: PromptToAdapt,
  apiKey: string
): Promise<AdaptedPrompt> {
  const anthropic = new Anthropic({ apiKey });

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: buildAdaptationSystemPrompt(),
    messages: [
      {
        role: "user",
        content: buildAdaptationUserPrompt(prompt),
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === "text");
  const responseText = textContent?.type === "text" ? textContent.text : "";

  // Parse JSON from response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse adaptation response");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  // Generate hints for the adapted content
  const hints = analyzePrompt(parsed.adaptedContent);

  return {
    originalTitle: prompt.title,
    originalContent: prompt.content,
    adaptedTitle: parsed.adaptedTitle,
    adaptedContent: parsed.adaptedContent,
    description: parsed.description,
    variables: parsed.variables || [],
    claudeHints: hints,
    suggestedCategory: parsed.suggestedCategory || classifyPrompt(prompt.title, prompt.content),
    tags: parsed.tags || generateTags(prompt.title, prompt.content, parsed.suggestedCategory),
  };
}

/**
 * Adapt a prompt without API (rule-based)
 * Used for basic adaptation when API is not available
 */
export function adaptPromptBasic(prompt: PromptToAdapt): AdaptedPrompt {
  const content = prompt.content;
  const category = prompt.category || classifyPrompt(prompt.title, content);

  // Extract variables
  const variables = extractVariables(content);

  // Basic adaptation: wrap in XML structure if not already structured
  let adaptedContent = content;

  if (!/<\w+>/.test(content)) {
    // Add basic structure
    const hasRole = /^(you are|act as|i want you)/i.test(content);

    if (hasRole) {
      // Split role from task
      const lines = content.split(/\n\n|\. (?=[A-Z])/);
      if (lines.length > 1) {
        adaptedContent = `<role>\n${lines[0]}\n</role>\n\n<task>\n${lines.slice(1).join("\n\n")}\n</task>`;
      }
    } else {
      adaptedContent = `<task>\n${content}\n</task>`;
    }
  }

  // Generate hints
  const hints = analyzePrompt(adaptedContent);
  const tags = generateTags(prompt.title, content, category);

  return {
    originalTitle: prompt.title,
    originalContent: prompt.content,
    adaptedTitle: prompt.title,
    adaptedContent,
    description: prompt.description || `${prompt.title} prompt template`,
    variables,
    claudeHints: hints,
    suggestedCategory: category,
    tags,
  };
}

