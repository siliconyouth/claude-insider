/**
 * MCP Configuration Storage Library
 *
 * Provides CRUD operations for saving, loading, and managing MCP configurations.
 * Supports both database storage (authenticated users) and localStorage (guests).
 */

import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/lib/database.types";
import type {
  MCPConfig,
  SavedMCPConfig,
  MCPConfigWithAuthor,
  MCPConfigVersion,
  MCPConfigInput,
  LocalMCPDraft,
  MCPGalleryFilters,
  MCPModerationItem,
  MCPConfigDifficulty,
} from "./schema";

// Helper to cast MCPConfig to Json for database operations
const toJson = (config: MCPConfig): Json => config as unknown as Json;

// Helper to cast Json back to MCPConfig
const fromJson = (json: Json): MCPConfig => json as unknown as MCPConfig;

// ============================================================================
// Constants
// ============================================================================

const LOCAL_STORAGE_KEY = "mcp_playground_drafts";
const LOCAL_STORAGE_CURRENT_KEY = "mcp_playground_current";

// ============================================================================
// Database Operations (Authenticated Users)
// ============================================================================

/**
 * Save a new MCP configuration to the database
 */
export async function saveConfig(input: MCPConfigInput): Promise<SavedMCPConfig> {
  const supabase = createClient();

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("You must be signed in to save configurations");
  }

  const { data, error } = await supabase.from("mcp_configs")
    .insert({
      user_id: user.id,
      name: input.name,
      description: input.description || null,
      config_json: toJson(input.config_json),
      tags: input.tags || [],
      difficulty: input.difficulty || null,
      use_cases: input.use_cases || [],
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save configuration: ${error.message}`);
  }

  return {
    ...data,
    config_json: fromJson(data.config_json),
  } as SavedMCPConfig;
}

/**
 * Update an existing MCP configuration
 */
export async function updateConfig(
  id: string,
  input: Partial<MCPConfigInput>,
  createVersion = false,
  changeSummary?: string
): Promise<SavedMCPConfig> {
  const supabase = createClient();

  // Optionally create a version snapshot before updating
  if (createVersion) {
    await supabase.rpc("save_mcp_config_version", {
      p_config_id: id,
      p_change_summary: changeSummary,
    });
  }

  const updateData: Record<string, unknown> = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.config_json !== undefined) updateData.config_json = toJson(input.config_json);
  if (input.tags !== undefined) updateData.tags = input.tags;
  if (input.difficulty !== undefined) updateData.difficulty = input.difficulty;
  if (input.use_cases !== undefined) updateData.use_cases = input.use_cases;

  const { data, error } = await supabase.from("mcp_configs")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update configuration: ${error.message}`);
  }

  return {
    ...data,
    config_json: fromJson(data.config_json),
  } as SavedMCPConfig;
}

/**
 * Delete an MCP configuration
 */
export async function deleteConfig(id: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from("mcp_configs").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete configuration: ${error.message}`);
  }
}

/**
 * Get a single configuration by ID
 */
export async function getConfig(id: string): Promise<SavedMCPConfig | null> {
  const supabase = createClient();

  const { data, error } = await supabase.from("mcp_configs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw new Error(`Failed to get configuration: ${error.message}`);
  }

  return {
    ...data,
    config_json: fromJson(data.config_json),
  } as SavedMCPConfig;
}

/**
 * Get all configurations for the current user
 */
export async function getMyConfigs(
  status?: "draft" | "pending_review" | "published" | "rejected"
): Promise<SavedMCPConfig[]> {
  const supabase = createClient();

  let query = supabase.from("mcp_configs")
    .select("*")
    .order("updated_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get configurations: ${error.message}`);
  }

  return (data || []).map(item => ({
    ...item,
    config_json: fromJson(item.config_json),
  })) as SavedMCPConfig[];
}

/**
 * Get starred configurations for the current user
 */
export async function getStarredConfigs(): Promise<MCPConfigWithAuthor[]> {
  const supabase = createClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return [];

  const { data, error } = await supabase.from("mcp_config_stars")
    .select(`
      config:mcp_configs (
        *,
        author:user (id, name, image)
      )
    `)
    .eq("user_id", user.user.id);

  if (error) {
    throw new Error(`Failed to get starred configurations: ${error.message}`);
  }

  // Transform the nested structure
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data as any[]) || [])
    .map((item) => {
      const config = item.config as SavedMCPConfig & {
        author: { id: string; name: string | null; image: string | null };
      };
      return {
        ...config,
        author_id: config.author?.id || "",
        author_name: config.author?.name || null,
        author_avatar: config.author?.image || null,
      };
    })
    .filter(Boolean) as MCPConfigWithAuthor[];
}

// ============================================================================
// Gallery Operations
// ============================================================================

/**
 * Get public configurations for the gallery
 */
export async function getGalleryConfigs(
  filters: MCPGalleryFilters = {}
): Promise<{ configs: MCPConfigWithAuthor[]; total: number }> {
  const supabase = createClient();
  const { search, tags, difficulty, sortBy = "stars", page = 1, limit = 20 } = filters;

  let query = supabase.from("mcp_configs")
    .select(
      `
      *,
      author:user!inner (id, name, image)
    `,
      { count: "exact" }
    )
    .eq("is_public", true)
    .eq("status", "published");

  // Apply filters
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (tags && tags.length > 0) {
    query = query.overlaps("tags", tags);
  }

  if (difficulty) {
    query = query.eq("difficulty", difficulty);
  }

  // Apply sorting
  switch (sortBy) {
    case "stars":
      query = query.order("stars_count", { ascending: false });
      break;
    case "forks":
      query = query.order("forks_count", { ascending: false });
      break;
    case "views":
      query = query.order("views_count", { ascending: false });
      break;
    case "recent":
    default:
      query = query.order("published_at", { ascending: false });
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to get gallery configurations: ${error.message}`);
  }

  // Transform the nested structure
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const configs = ((data as any[]) || []).map((item) => {
    const author = item.author as { id: string; name: string | null; image: string | null };
    return {
      ...item,
      author_id: author?.id || "",
      author_name: author?.name || null,
      author_avatar: author?.image || null,
    };
  }) as MCPConfigWithAuthor[];

  return { configs, total: count || 0 };
}

/**
 * Get a public configuration by ID (with view count increment)
 */
export async function getPublicConfig(id: string): Promise<MCPConfigWithAuthor | null> {
  const supabase = createClient();

  // Increment view count
  await supabase.rpc("increment_mcp_config_views", { p_config_id: id });

  const { data, error } = await supabase.from("mcp_configs")
    .select(
      `
      *,
      author:user (id, name, image)
    `
    )
    .eq("id", id)
    .eq("is_public", true)
    .eq("status", "published")
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to get configuration: ${error.message}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const item = data as any;
  const author = item.author as { id: string; name: string | null; image: string | null };
  return {
    ...item,
    author_id: author?.id || "",
    author_name: author?.name || null,
    author_avatar: author?.image || null,
  } as MCPConfigWithAuthor;
}

// ============================================================================
// Version Operations
// ============================================================================

/**
 * Get version history for a configuration
 */
export async function getVersionHistory(configId: string): Promise<MCPConfigVersion[]> {
  const supabase = createClient();

  const { data, error } = await supabase.from("mcp_config_versions")
    .select("*")
    .eq("config_id", configId)
    .order("version_number", { ascending: false });

  if (error) {
    throw new Error(`Failed to get version history: ${error.message}`);
  }

  return (data || []).map(item => ({
    ...item,
    config_json: fromJson(item.config_json),
  })) as MCPConfigVersion[];
}

/**
 * Restore a specific version
 */
export async function restoreVersion(
  configId: string,
  versionNumber: number
): Promise<SavedMCPConfig> {
  const supabase = createClient();

  // Get the version
  const { data: version, error: versionError } = await supabase.from("mcp_config_versions")
    .select("config_json")
    .eq("config_id", configId)
    .eq("version_number", versionNumber)
    .single();

  if (versionError) {
    throw new Error(`Failed to get version: ${versionError.message}`);
  }

  // Save current state as a new version
  await supabase.rpc("save_mcp_config_version", {
    p_config_id: configId,
    p_change_summary: `Before restore to version ${versionNumber}`,
  });

  // Update the config with the old version
  return updateConfig(configId, { config_json: fromJson(version.config_json) });
}

// ============================================================================
// Star Operations
// ============================================================================

/**
 * Toggle star on a configuration
 */
export async function toggleStar(configId: string): Promise<boolean> {
  const supabase = createClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Must be authenticated to star configs");

  // Check if already starred
  const { data: existing } = await supabase.from("mcp_config_stars")
    .select("user_id")
    .eq("user_id", user.user.id)
    .eq("config_id", configId)
    .single();

  if (existing) {
    // Remove star
    await supabase.from("mcp_config_stars")
      .delete()
      .eq("user_id", user.user.id)
      .eq("config_id", configId);
    return false;
  } else {
    // Add star
    await supabase.from("mcp_config_stars").insert({
      user_id: user.user.id,
      config_id: configId,
    });
    return true;
  }
}

/**
 * Check if user has starred a configuration
 */
export async function hasStarred(configId: string): Promise<boolean> {
  const supabase = createClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return false;

  const { data } = await supabase.from("mcp_config_stars")
    .select("user_id")
    .eq("user_id", user.user.id)
    .eq("config_id", configId)
    .single();

  return !!data;
}

// ============================================================================
// Fork Operations
// ============================================================================

/**
 * Fork a configuration
 */
export async function forkConfig(configId: string, name?: string): Promise<string> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("fork_mcp_config", {
    p_config_id: configId,
    p_name: name,
  });

  if (error) {
    throw new Error(`Failed to fork configuration: ${error.message}`);
  }

  return data as string;
}

// ============================================================================
// Publishing Operations
// ============================================================================

/**
 * Submit a configuration for review
 */
export async function submitForReview(configId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.rpc("submit_mcp_config_for_review", {
    p_config_id: configId,
  });

  if (error) {
    throw new Error(`Failed to submit for review: ${error.message}`);
  }
}

/**
 * Withdraw a configuration from review (back to draft)
 */
export async function withdrawFromReview(configId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from("mcp_configs")
    .update({ status: "draft" })
    .eq("id", configId)
    .eq("status", "pending_review");

  if (error) {
    throw new Error(`Failed to withdraw from review: ${error.message}`);
  }
}

// ============================================================================
// Moderation Operations (Admin/Moderator Only)
// ============================================================================

/**
 * Get pending moderation queue
 */
export async function getModerationQueue(): Promise<MCPModerationItem[]> {
  const supabase = createClient();

  const { data, error } = await supabase.from("mcp_configs_moderation_queue")
    .select("*");

  if (error) {
    throw new Error(`Failed to get moderation queue: ${error.message}`);
  }

  return (data || []).map(item => ({
    ...item,
    config_json: fromJson(item.config_json),
  })) as MCPModerationItem[];
}

/**
 * Approve or reject a configuration
 */
export async function moderateConfig(
  configId: string,
  approved: boolean,
  feedback?: string
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.rpc("moderate_mcp_config", {
    p_config_id: configId,
    p_approved: approved,
    p_feedback: feedback,
  });

  if (error) {
    throw new Error(`Failed to moderate configuration: ${error.message}`);
  }
}

// ============================================================================
// localStorage Operations (Guest Users)
// ============================================================================

/**
 * Get all local drafts from localStorage
 */
export function getLocalDrafts(): LocalMCPDraft[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save a draft to localStorage
 */
export function saveLocalDraft(draft: Omit<LocalMCPDraft, "id" | "created_at" | "updated_at">): LocalMCPDraft {
  const drafts = getLocalDrafts();
  const now = new Date().toISOString();

  const newDraft: LocalMCPDraft = {
    id: crypto.randomUUID(),
    ...draft,
    created_at: now,
    updated_at: now,
  };

  drafts.push(newDraft);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(drafts));

  return newDraft;
}

/**
 * Update a local draft
 */
export function updateLocalDraft(
  id: string,
  updates: Partial<Omit<LocalMCPDraft, "id" | "created_at">>
): LocalMCPDraft | null {
  const drafts = getLocalDrafts();
  const index = drafts.findIndex((d) => d.id === id);

  if (index === -1) return null;

  const existing = drafts[index];
  if (!existing) return null;

  const updated: LocalMCPDraft = {
    ...existing,
    ...updates,
    id: existing.id, // Ensure id is preserved
    created_at: existing.created_at, // Ensure created_at is preserved
    updated_at: new Date().toISOString(),
  };

  drafts[index] = updated;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(drafts));
  return updated;
}

/**
 * Delete a local draft
 */
export function deleteLocalDraft(id: string): void {
  const drafts = getLocalDrafts().filter((d) => d.id !== id);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(drafts));
}

/**
 * Get the current working config from localStorage
 */
export function getCurrentLocalConfig(): MCPConfig | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_CURRENT_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Save the current working config to localStorage (auto-save)
 */
export function saveCurrentLocalConfig(config: MCPConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_STORAGE_CURRENT_KEY, JSON.stringify(config));
}

/**
 * Clear the current working config from localStorage
 */
export function clearCurrentLocalConfig(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LOCAL_STORAGE_CURRENT_KEY);
}

/**
 * Migrate local drafts to database after sign-in
 */
export async function migrateLocalDraftsToDatabase(): Promise<number> {
  const drafts = getLocalDrafts();
  if (drafts.length === 0) return 0;

  let migrated = 0;

  for (const draft of drafts) {
    try {
      await saveConfig({
        name: draft.name,
        description: draft.description,
        config_json: draft.config_json,
        tags: draft.tags,
        difficulty: draft.difficulty,
        use_cases: draft.use_cases,
      });
      migrated++;
    } catch {
      // Ignore individual failures, continue with others
    }
  }

  // Clear local storage if all migrated
  if (migrated === drafts.length) {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }

  return migrated;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get popular tags from published configs
 */
export async function getPopularTags(limit = 20): Promise<{ tag: string; count: number }[]> {
  const supabase = createClient();

  const { data, error } = await supabase.from("mcp_configs")
    .select("tags")
    .eq("is_public", true)
    .eq("status", "published");

  if (error) {
    throw new Error(`Failed to get popular tags: ${error.message}`);
  }

  // Count tag occurrences
  const tagCounts = new Map<string, number>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const row of (data as any[]) || []) {
    for (const tag of (row.tags as string[]) || []) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
  }

  // Sort by count and return top N
  return Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Get difficulty distribution
 */
export async function getDifficultyStats(): Promise<
  { difficulty: MCPConfigDifficulty; count: number }[]
> {
  const supabase = createClient();

  const { data, error } = await supabase.from("mcp_configs")
    .select("difficulty")
    .eq("is_public", true)
    .eq("status", "published")
    .not("difficulty", "is", null);

  if (error) {
    throw new Error(`Failed to get difficulty stats: ${error.message}`);
  }

  const counts = new Map<MCPConfigDifficulty, number>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const row of (data as any[]) || []) {
    const diff = row.difficulty as MCPConfigDifficulty;
    counts.set(diff, (counts.get(diff) || 0) + 1);
  }

  return Array.from(counts.entries()).map(([difficulty, count]) => ({
    difficulty,
    count,
  }));
}
