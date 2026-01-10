/**
 * Interactive Prompt Builder Types
 *
 * Shared type definitions for all builder modes:
 * - Quick Mode (Enhanced Variable Modal)
 * - Guided Mode (Wizard)
 * - Chat Mode (AI Builder)
 * - Playground Mode (Full Editor)
 */

// ============================================================================
// Variable Configuration (matches database schema)
// ============================================================================

export type VariableInputType =
  | "text"
  | "textarea"
  | "select"
  | "code"
  | "number"
  | "url"
  | "email"
  | "file";

export interface VariableExample {
  value: string;
  description?: string;
}

export interface ConditionalShow {
  variable: string;
  operator: "equals" | "not_equals" | "contains" | "not_empty";
  value?: string;
}

export interface VariableConfig {
  id?: string;
  promptId?: string;
  variableName: string;

  // Input type and validation
  inputType: VariableInputType;
  isRequired: boolean;
  validationRegex?: string;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;

  // Suggestions and examples
  suggestions: string[];
  examples: VariableExample[];

  // AI-powered suggestions
  aiSuggestionEnabled: boolean;
  aiSuggestionPrompt?: string;

  // Display configuration
  displayOrder: number;
  groupName?: string;
  placeholder?: string;
  helpText?: string;
  label?: string; // Override variable name for display

  // Smart features
  detectFromClipboard: boolean;
  detectFromContext: boolean;
  dependentOn?: string;
  conditionalShow?: ConditionalShow;

  // Code-specific settings
  codeLanguage?: string;
  codeHeight?: number;
}

// ============================================================================
// Basic Variable (from prompts.variables JSONB)
// ============================================================================

export interface PromptVariable {
  name: string;
  description?: string;
  default_value?: string;
  required?: boolean;
}

// ============================================================================
// Builder Session State
// ============================================================================

export type BuilderMode = "quick" | "guided" | "chat" | "playground";

export interface BuilderValues {
  [variableName: string]: string;
}

export interface BuilderSession {
  id?: string;
  promptId: string;
  userId?: string;
  mode: BuilderMode;
  status: "active" | "completed" | "abandoned" | "expired";
  values: BuilderValues;
  currentVariable?: string;
  remainingVariables: string[];
  messages?: ChatMessage[];
  finalPrompt?: string;
  startedAt: Date;
  lastActivityAt: Date;
  completedAt?: Date;
}

// ============================================================================
// Chat Builder Types
// ============================================================================

export interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: Date;
  options?: ChatOption[];
  variableCollected?: string;
  valueCollected?: string;
}

export interface ChatOption {
  label: string;
  value: string;
  description?: string;
}

// ============================================================================
// Prompt Fill (saved/shared filled prompts)
// ============================================================================

export interface PromptFill {
  id: string;
  promptId: string;
  userId?: string;
  variableValues: BuilderValues;
  finalContent: string;
  title?: string;
  notes?: string;
  shareToken?: string;
  isPublic: boolean;
  shareSettings: ShareSettings;
  viewCount: number;
  forkCount: number;
  copyCount: number;
  forkedFromFillId?: string;
  builderMode?: BuilderMode;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShareSettings {
  allowFork?: boolean;
  showVariables?: boolean;
  expiresAt?: Date | null;
}

// ============================================================================
// User Preferences
// ============================================================================

export interface BuilderPreferences {
  defaultMode: BuilderMode;
  rememberMode: boolean;
  lastUsedMode?: BuilderMode;

  // Quick mode
  showPreview: boolean;
  showSuggestions: boolean;
  autoDetectClipboard: boolean;

  // Guided mode
  skipCompletedSteps: boolean;
  showProgressBar: boolean;

  // Chat mode
  chatPersonality: "helpful" | "concise" | "detailed" | "friendly";
  showTypingIndicator: boolean;

  // Playground mode
  editorTheme: "dark" | "light" | "system";
  editorFontSize: number;
  autoSave: boolean;
  autoSaveInterval: number;

  // History
  saveFillHistory: boolean;
  maxHistoryItems: number;
}

// ============================================================================
// Component Props
// ============================================================================

export interface EnhancedVariableModalProps {
  promptId: string;
  promptTitle: string;
  promptContent: string;
  variables: PromptVariable[];
  variableConfigs?: VariableConfig[];
  onSubmit: (values: BuilderValues, finalContent: string) => void;
  onClose: () => void;
  onModeChange?: (mode: BuilderMode) => void;
  initialValues?: BuilderValues;
}

export interface BuilderModeSelectorProps {
  promptId: string;
  promptTitle: string;
  variableCount: number;
  onSelectMode: (mode: BuilderMode) => void;
  onClose: () => void;
  preferences?: BuilderPreferences;
}

export interface GuidedWizardProps {
  promptId: string;
  promptTitle: string;
  promptContent: string;
  variables: PromptVariable[];
  variableConfigs?: VariableConfig[];
  onComplete: (values: BuilderValues, finalContent: string) => void;
  onClose: () => void;
  initialValues?: BuilderValues;
}

export interface ChatBuilderProps {
  promptId: string;
  promptTitle: string;
  promptContent: string;
  variables: PromptVariable[];
  variableConfigs?: VariableConfig[];
  onComplete: (values: BuilderValues, finalContent: string) => void;
  onClose: () => void;
  sessionId?: string;
}

export interface PlaygroundProps {
  promptId?: string;
  promptTitle?: string;
  promptContent?: string;
  variables?: PromptVariable[];
  variableConfigs?: VariableConfig[];
  onSave?: (fill: Partial<PromptFill>) => void;
  onClose?: () => void;
}

// ============================================================================
// API Types
// ============================================================================

export interface SuggestVariableRequest {
  promptId: string;
  variableName: string;
  currentValues: BuilderValues;
  context?: string;
}

export interface SuggestVariableResponse {
  suggestions: string[];
  explanation?: string;
}

export interface ChatBuilderMessageRequest {
  sessionId: string;
  message: string;
}

export interface ChatBuilderMessageResponse {
  message: ChatMessage;
  isComplete: boolean;
  finalPrompt?: string;
  values?: BuilderValues;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert PromptVariable to VariableConfig with defaults
 */
export function variableToConfig(
  variable: PromptVariable,
  index: number
): VariableConfig {
  // Infer input type from variable name
  const name = variable.name.toLowerCase();
  let inputType: VariableInputType = "text";
  let codeLanguage: string | undefined;

  if (name.includes("code") || name.includes("script") || name.includes("snippet")) {
    inputType = "code";
  } else if (
    name.includes("text") ||
    name.includes("content") ||
    name.includes("description") ||
    name.includes("body") ||
    name.includes("message") ||
    name.includes("notes")
  ) {
    inputType = "textarea";
  } else if (name.includes("url") || name.includes("link")) {
    inputType = "url";
  } else if (name.includes("email")) {
    inputType = "email";
  } else if (
    name.includes("count") ||
    name.includes("number") ||
    name.includes("amount") ||
    name.includes("quantity")
  ) {
    inputType = "number";
  } else if (name.includes("language") || name.includes("lang")) {
    inputType = "select";
  }

  // Infer code language
  if (inputType === "code" && variable.description) {
    const desc = variable.description.toLowerCase();
    if (desc.includes("python")) codeLanguage = "python";
    else if (desc.includes("javascript") || desc.includes("js")) codeLanguage = "javascript";
    else if (desc.includes("typescript") || desc.includes("ts")) codeLanguage = "typescript";
    else if (desc.includes("java")) codeLanguage = "java";
    else if (desc.includes("go")) codeLanguage = "go";
    else if (desc.includes("rust")) codeLanguage = "rust";
    else if (desc.includes("c++") || desc.includes("cpp")) codeLanguage = "cpp";
    else if (desc.includes("c#") || desc.includes("csharp")) codeLanguage = "csharp";
  }

  return {
    variableName: variable.name,
    inputType,
    isRequired: variable.required ?? true,
    suggestions: [],
    examples: [],
    aiSuggestionEnabled: false,
    displayOrder: index,
    placeholder: variable.default_value || undefined,
    helpText: variable.description || undefined,
    detectFromClipboard: inputType === "code",
    detectFromContext: false,
    codeLanguage,
    codeHeight: inputType === "code" ? 200 : undefined,
  };
}

/**
 * Format variable name for display
 */
export function formatVariableName(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Substitute variables in prompt content
 */
export function substituteVariables(
  content: string,
  values: BuilderValues
): string {
  let result = content;
  for (const [name, value] of Object.entries(values)) {
    result = result.replace(new RegExp(`\\{\\{${name}\\}\\}`, "g"), value);
  }
  return result;
}

/**
 * Extract variable names from prompt content
 */
export function extractVariableNames(content: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const names: string[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    const name = match[1];
    if (name && !names.includes(name)) {
      names.push(name);
    }
  }
  return names;
}

/**
 * Check if a variable should be shown based on conditional rules
 */
export function shouldShowVariable(
  config: VariableConfig,
  values: BuilderValues
): boolean {
  if (!config.conditionalShow) return true;

  const { variable, operator, value } = config.conditionalShow;
  const currentValue = values[variable] || "";

  switch (operator) {
    case "equals":
      return currentValue === value;
    case "not_equals":
      return currentValue !== value;
    case "contains":
      return value ? currentValue.includes(value) : false;
    case "not_empty":
      return currentValue.trim().length > 0;
    default:
      return true;
  }
}

/**
 * Validate a variable value
 */
export function validateVariable(
  value: string,
  config: VariableConfig
): string | null {
  if (config.isRequired && !value.trim()) {
    return "This field is required";
  }

  if (config.minLength && value.length < config.minLength) {
    return `Minimum ${config.minLength} characters required`;
  }

  if (config.maxLength && value.length > config.maxLength) {
    return `Maximum ${config.maxLength} characters allowed`;
  }

  if (config.validationRegex) {
    try {
      const regex = new RegExp(config.validationRegex);
      if (!regex.test(value)) {
        return "Invalid format";
      }
    } catch {
      // Invalid regex, skip validation
    }
  }

  if (config.inputType === "number") {
    const num = parseFloat(value);
    if (isNaN(num)) {
      return "Must be a number";
    }
    if (config.minValue !== undefined && num < config.minValue) {
      return `Minimum value is ${config.minValue}`;
    }
    if (config.maxValue !== undefined && num > config.maxValue) {
      return `Maximum value is ${config.maxValue}`;
    }
  }

  if (config.inputType === "url" && value) {
    try {
      new URL(value);
    } catch {
      return "Invalid URL";
    }
  }

  if (config.inputType === "email" && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return "Invalid email address";
    }
  }

  return null;
}
