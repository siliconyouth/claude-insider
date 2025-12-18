import type { CollectionConfig } from 'payload';
import { hasRole } from './Users';

/**
 * Email Templates Collection
 *
 * Allows admins to customize transactional email templates via the CMS.
 * Templates use {{variable}} syntax for dynamic content.
 *
 * Available Variables (per template type):
 * - All templates: {{appName}}, {{appUrl}}, {{year}}
 * - verification: {{userName}}, {{verificationUrl}}, {{verificationCode}}
 * - password-reset: {{userName}}, {{resetUrl}}
 * - welcome: {{userName}}
 * - notification: {{userName}}, {{title}}, {{message}}, {{actionUrl}}, {{actionText}}
 * - digest: {{userName}}, {{period}}, {{itemCount}}, {{items}}
 * - mention: {{userName}}, {{mentionedBy}}, {{preview}}, {{link}}
 * - donation-receipt: {{donorName}}, {{amount}}, {{currency}}, {{date}}, {{transactionId}}
 */
export const EmailTemplates: CollectionConfig = {
  slug: 'email-templates',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'status', 'updatedAt'],
    group: 'Settings',
    description: 'Customize transactional email templates sent to users',
  },
  access: {
    // Only admins can view/edit email templates
    read: ({ req: { user } }) => hasRole(user, ['admin', 'superadmin']),
    create: ({ req: { user } }) => hasRole(user, ['superadmin']),
    update: ({ req: { user } }) => hasRole(user, ['admin', 'superadmin']),
    delete: ({ req: { user } }) => hasRole(user, ['superadmin']),
  },
  fields: [
    // ============================================
    // Basic Information
    // ============================================
    {
      name: 'slug',
      type: 'select',
      required: true,
      unique: true,
      options: [
        { label: 'Email Verification', value: 'verification' },
        { label: 'Email Verification (with code)', value: 'verification-code' },
        { label: 'Password Reset', value: 'password-reset' },
        { label: 'Welcome Email', value: 'welcome' },
        { label: 'Notification Email', value: 'notification' },
        { label: 'Daily/Weekly Digest', value: 'digest' },
        { label: 'Mention Notification', value: 'mention' },
        { label: 'New Follower', value: 'follow' },
        { label: 'Comment Reply', value: 'comment-reply' },
        { label: 'Donation Receipt', value: 'donation-receipt' },
        { label: 'Donation Thank You', value: 'donation-thank-you' },
        { label: 'Feedback Confirmation', value: 'feedback-confirmation' },
        { label: 'Admin Alert', value: 'admin-alert' },
        { label: 'Import Complete', value: 'import-complete' },
        { label: 'Discovery Complete', value: 'discovery-complete' },
      ],
      admin: {
        description: 'Select the email type this template is for',
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Friendly name for this template (for admin reference)',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Active', value: 'active' },
      ],
      admin: {
        description: 'Only "Active" templates will be used. Draft templates fall back to default.',
        position: 'sidebar',
      },
    },

    // ============================================
    // Email Content
    // ============================================
    {
      name: 'subject',
      type: 'text',
      required: true,
      admin: {
        description: 'Email subject line. Use {{variables}} for dynamic content.',
      },
    },
    {
      name: 'previewText',
      type: 'text',
      admin: {
        description: 'Preview text shown in email clients (optional). Keep under 100 characters.',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'HTML Content',
          description: 'Rich HTML email content',
          fields: [
            {
              name: 'htmlContent',
              type: 'richText',
              required: true,
              admin: {
                description: 'The main email body. Use {{variables}} for dynamic content.',
              },
            },
          ],
        },
        {
          label: 'Plain Text',
          description: 'Plain text fallback for email clients that don\'t support HTML',
          fields: [
            {
              name: 'plainTextContent',
              type: 'textarea',
              admin: {
                description: 'Plain text version of the email (optional but recommended for accessibility).',
                rows: 10,
              },
            },
          ],
        },
        {
          label: 'Available Variables',
          description: 'Reference for available template variables',
          fields: [
            {
              name: 'variablesInfo',
              type: 'ui',
              admin: {
                components: {
                  Field: '/components/payload/VariablesInfoField',
                },
              },
            },
          ],
        },
      ],
    },

    // ============================================
    // Customization Options
    // ============================================
    {
      name: 'styling',
      type: 'group',
      admin: {
        description: 'Optional styling overrides',
      },
      fields: [
        {
          name: 'primaryColor',
          type: 'text',
          admin: {
            description: 'Primary button/link color (hex, e.g., #2563eb). Leave empty for default gradient.',
          },
        },
        {
          name: 'showLogo',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Show Claude Insider logo in email header',
          },
        },
        {
          name: 'showFooter',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Show standard footer with copyright and unsubscribe link',
          },
        },
      ],
    },

    // ============================================
    // Metadata
    // ============================================
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Internal notes about this template (not sent in emails)',
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
};
