import type { CollectionConfig, CollectionAfterChangeHook } from 'payload';
import { createRevalidateHook, createDeleteRevalidateHook } from '../lib/revalidate';
import { hasRole } from './Users';
import { notifyAdminsResourceSubmission } from '../lib/admin-notifications';
import { createResourceSyncHook, createResourceDeleteHook } from '../lib/payload/sync-resources';
import type { Resource, Category } from '../payload-types';
import { RELATIONSHIP_TYPES } from './Documents';

/**
 * Resource relationship types (resource-to-resource)
 */
export const RESOURCE_RELATIONSHIP_TYPES = [
  { label: 'Alternative', value: 'alternative' },
  { label: 'Complement', value: 'complement' },
  { label: 'Dependency', value: 'dependency' },
  { label: 'Fork', value: 'fork' },
  { label: 'Successor', value: 'successor' },
  { label: 'Related', value: 'related' },
] as const;

/**
 * Enhancement status options
 */
export const ENHANCEMENT_STATUS = [
  { label: 'Not Enhanced', value: 'not_enhanced' },
  { label: 'Pending Enhancement', value: 'pending' },
  { label: 'Enhanced', value: 'enhanced' },
  { label: 'Needs Update', value: 'needs_update' },
  { label: 'Enhancement Failed', value: 'failed' },
] as const;

/**
 * Hook to notify admins when a resource is submitted for review
 */
const notifyAdminsOnPendingReview: CollectionAfterChangeHook<Resource> = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  const isNewPendingReview = operation === 'create' && doc.publishStatus === 'pending_review';
  const isStatusChangeToPending = operation === 'update' &&
    doc.publishStatus === 'pending_review' &&
    previousDoc?.publishStatus !== 'pending_review';

  if (isNewPendingReview || isStatusChangeToPending) {
    const categoryName = typeof doc.category === 'object' && doc.category
      ? (doc.category as Category).name
      : undefined;

    const user = req.user;

    notifyAdminsResourceSubmission({
      id: doc.id,
      title: doc.title,
      url: doc.url,
      category: categoryName,
      submittedBy: user ? {
        id: String(user.id),
        email: user.email,
        name: (user as { name?: string }).name,
      } : undefined,
      isNew: operation === 'create',
    }).catch((err) => console.error('[Resources] Admin notification error:', err));
  }

  return doc;
};

/**
 * Resources Collection
 *
 * Curated collection of Claude-related tools, libraries, and resources with:
 * - Full publication workflow (draft → pending_review → published)
 * - AI-powered enhancement (summary, features, pros/cons)
 * - Bidirectional relationships to documentation
 * - GitHub stats tracking
 *
 * Architecture:
 * - Manual edits: Done directly in admin panel (free)
 * - AI enhancement: Run via Claude Code CLI (uses subscription, not API credits)
 * - View/manage relationships: Admin panel (free)
 */
export const Resources: CollectionConfig = {
  slug: 'resources',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'publishStatus', 'enhancementStatus', 'featured', 'updatedAt'],
    group: 'Resources',
    listSearchableFields: ['title', 'description', 'url'],
    description: 'Curated resources with AI-powered enhancement and relationship management',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => hasRole(user, ['superadmin']),
  },
  versions: {
    drafts: true,
    maxPerDoc: 10,
  },
  hooks: {
    afterChange: [createRevalidateHook('resources'), notifyAdminsOnPendingReview, createResourceSyncHook()],
    afterDelete: [createDeleteRevalidateHook('resources'), createResourceDeleteHook()],
  },
  fields: [
    // Publication status in sidebar
    {
      name: 'publishStatus',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Published', value: 'published' },
        { label: 'Hidden', value: 'hidden' },
        { label: 'Pending Review', value: 'pending_review' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Draft', value: 'draft' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Publication workflow status',
      },
    },

    // Enhancement status in sidebar
    {
      name: 'enhancementStatus',
      type: 'select',
      defaultValue: 'not_enhanced',
      options: ENHANCEMENT_STATUS.map(s => s),
      admin: {
        position: 'sidebar',
        description: 'AI enhancement status',
      },
    },

    // Tabs for organized content
    {
      type: 'tabs',
      tabs: [
        // ─────────────────────────────────────────────────────────────────
        // Tab 1: Basic Info
        // ─────────────────────────────────────────────────────────────────
        {
          label: 'Basic Info',
          description: 'Core resource information',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
              admin: {
                description: 'Resource title (e.g., "Claude Desktop")',
              },
            },
            {
              name: 'description',
              type: 'textarea',
              required: true,
              admin: {
                description: 'Brief description of the resource',
              },
            },
            {
              name: 'url',
              type: 'text',
              required: true,
              admin: {
                description: 'Primary URL for the resource',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'category',
                  type: 'relationship',
                  relationTo: 'categories',
                  required: true,
                  admin: {
                    description: 'Primary category',
                    width: '50%',
                  },
                },
                {
                  name: 'subcategory',
                  type: 'relationship',
                  relationTo: 'subcategories',
                  admin: {
                    description: 'Subcategory',
                    width: '50%',
                  },
                  filterOptions: ({ data }) => {
                    if (data?.category) {
                      return { category: { equals: data.category } };
                    }
                    return true;
                  },
                },
              ],
            },
            {
              name: 'tags',
              type: 'relationship',
              relationTo: 'tags',
              hasMany: true,
              admin: {
                description: 'Tags for filtering and discovery',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'difficulty',
                  type: 'relationship',
                  relationTo: 'difficulty-levels',
                  admin: {
                    description: 'Skill level required',
                    width: '50%',
                  },
                },
                {
                  name: 'status',
                  type: 'select',
                  required: true,
                  defaultValue: 'community',
                  options: [
                    { label: 'Official (Anthropic)', value: 'official' },
                    { label: 'Community', value: 'community' },
                    { label: 'Beta', value: 'beta' },
                    { label: 'Deprecated', value: 'deprecated' },
                    { label: 'Archived', value: 'archived' },
                  ],
                  admin: {
                    width: '50%',
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'featured',
                  type: 'checkbox',
                  defaultValue: false,
                  admin: {
                    description: 'Show on homepage featured section',
                    width: '50%',
                  },
                },
                {
                  name: 'featuredReason',
                  type: 'select',
                  options: [
                    { label: "Editor's Pick", value: 'editors-pick' },
                    { label: 'Most Popular', value: 'most-popular' },
                    { label: 'New', value: 'new' },
                    { label: 'Trending', value: 'trending' },
                    { label: 'Essential', value: 'essential' },
                  ],
                  admin: {
                    condition: (data) => data?.featured,
                    description: 'Featured badge',
                    width: '50%',
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'addedDate',
                  type: 'date',
                  required: true,
                  admin: {
                    description: 'Date added to collection',
                    width: '50%',
                  },
                },
                {
                  name: 'lastVerified',
                  type: 'date',
                  required: true,
                  admin: {
                    description: 'Last verified as active',
                    width: '50%',
                  },
                },
              ],
            },
          ],
        },

        // ─────────────────────────────────────────────────────────────────
        // Tab 2: AI Enhancement
        // ─────────────────────────────────────────────────────────────────
        {
          label: 'AI Enhancement',
          description: 'AI-generated content (run enhancement in Claude Code)',
          fields: [
            {
              name: 'aiSummary',
              type: 'textarea',
              admin: {
                description: 'AI-generated summary (1-2 paragraphs)',
              },
            },
            {
              name: 'aiOverview',
              type: 'richText',
              admin: {
                description: 'AI-generated detailed overview (MDX-compatible)',
              },
            },
            {
              name: 'keyFeatures',
              type: 'array',
              label: 'Key Features',
              admin: {
                description: 'AI-discovered key features of this resource',
              },
              fields: [
                {
                  name: 'feature',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'description',
                  type: 'textarea',
                },
              ],
            },
            {
              name: 'useCases',
              type: 'array',
              label: 'Use Cases',
              admin: {
                description: 'AI-identified use cases',
              },
              fields: [
                {
                  name: 'useCase',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'description',
                  type: 'textarea',
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'pros',
                  type: 'array',
                  label: 'Pros',
                  admin: {
                    description: 'AI-identified advantages',
                    width: '50%',
                  },
                  fields: [
                    {
                      name: 'pro',
                      type: 'text',
                      required: true,
                    },
                  ],
                },
                {
                  name: 'cons',
                  type: 'array',
                  label: 'Cons',
                  admin: {
                    description: 'AI-identified disadvantages',
                    width: '50%',
                  },
                  fields: [
                    {
                      name: 'con',
                      type: 'text',
                      required: true,
                    },
                  ],
                },
              ],
            },
            {
              name: 'enhancementMetadata',
              type: 'group',
              label: 'Enhancement Details',
              admin: {
                description: 'Details from the most recent AI enhancement',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'aiEnhancedAt',
                      type: 'date',
                      admin: {
                        description: 'Last AI enhancement timestamp',
                        readOnly: true,
                        width: '50%',
                        date: { pickerAppearance: 'dayAndTime' },
                      },
                    },
                    {
                      name: 'aiModel',
                      type: 'text',
                      admin: {
                        description: 'AI model used',
                        readOnly: true,
                        width: '50%',
                      },
                    },
                  ],
                },
                {
                  name: 'enhancementNotes',
                  type: 'textarea',
                  admin: {
                    description: 'Notes from the enhancement run',
                    readOnly: true,
                  },
                },
              ],
            },
            // AI Operations UI
            {
              name: 'aiOperations',
              type: 'ui',
              admin: {
                components: {
                  Field: '@/components/payload/ResourceAIOperations',
                },
              },
            },
          ],
        },

        // ─────────────────────────────────────────────────────────────────
        // Tab 3: Relationships
        // ─────────────────────────────────────────────────────────────────
        {
          label: 'Relationships',
          description: 'Connections to documentation and other resources',
          fields: [
            // Manual doc relationships
            {
              name: 'relatedDocs',
              type: 'relationship',
              relationTo: 'documents',
              hasMany: true,
              admin: {
                description: 'Manually linked documentation pages',
              },
            },
            {
              name: 'autoMatchedDocs',
              type: 'relationship',
              relationTo: 'documents',
              hasMany: true,
              admin: {
                description: 'Auto-matched documents based on shared tags (read-only)',
                readOnly: true,
              },
            },

            // AI-discovered doc relationships
            {
              name: 'aiDocRelationships',
              type: 'array',
              label: 'AI-Discovered Doc Relationships',
              admin: {
                description: 'Relationships to documentation discovered by AI analysis',
                readOnly: true,
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'docSlug',
                      type: 'text',
                      required: true,
                      admin: { description: 'Document slug', width: '50%' },
                    },
                    {
                      name: 'docTitle',
                      type: 'text',
                      admin: { description: 'Document title', width: '50%' },
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
                      admin: { description: 'Type of relationship', width: '50%' },
                    },
                    {
                      name: 'confidence',
                      type: 'number',
                      min: 0,
                      max: 1,
                      admin: { description: 'Confidence score (0.0-1.0)', width: '50%' },
                    },
                  ],
                },
                {
                  name: 'reasoning',
                  type: 'textarea',
                  admin: { description: "AI's reasoning" },
                },
                {
                  name: 'isApproved',
                  type: 'checkbox',
                  defaultValue: false,
                  admin: { description: 'Manually approved by admin' },
                },
              ],
            },

            // Manual resource relationships
            {
              name: 'relatedResources',
              type: 'relationship',
              relationTo: 'resources',
              hasMany: true,
              admin: {
                description: 'Manually linked related resources',
              },
            },

            // AI-discovered resource relationships
            {
              name: 'aiResourceRelationships',
              type: 'array',
              label: 'AI-Discovered Resource Relationships',
              admin: {
                description: 'Relationships to other resources discovered by AI',
                readOnly: true,
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'resourceId',
                      type: 'text',
                      required: true,
                      admin: { description: 'Resource ID', width: '50%' },
                    },
                    {
                      name: 'resourceTitle',
                      type: 'text',
                      admin: { description: 'Resource title', width: '50%' },
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
                      options: RESOURCE_RELATIONSHIP_TYPES.map(t => t),
                      admin: { description: 'Type of relationship', width: '50%' },
                    },
                    {
                      name: 'confidence',
                      type: 'number',
                      min: 0,
                      max: 1,
                      admin: { description: 'Confidence score', width: '50%' },
                    },
                  ],
                },
              ],
            },

            // Relationship stats
            {
              name: 'relationshipCount',
              type: 'number',
              admin: {
                description: 'Total number of relationships',
                readOnly: true,
              },
            },
          ],
        },

        // ─────────────────────────────────────────────────────────────────
        // Tab 4: GitHub & Versioning
        // ─────────────────────────────────────────────────────────────────
        {
          label: 'GitHub & Versioning',
          description: 'Repository information and version tracking',
          fields: [
            {
              name: 'github',
              type: 'group',
              admin: {
                description: 'GitHub repository information',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'owner',
                      type: 'text',
                      admin: { description: 'GitHub username or org', width: '50%' },
                    },
                    {
                      name: 'repo',
                      type: 'text',
                      admin: { description: 'Repository name', width: '50%' },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'stars',
                      type: 'number',
                      defaultValue: 0,
                      admin: { description: 'Star count', width: '33%' },
                    },
                    {
                      name: 'forks',
                      type: 'number',
                      defaultValue: 0,
                      admin: { width: '33%' },
                    },
                    {
                      name: 'lastUpdated',
                      type: 'date',
                      admin: { description: 'Last commit date', width: '34%' },
                    },
                  ],
                },
                {
                  name: 'language',
                  type: 'relationship',
                  relationTo: 'programming-languages',
                  admin: { description: 'Primary programming language' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'version',
                  type: 'text',
                  admin: { description: 'Latest version', width: '50%' },
                },
                {
                  name: 'namespace',
                  type: 'text',
                  admin: { description: 'Package namespace', width: '50%' },
                },
              ],
            },
          ],
        },

        // ─────────────────────────────────────────────────────────────────
        // Tab 5: Discovery & Review
        // ─────────────────────────────────────────────────────────────────
        {
          label: 'Discovery & Review',
          description: 'How this resource was found and its review status',
          fields: [
            {
              name: 'discovery',
              type: 'group',
              label: 'Discovery Information',
              admin: {
                description: 'How this resource was discovered',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'source',
                      type: 'relationship',
                      relationTo: 'resource-sources',
                      admin: { description: 'Discovery source', width: '50%' },
                    },
                    {
                      name: 'discoveredBy',
                      type: 'select',
                      options: [
                        { label: 'AI Discovery', value: 'ai' },
                        { label: 'Manual Entry', value: 'manual' },
                        { label: 'Bulk Import', value: 'import' },
                        { label: 'User Suggestion', value: 'suggestion' },
                      ],
                      admin: { description: 'Discovery method', width: '50%' },
                    },
                  ],
                },
                {
                  name: 'discoveredAt',
                  type: 'date',
                  admin: { description: 'When this resource was discovered' },
                },
                {
                  name: 'aiConfidenceScore',
                  type: 'number',
                  min: 0,
                  max: 100,
                  admin: {
                    description: 'AI confidence score (0-100)',
                    condition: (data) => data?.discovery?.discoveredBy === 'ai',
                  },
                },
                {
                  name: 'aiNotes',
                  type: 'textarea',
                  admin: {
                    description: 'AI analysis notes',
                    condition: (data) => data?.discovery?.discoveredBy === 'ai',
                  },
                },
              ],
            },
            {
              name: 'review',
              type: 'group',
              label: 'Review Information',
              admin: {
                description: 'Review and approval tracking',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'reviewedBy',
                      type: 'relationship',
                      relationTo: 'users',
                      admin: { description: 'Reviewer', width: '50%' },
                    },
                    {
                      name: 'reviewedAt',
                      type: 'date',
                      admin: { description: 'Review date', width: '50%' },
                    },
                  ],
                },
                {
                  name: 'reviewNotes',
                  type: 'textarea',
                  admin: { description: 'Review notes' },
                },
                {
                  name: 'rejectionReason',
                  type: 'textarea',
                  admin: {
                    description: 'Rejection reason',
                    condition: (data) => data?.publishStatus === 'rejected',
                  },
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
