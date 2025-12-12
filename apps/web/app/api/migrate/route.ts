import { getPayload } from 'payload';
import config from '@payload-config';
import { NextResponse } from 'next/server';

// Import static resources data
import { RESOURCE_CATEGORIES } from '@/data/resources/schema';
import officialResources from '@/data/resources/official.json';
import toolsResources from '@/data/resources/tools.json';
import mcpServersResources from '@/data/resources/mcp-servers.json';
import rulesResources from '@/data/resources/rules.json';
import promptsResources from '@/data/resources/prompts.json';
import agentsResources from '@/data/resources/agents.json';
import tutorialsResources from '@/data/resources/tutorials.json';
import sdksResources from '@/data/resources/sdks.json';
import showcasesResources from '@/data/resources/showcases.json';
import communityResources from '@/data/resources/community.json';

// All resources combined
const ALL_RESOURCES = [
  ...officialResources,
  ...toolsResources,
  ...mcpServersResources,
  ...rulesResources,
  ...promptsResources,
  ...agentsResources,
  ...tutorialsResources,
  ...sdksResources,
  ...showcasesResources,
  ...communityResources,
] as Array<{
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
  addedDate: string;
  lastVerified: string;
}>;

// Map featured reason from JSON to Payload select values
function mapFeaturedReason(reason?: string): string | undefined {
  if (!reason) return undefined;
  const map: Record<string, string> = {
    'Official Source': 'essential',
    'Official Examples': 'essential',
    'Official SDK': 'essential',
    'Official Repository': 'essential',
    'Official Tool': 'essential',
    'Most Popular': 'most-popular',
    "Editor's Pick": 'editors-pick',
    'Trending': 'trending',
    'New': 'new',
    'Essential': 'essential',
  };
  return map[reason] || 'editors-pick';
}

export async function POST() {
  try {
    const payload = await getPayload({ config });

    // Check if categories already exist
    const existingCategories = await payload.find({
      collection: 'categories',
      limit: 1,
    });

    if (existingCategories.totalDocs > 0) {
      return NextResponse.json(
        { error: 'Data already exists. Use DELETE to clear first.' },
        { status: 400 }
      );
    }

    const results = {
      categories: 0,
      tags: 0,
      resources: 0,
      errors: [] as string[],
    };

    // Step 1: Create all categories
    console.log('Creating categories...');
    const categoryMap = new Map<string, number>();

    for (const [i, cat] of RESOURCE_CATEGORIES.entries()) {
      try {
        const created = await payload.create({
          collection: 'categories',
          data: {
            slug: cat.slug,
            name: cat.name,
            shortName: cat.shortName,
            description: cat.description,
            icon: cat.icon,
            color: cat.color as 'violet' | 'blue' | 'cyan' | 'green' | 'yellow' | 'purple' | 'pink' | 'indigo' | 'amber' | 'rose',
            sortOrder: i,
          },
        });
        categoryMap.set(cat.slug, created.id);
        results.categories++;
        console.log(`  Created category: ${cat.name} (ID: ${created.id})`);
      } catch (error) {
        const msg = `Failed to create category ${cat.slug}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(msg);
        results.errors.push(msg);
      }
    }

    // Step 2: Collect and create all unique tags
    console.log('Creating tags...');
    const allTags = new Set<string>();
    ALL_RESOURCES.forEach((resource) => {
      resource.tags.forEach((tag) => allTags.add(tag));
    });

    const tagMap = new Map<string, number>();
    for (const tagName of allTags) {
      try {
        const created = await payload.create({
          collection: 'tags',
          data: {
            name: tagName,
            description: `Resources tagged with "${tagName}"`,
            resourceCount: 0, // Will be updated later
          },
        });
        tagMap.set(tagName, created.id);
        results.tags++;
      } catch (error) {
        const msg = `Failed to create tag ${tagName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(msg);
        results.errors.push(msg);
      }
    }
    console.log(`  Created ${results.tags} tags`);

    // Step 3: Create all resources
    console.log('Creating resources...');
    for (const resource of ALL_RESOURCES) {
      try {
        // Get category ID
        const categoryId = categoryMap.get(resource.category);
        if (!categoryId) {
          results.errors.push(`Category not found for resource: ${resource.title} (category: ${resource.category})`);
          continue;
        }

        // Get tag IDs
        const tagIds = resource.tags
          .map((tag) => tagMap.get(tag))
          .filter((id): id is number => id !== undefined);

        // Parse dates
        const addedDate = new Date(resource.addedDate).toISOString();
        const lastVerified = new Date(resource.lastVerified).toISOString();
        const githubLastUpdated = resource.github?.lastUpdated
          ? new Date(resource.github.lastUpdated).toISOString()
          : undefined;

        await payload.create({
          collection: 'resources',
          data: {
            title: resource.title,
            description: resource.description,
            url: resource.url,
            category: categoryId,
            // subcategory is a relationship - not migrated (would need subcategory ID lookup)
            subcategory: undefined,
            tags: tagIds,
            // difficulty is a relationship - not migrated (would need difficulty level ID lookup)
            difficulty: undefined,
            status: resource.status as 'official' | 'community' | 'beta' | 'deprecated' | 'archived',
            // GitHub is a group field with nested properties
            github: resource.github ? {
              owner: resource.github.owner,
              repo: resource.github.repo,
              stars: resource.github.stars || 0,
              forks: resource.github.forks || 0,
              lastUpdated: githubLastUpdated,
              // language is a relationship - not migrated (would need language ID lookup)
              language: undefined,
            } : undefined,
            version: resource.version,
            namespace: resource.namespace,
            featured: resource.featured || false,
            featuredReason: resource.featured
              ? (mapFeaturedReason(resource.featuredReason) as 'editors-pick' | 'most-popular' | 'new' | 'trending' | 'essential' | undefined)
              : undefined,
            addedDate,
            lastVerified,
          },
        });
        results.resources++;
      } catch (error) {
        const msg = `Failed to create resource "${resource.title}": ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(msg);
        results.errors.push(msg);
      }
    }
    console.log(`  Created ${results.resources} resources`);

    // Step 4: Update tag counts
    console.log('Updating tag counts...');
    for (const [, tagId] of tagMap) {
      const resourcesWithTag = await payload.find({
        collection: 'resources',
        where: { tags: { contains: tagId } },
        limit: 0,
      });
      await payload.update({
        collection: 'tags',
        id: tagId,
        data: { resourceCount: resourcesWithTag.totalDocs },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      results,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to migrate' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const payload = await getPayload({ config });

    // Delete all resources first (due to foreign key constraints)
    const resources = await payload.find({
      collection: 'resources',
      limit: 1000,
    });
    for (const resource of resources.docs) {
      await payload.delete({
        collection: 'resources',
        id: resource.id,
      });
    }

    // Delete all tags
    const tags = await payload.find({
      collection: 'tags',
      limit: 1000,
    });
    for (const tag of tags.docs) {
      await payload.delete({
        collection: 'tags',
        id: tag.id,
      });
    }

    // Delete all categories
    const categories = await payload.find({
      collection: 'categories',
      limit: 100,
    });
    for (const category of categories.docs) {
      await payload.delete({
        collection: 'categories',
        id: category.id,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'All data cleared',
      deleted: {
        resources: resources.totalDocs,
        tags: tags.totalDocs,
        categories: categories.totalDocs,
      },
    });
  } catch (error) {
    console.error('Clear data error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to clear data' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const payload = await getPayload({ config });

    const [categories, tags, resources] = await Promise.all([
      payload.find({ collection: 'categories', limit: 0 }),
      payload.find({ collection: 'tags', limit: 0 }),
      payload.find({ collection: 'resources', limit: 0 }),
    ]);

    return NextResponse.json({
      message: 'Migration status',
      counts: {
        categories: categories.totalDocs,
        tags: tags.totalDocs,
        resources: resources.totalDocs,
      },
      sourceData: {
        categories: RESOURCE_CATEGORIES.length,
        resources: ALL_RESOURCES.length,
        tags: new Set(ALL_RESOURCES.flatMap((r) => r.tags)).size,
      },
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check status' },
      { status: 500 }
    );
  }
}
