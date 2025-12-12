import { getPayload } from 'payload';
import config from '@payload-config';
import { NextResponse } from 'next/server';

/**
 * Seed Reference Data API
 *
 * Seeds the difficulty levels and programming languages collections
 * with initial data. Can be called multiple times (will skip existing).
 */

// Difficulty levels seed data
const DIFFICULTY_LEVELS = [
  {
    name: 'Beginner',
    slug: 'beginner',
    description: 'Suitable for those new to Claude or AI in general',
    color: 'green' as const,
    icon: '🌱',
    sortOrder: 1,
  },
  {
    name: 'Intermediate',
    slug: 'intermediate',
    description: 'For users with some experience using Claude',
    color: 'blue' as const,
    icon: '📚',
    sortOrder: 2,
  },
  {
    name: 'Advanced',
    slug: 'advanced',
    description: 'Requires solid understanding of Claude capabilities',
    color: 'yellow' as const,
    icon: '🚀',
    sortOrder: 3,
  },
  {
    name: 'Expert',
    slug: 'expert',
    description: 'For power users and developers building with Claude',
    color: 'red' as const,
    icon: '💎',
    sortOrder: 4,
  },
];

// Programming languages seed data (with Tailwind color classes)
// Note: Aliases will be added via admin panel to avoid array seeding complexity
const PROGRAMMING_LANGUAGES = [
  { name: 'TypeScript', slug: 'typescript', color: 'blue-600' },
  { name: 'JavaScript', slug: 'javascript', color: 'yellow-500' },
  { name: 'Python', slug: 'python', color: 'emerald-500' },
  { name: 'Rust', slug: 'rust', color: 'amber-700' },
  { name: 'Go', slug: 'go', color: 'cyan-500' },
  { name: 'Java', slug: 'java', color: 'red-600' },
  { name: 'Kotlin', slug: 'kotlin', color: 'violet-600' },
  { name: 'Swift', slug: 'swift', color: 'orange-400' },
  { name: 'C++', slug: 'cpp', color: 'blue-500' },
  { name: 'C#', slug: 'csharp', color: 'fuchsia-600' },
  { name: 'Ruby', slug: 'ruby', color: 'red-500' },
  { name: 'PHP', slug: 'php', color: 'indigo-600' },
  { name: 'Scala', slug: 'scala', color: 'rose-500' },
  { name: 'Shell', slug: 'shell', color: 'teal-600' },
  { name: 'Elixir', slug: 'elixir', color: 'purple-500' },
  { name: 'Lua', slug: 'lua', color: 'purple-600' },
  { name: 'R', slug: 'r', color: 'sky-600' },
  { name: 'Julia', slug: 'julia', color: 'violet-500' },
  { name: 'Dart', slug: 'dart', color: 'sky-400' },
  { name: 'Clojure', slug: 'clojure', color: 'green-600' },
  { name: 'Haskell', slug: 'haskell', color: 'slate-600' },
  { name: 'Objective-C', slug: 'objective-c', color: 'blue-700' },
];

export async function POST() {
  try {
    const payload = await getPayload({ config });
    const results = {
      difficultyLevels: { created: 0, skipped: 0 },
      programmingLanguages: { created: 0, skipped: 0 },
    };

    // Seed difficulty levels
    for (const level of DIFFICULTY_LEVELS) {
      const existing = await payload.find({
        collection: 'difficulty-levels',
        where: { slug: { equals: level.slug } },
        limit: 1,
      });

      if (existing.totalDocs === 0) {
        await payload.create({
          collection: 'difficulty-levels',
          data: level,
        });
        results.difficultyLevels.created++;
      } else {
        results.difficultyLevels.skipped++;
      }
    }

    // Seed programming languages
    for (const lang of PROGRAMMING_LANGUAGES) {
      const existing = await payload.find({
        collection: 'programming-languages',
        where: { slug: { equals: lang.slug } },
        limit: 1,
      });

      if (existing.totalDocs === 0) {
        await payload.create({
          collection: 'programming-languages',
          data: {
            name: lang.name,
            slug: lang.slug,
            color: lang.color,
            // aliases can be added via admin panel
          },
        });
        results.programmingLanguages.created++;
      } else {
        results.programmingLanguages.skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Reference data seeded successfully',
      results,
    });
  } catch (error) {
    console.error('Seed reference data error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to seed reference data' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to seed difficulty levels and programming languages',
    data: {
      difficultyLevels: DIFFICULTY_LEVELS.map((l) => l.name),
      programmingLanguages: PROGRAMMING_LANGUAGES.map((l) => l.name),
    },
  });
}
