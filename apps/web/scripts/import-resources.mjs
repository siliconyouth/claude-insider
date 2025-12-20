/**
 * Import resources from JSON files to database
 *
 * Usage: node scripts/import-resources.mjs
 *
 * This script imports all resources from data/resources/*.json
 * into the new resources table.
 */

import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read DATABASE_URL from .env.local
const envPath = path.join(__dirname, "../.env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const match = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/);

if (!match) {
  console.error("DATABASE_URL not found in .env.local");
  process.exit(1);
}

const DATABASE_URL = match[1];

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Resource categories to import
const CATEGORIES = [
  "official",
  "tools",
  "mcp-servers",
  "rules",
  "prompts",
  "agents",
  "tutorials",
  "sdks",
  "showcases",
  "community",
];

async function importResources() {
  const client = await pool.connect();

  try {
    console.log("=== Starting Resource Import ===\n");

    let totalImported = 0;
    let totalTags = 0;
    let totalAuthors = 0;

    await client.query("BEGIN");

    for (const category of CATEGORIES) {
      const jsonPath = path.join(__dirname, `../data/resources/${category}.json`);

      if (!fs.existsSync(jsonPath)) {
        console.log(`Skipping ${category}: file not found`);
        continue;
      }

      const resources = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
      console.log(`Importing ${resources.length} resources from ${category}...`);

      for (const resource of resources) {
        try {
          // Insert main resource
          const result = await client.query(
            `INSERT INTO resources (
              slug,
              title,
              description,
              url,
              category,
              subcategory,
              status,
              is_featured,
              featured_reason,
              difficulty,
              version,
              namespace,
              github_owner,
              github_repo,
              github_stars,
              github_forks,
              github_language,
              github_last_commit,
              added_at,
              last_verified_at,
              pricing,
              website_url
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
              $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
              $21, $22
            )
            ON CONFLICT (slug) DO UPDATE SET
              title = EXCLUDED.title,
              description = EXCLUDED.description,
              url = EXCLUDED.url,
              updated_at = NOW()
            RETURNING id`,
            [
              resource.id, // slug
              resource.title,
              resource.description,
              resource.url,
              resource.category,
              resource.subcategory || null,
              resource.status || "community",
              resource.featured || false,
              resource.featuredReason || null,
              resource.difficulty || null,
              resource.version || null,
              resource.namespace || null,
              resource.github?.owner || null,
              resource.github?.repo || null,
              resource.github?.stars || 0,
              resource.github?.forks || 0,
              resource.github?.language || null,
              resource.github?.lastUpdated ? new Date(resource.github.lastUpdated) : null,
              resource.addedDate ? new Date(resource.addedDate) : new Date(),
              resource.lastVerified ? new Date(resource.lastVerified) : new Date(),
              // Infer pricing from URL or default to free
              resource.url?.includes("github.com") ? "open-source" : "free",
              // Use main URL as website if no separate website
              resource.url,
            ]
          );

          const resourceId = result.rows[0].id;

          // Insert tags
          if (resource.tags && resource.tags.length > 0) {
            for (const tag of resource.tags) {
              await client.query(
                `INSERT INTO resource_tags (resource_id, tag)
                 VALUES ($1, $2)
                 ON CONFLICT (resource_id, tag) DO NOTHING`,
                [resourceId, tag]
              );
              totalTags++;
            }
          }

          // Create author from GitHub if available
          if (resource.github?.owner) {
            await client.query(
              `INSERT INTO resource_authors (
                resource_id, name, role, github_username, is_primary
              ) VALUES ($1, $2, 'maintainer', $3, true)
              ON CONFLICT DO NOTHING`,
              [resourceId, resource.github.owner, resource.github.owner]
            );
            totalAuthors++;
          }

          totalImported++;
        } catch (err) {
          console.error(`  Error importing ${resource.id}:`, err.message);
        }
      }
    }

    await client.query("COMMIT");

    console.log("\n=== Import Complete ===");
    console.log(`Resources imported: ${totalImported}`);
    console.log(`Tags created: ${totalTags}`);
    console.log(`Authors created: ${totalAuthors}`);

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Import failed:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the import
importResources().catch(console.error);
