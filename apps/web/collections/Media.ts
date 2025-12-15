import type { CollectionConfig } from 'payload';
import { hasRole } from './Users';

/**
 * Media Collection
 *
 * Handles file uploads for:
 * - User avatars (CMS users)
 * - Resource images
 * - Documentation assets
 *
 * Generates responsive image sizes automatically.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'alt', 'mimeType', 'filesize', 'createdAt'],
    group: 'Admin',
    description: 'Uploaded images and files',
  },
  access: {
    // Anyone can read media (needed for displaying images)
    read: () => true,
    // Authenticated users can upload
    create: ({ req: { user } }) => !!user,
    // Users can update their own uploads, superadmins/admins can update any
    update: ({ req: { user } }) => {
      if (!user) return false;
      if (hasRole(user, ['superadmin', 'admin'])) return true;
      // For now, allow any authenticated user to update
      // TODO: Add uploadedBy field and check ownership
      return true;
    },
    // Only superadmins can delete
    delete: ({ req: { user } }) => hasRole(user, ['superadmin']),
  },
  upload: {
    // Store in media directory (relative to Next.js public or configured storage)
    staticDir: 'media',
    // Allowed file types
    mimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'],
    // Generate responsive sizes
    imageSizes: [
      {
        name: 'thumbnail',
        width: 100,
        height: 100,
        position: 'centre',
        formatOptions: {
          format: 'webp',
          options: {
            quality: 80,
          },
        },
      },
      {
        name: 'avatar',
        width: 200,
        height: 200,
        position: 'centre',
        formatOptions: {
          format: 'webp',
          options: {
            quality: 85,
          },
        },
      },
      {
        name: 'card',
        width: 400,
        height: 300,
        position: 'centre',
        formatOptions: {
          format: 'webp',
          options: {
            quality: 85,
          },
        },
      },
      {
        name: 'feature',
        width: 800,
        height: 600,
        position: 'centre',
        formatOptions: {
          format: 'webp',
          options: {
            quality: 85,
          },
        },
      },
    ],
    // Admin UI options
    adminThumbnail: 'thumbnail',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description: 'Alternative text for accessibility (required)',
      },
    },
    {
      name: 'caption',
      type: 'text',
      admin: {
        description: 'Optional caption for the image',
      },
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Avatar', value: 'avatar' },
        { label: 'Resource Image', value: 'resource' },
        { label: 'Documentation', value: 'doc' },
        { label: 'General', value: 'general' },
      ],
      defaultValue: 'general',
      admin: {
        position: 'sidebar',
        description: 'Category for organization',
      },
    },
  ],
  timestamps: true,
};
