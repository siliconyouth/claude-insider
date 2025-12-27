import type { GlobalConfig } from 'payload';
import { createGlobalRevalidateHook } from '../lib/revalidate';
import { RELATIONSHIP_TYPES } from '../collections/Documents';
import { publicRead, superadminAccess } from '../lib/payload-access';

/**
 * AIPipelineSettings Global
 *
 * System-wide configuration for AI pipeline operations:
 * - Relationship analysis settings (confidence thresholds, types)
 * - Resource enhancement settings (auto-enhance, required fields)
 * - Documentation rewriting settings (source requirements, scheduling)
 * - CLI command templates for Claude Code operations
 * - Cost tracking and rate limits
 *
 * Architecture:
 * This global syncs with the ai_pipeline_settings table in Supabase.
 * AI operations themselves run in Claude Code CLI (subscription-based).
 *
 * Access Control:
 * - Read: Public (needed for CLI scripts)
 * - Update: SUPERADMIN ONLY (sensitive API cost settings)
 */
export const AIPipelineSettings: GlobalConfig = {
  slug: 'ai-pipeline-settings',
  admin: {
    group: 'Settings',
    description: 'Configure AI pipeline operations (analysis, enhancement, rewriting) - Superadmin only',
  },
  access: {
    read: publicRead,
    update: superadminAccess, // Superadmin only - controls API costs
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
        {
          name: 'temperature',
          type: 'number',
          defaultValue: 0.3,
          min: 0,
          max: 1,
          admin: {
            description: 'Model temperature (0 = deterministic, 1 = creative)',
          },
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────
    // Cost Tracking (NEW)
    // ─────────────────────────────────────────────────────────────────
    {
      name: 'costTracking',
      type: 'group',
      label: 'Cost Tracking',
      admin: {
        description: 'Track and limit AI operation costs (Superadmin only)',
      },
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          label: 'Enable Cost Tracking',
          defaultValue: true,
          admin: {
            description: 'Track estimated costs for all AI operations',
          },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'monthlyBudgetUSD',
              type: 'number',
              label: 'Monthly Budget (USD)',
              defaultValue: 100,
              min: 0,
              max: 10000,
              admin: {
                description: 'Monthly spending limit',
                width: '50%',
              },
            },
            {
              name: 'warningThresholdPercent',
              type: 'number',
              label: 'Warning Threshold (%)',
              defaultValue: 80,
              min: 50,
              max: 100,
              admin: {
                description: 'Notify when this % of budget used',
                width: '50%',
              },
            },
          ],
        },
        {
          name: 'pauseOnBudgetExceeded',
          type: 'checkbox',
          label: 'Pause on Budget Exceeded',
          defaultValue: true,
          admin: {
            description: 'Automatically pause AI operations when budget is exceeded',
          },
        },
        {
          name: 'costPerInputToken',
          type: 'number',
          label: 'Cost per Input Token (USD)',
          defaultValue: 0.000015,
          admin: {
            description: 'Estimated cost per input token for Opus 4.5',
          },
        },
        {
          name: 'costPerOutputToken',
          type: 'number',
          label: 'Cost per Output Token (USD)',
          defaultValue: 0.000075,
          admin: {
            description: 'Estimated cost per output token for Opus 4.5',
          },
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────
    // Rate Limits (NEW)
    // ─────────────────────────────────────────────────────────────────
    {
      name: 'rateLimits',
      type: 'group',
      label: 'Rate Limits',
      admin: {
        description: 'Limit AI operation frequency to prevent abuse',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'maxOperationsPerHour',
              type: 'number',
              label: 'Max Operations/Hour',
              defaultValue: 100,
              min: 1,
              max: 1000,
              admin: {
                description: 'Maximum AI operations per hour',
                width: '50%',
              },
            },
            {
              name: 'maxOperationsPerDay',
              type: 'number',
              label: 'Max Operations/Day',
              defaultValue: 500,
              min: 1,
              max: 10000,
              admin: {
                description: 'Maximum AI operations per day',
                width: '50%',
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'maxConcurrentOperations',
              type: 'number',
              label: 'Max Concurrent',
              defaultValue: 3,
              min: 1,
              max: 10,
              admin: {
                description: 'Maximum simultaneous operations',
                width: '50%',
              },
            },
            {
              name: 'cooldownMinutes',
              type: 'number',
              label: 'Cooldown (minutes)',
              defaultValue: 1,
              min: 0,
              max: 60,
              admin: {
                description: 'Minimum time between operations',
                width: '50%',
              },
            },
          ],
        },
        {
          name: 'prioritizeManualRequests',
          type: 'checkbox',
          label: 'Prioritize Manual Requests',
          defaultValue: true,
          admin: {
            description: 'Give manual (admin-initiated) requests higher priority than scheduled ones',
          },
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────
    // Scheduling (NEW)
    // ─────────────────────────────────────────────────────────────────
    {
      name: 'scheduling',
      type: 'group',
      label: 'Scheduling',
      admin: {
        description: 'Configure when automated AI operations run',
      },
      fields: [
        {
          name: 'enableScheduledOperations',
          type: 'checkbox',
          label: 'Enable Scheduled Operations',
          defaultValue: false,
          admin: {
            description: 'Allow AI operations to run on a schedule',
          },
        },
        {
          name: 'preferredTimeUTC',
          type: 'text',
          label: 'Preferred Time (UTC)',
          defaultValue: '03:00',
          admin: {
            description: 'Preferred time for scheduled operations (HH:MM format)',
            condition: (data) => data?.scheduling?.enableScheduledOperations,
          },
        },
        {
          name: 'preferredDays',
          type: 'select',
          label: 'Preferred Days',
          hasMany: true,
          defaultValue: ['sunday'],
          options: [
            { label: 'Monday', value: 'monday' },
            { label: 'Tuesday', value: 'tuesday' },
            { label: 'Wednesday', value: 'wednesday' },
            { label: 'Thursday', value: 'thursday' },
            { label: 'Friday', value: 'friday' },
            { label: 'Saturday', value: 'saturday' },
            { label: 'Sunday', value: 'sunday' },
          ],
          admin: {
            description: 'Days when scheduled operations can run',
            condition: (data) => data?.scheduling?.enableScheduledOperations,
          },
        },
        {
          name: 'maxBatchSize',
          type: 'number',
          label: 'Max Batch Size',
          defaultValue: 50,
          min: 1,
          max: 500,
          admin: {
            description: 'Maximum items to process in one scheduled batch',
            condition: (data) => data?.scheduling?.enableScheduledOperations,
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
