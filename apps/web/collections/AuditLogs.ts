/**
 * Audit Logs Collection
 *
 * Tracks all admin actions for accountability and debugging.
 * Immutable records - no update or delete operations allowed.
 */

import type { CollectionConfig } from "payload";

export const AuditLogs: CollectionConfig = {
  slug: "audit-logs",
  admin: {
    useAsTitle: "action",
    group: "System",
    description: "Immutable audit trail of all admin actions",
    defaultColumns: ["action", "collection", "user", "createdAt"],
  },
  access: {
    // Only admins can read audit logs
    read: ({ req }) => {
      const user = req.user;
      if (!user) return false;
      if (user.role === "admin") return true;
      return false;
    },
    // No one can update or delete audit logs
    update: () => false,
    delete: () => false,
    // Only system can create (via API)
    create: ({ req }) => {
      // Allow creation from server-side code
      return !!req.user || req.headers?.get("x-internal-request") === "true";
    },
  },
  fields: [
    // Action type
    {
      name: "action",
      type: "select",
      required: true,
      options: [
        { label: "Create", value: "create" },
        { label: "Update", value: "update" },
        { label: "Delete", value: "delete" },
        { label: "Approve", value: "approve" },
        { label: "Reject", value: "reject" },
        { label: "Discover", value: "discover" },
        { label: "Scrape", value: "scrape" },
        { label: "Analyze", value: "analyze" },
        { label: "Import", value: "import" },
        { label: "Export", value: "export" },
        { label: "Login", value: "login" },
        { label: "Logout", value: "logout" },
        { label: "Settings Change", value: "settings" },
        { label: "Bulk Operation", value: "bulk" },
      ],
      admin: {
        description: "Type of action performed",
      },
    },
    // Target collection
    {
      name: "collection",
      type: "text",
      admin: {
        description: "Collection/entity type affected",
      },
    },
    // Target document ID
    {
      name: "documentId",
      type: "text",
      admin: {
        description: "ID of the affected document",
      },
    },
    // User who performed the action
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
      admin: {
        description: "User who performed this action",
      },
    },
    // User details snapshot (in case user is deleted later)
    {
      name: "userSnapshot",
      type: "group",
      admin: {
        description: "Snapshot of user details at time of action",
      },
      fields: [
        {
          name: "email",
          type: "email",
        },
        {
          name: "name",
          type: "text",
        },
        {
          name: "role",
          type: "text",
        },
      ],
    },
    // Changes made (before/after)
    {
      name: "changes",
      type: "json",
      admin: {
        description: "JSON diff of changes (before/after)",
      },
    },
    // Request metadata
    {
      name: "metadata",
      type: "group",
      fields: [
        {
          name: "ipAddress",
          type: "text",
          admin: {
            description: "Client IP address",
          },
        },
        {
          name: "userAgent",
          type: "text",
          admin: {
            description: "Browser/client user agent",
          },
        },
        {
          name: "endpoint",
          type: "text",
          admin: {
            description: "API endpoint called",
          },
        },
        {
          name: "method",
          type: "text",
          admin: {
            description: "HTTP method",
          },
        },
        {
          name: "duration",
          type: "number",
          admin: {
            description: "Request duration in ms",
          },
        },
        {
          name: "statusCode",
          type: "number",
          admin: {
            description: "HTTP response status code",
          },
        },
      ],
    },
    // Additional context
    {
      name: "context",
      type: "group",
      fields: [
        {
          name: "reason",
          type: "text",
          admin: {
            description: "Reason for action (if provided)",
          },
        },
        {
          name: "notes",
          type: "textarea",
          admin: {
            description: "Additional notes",
          },
        },
        {
          name: "affectedCount",
          type: "number",
          admin: {
            description: "Number of items affected (for bulk ops)",
          },
        },
        {
          name: "sourceUrl",
          type: "text",
          admin: {
            description: "Source URL (for discover/scrape actions)",
          },
        },
      ],
    },
    // Result status
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "success",
      options: [
        { label: "Success", value: "success" },
        { label: "Failed", value: "failed" },
        { label: "Partial", value: "partial" },
      ],
    },
    // Error details (if failed)
    {
      name: "error",
      type: "group",
      admin: {
        condition: (data) => data.status === "failed",
      },
      fields: [
        {
          name: "message",
          type: "text",
        },
        {
          name: "code",
          type: "text",
        },
        {
          name: "stack",
          type: "textarea",
        },
      ],
    },
  ],
  indexes: [
    // Index for filtering by action type
    { fields: ["action"] },
    // Index for filtering by user
    { fields: ["user"] },
    // Index for filtering by collection
    { fields: ["collection"] },
    // Index for filtering by status
    { fields: ["status"] },
    // Composite index for common queries
    { fields: ["action", "user"] },
  ],
};

export default AuditLogs;
