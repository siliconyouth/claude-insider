/**
 * Email Template CMS Integration
 *
 * Fetches email templates from Payload CMS and renders them with variables.
 * Falls back to hardcoded templates if CMS template is not found or inactive.
 */

import "server-only";
import { getPayload } from 'payload';
import config from '@/payload.config';

// Common variables available in all templates
const APP_NAME = "Claude Insider";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://claudeinsider.com";

export interface EmailTemplateData {
  id: string;
  slug: string;
  name: string;
  status: 'draft' | 'active';
  subject: string;
  previewText?: string;
  htmlContent: unknown; // Lexical editor format
  plainTextContent?: string;
  styling?: {
    primaryColor?: string;
    showLogo?: boolean;
    showFooter?: boolean;
  };
}

export interface RenderedTemplate {
  subject: string;
  html: string;
  text?: string;
}

/**
 * Fetch an email template from Payload CMS by slug
 * Returns null if not found or not active
 */
export async function getEmailTemplate(slug: string): Promise<EmailTemplateData | null> {
  try {
    const payload = await getPayload({ config });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (payload as any).find({
      collection: 'email-templates',
      where: {
        slug: { equals: slug },
        status: { equals: 'active' },
      },
      limit: 1,
    });

    if (result.docs.length === 0) {
      return null;
    }

    return result.docs[0] as unknown as EmailTemplateData;
  } catch (error) {
    console.error(`[Email Templates] Failed to fetch template "${slug}":`, error);
    return null;
  }
}

/**
 * Replace {{variable}} placeholders with actual values
 */
function interpolateVariables(template: string, variables: Record<string, string>): string {
  // Add common variables
  const allVars: Record<string, string> = {
    appName: APP_NAME,
    appUrl: APP_URL,
    year: new Date().getFullYear().toString(),
    ...variables,
  };

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return allVars[key] ?? match; // Keep original if variable not found
  });
}

/**
 * Convert Lexical editor content to HTML
 * This is a simplified converter - Payload's Lexical editor stores content as JSON
 */
function lexicalToHtml(content: unknown): string {
  if (!content) return '';

  // If it's already a string (plain HTML), return as-is
  if (typeof content === 'string') return content;

  // Handle Lexical JSON format
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lexicalContent = content as any;

  if (!lexicalContent.root?.children) {
    return '';
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function renderNode(node: any): string {
    if (!node) return '';

    switch (node.type) {
      case 'paragraph': {
        const pContent = (node.children || []).map(renderNode).join('');
        return `<p style="margin: 0 0 16px 0; color: #52525b; line-height: 1.6;">${pContent}</p>`;
      }

      case 'heading': {
        const level = node.tag || 'h2';
        const hContent = (node.children || []).map(renderNode).join('');
        const hStyles: Record<string, string> = {
          h1: 'margin: 0 0 20px 0; font-size: 24px; font-weight: 700; color: #18181b;',
          h2: 'margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #18181b;',
          h3: 'margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #18181b;',
          h4: 'margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #18181b;',
        };
        return `<${level} style="${hStyles[level] || hStyles.h2}">${hContent}</${level}>`;
      }

      case 'text': {
        let text = node.text || '';
        // Apply text formatting
        if (node.format) {
          if (node.format & 1) text = `<strong>${text}</strong>`; // Bold
          if (node.format & 2) text = `<em>${text}</em>`; // Italic
          if (node.format & 8) text = `<u>${text}</u>`; // Underline
          if (node.format & 16) text = `<code style="background: #f4f4f5; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${text}</code>`; // Code
        }
        return text;
      }

      case 'link': {
        const linkContent = (node.children || []).map(renderNode).join('');
        const url = node.fields?.url || node.url || '#';
        return `<a href="${url}" style="color: #2563eb; text-decoration: none;">${linkContent}</a>`;
      }

      case 'list': {
        const listTag = node.listType === 'number' ? 'ol' : 'ul';
        const listContent = (node.children || []).map(renderNode).join('');
        return `<${listTag} style="margin: 0 0 16px 0; padding-left: 24px; color: #52525b;">${listContent}</${listTag}>`;
      }

      case 'listitem': {
        const liContent = (node.children || []).map(renderNode).join('');
        return `<li style="margin: 4px 0;">${liContent}</li>`;
      }

      case 'quote': {
        const quoteContent = (node.children || []).map(renderNode).join('');
        return `<blockquote style="margin: 16px 0; padding: 12px 20px; border-left: 4px solid #2563eb; background: #f4f4f5; color: #52525b;">${quoteContent}</blockquote>`;
      }

      case 'horizontalrule':
        return '<hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e5e5;" />';

      default:
        // Recursively render children for unknown node types
        if (node.children) {
          return (node.children as unknown[]).map(renderNode).join('');
        }
        return '';
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return lexicalContent.root.children.map((child: any) => renderNode(child)).join('');
}

/**
 * Wrap content in the base email template
 */
function wrapInEmailTemplate(
  content: string,
  options?: { showLogo?: boolean; showFooter?: boolean; primaryColor?: string }
): string {
  const { showLogo = true, showFooter = true } = options || {};

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${APP_NAME}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        ${showLogo ? `
        <!-- Header -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
          <tr>
            <td style="text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; background: linear-gradient(to right, #7c3aed, #2563eb, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                ${APP_NAME}
              </h1>
            </td>
          </tr>
        </table>
        ` : ''}

        <!-- Content Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 32px;">
              ${content}
            </td>
          </tr>
        </table>

        ${showFooter ? `
        <!-- Footer -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 32px;">
          <tr>
            <td style="text-align: center; color: #71717a; font-size: 14px;">
              <p style="margin: 0 0 8px 0;">
                &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
              </p>
              <p style="margin: 0;">
                <a href="${APP_URL}" style="color: #2563eb; text-decoration: none;">claudeinsider.com</a>
              </p>
            </td>
          </tr>
        </table>
        ` : ''}
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Render an email template with variables
 *
 * @param slug - Template slug (e.g., "verification", "welcome")
 * @param variables - Dynamic variables to interpolate
 * @param fallbackHtml - Fallback HTML if CMS template not found
 * @returns Rendered template or null if neither CMS nor fallback available
 */
export async function renderEmailTemplate(
  slug: string,
  variables: Record<string, string>,
  fallback?: { subject: string; html: string; text?: string }
): Promise<RenderedTemplate | null> {
  // Try to get CMS template first
  const cmsTemplate = await getEmailTemplate(slug);

  if (cmsTemplate) {
    // Render CMS template
    const subject = interpolateVariables(cmsTemplate.subject, variables);
    const htmlContent = lexicalToHtml(cmsTemplate.htmlContent);
    const interpolatedHtml = interpolateVariables(htmlContent, variables);
    const html = wrapInEmailTemplate(interpolatedHtml, cmsTemplate.styling);
    const text = cmsTemplate.plainTextContent
      ? interpolateVariables(cmsTemplate.plainTextContent, variables)
      : undefined;

    return { subject, html, text };
  }

  // Fall back to hardcoded template
  if (fallback) {
    return {
      subject: interpolateVariables(fallback.subject, variables),
      html: interpolateVariables(fallback.html, variables),
      text: fallback.text ? interpolateVariables(fallback.text, variables) : undefined,
    };
  }

  console.warn(`[Email Templates] No template found for slug "${slug}" and no fallback provided`);
  return null;
}

/**
 * Check if a CMS template exists and is active
 */
export async function hasActiveTemplate(slug: string): Promise<boolean> {
  const template = await getEmailTemplate(slug);
  return template !== null;
}

/**
 * List all available template slugs in CMS
 */
export async function listTemplates(): Promise<{ slug: string; name: string; status: string }[]> {
  try {
    const payload = await getPayload({ config });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (payload as any).find({
      collection: 'email-templates',
      limit: 100,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return result.docs.map((doc: any) => ({
      slug: doc.slug as string,
      name: doc.name as string,
      status: doc.status as string,
    }));
  } catch (error) {
    console.error('[Email Templates] Failed to list templates:', error);
    return [];
  }
}

// ============================================
// Template Slug Constants
// ============================================

/**
 * All available email template slugs
 * Use these constants when calling tryCmsTemplate
 */
export const EMAIL_TEMPLATE_SLUGS = {
  VERIFICATION: 'verification',
  VERIFICATION_CODE: 'verification-code',
  PASSWORD_RESET: 'password-reset',
  WELCOME: 'welcome',
  NOTIFICATION: 'notification',
  DIGEST: 'digest',
  MENTION: 'mention',
  FOLLOW: 'follow',
  COMMENT_REPLY: 'comment-reply',
  DONATION_RECEIPT: 'donation-receipt',
  DONATION_THANK_YOU: 'donation-thank-you',
  FEEDBACK_CONFIRMATION: 'feedback-confirmation',
  ADMIN_ALERT: 'admin-alert',
  IMPORT_COMPLETE: 'import-complete',
  DISCOVERY_COMPLETE: 'discovery-complete',
} as const;

export type EmailTemplateSlug = typeof EMAIL_TEMPLATE_SLUGS[keyof typeof EMAIL_TEMPLATE_SLUGS];

// ============================================
// CMS Integration for lib/email.ts
// ============================================

/**
 * Try to use a CMS template, with fallback to hardcoded template.
 * This is the primary function for integrating CMS templates with existing email functions.
 *
 * @param slug - Template slug from EMAIL_TEMPLATE_SLUGS
 * @param variables - Variables to interpolate in the template
 * @param fallbackGenerator - Function that generates the fallback HTML (from lib/email.ts)
 * @returns Rendered template with subject and HTML
 *
 * @example
 * const template = await tryCmsTemplate(
 *   'verification',
 *   { userName: 'John', verificationUrl: 'https://...' },
 *   () => ({ subject: 'Verify your account', html: getVerificationEmailHtml(...) })
 * );
 */
export async function tryCmsTemplate(
  slug: EmailTemplateSlug,
  variables: Record<string, string>,
  fallbackGenerator: () => { subject: string; html: string; text?: string }
): Promise<RenderedTemplate> {
  // Try CMS template first
  const cmsTemplate = await getEmailTemplate(slug);

  if (cmsTemplate) {
    console.log(`[Email Templates] Using CMS template for "${slug}"`);

    const subject = interpolateVariables(cmsTemplate.subject, variables);
    const htmlContent = lexicalToHtml(cmsTemplate.htmlContent);
    const interpolatedHtml = interpolateVariables(htmlContent, variables);
    const html = wrapInEmailTemplate(interpolatedHtml, cmsTemplate.styling);
    const text = cmsTemplate.plainTextContent
      ? interpolateVariables(cmsTemplate.plainTextContent, variables)
      : undefined;

    return { subject, html, text };
  }

  // Fall back to hardcoded template
  console.log(`[Email Templates] Using hardcoded fallback for "${slug}"`);
  const fallback = fallbackGenerator();

  return {
    subject: fallback.subject,
    html: fallback.html,
    text: fallback.text,
  };
}

/**
 * Preview an email template without sending
 * Useful for testing templates in the admin dashboard
 *
 * @param slug - Template slug
 * @param variables - Sample variables for preview
 * @returns Rendered template preview
 */
export async function previewEmailTemplate(
  slug: EmailTemplateSlug,
  variables?: Record<string, string>
): Promise<RenderedTemplate | null> {
  // Default sample variables for preview
  const defaultVariables: Record<string, string> = {
    userName: 'John Doe',
    verificationUrl: `${APP_URL}/verify?token=sample-token`,
    verificationCode: '123456',
    resetUrl: `${APP_URL}/reset-password?token=sample-token`,
    title: 'Sample Notification Title',
    message: 'This is a sample notification message for preview purposes.',
    actionUrl: APP_URL,
    actionText: 'View Now',
    period: 'Dec 1-7, 2025',
    itemCount: '5',
    items: '<li>Sample item 1</li><li>Sample item 2</li>',
    mentionedBy: 'Jane Smith',
    preview: 'Hey @John, check out this resource!',
    link: `${APP_URL}/resources/123`,
    followerName: 'Jane Smith',
    followerUsername: 'janesmith',
    followerUrl: `${APP_URL}/users/janesmith`,
    donorName: 'John Doe',
    amount: '$25.00',
    currency: 'USD',
    date: new Date().toLocaleDateString(),
    transactionId: 'TXN-123456',
    paymentMethod: 'PayPal',
    badgeTier: 'Bronze',
    feedbackType: 'Bug Report',
    ticketId: 'FB-123',
    adminName: 'Admin',
    alertTitle: 'Security Alert',
    alertMessage: 'This is a sample admin alert message.',
    severity: 'warning',
    importType: 'Resources',
    totalCount: '100',
    successCount: '95',
    errorCount: '5',
    sourceUrl: 'https://example.com/resources',
    discoveredCount: '50',
    newCount: '30',
    updatedCount: '20',
    ...variables,
  };

  const cmsTemplate = await getEmailTemplate(slug);

  if (cmsTemplate) {
    const subject = interpolateVariables(cmsTemplate.subject, defaultVariables);
    const htmlContent = lexicalToHtml(cmsTemplate.htmlContent);
    const interpolatedHtml = interpolateVariables(htmlContent, defaultVariables);
    const html = wrapInEmailTemplate(interpolatedHtml, cmsTemplate.styling);
    const text = cmsTemplate.plainTextContent
      ? interpolateVariables(cmsTemplate.plainTextContent, defaultVariables)
      : undefined;

    return { subject, html, text };
  }

  return null;
}

/**
 * Generate button HTML for email templates
 * Use this in CMS templates for consistent button styling
 */
export function generateEmailButton(text: string, url: string): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
      <tr>
        <td style="background: linear-gradient(to right, #7c3aed, #2563eb, #06b6d4); border-radius: 8px;">
          <a href="${url}" style="display: inline-block; padding: 12px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `.trim();
}

/**
 * Seed a default email template (used by seed script)
 */
export async function seedEmailTemplate(template: {
  slug: EmailTemplateSlug;
  name: string;
  status: 'draft' | 'active';
  subject: string;
  previewText?: string;
  htmlContent: string;
  plainTextContent?: string;
  styling?: {
    primaryColor?: string;
    showLogo?: boolean;
    showFooter?: boolean;
  };
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const payload = await getPayload({ config });

    // Check if template already exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (payload as any).find({
      collection: 'email-templates',
      where: { slug: { equals: template.slug } },
      limit: 1,
    });

    if (existing.docs.length > 0) {
      console.log(`[Email Templates] Template "${template.slug}" already exists, skipping`);
      return { success: true, id: existing.docs[0].id };
    }

    // Create new template with Lexical-compatible content
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (payload as any).create({
      collection: 'email-templates',
      data: {
        slug: template.slug,
        name: template.name,
        status: template.status,
        subject: template.subject,
        previewText: template.previewText,
        // Convert plain HTML to Lexical format
        htmlContent: {
          root: {
            type: 'root',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                type: 'paragraph',
                format: '',
                indent: 0,
                version: 1,
                children: [
                  {
                    mode: 'normal',
                    text: template.htmlContent,
                    type: 'text',
                    style: '',
                    detail: 0,
                    format: 0,
                    version: 1,
                  },
                ],
                direction: 'ltr',
              },
            ],
            direction: 'ltr',
          },
        },
        plainTextContent: template.plainTextContent,
        styling: template.styling || {
          showLogo: true,
          showFooter: true,
        },
      },
    });

    console.log(`[Email Templates] Created template "${template.slug}" with ID: ${result.id}`);
    return { success: true, id: result.id };
  } catch (error) {
    console.error(`[Email Templates] Failed to seed template "${template.slug}":`, error);
    return { success: false, error: (error as Error).message };
  }
}
