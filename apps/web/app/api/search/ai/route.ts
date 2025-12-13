import { anthropic, DEFAULT_MODEL } from "@/lib/claude";
import { searchDocuments, type SearchResult } from "@/lib/rag";

export const runtime = "nodejs";
export const maxDuration = 30;

interface AISearchRequest {
  query: string;
  context?: {
    currentPage?: string;
    category?: string;
  };
}

interface AISearchResponse {
  query: string;
  expandedQuery?: string;
  results: Array<{
    title: string;
    section: string;
    url: string;
    category: string;
    snippet: string;
    relevance: "high" | "medium" | "low";
  }>;
  summary?: string;
  suggestedQueries?: string[];
}

/**
 * AI-Powered Search API
 *
 * Enhances traditional search with:
 * 1. Natural language query understanding
 * 2. Query expansion for better results
 * 3. AI-generated result summaries
 * 4. Suggested follow-up queries
 */
export async function POST(request: Request) {
  try {
    const body: AISearchRequest = await request.json();
    const { query, context } = body;

    if (!query || query.trim().length < 2) {
      return Response.json(
        { error: "Query must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Step 1: Use AI to understand and expand the query
    const queryAnalysis = await analyzeQuery(query);

    // Step 2: Search with both original and expanded queries
    const searchTerms = [query, ...(queryAnalysis.expandedTerms || [])];
    const allResults: SearchResult[] = [];

    for (const term of searchTerms) {
      const results = searchDocuments(term, 5, context);
      allResults.push(...results);
    }

    // Deduplicate results by URL
    const uniqueResults = deduplicateResults(allResults);

    // Step 3: Rank and format results
    const formattedResults = uniqueResults.slice(0, 8).map((result) => ({
      title: result.chunk.title,
      section: result.chunk.section,
      url: result.chunk.url,
      category: result.chunk.category,
      snippet: result.chunk.content.slice(0, 200) + "...",
      relevance: getRelevanceLevel(result.score),
    }));

    // Step 4: Generate AI summary if we have results
    let summary: string | undefined;
    let suggestedQueries: string[] | undefined;

    if (formattedResults.length > 0) {
      const aiEnhancement = await generateSearchEnhancement(
        query,
        formattedResults.slice(0, 3)
      );
      summary = aiEnhancement.summary;
      suggestedQueries = aiEnhancement.suggestedQueries;
    }

    const response: AISearchResponse = {
      query,
      expandedQuery: queryAnalysis.expandedTerms?.join(", "),
      results: formattedResults,
      summary,
      suggestedQueries,
    };

    return Response.json(response);
  } catch (error) {
    console.error("AI Search error:", error);
    return Response.json(
      { error: "Search failed. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * Analyze and expand the user's query for better search results
 */
async function analyzeQuery(query: string): Promise<{
  intent: string;
  expandedTerms: string[];
}> {
  try {
    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 256,
      system: `You are a search query analyzer for Claude Code documentation. Given a user's search query, output JSON with:
1. intent: What the user is trying to find (brief description)
2. expandedTerms: Array of 2-3 alternative search terms that would help find relevant documentation

Only output valid JSON, no explanation. Focus on Claude Code, API, MCP, configuration, and development terms.

Example input: "how do i make claude run commands"
Example output: {"intent":"user wants to configure tool permissions","expandedTerms":["bash permissions","tool use configuration","auto approve commands"]}`,
      messages: [{ role: "user", content: query }],
    });

    const content = response.content[0];
    if (content && content.type === "text") {
      const parsed = JSON.parse(content.text);
      return {
        intent: parsed.intent || "",
        expandedTerms: parsed.expandedTerms || [],
      };
    }
  } catch (error) {
    console.error("Query analysis error:", error);
  }

  return { intent: "", expandedTerms: [] };
}

/**
 * Generate AI-powered summary and suggestions for search results
 */
async function generateSearchEnhancement(
  query: string,
  topResults: Array<{ title: string; section: string; snippet: string }>
): Promise<{
  summary: string;
  suggestedQueries: string[];
}> {
  try {
    const resultsContext = topResults
      .map((r) => `- ${r.title} > ${r.section}: ${r.snippet}`)
      .join("\n");

    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 300,
      system: `You help users find information in Claude Code documentation. Given a search query and top results, provide:
1. A brief 1-2 sentence summary of what the user will find
2. 2-3 related follow-up queries they might want to search

Output JSON only: {"summary":"...","suggestedQueries":["...","..."]}`,
      messages: [
        {
          role: "user",
          content: `Query: "${query}"\n\nTop results:\n${resultsContext}`,
        },
      ],
    });

    const content = response.content[0];
    if (content && content.type === "text") {
      const parsed = JSON.parse(content.text);
      return {
        summary: parsed.summary || "",
        suggestedQueries: parsed.suggestedQueries || [],
      };
    }
  } catch (error) {
    console.error("Enhancement generation error:", error);
  }

  return { summary: "", suggestedQueries: [] };
}

/**
 * Deduplicate results by URL, keeping highest score
 */
function deduplicateResults(results: SearchResult[]): SearchResult[] {
  const seen = new Map<string, SearchResult>();

  for (const result of results) {
    const existing = seen.get(result.chunk.url);
    if (!existing || result.score > existing.score) {
      seen.set(result.chunk.url, result);
    }
  }

  return Array.from(seen.values()).sort((a, b) => b.score - a.score);
}

/**
 * Convert numeric score to relevance level
 */
function getRelevanceLevel(score: number): "high" | "medium" | "low" {
  if (score > 2) return "high";
  if (score > 0.5) return "medium";
  return "low";
}
