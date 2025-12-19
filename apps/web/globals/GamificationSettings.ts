import type { GlobalConfig } from 'payload';

/**
 * Gamification Settings Global
 *
 * Site-wide configuration for the gamification system including
 * points, levels, streaks, and notification defaults.
 */
export const GamificationSettings: GlobalConfig = {
  slug: 'gamification-settings',
  label: 'Gamification Settings',
  admin: {
    group: 'Gamification',
    description: 'Configure points, levels, streaks, and achievement notifications',
  },
  access: {
    read: () => true, // Public read for frontend
    update: ({ req: { user } }) =>
      user?.role === 'admin' || user?.role === 'superadmin',
  },
  fields: [
    // ========== Points System ==========
    {
      name: 'pointsSystem',
      type: 'group',
      label: 'Points System',
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          label: 'Enable Points System',
          defaultValue: true,
          admin: {
            description: 'Master toggle for the points system',
          },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'pointsPerMessage',
              type: 'number',
              label: 'Points per Message',
              defaultValue: 1,
              min: 0,
              max: 100,
              admin: {
                description: 'Points awarded for sending a message',
                width: '25%',
              },
            },
            {
              name: 'pointsPerLogin',
              type: 'number',
              label: 'Points per Login',
              defaultValue: 5,
              min: 0,
              max: 100,
              admin: {
                description: 'Daily login bonus',
                width: '25%',
              },
            },
            {
              name: 'pointsPerReview',
              type: 'number',
              label: 'Points per Review',
              defaultValue: 10,
              min: 0,
              max: 100,
              admin: {
                description: 'Points for writing a resource review',
                width: '25%',
              },
            },
            {
              name: 'pointsPerComment',
              type: 'number',
              label: 'Points per Comment',
              defaultValue: 2,
              min: 0,
              max: 100,
              admin: {
                description: 'Points for posting a comment',
                width: '25%',
              },
            },
          ],
        },
        {
          name: 'dailyPointsCap',
          type: 'number',
          label: 'Daily Points Cap',
          defaultValue: 100,
          min: 0,
          max: 10000,
          admin: {
            description: 'Maximum points a user can earn per day (0 = unlimited)',
          },
        },
      ],
    },

    // ========== Levels ==========
    {
      name: 'levelsEnabled',
      type: 'checkbox',
      label: 'Enable Levels',
      defaultValue: true,
      admin: {
        description: 'Show user levels based on total points',
      },
    },
    {
      name: 'levels',
      type: 'array',
      label: 'Level Definitions',
      admin: {
        description: 'Define level thresholds and rewards',
        condition: (data) => data?.levelsEnabled,
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'level',
              type: 'number',
              required: true,
              min: 1,
              admin: {
                description: 'Level number',
                width: '15%',
              },
            },
            {
              name: 'name',
              type: 'text',
              required: true,
              admin: {
                description: 'Level name (e.g., "Beginner")',
                width: '30%',
              },
            },
            {
              name: 'pointsRequired',
              type: 'number',
              required: true,
              min: 0,
              admin: {
                description: 'Points to reach this level',
                width: '25%',
              },
            },
            {
              name: 'icon',
              type: 'text',
              admin: {
                description: 'Lucide icon name',
                width: '15%',
              },
            },
            {
              name: 'color',
              type: 'text',
              admin: {
                description: 'Tailwind color',
                width: '15%',
              },
            },
          ],
        },
        {
          name: 'perks',
          type: 'array',
          label: 'Level Perks',
          admin: {
            description: 'Benefits unlocked at this level',
          },
          fields: [
            {
              name: 'perk',
              type: 'text',
              admin: {
                description: 'Perk description',
              },
            },
          ],
        },
      ],
      defaultValue: [
        { level: 1, name: 'Newcomer', pointsRequired: 0, icon: 'user', color: 'gray' },
        { level: 2, name: 'Explorer', pointsRequired: 100, icon: 'compass', color: 'green' },
        { level: 3, name: 'Contributor', pointsRequired: 500, icon: 'message-square', color: 'blue' },
        { level: 4, name: 'Expert', pointsRequired: 1000, icon: 'award', color: 'violet' },
        { level: 5, name: 'Master', pointsRequired: 2500, icon: 'crown', color: 'amber' },
        { level: 6, name: 'Legend', pointsRequired: 5000, icon: 'trophy', color: 'rose' },
      ],
    },

    // ========== Streaks ==========
    {
      name: 'streaks',
      type: 'group',
      label: 'Streak System',
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          label: 'Enable Streaks',
          defaultValue: true,
          admin: {
            description: 'Track daily login streaks',
          },
        },
        {
          name: 'gracePeriodHours',
          type: 'number',
          label: 'Grace Period (hours)',
          defaultValue: 24,
          min: 0,
          max: 48,
          admin: {
            description: 'Hours after midnight before streak resets',
            condition: (data) => data?.streaks?.enabled,
          },
        },
        {
          name: 'milestones',
          type: 'array',
          label: 'Streak Milestones',
          admin: {
            description: 'Bonus rewards at streak milestones',
            condition: (data) => data?.streaks?.enabled,
          },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'days',
                  type: 'number',
                  required: true,
                  min: 1,
                  admin: {
                    description: 'Days required',
                    width: '33%',
                  },
                },
                {
                  name: 'bonusPoints',
                  type: 'number',
                  min: 0,
                  admin: {
                    description: 'Bonus points',
                    width: '33%',
                  },
                },
                {
                  name: 'achievementSlug',
                  type: 'text',
                  admin: {
                    description: 'Achievement to award (slug)',
                    width: '33%',
                  },
                },
              ],
            },
          ],
          defaultValue: [
            { days: 7, bonusPoints: 50, achievementSlug: 'week_warrior' },
            { days: 30, bonusPoints: 200, achievementSlug: 'monthly_maven' },
            { days: 100, bonusPoints: 500, achievementSlug: 'century_champion' },
            { days: 365, bonusPoints: 1000, achievementSlug: 'yearly_legend' },
          ],
        },
      ],
    },

    // ========== Notification Defaults ==========
    {
      name: 'notifications',
      type: 'group',
      label: 'Notification Defaults',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'showAchievementPopups',
              type: 'checkbox',
              label: 'Show Achievement Popups',
              defaultValue: true,
              admin: {
                width: '50%',
              },
            },
            {
              name: 'showLevelUpPopups',
              type: 'checkbox',
              label: 'Show Level Up Popups',
              defaultValue: true,
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
              name: 'defaultConfettiEnabled',
              type: 'checkbox',
              label: 'Default Confetti Enabled',
              defaultValue: true,
              admin: {
                width: '50%',
              },
            },
            {
              name: 'defaultSoundEnabled',
              type: 'checkbox',
              label: 'Default Sound Enabled',
              defaultValue: true,
              admin: {
                width: '50%',
              },
            },
          ],
        },
      ],
    },

    // ========== Leaderboard ==========
    {
      name: 'leaderboard',
      type: 'group',
      label: 'Leaderboard Settings',
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          label: 'Enable Leaderboard',
          defaultValue: true,
        },
        {
          name: 'displayLimit',
          type: 'number',
          label: 'Display Limit',
          defaultValue: 100,
          min: 10,
          max: 1000,
          admin: {
            description: 'Maximum users shown on leaderboard',
            condition: (data) => data?.leaderboard?.enabled,
          },
        },
        {
          name: 'refreshInterval',
          type: 'number',
          label: 'Refresh Interval (minutes)',
          defaultValue: 5,
          min: 1,
          max: 60,
          admin: {
            description: 'How often to refresh rankings',
            condition: (data) => data?.leaderboard?.enabled,
          },
        },
      ],
    },
  ],
};
