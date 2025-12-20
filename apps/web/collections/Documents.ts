import type { CollectionConfig } from 'payload';
import { createRevalidateHook, createDeleteRevalidateHook } from '../lib/revalidate';
import { hasRole } from './Users';

/**
 * Relationship types for doc-resource connections
 * These match the types defined in the migration and AI pipeline
 */
export const RELATIONSHIP_TYPES = [
  { label: 'Required', value: 'required' },
  { label: 'Recommended', value: 'recommended' },
  { label: 'Related', value: 'related' },
  { label: 'Example', value: 'example' },
  { label: 'Alternative', value: 'alternative' },
  { label: 'Extends', value: 'extends' },
  { label: 'Implements', value: 'implements' },
] as const;

/**
 * Analysis status options for AI pipeline
 */
export const ANALYSIS_STATUS = [
  { label: 'Pending Analysis', value: 'pending' },
  { label: 'Analyzed', value: 'analyzed' },
  { label: 'Needs Re-analysis', value: 'needs_update' },
  { label: 'Analysis Failed', value: 'failed' },
] as const;

/**
 * Documents Collection
 *
 * Mirrors MDX documentation files in Payload CMS with full AI-assisted
 * relationship management. Documents are synced from the filesystem at
 * build time, with relationships analyzed by Claude Opus 4.5 in Claude Code.
 *
 * Architecture:
 * - Manual edits: Done directly in admin panel (free)
 * - AI analysis: Run via Claude Code CLI (uses subscription, not API credits)
 * - View/manage relationships: Admin panel (free)
 */
export const Documents: CollectionConfig = {
  slug: 'documents',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'docCategory', 'analysisStatus', 'relationshipCount', 'updatedAt'],
    group: 'Content',
    listSearchableFields: ['title', 'slug', 'description'],
    description: 'Documentation pages with AI-powered relationship management',
  },
  access: {
    read: () => true, // Public read for API access
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => hasRole(user, ['superadmin']),
  },
  hooks: {
    afterChange: [createRevalidateHook('documents')],
    afterDelete: [createDeleteRevalidateHook('documents')],
  },
  fields: [
    // Tabs for organized content
    {
      type: 'tabs',
      tabs: [
        // ─────────────────────────────────────────────────────────────────
        // Tab 1: Content (Core document information)
        // ─────────────────────────────────────────────────────────────────
        {
          label: 'Content',
          description: 'Core document information and metadata',
          fields: [
            // Core identification
            {
              name: 'slug',
              type: 'text',
              required: true,
              unique: true,
              admin: {
                description: 'URL path slug (e.g., "getting-started/installation")',
                readOnly: true, // Set by sync script
              },
            },
            {
              name: 'title',
              type: 'text',
              required: true,
              admin: {
                description: 'Document title from frontmatter',
              },
            },
            {
              name: 'description',
              type: 'textarea',
              admin: {
                description: 'Document description from frontmatter',
              },
            },

            // Categorization
            {
              name: 'docCategory',
              type: 'text',
              required: true,
              admin: {
                description: 'Documentation category (e.g., "getting-started", "api")',
                readOnly: true, // Derived from file path
              },
            },
            {
              name: 'tags',
              type: 'relationship',
              relationTo: 'tags',
              hasMany: true,
              admin: {
                description: 'Tags for auto-matching with resources',
              },
            },

            // Sync tracking
            {
              name: 'syncInfo',
              type: 'group',
              admin: {
                description: 'Sync tracking information',
              },
              fields: [
                {
                  name: 'mdxPath',
                  type: 'text',
                  admin: {
                    description: 'Path to source MDX file',
                    readOnly: true,
                  },
                },
                {
                  name: 'contentHash',
                  type: 'text',
                  admin: {
                    description: 'MD5 hash for change detection',
                    readOnly: true,
                  },
                },
                {
                  name: 'lastSynced',
                  type: 'date',
                  admin: {
                    description: 'Last sync timestamp',
                    readOnly: true,
                    date: {
                      pickerAppearance: 'dayAndTime',
                    },
                  },
                },
              ],
            },

            // Metadata
            {
              name: 'metadata',
              type: 'group',
              admin: {
                description: 'Document statistics',
              },
              fields: [
                {
                  name: 'readingTime',
                  type: 'text',
                  admin: {
                    description: 'Estimated reading time',
                    readOnly: true,
                  },
                },
                {
                  name: 'wordCount',
                  type: 'number',
                  admin: {
                    description: 'Word count',
                    readOnly: true,
                  },
                },
                {
                  name: 'headingCount',
                  type: 'number',
                  admin: {
                    description: 'Number of headings/sections',
                    readOnly: true,
                  },
                },
                {
                  name: 'codeBlockCount',
                  type: 'number',
                  admin: {
                    description: 'Number of code blocks',
                    readOnly: true,
                  },
                },
              ],
            },
          ],
        },

        // ─────────────────────────────────────────────────────────────────
        // Tab 2: Relationships (Manual + AI-discovered)
        // ─────────────────────────────────────────────────────────────────
        {
          label: 'Relationships',
          description: 'Manage connections to resources (manual and AI-discovered)',
          fields: [
            // Manual relationship controls
            {
              type: 'row',
              fields: [
                {
                  name: 'displayMode',
                  type: 'select',
                  defaultValue: 'both',
                  options: [
                    { label: 'Hover Tooltips Only', value: 'hover' },
                    { label: 'Full Cards Only', value: 'cards' },
                    { label: 'Both (Recommended)', value: 'both' },
                  ],
                  admin: {
                    description: 'How to display related resources on the doc page',
                    width: '50%',
                  },
                },
                {
                  name: 'autoMatchEnabled',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: {
                    description: 'Enable automatic tag-based matching',
                    width: '50%',
                  },
                },
              ],
            },

            // Manual relationships
            {
              name: 'relatedResources',
              type: 'relationship',
              relationTo: 'resources',
              hasMany: true,
              admin: {
                description: 'Manually linked resources (takes priority over auto-matched)',
              },
            },
            {
              name: 'excludedResources',
              type: 'relationship',
              relationTo: 'resources',
              hasMany: true,
              admin: {
                description: 'Resources to exclude from auto-matching and AI suggestions',
              },
            },

            // Auto-matched (tag-based)
            {
              name: 'autoMatchedResources',
              type: 'relationship',
              relationTo: 'resources',
              hasMany: true,
              admin: {
                description: 'Automatically matched based on shared tags (read-only)',
                readOnly: true,
              },
            },

            // AI-discovered relationships
            {
              name: 'aiRelationships',
              type: 'array',
              label: 'AI-Discovered Relationships',
              admin: {
                description: 'Relationships discovered by Claude Opus 4.5 analysis. Run analysis in Claude Code CLI.',
                readOnly: true,
                initCollapsed: false,
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'resourceId',
                      type: 'text',
                      required: true,
                      admin: {
                        description: 'Resource UUID',
                        width: '50%',
                      },
                    },
                    {
                      name: 'resourceTitle',
                      type: 'text',
                      admin: {
                        description: 'Resource title (for display)',
                        width: '50%',
                      },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'relationshipType',
                      type: 'select',
                      required: true,
                      options: RELATIONSHIP_TYPES.map(t => t),
                      admin: {
                        description: 'Type of relationship',
                        width: '50%',
                      },
                    },
                    {
                      name: 'confidence',
                      type: 'number',
                      min: 0,
                      max: 1,
                      admin: {
                        description: 'Confidence score (0.0-1.0)',
                        width: '50%',
                      },
                    },
                  ],
                },
                {
                  name: 'reasoning',
                  type: 'textarea',
                  admin: {
                    description: "AI's reasoning for this relationship",
                  },
                },
                {
                  name: 'isApproved',
                  type: 'checkbox',
                  defaultValue: false,
                  admin: {
                    description: 'Manually approved by admin',
                  },
                },
              ],
            },

            // Relationship stats (computed)
            {
              name: 'relationshipCount',
              type: 'number',
              admin: {
                description: 'Total number of relationships (manual + AI)',
                readOnly: true,
              },
            },
          ],
        },

        // ─────────────────────────────────────────────────────────────────
        // Tab 3: AI Pipeline (Analysis tracking and operations)
        // ─────────────────────────────────────────────────────────────────
        {
          label: 'AI Pipeline',
          description: 'AI analysis status and operations (run in Claude Code)',
          fields: [
            // Analysis status
            {
              type: 'row',
              fields: [
                {
                  name: 'analysisStatus',
                  type: 'select',
                  defaultValue: 'pending',
                  options: ANALYSIS_STATUS.map(s => s),
                  admin: {
                    description: 'Current analysis status',
                    width: '50%',
                  },
                },
                {
                  name: 'lastAnalyzedAt',
                  type: 'date',
                  admin: {
                    description: 'Last AI analysis timestamp',
                    readOnly: true,
                    width: '50%',
                    date: {
                      pickerAppearance: 'dayAndTime',
                    },
                  },
                },
              ],
            },

            // Analysis metadata
            {
              name: 'analysisMetadata',
              type: 'group',
              label: 'Last Analysis Details',
              admin: {
                description: 'Details from the most recent AI analysis',
              },
              fields: [
                {
                  name: 'aiModel',
                  type: 'text',
                  admin: {
                    description: 'AI model used (e.g., "claude-opus-4-5-20251101")',
                    readOnly: true,
                  },
                },
                {
                  name: 'analysisContentHash',
                  type: 'text',
                  admin: {
                    description: 'Content hash at time of analysis',
                    readOnly: true,
                  },
                },
                {
                  name: 'relationshipsFound',
                  type: 'number',
                  admin: {
                    description: 'Number of relationships found',
                    readOnly: true,
                  },
                },
                {
                  name: 'analysisDuration',
                  type: 'number',
                  admin: {
                    description: 'Analysis duration in seconds',
                    readOnly: true,
                  },
                },
                {
                  name: 'analysisNotes',
                  type: 'textarea',
                  admin: {
                    description: 'Notes from the analysis run',
                    readOnly: true,
                  },
                },
              ],
            },

            // AI Operations UI (CLI command display)
            {
              name: 'aiOperations',
              type: 'ui',
              admin: {
                components: {
                  Field: '@/components/payload/DocumentAIOperations',
                },
              },
            },

            // Rewrite tracking (for future doc rewriting feature)
            {
              name: 'rewriteInfo',
              type: 'group',
              label: 'Documentation Rewrite (Future)',
              admin: {
                description: 'Tracking for AI-powered documentation rewrites',
              },
              fields: [
                {
                  name: 'lastRewriteAt',
                  type: 'date',
                  admin: {
                    description: 'Last AI rewrite timestamp',
                    readOnly: true,
                    date: {
                      pickerAppearance: 'dayAndTime',
                    },
                  },
                },
                {
                  name: 'rewriteStatus',
                  type: 'select',
                  options: [
                    { label: 'Not Scheduled', value: 'none' },
                    { label: 'Queued', value: 'queued' },
                    { label: 'In Progress', value: 'in_progress' },
                    { label: 'Completed', value: 'completed' },
                  ],
                  defaultValue: 'none',
                  admin: {
                    description: 'Rewrite operation status',
                  },
                },
                {
                  name: 'sourceUrls',
                  type: 'array',
                  admin: {
                    description: 'Source URLs for content rewriting',
                  },
                  fields: [
                    {
                      name: 'url',
                      type: 'text',
                      required: true,
                    },
                    {
                      name: 'title',
                      type: 'text',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  timestamps: true,
};
