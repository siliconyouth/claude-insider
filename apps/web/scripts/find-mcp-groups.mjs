#!/usr/bin/env node
import './lib/env.mjs';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function findServers(name, pattern) {
  const { rows } = await pool.query(`
    SELECT slug FROM resources
    WHERE category = 'mcp-servers' AND is_published = TRUE
      AND (LOWER(title) LIKE $1 OR LOWER(slug) LIKE $1 OR LOWER(description) LIKE $1)
    ORDER BY title LIMIT 15
  `, [`%${pattern}%`]);

  if (rows.length > 0) {
    console.log(`${name} (${rows.length}): ${rows.map(r => r.slug).join(', ')}`);
  }
  return rows.map(r => r.slug);
}

async function main() {
  const groups = {};

  groups.database = await findServers('Database', 'database');
  groups.postgres = await findServers('Postgres', 'postgres');
  groups.mysql = await findServers('MySQL', 'mysql');
  groups.sqlite = await findServers('SQLite', 'sqlite');
  groups.mongodb = await findServers('MongoDB', 'mongo');
  groups.redis = await findServers('Redis', 'redis');
  groups.filesystem = await findServers('Filesystem', 'filesystem');
  groups.github = await findServers('GitHub', 'github');
  groups.gitlab = await findServers('GitLab', 'gitlab');
  groups.puppeteer = await findServers('Puppeteer', 'puppeteer');
  groups.playwright = await findServers('Playwright', 'playwright');
  groups.slack = await findServers('Slack', 'slack');
  groups.discord = await findServers('Discord', 'discord');
  groups.notion = await findServers('Notion', 'notion');
  groups.obsidian = await findServers('Obsidian', 'obsidian');
  groups.aws = await findServers('AWS', 'aws');
  groups.google = await findServers('Google', 'google');
  groups.azure = await findServers('Azure', 'azure');
  groups.docker = await findServers('Docker', 'docker');
  groups.kubernetes = await findServers('Kubernetes', 'kubernetes');
  groups.memory = await findServers('Memory', 'memory');

  await pool.end();
}

main().catch(console.error);
