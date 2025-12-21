// AI Editor Types

export type EditCommand =
  | "improve"
  | "expand"
  | "simplify"
  | "examples"
  | "grammar"
  | "summarize"
  | "technical"
  | "friendly"
  | "custom";

export interface EditCommandInfo {
  id: EditCommand;
  label: string;
  description: string;
  icon: string;
  shortcut?: string;
}

export const EDIT_COMMANDS: EditCommandInfo[] = [
  {
    id: "improve",
    label: "Improve",
    description: "Enhance clarity and readability",
    icon: "✨",
    shortcut: "⌘I",
  },
  {
    id: "expand",
    label: "Expand",
    description: "Add more detail and context",
    icon: "📝",
    shortcut: "⌘E",
  },
  {
    id: "simplify",
    label: "Simplify",
    description: "Make easier to understand",
    icon: "🎯",
    shortcut: "⌘S",
  },
  {
    id: "examples",
    label: "Add Examples",
    description: "Include code examples",
    icon: "💻",
  },
  {
    id: "grammar",
    label: "Fix Grammar",
    description: "Correct spelling and grammar",
    icon: "📖",
    shortcut: "⌘G",
  },
  {
    id: "summarize",
    label: "Summarize",
    description: "Create a concise summary",
    icon: "📋",
  },
  {
    id: "technical",
    label: "Technical",
    description: "Make more precise",
    icon: "🔧",
  },
  {
    id: "friendly",
    label: "Friendly",
    description: "More conversational tone",
    icon: "👋",
  },
  {
    id: "custom",
    label: "Custom",
    description: "Your own instructions",
    icon: "✏️",
  },
];

export interface Selection {
  start: number;
  end: number;
  text: string;
}

export interface EditorContext {
  title?: string;
  category?: string;
  slug?: string;
  filePath?: string;
}

export interface EditResult {
  original: string;
  edited: string;
  command: EditCommand;
  customPrompt?: string;
}
