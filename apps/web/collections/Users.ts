import type { CollectionConfig } from 'payload';

/**
 * User Roles for Claude Insider CMS
 *
 * - admin: Full system access, can manage all users and content
 * - editor: Can create/edit content, cannot manage users
 * - moderator: Can approve/reject user submissions and comments
 * - beta_tester: Early access to new features, limited admin access
 */
export type UserRole = 'admin' | 'editor' | 'moderator' | 'beta_tester';

/**
 * Check if user has one of the specified roles
 */
export const hasRole = (user: { role?: string } | null, roles: UserRole[]): boolean => {
  if (!user?.role) return false;
  return roles.includes(user.role as UserRole);
};

export const Users: CollectionConfig = {
  slug: 'users',
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
    // Admins see all, others see only themselves
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (hasRole(user, ['admin'])) return true;
      // Users can read their own profile
      return { id: { equals: user.id } };
    },
    // Only admins can create users
    create: ({ req: { user } }) => hasRole(user, ['admin']),
    // Admins can update anyone, others can update themselves (except role)
    update: ({ req: { user }, id }) => {
      if (!user) return false;
      if (hasRole(user, ['admin'])) return true;
      // Users can update their own profile
      return user.id === id;
    },
    // Only admins can delete
    delete: ({ req: { user } }) => hasRole(user, ['admin']),
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
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'Moderator', value: 'moderator' },
        { label: 'Beta Tester', value: 'beta_tester' },
      ],
      access: {
        // Only admins can change roles
        update: ({ req: { user } }) => hasRole(user, ['admin']),
      },
      admin: {
        position: 'sidebar',
        description: 'User role determines access level',
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
        condition: (data) => ['admin', 'moderator'].includes(data?.role),
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
