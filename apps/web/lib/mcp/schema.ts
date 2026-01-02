/**
 * MCP (Model Context Protocol) Schema Types
 *
 * Defines the structure of MCP server configurations as used
 * by Claude Desktop and Claude Code.
 */

/**
 * Environment variables for an MCP server
 * Values can reference system environment variables using ${VAR_NAME} syntax
 */
export interface MCPServerEnv {
  [key: string]: string;
}

/**
 * Configuration for a single MCP server
 */
export interface MCPServerConfig {
  /** Command to execute (e.g., "npx", "node", "python") */
  command: string;
  /** Arguments to pass to the command */
  args?: string[];
  /** Environment variables for the server process */
  env?: MCPServerEnv;
}

/**
 * Root MCP configuration structure
 * This is what goes in ~/.claude/settings.json or .claude/settings.json
 */
export interface MCPConfig {
  mcpServers: {
    [serverName: string]: MCPServerConfig;
  };
}

/**
 * Validation error types
 */
export type ValidationErrorType =
  | 'syntax'      // JSON parsing error
  | 'schema'      // Missing required structure
  | 'required'    // Missing required field
  | 'type'        // Wrong type for a field
  | 'format'      // Invalid format (e.g., empty string)
  | 'warning';    // Not an error, but a suggestion

/**
 * A single validation error or warning
 */
export interface ValidationError {
  type: ValidationErrorType;
  message: string;
  line?: number;
  column?: number;
  path?: string;
  severity?: 'error' | 'warning';
}

/**
 * Result of validating an MCP configuration
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  serverCount: number;
  parsedConfig?: MCPConfig;
}

/**
 * MCP template entry for the template selector
 */
export interface MCPTemplate {
  id: string;
  name: string;
  description: string;
  category: 'official' | 'community' | 'database' | 'filesystem' | 'api' | 'search' | 'other';
  config: MCPConfig;
  tags?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  stars?: number;
  url?: string;
}

/**
 * Default empty MCP configuration
 */
export const DEFAULT_MCP_CONFIG: MCPConfig = {
  mcpServers: {
    "example-server": {
      command: "npx",
      args: ["-y", "@anthropic-ai/mcp-server-example"],
      env: {
        "API_KEY": "${YOUR_API_KEY}"
      }
    }
  }
};

/**
 * Default configuration as a formatted JSON string
 */
export const DEFAULT_CONFIG_STRING = JSON.stringify(DEFAULT_MCP_CONFIG, null, 2);

// ============================================================================
// Storage Types (for saved user configurations)
// ============================================================================

/**
 * Status of a saved MCP configuration
 */
export type MCPConfigStatus = 'draft' | 'pending_review' | 'published' | 'rejected';

/**
 * Difficulty level for an MCP configuration
 */
export type MCPConfigDifficulty = 'beginner' | 'intermediate' | 'advanced';

/**
 * A saved MCP configuration in the database
 */
export interface SavedMCPConfig {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  config_json: MCPConfig;
  tags: string[];
  difficulty: MCPConfigDifficulty | null;
  use_cases: string[];
  status: MCPConfigStatus;
  is_public: boolean;
  rejection_reason: string | null;
  stars_count: number;
  forks_count: number;
  views_count: number;
  forked_from_id: string | null;
  server_count: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

/**
 * Config with author information (for gallery display)
 */
export interface MCPConfigWithAuthor extends SavedMCPConfig {
  author_id: string;
  author_name: string | null;
  author_avatar: string | null;
}

/**
 * A version snapshot of an MCP configuration
 */
export interface MCPConfigVersion {
  id: string;
  config_id: string;
  version_number: number;
  config_json: MCPConfig;
  change_summary: string | null;
  created_at: string;
}

/**
 * Input for creating/updating an MCP configuration
 */
export interface MCPConfigInput {
  name: string;
  description?: string;
  config_json: MCPConfig;
  tags?: string[];
  difficulty?: MCPConfigDifficulty;
  use_cases?: string[];
}

/**
 * Input for saving a draft to localStorage (guest users)
 */
export interface LocalMCPDraft {
  id: string;
  name: string;
  description?: string;
  config_json: MCPConfig;
  tags?: string[];
  difficulty?: MCPConfigDifficulty;
  use_cases?: string[];
  created_at: string;
  updated_at: string;
}

/**
 * Gallery filter options
 */
export interface MCPGalleryFilters {
  search?: string;
  tags?: string[];
  difficulty?: MCPConfigDifficulty;
  sortBy?: 'stars' | 'forks' | 'recent' | 'views';
  page?: number;
  limit?: number;
}

/**
 * Moderation queue item
 */
export interface MCPModerationItem {
  id: string;
  name: string;
  description: string | null;
  config_json: MCPConfig;
  tags: string[];
  difficulty: MCPConfigDifficulty | null;
  server_count: number;
  created_at: string;
  user_id: string;
  author_name: string | null;
  author_email: string | null;
  review_id: string | null;
  review_status: 'pending' | 'approved' | 'rejected' | null;
  review_feedback: string | null;
}
