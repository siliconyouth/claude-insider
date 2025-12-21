import { generateResourcesFeed, rssResponse } from "@/lib/rss";
import { getResourcesForRSS } from "@/lib/resources/queries";

/**
 * GET handler for resources RSS feed
 *
 * Route: /resources/feed.xml
 *
 * Returns the 100 most recently added published resources.
 */
export async function GET() {
  const resources = await getResourcesForRSS();

  const rssItems = resources.map((resource) => ({
    title: resource.title,
    description: resource.description,
    url: resource.url,
    category: resource.category,
    slug: resource.slug,
  }));

  const feed = generateResourcesFeed(rssItems);
  return rssResponse(feed);
}
