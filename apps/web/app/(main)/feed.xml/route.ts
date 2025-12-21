import { generateMainFeed, rssResponse } from "@/lib/rss";

export async function GET() {
  const feed = generateMainFeed();
  return rssResponse(feed);
}
