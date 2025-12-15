/**
 * Translations Collection
 *
 * Manages UI translation strings for the Claude Insider website.
 * Supports all 18 locales with admin editing capabilities.
 *
 * Features:
 * - Namespaced organization (common, navigation, home, etc.)
 * - Localized value field for each language
 * - Context and placeholder documentation
 * - Bulk import/export support
 */

import type { CollectionConfig } from 'payload';
import { hasRole } from './Users';

export const Translations: CollectionConfig = {
  slug: 'translations',
  labels: {
    singular: 'Translation',
    plural: 'Translations',
  },
  admin: {
    group: 'Settings',
    defaultColumns: ['namespace', 'key', 'value', 'updatedAt'],
    useAsTitle: 'key',
    description: 'Manage UI translation strings across all supported languages.',
    listSearchableFields: ['namespace', 'key', 'value', 'context'],
  },
  access: {
    // Read access for authenticated users
    read: ({ req: { user } }) => !!user,
    // Write access for admins and moderators
    create: ({ req: { user } }) => hasRole(user, ['superadmin', 'admin', 'moderator']),
    update: ({ req: { user } }) => hasRole(user, ['superadmin', 'admin', 'moderator']),
    delete: ({ req: { user } }) => hasRole(user, ['superadmin']), // Only superadmin can delete
  },
  fields: [
    {
      name: 'namespace',
      type: 'select',
      required: true,
      options: [
        { label: 'Common', value: 'common' },
        { label: 'Navigation', value: 'navigation' },
        { label: 'Home', value: 'home' },
        { label: 'Search', value: 'search' },
        { label: 'Favorites', value: 'favorites' },
        { label: 'Collections', value: 'collections' },
        { label: 'Reading Lists', value: 'readingLists' },
        { label: 'Notifications', value: 'notifications' },
        { label: 'Profile', value: 'profile' },
        { label: 'Settings', value: 'settings' },
        { label: 'Auth', value: 'auth' },
        { label: 'PWA', value: 'pwa' },
        { label: 'Errors', value: 'errors' },
        { label: 'Footer', value: 'footer' },
      ],
      admin: {
        description: 'The translation namespace (matches JSON file structure)',
      },
    },
    {
      name: 'key',
      type: 'text',
      required: true,
      admin: {
        description: 'The translation key (e.g., "loading", "hero.title", "search.results")',
      },
    },
    {
      name: 'value',
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description: 'The translated string for each language',
      },
    },
    {
      name: 'context',
      type: 'textarea',
      admin: {
        description: 'Optional context to help translators understand where this string appears',
      },
    },
    {
      name: 'placeholders',
      type: 'array',
      admin: {
        description: 'Dynamic placeholders used in the string (e.g., {count}, {query})',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          admin: {
            description: 'Placeholder name without braces (e.g., "count", "query")',
          },
        },
        {
          name: 'description',
          type: 'text',
          admin: {
            description: 'What this placeholder represents',
          },
        },
      ],
    },
  ],
  timestamps: true,
};
