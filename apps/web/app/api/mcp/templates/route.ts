/**
 * MCP Templates API
 *
 * GET /api/mcp/templates - Fetch templates with optional filters
 *
 * Query params:
 * - search: Search query string
 * - category: Filter by category
 * - difficulty: Filter by difficulty
 * - featured: Only return featured templates (boolean)
 * - limit: Maximum number of results
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  searchTemplates,
  getFeaturedTemplates,
  getTemplateById,
  TEMPLATE_CATEGORIES,
  type TemplateCategory,
  type TemplateDifficulty,
} from '@/lib/mcp/templates';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') as TemplateCategory | null;
  const difficulty = searchParams.get('difficulty') as TemplateDifficulty | null;
  const featuredOnly = searchParams.get('featured') === 'true';
  const id = searchParams.get('id');
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  // If requesting a specific template by ID
  if (id) {
    const template = getTemplateById(id);
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ template });
  }

  // Search and filter templates
  const templates = searchTemplates(search, {
    category: category || undefined,
    difficulty: difficulty || undefined,
    featuredOnly,
  }).slice(0, limit);

  // Get category stats for filters
  const categoryStats = Object.entries(TEMPLATE_CATEGORIES).map(([key, meta]) => ({
    id: key,
    ...meta,
    count: searchTemplates('', { category: key as TemplateCategory }).length,
  }));

  return NextResponse.json({
    templates,
    total: templates.length,
    categories: categoryStats,
    featured: getFeaturedTemplates().slice(0, 6),
  });
}
