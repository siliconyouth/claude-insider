import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Pool } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env vars
const envContent = readFileSync(join(__dirname, '..', '.env.local'), 'utf-8');
envContent.split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx > 0 && !line.startsWith('#')) {
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    process.env[key] = value;
  }
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Known npm packages for resources
const npmPackages = {
  'anthropic-sdk': '@anthropic-ai/sdk',
  'claude-ai': 'claude-ai',
  'mcp-sdk': '@modelcontextprotocol/sdk',
  'langchain': 'langchain',
  'llamaindex': 'llamaindex',
  'vercel-ai-sdk': 'ai',
  'openai-sdk': 'openai',
  'continue-dev': null, // VS Code extension, not npm
  'cursor': null, // Application, not npm
  'cline': null, // VS Code extension
  'aider': null, // Python-based
  'fastmcp': '@anthropic-ai/fastmcp',
  'create-mcp-server': '@anthropic-ai/create-mcp-server',
};

// Known PyPI packages for resources
const pypiPackages = {
  'anthropic-sdk-python': 'anthropic',
  'aider': 'aider-chat',
  'langchain-python': 'langchain',
  'llamaindex-python': 'llama-index',
  'instructor': 'instructor',
  'marvin': 'marvin',
  'guidance': 'guidance',
  'openai-python': 'openai',
  'fastmcp-python': 'fastmcp',
  'pydantic-ai': 'pydantic-ai',
};

// Fetch npm package info
async function fetchNpmInfo(packageName) {
  try {
    const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(packageName)}`);
    if (!res.ok) return null;
    const data = await res.json();

    // Get weekly downloads
    const downloadsRes = await fetch(`https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(packageName)}`);
    const downloadsData = downloadsRes.ok ? await downloadsRes.json() : { downloads: 0 };

    return {
      name: packageName,
      version: data['dist-tags']?.latest,
      downloads: downloadsData.downloads || 0,
      description: data.description,
      homepage: data.homepage,
      repository: data.repository?.url,
    };
  } catch (e) {
    console.log(`  npm error for ${packageName}:`, e.message);
    return null;
  }
}

// Fetch PyPI package info
async function fetchPypiInfo(packageName) {
  try {
    const res = await fetch(`https://pypi.org/pypi/${encodeURIComponent(packageName)}/json`);
    if (!res.ok) return null;
    const data = await res.json();

    // PyPI doesn't have a direct downloads API, use pypistats
    let downloads = 0;
    try {
      const statsRes = await fetch(`https://pypistats.org/api/packages/${encodeURIComponent(packageName)}/recent`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        downloads = statsData.data?.last_month || 0;
      }
    } catch {}

    return {
      name: packageName,
      version: data.info?.version,
      downloads,
      description: data.info?.summary,
      homepage: data.info?.home_page || data.info?.project_url,
      repository: data.info?.project_urls?.Repository,
    };
  } catch (e) {
    console.log(`  pypi error for ${packageName}:`, e.message);
    return null;
  }
}

async function enrichResources() {
  console.log('=== ENRICHING RESOURCES WITH NPM/PYPI METADATA ===\n');

  // Get all resources
  const { rows: resources } = await pool.query(`
    SELECT id, slug, title, url, category, github_owner, github_repo, npm_package, pypi_package
    FROM resources
    ORDER BY category, title
  `);

  console.log(`Total resources: ${resources.length}\n`);

  let npmUpdates = 0;
  let pypiUpdates = 0;

  for (const resource of resources) {
    const updates = {};
    let hasUpdate = false;

    // Try to identify npm package
    if (!resource.npm_package) {
      // Check known mappings
      const knownNpm = npmPackages[resource.slug];
      if (knownNpm) {
        console.log(`📦 ${resource.title}: Checking npm ${knownNpm}...`);
        const npmInfo = await fetchNpmInfo(knownNpm);
        if (npmInfo) {
          updates.npm_package = knownNpm;
          updates.npm_downloads_weekly = npmInfo.downloads;
          hasUpdate = true;
          console.log(`   ✓ Found: ${npmInfo.downloads.toLocaleString()} weekly downloads`);
        }
      }
      // Check if GitHub repo has package.json (heuristic)
      else if (resource.github_owner && resource.github_repo) {
        // Try @org/repo pattern for official packages
        if (resource.github_owner === 'anthropics') {
          const possibleNpm = `@anthropic-ai/${resource.github_repo}`;
          console.log(`📦 ${resource.title}: Checking npm ${possibleNpm}...`);
          const npmInfo = await fetchNpmInfo(possibleNpm);
          if (npmInfo) {
            updates.npm_package = possibleNpm;
            updates.npm_downloads_weekly = npmInfo.downloads;
            hasUpdate = true;
            console.log(`   ✓ Found: ${npmInfo.downloads.toLocaleString()} weekly downloads`);
          }
        }
      }
    }

    // Try to identify PyPI package
    if (!resource.pypi_package) {
      // Check known mappings
      const knownPypi = pypiPackages[resource.slug];
      if (knownPypi) {
        console.log(`🐍 ${resource.title}: Checking PyPI ${knownPypi}...`);
        const pypiInfo = await fetchPypiInfo(knownPypi);
        if (pypiInfo) {
          updates.pypi_package = knownPypi;
          updates.pypi_downloads_monthly = pypiInfo.downloads;
          hasUpdate = true;
          console.log(`   ✓ Found: ${pypiInfo.downloads.toLocaleString()} monthly downloads`);
        }
      }
    }

    // Apply updates
    if (hasUpdate) {
      const setClauses = [];
      const values = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(updates)) {
        setClauses.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }

      values.push(resource.id);

      await pool.query(
        `UPDATE resources SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex}`,
        values
      );

      if (updates.npm_package) npmUpdates++;
      if (updates.pypi_package) pypiUpdates++;
    }

    // Rate limit to avoid API throttling
    await new Promise(r => setTimeout(r, 100));
  }

  console.log('\n=== SUMMARY ===');
  console.log(`npm packages added: ${npmUpdates}`);
  console.log(`PyPI packages added: ${pypiUpdates}`);

  // Show final counts
  const { rows: npmCount } = await pool.query('SELECT COUNT(*) as count FROM resources WHERE npm_package IS NOT NULL');
  const { rows: pypiCount } = await pool.query('SELECT COUNT(*) as count FROM resources WHERE pypi_package IS NOT NULL');

  console.log(`\nTotal with npm: ${npmCount[0].count}`);
  console.log(`Total with PyPI: ${pypiCount[0].count}`);

  await pool.end();
}

enrichResources().catch(console.error);
