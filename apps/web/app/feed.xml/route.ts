import { getAllDocsMeta } from "@/lib/mdx";

export async function GET() {
  const docs = getAllDocsMeta();
  const baseUrl = "https://www.claudeinsider.com";

  // Escape XML special characters
  const escapeXml = (str: string) =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Claude Insider</title>
    <link>${baseUrl}</link>
    <description>Documentation, tips, and guides for Claude AI - your comprehensive resource for Claude Code, API, and integrations.</description>
    <language>en-US</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${baseUrl}/icons/icon-192x192.svg</url>
      <title>Claude Insider</title>
      <link>${baseUrl}</link>
    </image>
    <copyright>Copyright ${new Date().getFullYear()} Vladimir Dukelic</copyright>
    <managingEditor>vladimir@dukelic.com (Vladimir Dukelic)</managingEditor>
    <webMaster>vladimir@dukelic.com (Vladimir Dukelic)</webMaster>
    <category>Technology</category>
    <category>AI</category>
    <category>Documentation</category>
    ${docs
      .map(
        (doc) => `
    <item>
      <title>${escapeXml(doc.title)}</title>
      <link>${baseUrl}/docs/${doc.slug.join("/")}</link>
      <description>${escapeXml(doc.description || "")}</description>
      <guid isPermaLink="true">${baseUrl}/docs/${doc.slug.join("/")}</guid>
      <category>${escapeXml(doc.category)}</category>
    </item>`
      )
      .join("")}
  </channel>
</rss>`;

  return new Response(rss.trim(), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
