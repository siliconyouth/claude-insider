import type { CollectionConfig } from 'payload';

/**
 * User Roles for Claude Insider CMS
 *
 * - superadmin: Ultimate access with private data visibility and delete powers
 * - admin: Full system access, can manage all users and content
 * - editor: Can create/edit content, cannot manage users
 * - moderator: Can approve/reject user submissions and comments
 *
 * Note: Beta tester is NOT a role - it's a boolean flag (is_beta_tester) on the main user table.
 */
export type UserRole = 'superadmin' | 'admin' | 'editor' | 'moderator';

/**
 * Check if user has one of the specified roles
 */
export const hasRole = (user: { role?: string } | null, roles: UserRole[]): boolean => {
  if (!user?.role) return false;
  return roles.includes(user.role as UserRole);
};

// Note: Field-level access control can be implemented with FieldAccess type
// Currently using afterRead hooks for masking private data instead

/**
 * Mask email address for non-superadmins
 * vladimir@example.com -> v*******@e******.com
 */
const maskEmail = (email: string): string => {
  const parts = email.split('@');
  const local = parts[0];
  const domain = parts[1];
  if (!local || !domain) return '***@***.***';
  const domainParts = domain.split('.');
  const domainName = domainParts[0];
  const tld = domainParts.slice(1).join('.');
  if (!domainName) return '***@***.***';
  const maskedLocal = local[0] + '*'.repeat(Math.max(local.length - 1, 3));
  const maskedDomain = domainName[0] + '*'.repeat(Math.max(domainName.length - 1, 3));
  return `${maskedLocal}@${maskedDomain}.${tld}`;
};

export const Users: CollectionConfig = {
  slug: 'users',
  // Use a separate table name to avoid conflict with Better Auth's "user" table
  dbName: 'payload_users',
  auth: {
    // Use stateless JWTs instead of database sessions
    // This avoids issues with PgBouncer connection pooling
    useSessions: false,
    tokenExpiration: 7200, // 2 hours
    maxLoginAttempts: 5,
    lockTime: 600000, // 10 minutes lockout after max attempts
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'role', 'isActive', 'createdAt'],
    group: 'Admin',
    description: 'CMS users who manage content and moderate submissions',
  },
  access: {
    // Super Admins and Admins see all, others see only themselves
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (hasRole(user, ['superadmin', 'admin'])) return true;
      // Users can read their own profile
      return { id: { equals: user.id } };
    },
    // Only superadmins and admins can create users
    create: ({ req: { user } }) => hasRole(user, ['superadmin', 'admin']),
    // Super Admins and Admins can update anyone, others can update themselves (except role)
    update: ({ req: { user }, id }) => {
      if (!user) return false;
      if (hasRole(user, ['superadmin', 'admin'])) return true;
      // Users can update their own profile
      return user.id === id;
    },
    // Only superadmins can delete (ultimate delete power)
    delete: ({ req: { user } }) => hasRole(user, ['superadmin']),
    // Any authenticated user can access admin panel
    admin: ({ req: { user } }) => !!user,
  },
  fields: [
    // Basic Info
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Display name for the admin panel',
      },
    },
    // Note: Avatar upload is commented out until media collection types are generated
    // Uncomment after running: pnpm payload generate:types
    // {
    //   name: 'avatar',
    //   type: 'upload',
    //   relationTo: 'media',
    //   admin: {
    //     description: 'Profile picture (optional)',
    //   },
    // },
    {
      name: 'bio',
      type: 'textarea',
      admin: {
        description: 'Short biography or description',
      },
    },

    // Role & Status
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: '⚡ Super Admin', value: 'superadmin' },
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'Moderator', value: 'moderator' },
      ],
      access: {
        // Only superadmins can assign superadmin role, admins can assign other roles
        update: ({ req: { user }, data }) => {
          if (!user) return false;
          // Super Admins can change any role
          if (hasRole(user, ['superadmin'])) return true;
          // Admins can change roles but not to/from superadmin
          if (hasRole(user, ['admin'])) {
            // Check if trying to set superadmin role
            if (data?.role === 'superadmin') return false;
            return true;
          }
          return false;
        },
      },
      admin: {
        position: 'sidebar',
        description: 'User role determines access level. Super Admin has ultimate access.',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Inactive users cannot log in',
      },
      access: {
        update: ({ req: { user } }) => hasRole(user, ['admin']),
      },
    },

    // Permissions (for moderators and admins)
    {
      name: 'permissions',
      type: 'group',
      admin: {
        description: 'Fine-grained permissions (for moderators)',
        condition: (data) => ['superadmin', 'admin', 'moderator'].includes(data?.role),
      },
      fields: [
        {
          name: 'canApproveComments',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Can approve or reject user comments',
          },
        },
        {
          name: 'canApproveEdits',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Can approve or reject edit suggestions',
          },
        },
        {
          name: 'canManageResources',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Can create, edit, and delete resources',
          },
        },
        {
          name: 'canViewAnalytics',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Can view site analytics and reports',
          },
        },
      ],
    },

    // Activity tracking
    {
      name: 'lastLoginAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Last successful login',
      },
    },
    {
      name: 'loginCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Total number of logins',
      },
    },
  ],
  hooks: {
    // Mask private data for non-superadmins viewing other users
    afterRead: [
      ({ doc, req }) => {
        if (!doc || !req.user) return doc;

        // Superadmins see everything
        if (hasRole(req.user, ['superadmin'])) return doc;

        // Users see their own data unmasked
        if (req.user.id === doc.id) return doc;

        // Mask email for non-superadmins viewing other users
        if (doc.email) {
          doc.email = maskEmail(doc.email);
        }

        // Hide login IP tracking data if it exists
        if (doc.lastLoginIP) {
          doc.lastLoginIP = '***.***.***';
        }

        return doc;
      },
    ],
    // Update login tracking on successful authentication
    afterLogin: [
      async ({ user, req }) => {
        try {
          // Type assertion to access custom fields
          const userData = user as { id: string; loginCount?: number };
          await req.payload.update({
            collection: 'users',
            id: userData.id,
            data: {
              lastLoginAt: new Date().toISOString(),
              loginCount: ((userData.loginCount as number) || 0) + 1,
            } as Record<string, unknown>,
          });
        } catch (error) {
          // Log but don't fail the login
          console.error('Failed to update login stats:', error);
        }
      },
    ],
  },
  timestamps: true,
};
