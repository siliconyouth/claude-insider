/**
 * Migration Script: JSON to Payload CMS
 *
 * This script migrates existing resource data from JSON files to the Payload CMS database.
 * Run with: pnpm migrate
 *
 * Prerequisites:
 * 1. Set DATABASE_URL environment variable to your Supabase connection string
 * 2. Set PAYLOAD_SECRET environment variable
 * 3. Ensure the database exists and Payload has run migrations
 */

import { getPayload } from 'payload';
import config from '../payload.config';

// Import existing data
import { RESOURCE_CATEGORIES, type ResourceEntry } from '../data/resources/schema';
import { ALL_RESOURCES, getAllTags } from '../data/resources/index';

async function migrate() {
  console.log('🚀 Starting migration to Payload CMS...\n');

  // Initialize Payload
  const payload = await getPayload({ config });
  console.log('✅ Payload initialized\n');

  // Step 1: Migrate Categories
  console.log('📁 Migrating categories...');
  const categoryIdMap = new Map<string, number>();

  for (const [index, category] of RESOURCE_CATEGORIES.entries()) {
    try {
      // Check if category already exists
      const existing = await payload.find({
        collection: 'categories',
        where: { slug: { equals: category.slug } },
        limit: 1,
      });

      if (existing.docs.length > 0) {
        console.log(`  ⏭️  Category "${category.name}" already exists, skipping...`);
        categoryIdMap.set(category.slug, existing.docs[0].id as number);
        continue;
      }

      const created = await payload.create({
        collection: 'categories',
        data: {
          slug: category.slug,
          name: category.name,
          shortName: category.shortName,
          description: category.description,
          icon: category.icon,
          color: category.color,
          sortOrder: index,
        },
      });
      categoryIdMap.set(category.slug, created.id as number);
      console.log(`  ✅ Created category: ${category.name}`);
    } catch (error) {
      console.error(`  ❌ Failed to create category "${category.name}":`, error);
    }
  }
  console.log(`\n✅ Migrated ${categoryIdMap.size} categories\n`);

  // Step 2: Migrate Tags
  console.log('🏷️  Migrating tags...');
  const tagIdMap = new Map<string, number>();
  const allTags = getAllTags();

  for (const tag of allTags) {
    try {
      // Check if tag already exists
      const existing = await payload.find({
        collection: 'tags',
        where: { name: { equals: tag.name } },
        limit: 1,
      });

      if (existing.docs.length > 0) {
        console.log(`  ⏭️  Tag "${tag.name}" already exists, skipping...`);
        tagIdMap.set(tag.name, existing.docs[0].id as number);
        continue;
      }

      const created = await payload.create({
        collection: 'tags',
        data: {
          name: tag.name,
          resourceCount: tag.count,
        },
      });
      tagIdMap.set(tag.name, created.id as number);
      console.log(`  ✅ Created tag: ${tag.name} (${tag.count} resources)`);
    } catch (error) {
      console.error(`  ❌ Failed to create tag "${tag.name}":`, error);
    }
  }
  console.log(`\n✅ Migrated ${tagIdMap.size} tags\n`);

  // Step 3: Migrate Resources
  console.log('📚 Migrating resources...');
  let resourceCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const resource of ALL_RESOURCES as ResourceEntry[]) {
    try {
      // Check if resource already exists by URL (unique identifier)
      const existing = await payload.find({
        collection: 'resources',
        where: { url: { equals: resource.url } },
        limit: 1,
      });

      if (existing.docs.length > 0) {
        console.log(`  ⏭️  Resource "${resource.title}" already exists, skipping...`);
        skippedCount++;
        continue;
      }

      // Get category ID
      const categoryId = categoryIdMap.get(resource.category);
      if (!categoryId) {
        console.error(`  ❌ Category "${resource.category}" not found for resource "${resource.title}"`);
        errorCount++;
        continue;
      }

      // Get tag IDs
      const tagIds = resource.tags
        .map((tagName) => tagIdMap.get(tagName))
        .filter((id): id is number => id !== undefined);

      // Prepare resource data
      const resourceData: Record<string, unknown> = {
        title: resource.title,
        description: resource.description,
        url: resource.url,
        category: categoryId,
        subcategory: resource.subcategory || undefined,
        tags: tagIds,
        difficulty: resource.difficulty || undefined,
        status: resource.status,
        featured: resource.featured || false,
        featuredReason: resource.featuredReason
          ? resource.featuredReason.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '')
          : undefined,
        addedDate: resource.addedDate,
        lastVerified: resource.lastVerified,
        version: resource.version || undefined,
        namespace: resource.namespace || undefined,
      };

      // Add GitHub info if present
      if (resource.github) {
        resourceData.github = {
          owner: resource.github.owner,
          repo: resource.github.repo,
          stars: resource.github.stars || 0,
          forks: resource.github.forks || 0,
          lastUpdated: resource.github.lastUpdated || undefined,
          language: resource.github.language || undefined,
        };
      }

      await payload.create({
        collection: 'resources',
        data: resourceData,
      });
      resourceCount++;
      console.log(`  ✅ Created resource: ${resource.title}`);
    } catch (error) {
      console.error(`  ❌ Failed to create resource "${resource.title}":`, error);
      errorCount++;
    }
  }

  console.log(`\n📊 Migration Summary:`);
  console.log(`  ✅ Categories: ${categoryIdMap.size}`);
  console.log(`  ✅ Tags: ${tagIdMap.size}`);
  console.log(`  ✅ Resources created: ${resourceCount}`);
  console.log(`  ⏭️  Resources skipped: ${skippedCount}`);
  console.log(`  ❌ Errors: ${errorCount}`);
  console.log(`\n🎉 Migration complete!`);

  process.exit(0);
}

// Run migration
migrate().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
