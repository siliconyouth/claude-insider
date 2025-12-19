import type { CollectionConfig } from 'payload';
import { hasRole } from './Users';
import {
  createAchievementSyncHook,
  createAchievementDeleteHook,
} from '../lib/payload/sync-achievements';

/**
 * Achievements Collection
 *
 * Defines all achievements that users can earn through various activities.
 * Supports automatic and manually-awarded achievements with customizable
 * notification settings.
 *
 * Syncs to Supabase `achievements` table on create/update/delete.
 */
export const Achievements: CollectionConfig = {
  slug: 'achievements',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'tier', 'category', 'basePoints', 'isActive'],
    group: 'Gamification',
    description: 'Create and manage user achievements',
  },
  access: {
    read: () => true, // Public read for frontend rendering
    create: ({ req: { user } }) => hasRole(user, ['admin', 'superadmin']),
    update: ({ req: { user } }) => hasRole(user, ['admin', 'superadmin']),
    delete: ({ req: { user } }) => hasRole(user, ['superadmin']),
  },
  hooks: {
    afterChange: [createAchievementSyncHook()],
    afterDelete: [createAchievementDeleteHook()],
  },
  fields: [
    // Basic Information
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Basic Info',
          fields: [
            {
              name: 'slug',
              type: 'text',
              required: true,
              unique: true,
              admin: {
                description: 'Unique identifier (e.g., "welcome_aboard", "first_message")',
              },
            },
            {
              name: 'name',
              type: 'text',
              required: true,
              admin: {
                description: 'Achievement title (e.g., "Welcome Aboard")',
              },
            },
            {
              name: 'description',
              type: 'textarea',
              required: true,
              admin: {
                description: 'Description shown to users when they earn the achievement',
              },
            },
            {
              name: 'icon',
              type: 'text',
              required: true,
              admin: {
                description: 'Lucide icon name (e.g., "rocket", "trophy", "star")',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'tier',
                  type: 'relationship',
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  relationTo: 'achievement-tiers' as any,
                  required: true,
                  admin: {
                    description: 'Rarity tier (affects points multiplier and visuals)',
                    width: '50%',
                  },
                },
                {
                  name: 'category',
                  type: 'relationship',
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  relationTo: 'achievement-categories' as any,
                  required: true,
                  admin: {
                    description: 'Achievement category for organization',
                    width: '50%',
                  },
                },
              ],
            },
            {
              name: 'basePoints',
              type: 'number',
              required: true,
              defaultValue: 10,
              min: 1,
              max: 1000,
              admin: {
                description: 'Base points awarded (multiplied by tier multiplier)',
              },
            },
          ],
        },
        {
          label: 'Conditions',
          description: 'Define how users earn this achievement',
          fields: [
            {
              name: 'conditionType',
              type: 'select',
              required: true,
              defaultValue: 'special',
              options: [
                { label: 'Special (Manual)', value: 'special' },
                { label: 'Count-based', value: 'count' },
                { label: 'Streak', value: 'streak' },
                { label: 'Time-based', value: 'time' },
                { label: 'First Action', value: 'first' },
                { label: 'Compound (Multiple conditions)', value: 'compound' },
              ],
              admin: {
                description: 'How is this achievement triggered?',
              },
            },
            {
              name: 'metric',
              type: 'select',
              options: [
                // Messaging
                { label: 'Messages Sent', value: 'messages_sent' },
                { label: 'Messages Received', value: 'messages_received' },
                { label: 'Conversations Started', value: 'conversations_started' },
                { label: 'Group Chats Created', value: 'groups_created' },
                // Social
                { label: 'Followers Gained', value: 'followers_count' },
                { label: 'Users Followed', value: 'following_count' },
                { label: 'Profile Views', value: 'profile_views' },
                // Content
                { label: 'Reviews Written', value: 'reviews_written' },
                { label: 'Comments Posted', value: 'comments_posted' },
                { label: 'Resources Favorited', value: 'favorites_count' },
                { label: 'Resources Rated', value: 'ratings_count' },
                // Account
                { label: 'Login Days', value: 'login_days' },
                { label: 'Days Since Registration', value: 'account_age_days' },
                { label: 'Streak Days', value: 'streak_days' },
                // Security
                { label: '2FA Enabled', value: '2fa_enabled' },
                { label: 'Passkeys Registered', value: 'passkeys_count' },
                // AI
                { label: 'AI Conversations', value: 'ai_conversations' },
                { label: 'AI Messages', value: 'ai_messages' },
              ],
              admin: {
                description: 'Which metric triggers this achievement?',
                condition: (data) =>
                  data.conditionType === 'count' ||
                  data.conditionType === 'streak' ||
                  data.conditionType === 'first',
              },
            },
            {
              name: 'threshold',
              type: 'number',
              defaultValue: 1,
              min: 1,
              admin: {
                description: 'Target value to reach (e.g., 10 messages, 7 day streak)',
                condition: (data) =>
                  data.conditionType === 'count' || data.conditionType === 'streak',
              },
            },
            {
              name: 'timeWindow',
              type: 'text',
              admin: {
                description: 'Time window for time-based achievements (e.g., "7d", "30d", "1h")',
                condition: (data) => data.conditionType === 'time',
              },
            },
            {
              name: 'compoundLogic',
              type: 'select',
              defaultValue: 'and',
              options: [
                { label: 'All conditions (AND)', value: 'and' },
                { label: 'Any condition (OR)', value: 'or' },
              ],
              admin: {
                description: 'How to combine multiple conditions',
                condition: (data) => data.conditionType === 'compound',
              },
            },
            {
              name: 'compoundConditions',
              type: 'json',
              admin: {
                description: 'JSON array of conditions: [{"metric": "...", "threshold": N}, ...]',
                condition: (data) => data.conditionType === 'compound',
              },
            },
          ],
        },
        {
          label: 'Notification',
          description: 'Configure the achievement popup',
          fields: [
            {
              name: 'notificationTitle',
              type: 'text',
              admin: {
                description: 'Custom popup title (defaults to "Achievement Unlocked!")',
              },
            },
            {
              name: 'notificationMessage',
              type: 'textarea',
              admin: {
                description: 'Custom popup message (defaults to achievement description)',
              },
            },
            {
              name: 'notificationSound',
              type: 'select',
              defaultValue: 'achievement',
              options: [
                { label: 'Achievement (Default)', value: 'achievement' },
                { label: 'Level Up', value: 'level_up' },
                { label: 'Fanfare', value: 'fanfare' },
                { label: 'Subtle', value: 'subtle' },
                { label: 'None', value: 'none' },
              ],
              admin: {
                description: 'Sound to play when earned',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'showConfetti',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: {
                    description: 'Show confetti animation',
                    width: '33%',
                  },
                },
                {
                  name: 'confettiDuration',
                  type: 'number',
                  defaultValue: 3000,
                  min: 1000,
                  max: 10000,
                  admin: {
                    description: 'Confetti duration (ms)',
                    width: '33%',
                    condition: (data) => data.showConfetti,
                  },
                },
                {
                  name: 'displayDuration',
                  type: 'number',
                  defaultValue: 5000,
                  min: 2000,
                  max: 15000,
                  admin: {
                    description: 'Popup duration (ms)',
                    width: '33%',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Availability',
          description: 'Control when and how the achievement can be earned',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'isActive',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: {
                    description: 'Achievement can be earned',
                    width: '25%',
                  },
                },
                {
                  name: 'isHidden',
                  type: 'checkbox',
                  defaultValue: false,
                  admin: {
                    description: 'Hidden until earned',
                    width: '25%',
                  },
                },
                {
                  name: 'isSecret',
                  type: 'checkbox',
                  defaultValue: false,
                  admin: {
                    description: 'Description hidden until earned',
                    width: '25%',
                  },
                },
                {
                  name: 'isLimited',
                  type: 'checkbox',
                  defaultValue: false,
                  admin: {
                    description: 'Time-limited availability',
                    width: '25%',
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'startDate',
                  type: 'date',
                  admin: {
                    description: 'Available from (for limited achievements)',
                    width: '50%',
                    condition: (data) => data.isLimited,
                  },
                },
                {
                  name: 'endDate',
                  type: 'date',
                  admin: {
                    description: 'Available until (for limited achievements)',
                    width: '50%',
                    condition: (data) => data.isLimited,
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
