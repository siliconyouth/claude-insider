#!/usr/bin/env node

/**
 * Analyze and Insert Resource Relationships
 *
 * This script analyzes resources and creates relationships based on:
 * - Same GitHub organization
 * - Title/name similarity (same prefix, family of tools)
 * - Description keywords (Claude Code, MCP, etc.)
 * - Category patterns (SDK alternatives, complementary tools)
 *
 * Run with: node scripts/analyze-and-insert-relationships.mjs [--dry-run]
 */

import './lib/env.mjs';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { Pool } = pg;

const DRY_RUN = process.argv.includes('--dry-run');

// Progress bar helper
function progressBar(current, total, width = 40) {
  const percent = current / total;
  const filled = Math.round(width * percent);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `[${bar}] ${Math.round(percent * 100)}% (${current}/${total})`;
}

// Relationship types - Must match CHECK constraint in migration 087:
// 'similar', 'alternative', 'complement', 'prerequisite', 'successor',
// 'uses', 'integrates', 'fork', 'inspired_by'
const RELATIONSHIP_TYPES = {
  same_org: { type: 'similar', confidence: 0.9 },         // Same org = similar tools
  family: { type: 'similar', confidence: 0.85 },          // Same title family = similar
  alternative: { type: 'alternative', confidence: 0.75 }, // Drop-in replacement
  complementary: { type: 'complement', confidence: 0.7 }, // Works well together
  integration: { type: 'integrates', confidence: 0.7 },   // Has integration with target
  dependency: { type: 'uses', confidence: 0.8 },          // Source uses target internally
  extension: { type: 'uses', confidence: 0.75 },          // Extension uses the base
};

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  console.log('\n🔍 Resource Relationship Analyzer');
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No changes will be saved\n');
  }

  try {
    // Load all resources
    console.log('📦 Loading resources...');
    const resources = await pool.query(`
      SELECT
        r.id, r.slug, r.title, r.description, r.category,
        r.github_owner, r.github_repo, r.npm_package, r.pypi_package
      FROM resources r
      WHERE r.is_published = true
      ORDER BY r.category, r.title
    `);
    console.log(`   Loaded ${resources.rows.length} resources\n`);

    // Group by various criteria
    const byGithubOrg = {};
    const byCategory = {};
    const byNpmScope = {};
    const claudeCodeTools = [];
    const mcpServers = [];
    const agentFrameworks = [];

    for (const r of resources.rows) {
      // By GitHub org
      if (r.github_owner) {
        const org = r.github_owner.toLowerCase();
        if (!byGithubOrg[org]) byGithubOrg[org] = [];
        byGithubOrg[org].push(r);
      }

      // By category
      if (!byCategory[r.category]) byCategory[r.category] = [];
      byCategory[r.category].push(r);

      // By npm scope
      if (r.npm_package?.startsWith('@')) {
        const scope = r.npm_package.split('/')[0];
        if (!byNpmScope[scope]) byNpmScope[scope] = [];
        byNpmScope[scope].push(r);
      }

      // Claude Code related
      if (r.title?.toLowerCase().includes('claude') ||
          r.description?.toLowerCase().includes('claude code') ||
          r.description?.toLowerCase().includes('claude desktop')) {
        claudeCodeTools.push(r);
      }

      // MCP servers
      if (r.category === 'mcp-servers' ||
          r.title?.toLowerCase().includes('mcp') ||
          r.description?.toLowerCase().includes('model context protocol')) {
        mcpServers.push(r);
      }

      // Agent frameworks
      if (r.category === 'agents' ||
          r.description?.toLowerCase().includes('agent framework') ||
          r.description?.toLowerCase().includes('multi-agent')) {
        agentFrameworks.push(r);
      }
    }

    const relationships = [];

    // ═══════════════════════════════════════════════════════════════
    // PASS 1: Same GitHub Organization
    // ═══════════════════════════════════════════════════════════════
    console.log('🏢 Pass 1: Analyzing same-org relationships...');
    let pass1Count = 0;
    const orgs = Object.entries(byGithubOrg).filter(([, items]) => items.length > 1);

    for (const [org, items] of orgs) {
      process.stdout.write(`\r   ${progressBar(pass1Count++, orgs.length)}`);

      // Connect all items from same org
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          relationships.push({
            source: items[i].id,
            target: items[j].id,
            ...RELATIONSHIP_TYPES.same_org,
            reason: `Same GitHub org: ${org}`
          });
        }
      }
    }
    console.log(`\n   Found ${relationships.length} same-org relationships\n`);

    // ═══════════════════════════════════════════════════════════════
    // PASS 2: Title Families (e.g., BabyAGI variants)
    // ═══════════════════════════════════════════════════════════════
    console.log('👨‍👩‍👧‍👦 Pass 2: Analyzing title family relationships...');
    const families = {};
    const familyPrefixes = ['baby', 'auto', 'agent', 'claude', 'ai-', 'gpt-', 'llm-'];

    for (const r of resources.rows) {
      const titleLower = r.title?.toLowerCase() || '';
      for (const prefix of familyPrefixes) {
        if (titleLower.startsWith(prefix) && titleLower.length > prefix.length + 2) {
          const key = prefix;
          if (!families[key]) families[key] = [];
          families[key].push(r);
          break;
        }
      }
    }

    let pass2Added = 0;
    for (const [prefix, items] of Object.entries(families)) {
      if (items.length < 2 || items.length > 20) continue; // Skip too small or too large groups

      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          // Check if not already added
          const exists = relationships.some(r =>
            (r.source === items[i].id && r.target === items[j].id) ||
            (r.source === items[j].id && r.target === items[i].id)
          );
          if (!exists) {
            relationships.push({
              source: items[i].id,
              target: items[j].id,
              ...RELATIONSHIP_TYPES.family,
              reason: `Same title family: ${prefix}*`
            });
            pass2Added++;
          }
        }
      }
    }
    console.log(`   Found ${pass2Added} family relationships\n`);

    // ═══════════════════════════════════════════════════════════════
    // PASS 3: npm Scope Relationships
    // ═══════════════════════════════════════════════════════════════
    console.log('📦 Pass 3: Analyzing npm scope relationships...');
    let pass3Added = 0;
    const scopes = Object.entries(byNpmScope).filter(([, items]) => items.length > 1 && items.length < 30);

    for (const [scope, items] of scopes) {
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const exists = relationships.some(r =>
            (r.source === items[i].id && r.target === items[j].id) ||
            (r.source === items[j].id && r.target === items[i].id)
          );
          if (!exists) {
            relationships.push({
              source: items[i].id,
              target: items[j].id,
              ...RELATIONSHIP_TYPES.same_org,
              reason: `Same npm scope: ${scope}`
            });
            pass3Added++;
          }
        }
      }
    }
    console.log(`   Found ${pass3Added} npm scope relationships\n`);

    // ═══════════════════════════════════════════════════════════════
    // PASS 4: Claude Code Tool Ecosystem
    // ═══════════════════════════════════════════════════════════════
    console.log('🤖 Pass 4: Analyzing Claude Code ecosystem...');
    let pass4Added = 0;

    // Connect Claude-related tools (limit to avoid too many connections)
    const claudeToolsLimited = claudeCodeTools.slice(0, 50);
    for (let i = 0; i < claudeToolsLimited.length; i++) {
      for (let j = i + 1; j < claudeToolsLimited.length; j++) {
        const exists = relationships.some(r =>
          (r.source === claudeToolsLimited[i].id && r.target === claudeToolsLimited[j].id) ||
          (r.source === claudeToolsLimited[j].id && r.target === claudeToolsLimited[i].id)
        );
        if (!exists) {
          relationships.push({
            source: claudeToolsLimited[i].id,
            target: claudeToolsLimited[j].id,
            ...RELATIONSHIP_TYPES.complementary,
            reason: 'Claude Code ecosystem tool'
          });
          pass4Added++;
        }
      }
    }
    console.log(`   Found ${pass4Added} Claude ecosystem relationships\n`);

    // ═══════════════════════════════════════════════════════════════
    // PASS 5: Agent Framework Alternatives
    // ═══════════════════════════════════════════════════════════════
    console.log('🤝 Pass 5: Analyzing agent framework alternatives...');
    let pass5Added = 0;

    // Key agent frameworks that are alternatives to each other
    const keyAgents = agentFrameworks.filter(r =>
      r.title?.match(/^(AutoGen|CrewAI|LangChain|LangGraph|Agents|AgentVerse|BabyAGI|AgentForge|Swarm)/i)
    ).slice(0, 20);

    for (let i = 0; i < keyAgents.length; i++) {
      for (let j = i + 1; j < keyAgents.length; j++) {
        const exists = relationships.some(r =>
          (r.source === keyAgents[i].id && r.target === keyAgents[j].id) ||
          (r.source === keyAgents[j].id && r.target === keyAgents[i].id)
        );
        if (!exists) {
          relationships.push({
            source: keyAgents[i].id,
            target: keyAgents[j].id,
            ...RELATIONSHIP_TYPES.alternative,
            reason: 'Alternative agent framework'
          });
          pass5Added++;
        }
      }
    }
    console.log(`   Found ${pass5Added} agent alternative relationships\n`);

    // ═══════════════════════════════════════════════════════════════
    // INSERT RELATIONSHIPS
    // ═══════════════════════════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`📊 Total relationships found: ${relationships.length}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (DRY_RUN) {
      console.log('📋 Sample relationships (first 20):');
      for (const rel of relationships.slice(0, 20)) {
        console.log(`   ${rel.type} (${rel.confidence}): ${rel.reason}`);
      }
      console.log('\n⚠️  DRY RUN - No changes saved. Run without --dry-run to insert.\n');
    } else {
      console.log('💾 Inserting relationships...');
      let inserted = 0;
      let updated = 0;
      let errors = 0;

      for (let i = 0; i < relationships.length; i++) {
        const rel = relationships[i];
        process.stdout.write(`\r   ${progressBar(i + 1, relationships.length)}`);

        try {
          const result = await pool.query(`
            INSERT INTO resource_relationships (
              source_resource_id, target_resource_id, relationship_type,
              confidence_score, ai_model, ai_reasoning, is_bidirectional, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, TRUE, TRUE)
            ON CONFLICT (source_resource_id, target_resource_id)
            DO UPDATE SET
              relationship_type = EXCLUDED.relationship_type,
              confidence_score = EXCLUDED.confidence_score,
              ai_reasoning = EXCLUDED.ai_reasoning,
              analyzed_at = NOW()
            RETURNING (xmax = 0) as is_insert
          `, [
            rel.source,
            rel.target,
            rel.type,
            rel.confidence,
            'claude-code-analysis',
            rel.reason
          ]);

          if (result.rows[0]?.is_insert) {
            inserted++;
          } else {
            updated++;
          }
        } catch (err) {
          errors++;
          if (errors <= 5) {
            console.error(`\n   Error: ${err.message}`);
          }
        }
      }

      console.log(`\n\n✅ Complete!`);
      console.log(`   Inserted: ${inserted}`);
      console.log(`   Updated: ${updated}`);
      console.log(`   Errors: ${errors}\n`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
