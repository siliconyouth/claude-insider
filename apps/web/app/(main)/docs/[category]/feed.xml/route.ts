import {
  generateCategoryFeed,
  getAvailableCategories,
  rssResponse,
  feedNotFound,
} from "@/lib/rss";

interface RouteParams {
  params: Promise<{ category: string }>;
}

/**
 * Generate static params for all category feeds
 */
export async function generateStaticParams() {
  const categories = getAvailableCategories();
  return categories.map((category) => ({ category }));
}

/**
 * GET handler for category-specific RSS feeds
 *
 * Routes:
 * - /docs/getting-started/feed.xml
 * - /docs/configuration/feed.xml
 * - /docs/api/feed.xml
 * - /docs/integrations/feed.xml
 * - /docs/tips-and-tricks/feed.xml
 * - /docs/tutorials/feed.xml
 * - /docs/examples/feed.xml
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const { category } = await params;

  const feed = generateCategoryFeed(category);

  if (!feed) {
    return feedNotFound();
  }

  return rssResponse(feed);
}
