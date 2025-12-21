/**
 * Run Discovery Script
 *
 * Manually triggers resource discovery from all configured sources.
 * This script directly queries the sources and uses the adapters to find resources.
 */

import './lib/env.mjs';
import pg from 'pg';
import { join } from 'path';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

/**
 * Fetch README content from a GitHub awesome list
 */
async function fetchAwesomeList(owner, repo, branch = 'main', path = 'README.md') {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
  console.log(`  Fetching: ${url}`);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      // Try 'master' branch if 'main' fails
      if (branch === 'main') {
        return fetchAwesomeList(owner, repo, 'master', path);
      }
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.log(`  ❌ Failed to fetch: ${error.message}`);
    return null;
  }
}

/**
 * Parse markdown to extract links
 */
function parseMarkdownLinks(markdown) {
  const links = [];

  // Match markdown links: [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;

  while ((match = linkRegex.exec(markdown)) !== null) {
    const title = match[1].trim();
    const url = match[2].trim();

    // Skip anchor links, images, and non-http links
    if (url.startsWith('#') || url.startsWith('mailto:') ||
        /\.(png|jpg|jpeg|gif|svg|ico)$/i.test(url)) {
      continue;
    }

    // Only include relevant URLs (GitHub repos, npm, etc.)
    if (url.includes('github.com') || url.includes('npmjs.com') ||
        url.includes('pypi.org') || url.includes('anthropic') ||
        url.includes('claude') || url.includes('mcp')) {
      links.push({ title, url });
    }
  }

  return links;
}

/**
 * Fetch GitHub repo info
 */
async function fetchGitHubRepo(owner, repo) {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Claude-Insider-Discovery'
  };

  if (GITHUB_TOKEN) {
    headers['Authorization'] = `token ${GITHUB_TOKEN}`;
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Simple progress bar
 */
function progressBar(current, total, width = 25, label = '') {
  const percent = Math.round((current / total) * 100);
  const filled = Math.round((current / total) * width);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  const labelStr = label ? ` ${label}` : '';
  return `[${bar}] ${percent}%${labelStr} (${current}/${total})`;
}

/**
 * Show progress on same line
 */
function showProgress(current, total, label = '') {
  process.stdout.write(`\r  ${progressBar(current, total, 25, label)}    `);
}

/**
 * Clear progress line
 */
function clearProgress() {
  process.stdout.write('\r' + ' '.repeat(70) + '\r');
}

/**
 * Process a single awesome list source
 */
async function processAwesomeList(source, existingUrls) {
  const config = source.github_config;
  if (!config.owner || !config.repo) {
    console.log(`  ⚠️  Missing owner/repo config`);
    return [];
  }

  const markdown = await fetchAwesomeList(
    config.owner,
    config.repo,
    config.branch || 'main',
    config.path || 'README.md'
  );

  if (!markdown) return [];

  const links = parseMarkdownLinks(markdown);
  console.log(`  📋 Found ${links.length} potential links`);

  // Filter out already existing URLs first (skip GitHub API calls for these)
  const newLinks = links.filter(link => !existingUrls.has(link.url));
  const skipped = links.length - newLinks.length;
  if (skipped > 0) {
    console.log(`  ⏭️  Skipping ${skipped} already known URLs`);
  }

  if (newLinks.length === 0) {
    console.log(`  ✓ All links already processed`);
    return [];
  }

  console.log(`  🔄 Enriching ${newLinks.length} new links...`);

  // Enrich with GitHub data where applicable
  const resources = [];
  let processed = 0;

  for (const link of newLinks) {
    processed++;
    showProgress(processed, newLinks.length);

    // Parse GitHub URLs
    const githubMatch = link.url.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/);

    const resource = {
      url: link.url,
      title: link.title,
      description: '',
      sourceType: 'awesome_list',
      metadata: {}
    };

    if (githubMatch) {
      const [, owner, repo] = githubMatch;
      const repoInfo = await fetchGitHubRepo(owner, repo.replace(/\.git$/, ''));

      if (repoInfo) {
        resource.description = repoInfo.description || '';
        resource.metadata.github = {
          owner,
          repo: repo.replace(/\.git$/, ''),
          stars: repoInfo.stargazers_count,
          forks: repoInfo.forks_count,
          language: repoInfo.language,
          topics: repoInfo.topics || []
        };

        // Apply min_stars filter
        if (source.min_stars && repoInfo.stargazers_count < source.min_stars) {
          continue;
        }
      }

      // Rate limit for GitHub API (reduced since we skip existing)
      await new Promise(r => setTimeout(r, 50));
    }

    resources.push(resource);
  }

  clearProgress();
  console.log(`  ✓ Enriched ${resources.length} resources`);

  return resources;
}

/**
 * Process GitHub organization repos
 */
async function processGitHubOrg(source) {
  const config = source.github_config;
  if (!config.owner) {
    console.log(`  ⚠️  Missing owner config`);
    return [];
  }

  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Claude-Insider-Discovery'
  };

  if (GITHUB_TOKEN) {
    headers['Authorization'] = `token ${GITHUB_TOKEN}`;
  }

  try {
    const response = await fetch(
      `https://api.github.com/orgs/${config.owner}/repos?per_page=100&sort=stars`,
      { headers }
    );

    if (!response.ok) {
      // Try as user instead of org
      const userResponse = await fetch(
        `https://api.github.com/users/${config.owner}/repos?per_page=100&sort=stars`,
        { headers }
      );
      if (!userResponse.ok) throw new Error(`HTTP ${response.status}`);
      const repos = await userResponse.json();
      return processRepos(repos, source);
    }

    const repos = await response.json();
    return processRepos(repos, source);
  } catch (error) {
    console.log(`  ❌ Failed to fetch org: ${error.message}`);
    return [];
  }
}

function processRepos(repos, source) {
  return repos
    .filter(repo => !repo.archived && !repo.fork)
    .filter(repo => !source.min_stars || repo.stargazers_count >= source.min_stars)
    .map(repo => ({
      url: repo.html_url,
      title: repo.name,
      description: repo.description || '',
      sourceType: 'github_repo',
      metadata: {
        github: {
          owner: repo.owner.login,
          repo: repo.name,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          language: repo.language,
          topics: repo.topics || []
        }
      }
    }));
}

/**
 * Process a website source (scraping for links)
 */
async function processWebsite(source, existingUrls) {
  console.log(`  🌐 Scraping website: ${source.url}`);

  const resources = [];

  try {
    const response = await fetch(source.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ClaudeInsider/1.0; +https://claudeinsider.com)',
        'Accept': 'text/html,application/xhtml+xml',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    // Extract all links from the page
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]*)</g;
    let match;
    const links = [];

    while ((match = linkRegex.exec(html)) !== null) {
      const url = match[1];
      let title = match[2].trim();

      // Skip empty titles, anchors, and internal links
      if (!title || url.startsWith('#') || url.startsWith('javascript:')) {
        continue;
      }

      // Make relative URLs absolute
      let absoluteUrl = url;
      if (url.startsWith('/')) {
        const baseUrl = new URL(source.url);
        absoluteUrl = `${baseUrl.origin}${url}`;
      } else if (!url.startsWith('http')) {
        continue; // Skip non-http links
      }

      // Filter for relevant URLs (GitHub, npm, etc.)
      if (absoluteUrl.includes('github.com') ||
          absoluteUrl.includes('npmjs.com') ||
          absoluteUrl.includes('pypi.org')) {
        links.push({ url: absoluteUrl, title });
      }
    }

    // Filter out existing URLs
    const newLinks = links.filter(link => !existingUrls.has(link.url));
    console.log(`  📋 Found ${links.length} links, ${newLinks.length} new`);

    if (newLinks.length === 0) {
      console.log(`  ✓ All links already known`);
      return [];
    }

    // Process each link with progress
    let processed = 0;
    for (const link of newLinks) {
      processed++;
      showProgress(processed, newLinks.length);

      // Get GitHub metadata if applicable
      const githubMatch = link.url.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/);
      let metadata = {};

      if (githubMatch) {
        const [, owner, repo] = githubMatch;
        const repoInfo = await fetchGitHubRepo(owner, repo.replace(/\.git$/, ''));

        if (repoInfo) {
          // Apply min_stars filter
          if (source.min_stars && repoInfo.stargazers_count < source.min_stars) {
            continue;
          }

          metadata.github = {
            owner,
            repo: repo.replace(/\.git$/, ''),
            stars: repoInfo.stargazers_count,
            forks: repoInfo.forks_count,
            language: repoInfo.language,
          };

          // Use repo description if title is generic
          if (link.title.length < 5 || link.title === owner || link.title === repo) {
            link.title = repoInfo.name || repo;
          }
        }

        await new Promise(r => setTimeout(r, 50));
      }

      resources.push({
        url: link.url,
        title: link.title,
        description: metadata.github?.description || '',
        sourceType: 'website',
        metadata
      });
    }

    clearProgress();
    console.log(`  ✓ Processed ${resources.length} resources`);
    return resources;
  } catch (error) {
    console.log(`  ❌ Website scraping failed: ${error.message}`);

    // Fallback: add the website itself as a resource
    return [{
      url: source.url,
      title: source.name,
      description: source.description || '',
      sourceType: 'website',
      metadata: {}
    }];
  }
}

/**
 * Process npm registry source
 */
async function processNpm(source, existingUrls) {
  const config = source.registry_config || {};
  const searchQuery = config.search_query || config.searchQuery || 'claude anthropic mcp';
  const scope = config.scope;

  console.log(`  📦 Searching npm for: ${scope || searchQuery}`);

  const resources = [];

  try {
    // If scope is provided, fetch all packages in that scope
    if (scope) {
      const url = `https://registry.npmjs.org/-/v1/search?text=scope:${scope.replace('@', '')}&size=100`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      for (const pkg of data.objects || []) {
        const npmUrl = `https://www.npmjs.com/package/${pkg.package.name}`;
        if (existingUrls.has(npmUrl)) continue;

        resources.push({
          url: npmUrl,
          title: pkg.package.name,
          description: pkg.package.description || '',
          sourceType: 'npm',
          metadata: {
            npm: {
              name: pkg.package.name,
              version: pkg.package.version,
              downloads: pkg.downloads?.weekly || 0,
              author: pkg.package.author?.name || pkg.package.publisher?.username || '',
            }
          }
        });
      }
    } else {
      // Search by keywords
      const keywords = searchQuery.split(' ');
      let keywordIdx = 0;
      for (const keyword of keywords) {
        keywordIdx++;
        showProgress(keywordIdx, keywords.length, keyword);

        const url = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(keyword)}&size=50`;
        const response = await fetch(url);
        if (!response.ok) continue;
        const data = await response.json();

        for (const pkg of data.objects || []) {
          const npmUrl = `https://www.npmjs.com/package/${pkg.package.name}`;
          if (existingUrls.has(npmUrl)) continue;

          // Filter by min downloads if specified
          if (source.min_downloads && (pkg.downloads?.weekly || 0) < source.min_downloads) {
            continue;
          }

          resources.push({
            url: npmUrl,
            title: pkg.package.name,
            description: pkg.package.description || '',
            sourceType: 'npm',
            metadata: {
              npm: {
                name: pkg.package.name,
                version: pkg.package.version,
                downloads: pkg.downloads?.weekly || 0,
                author: pkg.package.author?.name || pkg.package.publisher?.username || '',
              }
            }
          });
        }

        // Rate limit
        await new Promise(r => setTimeout(r, 200));
      }
      clearProgress();
    }

    console.log(`  ✓ Found ${resources.length} npm packages`);
    return resources;
  } catch (error) {
    console.log(`  ❌ npm search failed: ${error.message}`);
    return [];
  }
}

/**
 * Process PyPI registry source
 */
async function processPypi(source, existingUrls) {
  const config = source.registry_config || {};
  const searchQuery = config.search_query || config.searchQuery || 'claude anthropic';

  console.log(`  🐍 Searching PyPI for: ${searchQuery}`);

  const resources = [];

  try {
    // PyPI doesn't have a great search API, so we'll search for known packages
    // and use the JSON API to get package details
    const keywords = searchQuery.split(' ');

    // Build all variations to check
    const allPackages = [];
    for (const keyword of keywords) {
      const variations = [keyword, `${keyword}-ai`, `${keyword}-sdk`, `${keyword}-api`, `py${keyword}`];
      allPackages.push(...variations);
    }

    let checked = 0;
    for (const pkgName of allPackages) {
      checked++;
      showProgress(checked, allPackages.length, pkgName);

      const url = `https://pypi.org/pypi/${pkgName}/json`;
      try {
        const response = await fetch(url);
        if (!response.ok) continue;
        const data = await response.json();

        const pypiUrl = `https://pypi.org/project/${data.info.name}/`;
        if (existingUrls.has(pypiUrl)) continue;

        resources.push({
          url: pypiUrl,
          title: data.info.name,
          description: data.info.summary || '',
          sourceType: 'pypi',
          metadata: {
            pypi: {
              name: data.info.name,
              version: data.info.version,
              author: data.info.author || '',
              license: data.info.license || '',
              requiresPython: data.info.requires_python || '',
            }
          }
        });
      } catch {
        // Package doesn't exist, continue
      }

      await new Promise(r => setTimeout(r, 100));
    }
    clearProgress();

    // Dedupe by URL
    const seen = new Set();
    const unique = resources.filter(r => {
      if (seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    });

    console.log(`  ✓ Found ${unique.length} PyPI packages`);
    return unique;
  } catch (error) {
    console.log(`  ❌ PyPI search failed: ${error.message}`);
    return [];
  }
}

/**
 * Process GitHub search source
 */
async function processGitHubSearch(source, existingUrls) {
  const config = source.github_config || {};
  const searchQuery = config.search_query || config.searchQuery;

  // Handle topics - can be string or array
  let topics = [];
  if (config.topics) {
    if (Array.isArray(config.topics)) {
      topics = config.topics;
    } else if (typeof config.topics === 'string') {
      topics = config.topics.split(',').map(t => t.trim());
    }
  }

  if (!searchQuery && topics.length === 0) {
    console.log(`  ⚠️  Missing search query or topics`);
    return [];
  }

  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Claude-Insider-Discovery'
  };

  if (GITHUB_TOKEN) {
    headers['Authorization'] = `token ${GITHUB_TOKEN}`;
  }

  const resources = [];

  try {
    // Build search query
    let query = searchQuery || '';
    if (topics.length > 0) {
      query += ' ' + topics.map(t => `topic:${t}`).join(' ');
    }
    query = query.trim();

    console.log(`  🔎 Searching GitHub: ${query}`);

    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=100`;
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`  📋 Found ${data.total_count} total, processing top ${data.items?.length || 0}`);

    for (const repo of data.items || []) {
      if (existingUrls.has(repo.html_url)) continue;

      // Apply min_stars filter
      if (source.min_stars && repo.stargazers_count < source.min_stars) {
        continue;
      }

      // Skip archived repos
      if (repo.archived) continue;

      resources.push({
        url: repo.html_url,
        title: repo.full_name,
        description: repo.description || '',
        sourceType: 'github_search',
        metadata: {
          github: {
            owner: repo.owner.login,
            repo: repo.name,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            language: repo.language,
            topics: repo.topics || []
          }
        }
      });
    }

    console.log(`  ✓ Found ${resources.length} repositories`);
    return resources;
  } catch (error) {
    console.log(`  ❌ GitHub search failed: ${error.message}`);
    return [];
  }
}

/**
 * Main discovery function
 */
async function runDiscovery() {
  console.log('=== RUNNING RESOURCE DISCOVERY ===\n');

  // Get all active sources
  const { rows: sources } = await pool.query(`
    SELECT * FROM resource_sources
    WHERE is_active = TRUE
    ORDER BY type, name
  `);

  console.log(`📋 Processing ${sources.length} active sources\n`);

  // Get existing URLs to skip duplicates
  const { rows: existingResources } = await pool.query(
    `SELECT url FROM resources WHERE url IS NOT NULL`
  );
  const existingUrls = new Set(existingResources.map(r => r.url));

  const { rows: existingQueue } = await pool.query(
    `SELECT discovered_url FROM resource_discovery_queue`
  );
  existingQueue.forEach(q => existingUrls.add(q.discovered_url));

  console.log(`📊 ${existingUrls.size} existing URLs to skip\n`);

  let totalDiscovered = 0;
  let totalQueued = 0;

  for (const source of sources) {
    console.log(`\n🔍 ${source.name} (${source.type})`);

    let resources = [];

    try {
      switch (source.type) {
        case 'awesome_list':
          resources = await processAwesomeList(source, existingUrls);
          break;
        case 'github_repo':
          resources = await processGitHubOrg(source);
          break;
        case 'github_search':
          resources = await processGitHubSearch(source, existingUrls);
          break;
        case 'npm':
          resources = await processNpm(source, existingUrls);
          break;
        case 'pypi':
          resources = await processPypi(source, existingUrls);
          break;
        case 'website':
          resources = await processWebsite(source, existingUrls);
          break;
        default:
          console.log(`  ⏭️  Skipping unsupported type: ${source.type}`);
          continue;
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      continue;
    }

    console.log(`  📦 Discovered ${resources.length} resources`);
    totalDiscovered += resources.length;

    // Filter out existing and add to queue
    let queued = 0;
    for (const resource of resources) {
      if (existingUrls.has(resource.url)) continue;

      try {
        await pool.query(`
          INSERT INTO resource_discovery_queue (
            source_id, discovered_url, discovered_title,
            discovered_description, discovered_data, status
          ) VALUES ($1, $2, $3, $4, $5, 'pending')
          ON CONFLICT (discovered_url) DO NOTHING
        `, [
          source.id,
          resource.url,
          resource.title,
          resource.description,
          JSON.stringify(resource.metadata)
        ]);

        existingUrls.add(resource.url);
        queued++;
      } catch (error) {
        // Skip duplicates silently
      }
    }

    console.log(`  ✅ Queued ${queued} new resources`);
    totalQueued += queued;

    // Update source last scan info using the stored procedure
    await pool.query(
      `SELECT mark_source_scanned($1, $2, $3, $4)`,
      [source.id, 'success', queued, null]
    );

    // Rate limit between sources
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n=== DISCOVERY COMPLETE ===');
  console.log(`Total discovered: ${totalDiscovered}`);
  console.log(`Total queued (new): ${totalQueued}`);

  // Show queue stats
  const { rows: queueStats } = await pool.query(`
    SELECT status, COUNT(*) as count
    FROM resource_discovery_queue
    GROUP BY status
  `);

  console.log('\nQueue status:');
  queueStats.forEach(s => console.log(`  ${s.status}: ${s.count}`));

  await pool.end();
}

runDiscovery().catch(console.error);
