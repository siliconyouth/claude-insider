#!/usr/bin/env npx tsx
/**
 * Sync Resources from Database to JSON Files
 *
 * Exports resources from the database to JSON files organized by category.
 * This keeps the static JSON files in sync with the database.
 *
 * Usage: npx dotenvx run -f .env.local -- npx tsx scripts/sync-resources-to-json.ts
 */

import * as fs from "fs";
import * as path from "path";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const RESOURCES_DIR = "data/resources";

interface DatabaseResource {
  id: string;
  slug: string;
  title: string;
  description: string;
  url: string;
  category: string;
  subcategory: string | null;
  status: string;
  is_featured: boolean;
  featured_reason: string | null;
  difficulty: string | null;
  version: string | null;
  namespace: string | null;
  github_owner: string | null;
  github_repo: string | null;
  github_stars: number;
  github_forks: number;
  github_language: string | null;
  github_last_commit: string | null;
  screenshots: string[] | null;
  added_at: string;
  last_verified_at: string | null;
}

interface ResourceTag {
  resource_id: string;
  tag: string;
}

interface JsonResource {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  subcategory?: string;
  tags: string[];
  difficulty?: string;
  status: string;
  github?: {
    owner: string;
    repo: string;
    stars: number;
    forks: number;
    lastUpdated: string;
    language: string;
  };
  version?: string;
  namespace?: string;
  featured?: boolean;
  featuredReason?: string;
  screenshotUrl?: string;
  screenshots?: string[];
  addedDate: string;
  lastVerified: string;
}

// Get Supabase client
function getSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  return createClient(url, key);
}

// Fetch all resources with tags (handles pagination)
async function fetchAllResources(supabase: SupabaseClient): Promise<{
  resources: DatabaseResource[];
  tags: Map<string, string[]>;
}> {
  // Fetch resources with pagination (Supabase default limit is 1000)
  const allResources: DatabaseResource[] = [];
  let offset = 0;
  const pageSize = 1000;

  while (true) {
    const { data: resources, error: resourcesError } = await supabase
      .from("resources")
      .select("*")
      .eq("is_published", true)
      .order("category")
      .order("title")
      .range(offset, offset + pageSize - 1);

    if (resourcesError) {
      throw new Error(`Failed to fetch resources: ${resourcesError.message}`);
    }

    if (!resources || resources.length === 0) {
      break;
    }

    allResources.push(...resources);
    console.log(`  Fetched ${allResources.length} resources...`);

    if (resources.length < pageSize) {
      break; // Last page
    }

    offset += pageSize;
  }

  // Fetch tags with pagination
  const allTags: ResourceTag[] = [];
  offset = 0;

  while (true) {
    const { data: tagsData, error: tagsError } = await supabase
      .from("resource_tags")
      .select("resource_id, tag")
      .range(offset, offset + pageSize - 1);

    if (tagsError) {
      throw new Error(`Failed to fetch tags: ${tagsError.message}`);
    }

    if (!tagsData || tagsData.length === 0) {
      break;
    }

    allTags.push(...tagsData);

    if (tagsData.length < pageSize) {
      break;
    }

    offset += pageSize;
  }

  // Group tags by resource
  const tagsMap = new Map<string, string[]>();
  for (const tag of allTags) {
    const existing = tagsMap.get(tag.resource_id) || [];
    existing.push(tag.tag);
    tagsMap.set(tag.resource_id, existing);
  }

  return {
    resources: allResources,
    tags: tagsMap,
  };
}

// Convert database resource to JSON format
function convertToJsonFormat(resource: DatabaseResource, tags: string[]): JsonResource {
  const jsonResource: JsonResource = {
    id: resource.slug,
    title: resource.title,
    description: resource.description,
    url: resource.url,
    category: resource.category,
    tags: tags,
    status: resource.status,
    addedDate: resource.added_at.split("T")[0],
    lastVerified: (resource.last_verified_at || resource.added_at).split("T")[0],
  };

  // Optional fields
  if (resource.subcategory) {
    jsonResource.subcategory = resource.subcategory;
  }

  if (resource.difficulty) {
    jsonResource.difficulty = resource.difficulty;
  }

  if (resource.version) {
    jsonResource.version = resource.version;
  }

  if (resource.namespace) {
    jsonResource.namespace = resource.namespace;
  }

  if (resource.is_featured) {
    jsonResource.featured = true;
    if (resource.featured_reason) {
      jsonResource.featuredReason = resource.featured_reason;
    }
  }

  // GitHub info
  if (resource.github_owner && resource.github_repo) {
    jsonResource.github = {
      owner: resource.github_owner,
      repo: resource.github_repo,
      stars: resource.github_stars || 0,
      forks: resource.github_forks || 0,
      lastUpdated: (resource.github_last_commit || resource.added_at).split("T")[0],
      language: resource.github_language || "Unknown",
    };
  }

  // Screenshots
  if (resource.screenshots && resource.screenshots.length > 0) {
    jsonResource.screenshotUrl = resource.screenshots[0];
    if (resource.screenshots.length > 1) {
      jsonResource.screenshots = resource.screenshots;
    }
  }

  return jsonResource;
}

// Group resources by category
function groupByCategory(
  resources: DatabaseResource[],
  tagsMap: Map<string, string[]>
): Map<string, JsonResource[]> {
  const grouped = new Map<string, JsonResource[]>();

  for (const resource of resources) {
    const tags = tagsMap.get(resource.id) || [];
    const jsonResource = convertToJsonFormat(resource, tags);

    const existing = grouped.get(resource.category) || [];
    existing.push(jsonResource);
    grouped.set(resource.category, existing);
  }

  return grouped;
}

// Write JSON files
function writeJsonFiles(grouped: Map<string, JsonResource[]>): void {
  // Ensure directory exists
  if (!fs.existsSync(RESOURCES_DIR)) {
    fs.mkdirSync(RESOURCES_DIR, { recursive: true });
  }

  for (const [category, resources] of grouped) {
    const filePath = path.join(RESOURCES_DIR, `${category}.json`);

    // Sort resources: featured first, then by title
    resources.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return a.title.localeCompare(b.title);
    });

    fs.writeFileSync(filePath, JSON.stringify(resources, null, 2) + "\n");
    console.log(`📝 ${category}.json: ${resources.length} resources`);
  }
}

// Main
async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("🔄 Sync Resources from Database to JSON");
  console.log("=".repeat(60) + "\n");

  const supabase = getSupabaseClient();

  // Fetch all resources
  console.log("📊 Fetching resources from database...\n");
  const { resources, tags } = await fetchAllResources(supabase);

  console.log(`Found ${resources.length} published resources`);
  console.log(`Found ${tags.size} resources with tags\n`);

  // Group by category
  const grouped = groupByCategory(resources, tags);

  console.log("📁 Writing JSON files:\n");
  writeJsonFiles(grouped);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Sync Summary");
  console.log("=".repeat(60));
  console.log(`Total resources: ${resources.length}`);
  console.log(`Categories: ${grouped.size}`);

  let withScreenshots = 0;
  for (const resource of resources) {
    if (resource.screenshots && resource.screenshots.length > 0) {
      withScreenshots++;
    }
  }
  console.log(`With screenshots: ${withScreenshots} (${((withScreenshots / resources.length) * 100).toFixed(1)}%)`);
  console.log("=".repeat(60) + "\n");
}

main().catch(console.error);
