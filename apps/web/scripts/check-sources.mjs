import './lib/env.mjs';
import pg from 'pg';
import { join } from 'path';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  console.log('=== RESOURCE DISCOVERY SOURCES ===\n');

  // Check resource_sources table (using pg directly)
  const { rows: sources } = await pool.query(`
    SELECT name, type, url, is_active, scan_frequency, default_category
    FROM resource_sources
    ORDER BY type, name
  `);

  console.log(`📋 Discovery Sources Configured: ${sources.length}\n`);

  if (sources.length > 0) {
    // Group by type
    const byType = {};
    sources.forEach(s => {
      if (!byType[s.type]) byType[s.type] = [];
      byType[s.type].push(s);
    });

    for (const [type, items] of Object.entries(byType)) {
      console.log(`\n  ${type.toUpperCase()} (${items.length}):`);
      items.forEach(s => {
        const status = s.is_active ? '✓' : '✗';
        console.log(`    ${status} ${s.name}`);
        console.log(`      ${s.url}`);
        console.log(`      → ${s.default_category || 'no category'} | ${s.scan_frequency}`);
      });
    }
  }

  // Check resources table for analysis
  console.log('\n\n=== CURRENT RESOURCES ANALYSIS ===\n');

  const { rows: resources } = await pool.query(`
    SELECT id, slug, title, category, url, github_owner, github_repo,
           npm_package, npm_downloads_weekly, pypi_package, pypi_downloads_monthly
    FROM resources
    ORDER BY category
  `);

  console.log(`Total resources in DB: ${resources.length}\n`);

  // Analyze by category
  const byCategory = {};
  resources.forEach(r => {
    byCategory[r.category] = (byCategory[r.category] || 0) + 1;
  });
  console.log('By Category:');
  Object.entries(byCategory).sort((a,b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`);
  });

  // Check for awesome list indicators
  const awesomeResources = resources.filter(r =>
    r.url?.includes('awesome') ||
    r.title?.toLowerCase().includes('awesome') ||
    r.slug?.includes('awesome')
  );
  console.log(`\n🌟 Awesome list resources: ${awesomeResources.length}`);
  awesomeResources.forEach(r => {
    console.log(`  - ${r.title}`);
  });

  // GitHub sources
  const withGithub = resources.filter(r => r.github_owner && r.github_repo);
  console.log(`\n📦 Resources with GitHub: ${withGithub.length}`);

  // npm sources with downloads
  const withNpm = resources.filter(r => r.npm_package);
  console.log(`📦 Resources with npm: ${withNpm.length}`);
  if (withNpm.length > 0) {
    console.log('   Top npm packages:');
    withNpm
      .sort((a, b) => (b.npm_downloads_weekly || 0) - (a.npm_downloads_weekly || 0))
      .slice(0, 5)
      .forEach(r => {
        console.log(`     ${r.npm_package}: ${(r.npm_downloads_weekly || 0).toLocaleString()}/week`);
      });
  }

  // pypi sources with downloads
  const withPypi = resources.filter(r => r.pypi_package);
  console.log(`🐍 Resources with PyPI: ${withPypi.length}`);
  if (withPypi.length > 0) {
    console.log('   Top PyPI packages:');
    withPypi
      .sort((a, b) => (b.pypi_downloads_monthly || 0) - (a.pypi_downloads_monthly || 0))
      .slice(0, 5)
      .forEach(r => {
        console.log(`     ${r.pypi_package}: ${(r.pypi_downloads_monthly || 0).toLocaleString()}/month`);
      });
  }

  // Show unique URL domains
  console.log('\n=== URL DOMAIN ANALYSIS ===\n');
  const domains = {};
  resources.forEach(r => {
    try {
      const url = new URL(r.url);
      domains[url.hostname] = (domains[url.hostname] || 0) + 1;
    } catch {}
  });
  console.log('Top domains:');
  Object.entries(domains).sort((a,b) => b[1] - a[1]).slice(0, 10).forEach(([domain, count]) => {
    console.log(`  ${domain}: ${count}`);
  });

  await pool.end();
}

check().catch(console.error);
