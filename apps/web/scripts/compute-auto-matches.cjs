/**
 * Compute Auto-Matches between Documents and Resources
 *
 * This script computes tag-based matches between documentation pages
 * and curated resources for the cross-linking system.
 *
 * Run: node scripts/compute-auto-matches.cjs
 */

const fs = require('fs');
const path = require('path');

const DOCUMENTS_INDEX = path.join(__dirname, '../data/documents-index.json');
const RESOURCES_DIR = path.join(__dirname, '../data/resources');
const OUTPUT_FILE = path.join(__dirname, '../data/cross-links-index.json');

// Default matching settings
const DEFAULT_SETTINGS = {
  minTagOverlap: 2,
  minScoreThreshold: 0.3,
  maxAutoMatches: 5,
  tagOverlapWeight: 0.6,
  categoryMappingWeight: 0.25,
  titleSimilarityWeight: 0.15,
};

// Category mappings (doc category -> resource categories)
const CATEGORY_MAPPINGS = {
  'getting-started': ['official', 'tools', 'tutorials'],
  configuration: ['rules', 'tools'],
  'tips-and-tricks': ['prompts', 'tutorials'],
  api: ['sdks', 'official'],
  integrations: ['mcp-servers', 'tools', 'sdks'],
  tutorials: ['tutorials', 'showcases'],
  examples: ['showcases', 'community'],
};

// Load all resources from JSON files
function loadAllResources() {
  const resources = [];
  const files = fs.readdirSync(RESOURCES_DIR).filter((f) => f.endsWith('.json'));

  for (const file of files) {
    if (file === 'schema.ts' || file === 'index.ts') continue;
    try {
      const filePath = path.join(RESOURCES_DIR, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (Array.isArray(data)) {
        resources.push(...data);
      }
    } catch {
      // Skip invalid files
    }
  }

  return resources;
}

// Calculate Jaccard similarity
function jaccardSimilarity(set1, set2) {
  if (set1.size === 0 && set2.size === 0) return 0;

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

// Calculate text similarity using word overlap
function textSimilarity(text1, text2) {
  const normalize = (text) =>
    new Set(
      (text || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter((word) => word.length > 2)
    );

  return jaccardSimilarity(normalize(text1), normalize(text2));
}

// Calculate match score between document and resource
function calculateMatchScore(doc, resource) {
  // Tag overlap
  const docTags = new Set((doc.tags || []).map((t) => t.toLowerCase()));
  const resourceTags = new Set((resource.tags || []).map((t) => t.toLowerCase()));
  const matchedTags = [...docTags].filter((tag) => resourceTags.has(tag));
  const tagScore = jaccardSimilarity(docTags, resourceTags);

  // Category mapping bonus
  const mappedCategories = CATEGORY_MAPPINGS[doc.docCategory] || [];
  const categoryBonus = mappedCategories.includes(resource.category) ? 1 : 0;

  // Title similarity
  const titleSimilarity = textSimilarity(doc.title, resource.title);

  // Combined score
  const score =
    tagScore * DEFAULT_SETTINGS.tagOverlapWeight +
    categoryBonus * DEFAULT_SETTINGS.categoryMappingWeight +
    titleSimilarity * DEFAULT_SETTINGS.titleSimilarityWeight;

  return {
    resourceId: resource.id,
    resourceTitle: resource.title,
    resourceCategory: resource.category,
    score: Math.round(score * 1000) / 1000,
    matchedTags,
    tagScore: Math.round(tagScore * 1000) / 1000,
    categoryBonus,
    titleSimilarity: Math.round(titleSimilarity * 1000) / 1000,
  };
}

// Get auto-matched resources for a document
function getAutoMatches(doc, resources) {
  return resources
    .map((resource) => calculateMatchScore(doc, resource))
    .filter((m) => m.score >= DEFAULT_SETTINGS.minScoreThreshold)
    .filter((m) => m.matchedTags.length >= DEFAULT_SETTINGS.minTagOverlap || m.categoryBonus > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, DEFAULT_SETTINGS.maxAutoMatches);
}

// Get documents that relate to a resource
function getRelatedDocs(resource, documents) {
  return documents
    .map((doc) => {
      const score = calculateMatchScore(doc, resource);
      return {
        docSlug: doc.slug,
        docTitle: doc.title,
        docCategory: doc.docCategory,
        ...score,
      };
    })
    .filter((d) => d.score >= DEFAULT_SETTINGS.minScoreThreshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, DEFAULT_SETTINGS.maxAutoMatches);
}

// Main computation function
async function computeAutoMatches() {
  console.log('🔄 Computing auto-matches between documents and resources...\n');

  // Load data
  if (!fs.existsSync(DOCUMENTS_INDEX)) {
    console.error('❌ Documents index not found. Run sync-mdx-to-payload.cjs first.');
    process.exit(1);
  }

  const documentsData = JSON.parse(fs.readFileSync(DOCUMENTS_INDEX, 'utf-8'));
  const documents = documentsData.documents || [];
  const resources = loadAllResources();

  console.log(`📄 Documents: ${documents.length}`);
  console.log(`📚 Resources: ${resources.length}\n`);

  // Compute document -> resources matches
  const docToResources = {};
  let totalDocMatches = 0;

  for (const doc of documents) {
    const matches = getAutoMatches(doc, resources);
    if (matches.length > 0) {
      docToResources[doc.slug] = {
        docTitle: doc.title,
        docCategory: doc.docCategory,
        displayMode: doc.displayMode || 'both',
        autoMatchEnabled: doc.autoMatchEnabled !== false,
        manualResources: doc.relatedResources || [],
        autoMatchedResources: matches,
      };
      totalDocMatches += matches.length;
    }
  }

  // Compute resource -> documents matches
  const resourceToDocs = {};
  let totalResourceMatches = 0;

  for (const resource of resources) {
    const relatedDocs = getRelatedDocs(resource, documents);
    if (relatedDocs.length > 0) {
      resourceToDocs[resource.id] = {
        resourceTitle: resource.title,
        resourceCategory: resource.category,
        relatedDocs,
      };
      totalResourceMatches += relatedDocs.length;
    }
  }

  // Write output
  const output = {
    generatedAt: new Date().toISOString(),
    settings: DEFAULT_SETTINGS,
    categoryMappings: CATEGORY_MAPPINGS,
    stats: {
      totalDocuments: documents.length,
      totalResources: resources.length,
      documentsWithMatches: Object.keys(docToResources).length,
      resourcesWithMatches: Object.keys(resourceToDocs).length,
      totalDocToResourceLinks: totalDocMatches,
      totalResourceToDocLinks: totalResourceMatches,
    },
    docToResources,
    resourceToDocs,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

  // Print summary
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║              Cross-Links Index Generated                      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  console.log(`✓ Documents with matches: ${Object.keys(docToResources).length}/${documents.length}`);
  console.log(`✓ Resources with matches: ${Object.keys(resourceToDocs).length}/${resources.length}`);
  console.log(`✓ Total doc→resource links: ${totalDocMatches}`);
  console.log(`✓ Total resource→doc links: ${totalResourceMatches}`);
  console.log(`✓ Output: ${OUTPUT_FILE}\n`);

  // Top matches by category
  const matchesByCategory = {};
  for (const [slug, data] of Object.entries(docToResources)) {
    const category = data.docCategory;
    matchesByCategory[category] = (matchesByCategory[category] || 0) + data.autoMatchedResources.length;
  }

  console.log('Matches by Doc Category:');
  for (const [category, count] of Object.entries(matchesByCategory).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${category}: ${count}`);
  }
  console.log('');

  return output;
}

// Run if called directly
if (require.main === module) {
  computeAutoMatches().catch(console.error);
}

module.exports = { computeAutoMatches };
