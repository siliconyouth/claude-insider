'use client';

/**
 * VariablesInfoField - Custom Payload UI Field
 *
 * Displays available template variables for email templates.
 * This is a read-only reference field for admins.
 */

import React, { useState } from 'react';

// Variable documentation per template type
const TEMPLATE_VARIABLES: Record<string, { name: string; description: string }[]> = {
  // Common variables available in ALL templates
  _common: [
    { name: '{{appName}}', description: 'Application name (Claude Insider)' },
    { name: '{{appUrl}}', description: 'Application URL (https://claudeinsider.com)' },
    { name: '{{year}}', description: 'Current year (e.g., 2025)' },
  ],

  verification: [
    { name: '{{userName}}', description: "Recipient's name (if available)" },
    { name: '{{verificationUrl}}', description: 'Full verification link URL' },
  ],

  'verification-code': [
    { name: '{{userName}}', description: "Recipient's name (if available)" },
    { name: '{{verificationUrl}}', description: 'Full verification link URL' },
    { name: '{{verificationCode}}', description: '6-digit verification code' },
  ],

  'password-reset': [
    { name: '{{userName}}', description: "Recipient's name (if available)" },
    { name: '{{resetUrl}}', description: 'Password reset link URL' },
  ],

  welcome: [
    { name: '{{userName}}', description: "New user's name" },
  ],

  notification: [
    { name: '{{userName}}', description: "Recipient's name" },
    { name: '{{title}}', description: 'Notification title' },
    { name: '{{message}}', description: 'Notification message/body' },
    { name: '{{actionUrl}}', description: 'Call-to-action button URL' },
    { name: '{{actionText}}', description: 'Call-to-action button text' },
  ],

  digest: [
    { name: '{{userName}}', description: "Recipient's name" },
    { name: '{{period}}', description: 'Digest period (daily/weekly/monthly)' },
    { name: '{{itemCount}}', description: 'Number of items in digest' },
    { name: '{{items}}', description: 'HTML list of digest items' },
  ],

  mention: [
    { name: '{{userName}}', description: 'Mentioned user name' },
    { name: '{{mentionedBy}}', description: 'Name of person who mentioned them' },
    { name: '{{preview}}', description: 'Preview of the message content' },
    { name: '{{link}}', description: 'Direct link to the mention' },
  ],

  follow: [
    { name: '{{userName}}', description: "Recipient's name" },
    { name: '{{followerName}}', description: 'Name of new follower' },
    { name: '{{followerUsername}}', description: "Follower's username" },
    { name: '{{followerUrl}}', description: 'Link to follower profile' },
  ],

  'comment-reply': [
    { name: '{{userName}}', description: "Recipient's name" },
    { name: '{{replierName}}', description: 'Name of person who replied' },
    { name: '{{preview}}', description: 'Preview of the reply content' },
    { name: '{{link}}', description: 'Direct link to the comment' },
  ],

  'donation-receipt': [
    { name: '{{donorName}}', description: "Donor's name" },
    { name: '{{amount}}', description: 'Donation amount (formatted)' },
    { name: '{{currency}}', description: 'Currency code (USD, EUR, etc.)' },
    { name: '{{date}}', description: 'Donation date' },
    { name: '{{transactionId}}', description: 'Transaction reference ID' },
    { name: '{{paymentMethod}}', description: 'Payment method used' },
  ],

  'donation-thank-you': [
    { name: '{{donorName}}', description: "Donor's name" },
    { name: '{{amount}}', description: 'Donation amount (formatted)' },
    { name: '{{badgeTier}}', description: 'Donor badge tier (Bronze/Silver/Gold/Platinum)' },
  ],

  'feedback-confirmation': [
    { name: '{{userName}}', description: "User's name" },
    { name: '{{feedbackType}}', description: 'Type of feedback submitted' },
    { name: '{{ticketId}}', description: 'Feedback ticket reference ID' },
  ],

  'admin-alert': [
    { name: '{{adminName}}', description: "Admin's name" },
    { name: '{{alertTitle}}', description: 'Alert title/subject' },
    { name: '{{alertMessage}}', description: 'Alert details' },
    { name: '{{severity}}', description: 'Alert severity (info/warning/critical)' },
    { name: '{{actionUrl}}', description: 'Link to take action' },
  ],

  'import-complete': [
    { name: '{{adminName}}', description: "Admin's name" },
    { name: '{{importType}}', description: 'Type of import (resources/users/etc.)' },
    { name: '{{totalCount}}', description: 'Total items processed' },
    { name: '{{successCount}}', description: 'Successfully imported count' },
    { name: '{{errorCount}}', description: 'Failed import count' },
  ],

  'discovery-complete': [
    { name: '{{adminName}}', description: "Admin's name" },
    { name: '{{sourceUrl}}', description: 'Source URL that was crawled' },
    { name: '{{discoveredCount}}', description: 'Number of resources discovered' },
    { name: '{{newCount}}', description: 'Number of new resources' },
    { name: '{{updatedCount}}', description: 'Number of updated resources' },
  ],
};

const TEMPLATE_LABELS: Record<string, string> = {
  verification: 'Email Verification',
  'verification-code': 'Email Verification (with code)',
  'password-reset': 'Password Reset',
  welcome: 'Welcome Email',
  notification: 'Notification Email',
  digest: 'Daily/Weekly Digest',
  mention: 'Mention Notification',
  follow: 'New Follower',
  'comment-reply': 'Comment Reply',
  'donation-receipt': 'Donation Receipt',
  'donation-thank-you': 'Donation Thank You',
  'feedback-confirmation': 'Feedback Confirmation',
  'admin-alert': 'Admin Alert',
  'import-complete': 'Import Complete',
  'discovery-complete': 'Discovery Complete',
};

export default function VariablesInfoField() {
  const [selectedSlug, setSelectedSlug] = useState('verification');
  const commonVars = TEMPLATE_VARIABLES._common || [];
  const specificVars = TEMPLATE_VARIABLES[selectedSlug] || [];

  const templateSlugs = Object.keys(TEMPLATE_VARIABLES).filter((k) => k !== '_common');

  return (
    <div style={{ padding: '16px 0' }}>
      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>
        Email Template Variables Reference
      </h4>

      {/* Template Type Selector */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#666' }}>
          View variables for template type:
        </label>
        <select
          value={selectedSlug}
          onChange={(e) => setSelectedSlug(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #e5e5e5',
            fontSize: '14px',
          }}
        >
          {templateSlugs.map((slug) => (
            <option key={slug} value={slug}>
              {TEMPLATE_LABELS[slug] || slug}
            </option>
          ))}
        </select>
      </div>

      {/* Common Variables */}
      <div style={{ marginBottom: '16px' }}>
        <h5 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 600, color: '#666' }}>
          Common Variables (available in all templates)
        </h5>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e5e5' }}>
              <th style={{ textAlign: 'left', padding: '8px', fontWeight: 600 }}>Variable</th>
              <th style={{ textAlign: 'left', padding: '8px', fontWeight: 600 }}>Description</th>
            </tr>
          </thead>
          <tbody>
            {commonVars.map((v) => (
              <tr key={v.name} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '8px', fontFamily: 'monospace', color: '#0066cc' }}>{v.name}</td>
                <td style={{ padding: '8px', color: '#555' }}>{v.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Template-Specific Variables */}
      {specificVars.length > 0 && (
        <div>
          <h5 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 600, color: '#666' }}>
            Variables for &quot;{TEMPLATE_LABELS[selectedSlug] || selectedSlug}&quot;
          </h5>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e5e5' }}>
                <th style={{ textAlign: 'left', padding: '8px', fontWeight: 600 }}>Variable</th>
                <th style={{ textAlign: 'left', padding: '8px', fontWeight: 600 }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {specificVars.map((v) => (
                <tr key={v.name} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '8px', fontFamily: 'monospace', color: '#0066cc' }}>{v.name}</td>
                  <td style={{ padding: '8px', color: '#555' }}>{v.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ marginTop: '16px', fontSize: '12px', color: '#888' }}>
        Copy variables exactly as shown (including curly braces) into your subject line or content.
      </p>
    </div>
  );
}
