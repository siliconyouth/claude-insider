/**
 * RAG (Retrieval Augmented Generation) system for documentation
 * Uses TF-IDF based search to find relevant documentation chunks
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";

// Document chunk for RAG
export interface DocumentChunk {
  id: string;
  title: string;
  section: string;
  content: string;
  url: string;
  category: string;
  keywords: string[];
}

// Search result with relevance score
export interface SearchResult {
  chunk: DocumentChunk;
  score: number;
}

// In-memory document index
let documentIndex: DocumentChunk[] | null = null;
let tfidfIndex: Map<string, Map<string, number>> | null = null;
let idfValues: Map<string, number> | null = null;

/**
 * Tokenize text into words for search
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .filter((word) => !STOP_WORDS.has(word));
}

// Common stop words to filter out
const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "as", "is", "was", "are", "were", "been",
  "be", "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "can", "this", "that", "these", "those", "it",
  "its", "you", "your", "we", "our", "they", "their", "he", "she", "his",
  "her", "what", "which", "who", "whom", "when", "where", "why", "how",
  "all", "each", "every", "both", "few", "more", "most", "other", "some",
  "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too",
  "very", "just", "also", "now", "here", "there", "then", "once", "if",
]);

/**
 * Split content into chunks by sections (headers)
 */
function chunkContent(
  content: string,
  title: string,
  url: string,
  category: string
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];

  // Remove MDX components and code blocks for cleaner text
  const cleanContent = content
    .replace(/<[^>]+>/g, " ")
    .replace(/```[\s\S]*?```/g, "[code block]")
    .replace(/`[^`]+`/g, " ")
    .replace(/\{[^}]+\}/g, " ")
    .replace(/import\s+.*?from\s+['"][^'"]+['"]/g, "")
    .replace(/export\s+/g, "");

  // Split by headers (## or ###)
  const sections = cleanContent.split(/(?=^#{2,3}\s)/m);

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i].trim();
    if (!section) continue;

    // Extract section title
    const headerMatch = section.match(/^#{2,3}\s+(.+?)$/m);
    const sectionTitle = headerMatch ? headerMatch[1].trim() : title;

    // Get section content (without header)
    const sectionContent = headerMatch
      ? section.replace(/^#{2,3}\s+.+?\n/, "").trim()
      : section;

    if (sectionContent.length < 50) continue; // Skip very short sections

    // Extract keywords from content
    const words = tokenize(sectionContent);
    const wordFreq = new Map<string, number>();
    words.forEach((word) => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });

    // Get top keywords by frequency
    const keywords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);

    chunks.push({
      id: `${url}#${i}`,
      title,
      section: sectionTitle,
      content: sectionContent.slice(0, 1500), // Limit chunk size
      url,
      category,
      keywords,
    });
  }

  // If no sections found, use the whole content
  if (chunks.length === 0 && cleanContent.length > 50) {
    const words = tokenize(cleanContent);
    const wordFreq = new Map<string, number>();
    words.forEach((word) => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });

    const keywords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);

    chunks.push({
      id: `${url}#0`,
      title,
      section: title,
      content: cleanContent.slice(0, 1500),
      url,
      category,
      keywords,
    });
  }

  return chunks;
}

/**
 * Load and index all documentation files
 */
export function loadDocumentIndex(): DocumentChunk[] {
  if (documentIndex) return documentIndex;

  const contentDir = path.join(process.cwd(), "content");
  const chunks: DocumentChunk[] = [];

  // Category mapping
  const categories: Record<string, string> = {
    "getting-started": "Getting Started",
    configuration: "Configuration",
    "tips-and-tricks": "Tips & Tricks",
    api: "API Reference",
    integrations: "Integrations",
  };

  // Recursively find all MDX files
  function walkDir(dir: string, category: string = ""): void {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        const newCategory = category || file;
        walkDir(filePath, newCategory);
      } else if (file.endsWith(".mdx")) {
        try {
          const content = fs.readFileSync(filePath, "utf-8");
          const { data: frontmatter, content: mdxContent } = matter(content);

          const relativePath = path.relative(contentDir, filePath);
          const slug = relativePath
            .replace(/\.mdx$/, "")
            .replace(/\/index$/, "")
            .replace(/\\/g, "/");

          const url = `/docs/${slug}`;
          const title = frontmatter.title || slug.split("/").pop() || "Untitled";
          const categoryName = categories[category] || category;

          const fileChunks = chunkContent(mdxContent, title, url, categoryName);
          chunks.push(...fileChunks);
        } catch (error) {
          console.error(`Error processing ${filePath}:`, error);
        }
      }
    }
  }

  walkDir(contentDir);
  documentIndex = chunks;

  // Build TF-IDF index
  buildTfidfIndex(chunks);

  return chunks;
}

/**
 * Build TF-IDF index for search
 */
function buildTfidfIndex(chunks: DocumentChunk[]): void {
  tfidfIndex = new Map();
  const docFreq = new Map<string, number>();

  // Calculate term frequency for each document
  for (const chunk of chunks) {
    const words = tokenize(chunk.content + " " + chunk.title + " " + chunk.section);
    const termFreq = new Map<string, number>();

    for (const word of words) {
      termFreq.set(word, (termFreq.get(word) || 0) + 1);
    }

    // Normalize by document length
    const maxFreq = Math.max(...termFreq.values());
    for (const [term, freq] of termFreq) {
      termFreq.set(term, freq / maxFreq);
    }

    tfidfIndex.set(chunk.id, termFreq);

    // Track document frequency
    const uniqueTerms = new Set(words);
    for (const term of uniqueTerms) {
      docFreq.set(term, (docFreq.get(term) || 0) + 1);
    }
  }

  // Calculate IDF values
  idfValues = new Map();
  const numDocs = chunks.length;
  for (const [term, freq] of docFreq) {
    idfValues.set(term, Math.log(numDocs / (1 + freq)));
  }
}

/**
 * Search documents using TF-IDF scoring
 */
export function searchDocuments(
  query: string,
  limit: number = 5
): SearchResult[] {
  const chunks = loadDocumentIndex();
  if (!tfidfIndex || !idfValues) return [];

  const queryTerms = tokenize(query);
  if (queryTerms.length === 0) return [];

  const scores: { chunk: DocumentChunk; score: number }[] = [];

  for (const chunk of chunks) {
    const docTf = tfidfIndex.get(chunk.id);
    if (!docTf) continue;

    let score = 0;

    // Calculate TF-IDF score
    for (const term of queryTerms) {
      const tf = docTf.get(term) || 0;
      const idf = idfValues.get(term) || 0;
      score += tf * idf;
    }

    // Boost for title/section matches
    const titleLower = chunk.title.toLowerCase();
    const sectionLower = chunk.section.toLowerCase();

    for (const term of queryTerms) {
      if (titleLower.includes(term)) score *= 1.5;
      if (sectionLower.includes(term)) score *= 1.3;
      if (chunk.keywords.includes(term)) score *= 1.2;
    }

    // Boost for exact phrase matches
    const queryLower = query.toLowerCase();
    if (chunk.content.toLowerCase().includes(queryLower)) {
      score *= 2;
    }

    if (score > 0) {
      scores.push({ chunk, score });
    }
  }

  // Sort by score and return top results
  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get context for RAG from search results
 */
export function getRAGContext(query: string, maxChunks: number = 3): string {
  const results = searchDocuments(query, maxChunks);

  if (results.length === 0) {
    return "";
  }

  let context = "\n\nRELEVANT DOCUMENTATION:\n";

  for (const result of results) {
    context += `\n---\n`;
    context += `[${result.chunk.category}] ${result.chunk.title}`;
    if (result.chunk.section !== result.chunk.title) {
      context += ` > ${result.chunk.section}`;
    }
    context += `\nURL: ${result.chunk.url}\n\n`;
    context += result.chunk.content;
    context += `\n`;
  }

  return context;
}

/**
 * Get all available categories and their document counts
 */
export function getDocumentStats(): Record<string, number> {
  const chunks = loadDocumentIndex();
  const stats: Record<string, number> = {};

  for (const chunk of chunks) {
    stats[chunk.category] = (stats[chunk.category] || 0) + 1;
  }

  return stats;
}
