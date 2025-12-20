import type { GlobalConfig } from 'payload';
import { createGlobalRevalidateHook } from '../lib/revalidate';
import { RELATIONSHIP_TYPES, ANALYSIS_STATUS } from '../collections/Documents';
import { ENHANCEMENT_STATUS } from '../collections/Resources';

/**
 * AIPipelineSettings Global
 *
 * System-wide configuration for AI pipeline operations:
 * - Relationship analysis settings (confidence thresholds, types)
 * - Resource enhancement settings (auto-enhance, required fields)
 * - Documentation rewriting settings (source requirements, scheduling)
 * - CLI command templates for Claude Code operations
 *
 * Architecture:
 * This global syncs with the ai_pipeline_settings table in Supabase.
 * AI operations themselves run in Claude Code CLI (subscription-based).
 */
export const AIPipelineSettings: GlobalConfig = {
  slug: 'ai-pipeline-settings',
  admin: {
    group: 'Settings',
    description: 'Configure AI pipeline operations (analysis, enhancement, rewriting)',
  },
  access: {
    read: () => true, // Needed for CLI scripts
    update: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'superadmin',
  },
  hooks: {
    afterChange: [createGlobalRevalidateHook('ai-pipeline-settings')],
  },
  fields: [
    // ─────────────────────────────────────────────────────────────────
    // Relationship Analysis
    // ─────────────────────────────────────────────────────────────────
    {
      name: 'relationships',
      type: 'group',
      label: 'Relationship Analysis',
      admin: {
        description: 'Settings for AI-powered relationship discovery between docs and resources',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'minConfidence',
              type: 'number',
              required: true,
              defaultValue: 0.6,
              min: 0,
              max: 1,
              admin: {
                description: 'Minimum confidence score to save a relationship (0-1)',
                width: '50%',
              },
            },
            {
              name: 'maxRelationshipsPerDoc',
              type: 'number',
              required: true,
              defaultValue: 10,
              min: 1,
              max: 50,
              admin: {
                description: 'Maximum AI relationships to discover per document',
                width: '50%',
              },
            },
          ],
        },
        {
          name: 'enabledTypes',
          type: 'select',
          hasMany: true,
          required: true,
          defaultValue: ['required', 'recommended', 'related', 'example'],
          options: RELATIONSHIP_TYPES.map(t => t),
          admin: {
            description: 'Relationship types to discover',
          },
        },
        {
          name: 'autoAnalyzeNewContent',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Automatically queue new documents for analysis (requires CLI execution)',
          },
        },
        {
          name: 'reanalyzeOnContentChange',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Mark documents for re-analysis when content hash changes',
          },
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────
    // Resource Enhancement
    // ─────────────────────────────────────────────────────────────────
    {
      name: 'enhancement',
      type: 'group',
      label: 'Resource Enhancement',
      admin: {
        description: 'Settings for AI-powered resource enhancement (summary, features, pros/cons)',
      },
      fields: [
        {
          name: 'autoEnhanceNewResources',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Automatically queue new resources for enhancement',
          },
        },
        {
          name: 'requiredFields',
          type: 'group',
          label: 'Required Fields',
          admin: {
            description: 'Fields required for a resource to be considered "enhanced"',
          },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'requireSummary',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: { width: '50%' },
                },
                {
                  name: 'requireKeyFeatures',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: { width: '50%' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'requireUseCases',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: { width: '50%' },
                },
                {
                  name: 'requireProsAndCons',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: { width: '50%' },
                },
              ],
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'minFeaturesCount',
              type: 'number',
              defaultValue: 3,
              min: 1,
              max: 20,
              admin: {
                description: 'Minimum key features to generate',
                width: '50%',
              },
            },
            {
              name: 'maxFeaturesCount',
              type: 'number',
              defaultValue: 8,
              min: 1,
              max: 20,
              admin: {
                description: 'Maximum key features to generate',
                width: '50%',
              },
            },
          ],
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────
    // Documentation Rewriting
    // ─────────────────────────────────────────────────────────────────
    {
      name: 'documentation',
      type: 'group',
      label: 'Documentation Rewriting',
      admin: {
        description: 'Settings for AI-powered documentation rewriting from source URLs',
      },
      fields: [
        {
          name: 'autoRewriteSchedule',
          type: 'select',
          defaultValue: 'disabled',
          options: [
            { label: 'Disabled', value: 'disabled' },
            { label: 'Weekly', value: 'weekly' },
            { label: 'Monthly', value: 'monthly' },
          ],
          admin: {
            description: 'Automatic rewrite schedule (queues operations for CLI)',
          },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'requireSourceUrls',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                description: 'Require at least one source URL for rewriting',
                width: '50%',
              },
            },
            {
              name: 'maxSourcesPerDoc',
              type: 'number',
              defaultValue: 5,
              min: 1,
              max: 10,
              admin: {
                description: 'Maximum source URLs to process',
                width: '50%',
              },
            },
          ],
        },
        {
          name: 'preserveSections',
          type: 'select',
          hasMany: true,
          options: [
            { label: 'Code Examples', value: 'code_examples' },
            { label: 'ContentMeta', value: 'content_meta' },
            { label: 'Custom Components', value: 'custom_components' },
          ],
          defaultValue: ['content_meta', 'custom_components'],
          admin: {
            description: 'MDX sections to preserve during rewrite',
          },
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────
    // CLI Commands
    // ─────────────────────────────────────────────────────────────────
    {
      name: 'cliCommands',
      type: 'group',
      label: 'Claude Code CLI Commands',
      admin: {
        description: 'Command templates for running AI operations. These run in Claude Code CLI to use your subscription credits instead of API credits.',
      },
      fields: [
        {
          name: 'analyzeRelationshipsCommand',
          type: 'code',
          admin: {
            language: 'bash',
            description: 'Command to analyze relationships for a single document',
          },
          defaultValue: 'node scripts/analyze-relationships.mjs --slug=<SLUG>',
        },
        {
          name: 'enhanceResourceCommand',
          type: 'code',
          admin: {
            language: 'bash',
            description: 'Command to enhance a single resource',
          },
          defaultValue: 'node scripts/enhance-resources.mjs --id=<ID>',
        },
        {
          name: 'rewriteDocCommand',
          type: 'code',
          admin: {
            language: 'bash',
            description: 'Command to rewrite a single document',
          },
          defaultValue: 'node scripts/rewrite-docs.mjs --slug=<SLUG>',
        },
        {
          name: 'bulkAnalyzeCommand',
          type: 'code',
          admin: {
            language: 'bash',
            description: 'Command to analyze all pending documents',
          },
          defaultValue: 'node scripts/analyze-relationships.mjs --all',
        },
        {
          name: 'bulkEnhanceCommand',
          type: 'code',
          admin: {
            language: 'bash',
            description: 'Command to enhance all pending resources',
          },
          defaultValue: 'node scripts/enhance-resources.mjs --pending',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────
    // Operation Tracking
    // ─────────────────────────────────────────────────────────────────
    {
      name: 'operationTracking',
      type: 'group',
      label: 'Operation Tracking',
      admin: {
        description: 'Settings for tracking AI operations',
      },
      fields: [
        {
          name: 'keepCompletedDays',
          type: 'number',
          defaultValue: 30,
          min: 1,
          max: 365,
          admin: {
            description: 'Days to keep completed operations in history',
          },
        },
        {
          name: 'keepFailedDays',
          type: 'number',
          defaultValue: 90,
          min: 1,
          max: 365,
          admin: {
            description: 'Days to keep failed operations for debugging',
          },
        },
        {
          name: 'notifyOnCompletion',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Send notification when operations complete',
          },
        },
        {
          name: 'notifyOnFailure',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Send notification when operations fail',
          },
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────
    // Model Configuration
    // ─────────────────────────────────────────────────────────────────
    {
      name: 'modelConfig',
      type: 'group',
      label: 'Model Configuration',
      admin: {
        description: 'AI model settings for pipeline operations',
      },
      fields: [
        {
          name: 'preferredModel',
          type: 'select',
          defaultValue: 'claude-opus-4-5-20251101',
          options: [
            { label: 'Claude Opus 4.5 (Recommended)', value: 'claude-opus-4-5-20251101' },
            { label: 'Claude Sonnet 4', value: 'claude-sonnet-4-20250514' },
            { label: 'Claude Haiku 3.5', value: 'claude-3-5-haiku-20241022' },
          ],
          admin: {
            description: 'Preferred model for AI operations',
          },
        },
        {
          name: 'fallbackModel',
          type: 'select',
          defaultValue: 'claude-sonnet-4-20250514',
          options: [
            { label: 'Claude Opus 4.5', value: 'claude-opus-4-5-20251101' },
            { label: 'Claude Sonnet 4', value: 'claude-sonnet-4-20250514' },
            { label: 'Claude Haiku 3.5', value: 'claude-3-5-haiku-20241022' },
          ],
          admin: {
            description: 'Fallback model if preferred is unavailable',
          },
        },
        {
          name: 'maxTokensPerOperation',
          type: 'number',
          defaultValue: 8000,
          min: 1000,
          max: 200000,
          admin: {
            description: 'Maximum tokens per operation',
          },
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────
    // Info Panel
    // ─────────────────────────────────────────────────────────────────
    {
      name: 'infoPanel',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/payload/AIPipelineInfoPanel',
        },
      },
    },
  ],
};
