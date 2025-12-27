import type { GlobalConfig } from 'payload';
import { createGlobalRevalidateHook } from '../lib/revalidate';
import { publicRead, adminAccess } from '../lib/payload-access';

/**
 * Gamification Settings Global
 *
 * Site-wide configuration for the gamification system including
 * points, levels, streaks, and notification defaults.
 *
 * Access Control:
 * - Read: Public (needed for frontend display)
 * - Update: Admin and Superadmin only
 * - Note: Moderators can adjust points via dedicated moderation UI
 */
export const GamificationSettings: GlobalConfig = {
  slug: 'gamification-settings',
  label: 'Gamification Settings',
  admin: {
    group: 'Gamification',
    description: 'Configure points, levels, streaks, and achievement notifications',
  },
  access: {
    read: publicRead,
    update: adminAccess,
  },
  hooks: {
    afterChange: [createGlobalRevalidateHook('gamification-settings')],
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
          type: 'row',
          fields: [
            {
              name: 'pointsPerRating',
              type: 'number',
              label: 'Points per Rating',
              defaultValue: 2,
              min: 0,
              max: 100,
              admin: {
                description: 'Points for rating a resource',
                width: '25%',
              },
            },
            {
              name: 'pointsPerFavorite',
              type: 'number',
              label: 'Points per Favorite',
              defaultValue: 1,
              min: 0,
              max: 100,
              admin: {
                description: 'Points for adding to favorites',
                width: '25%',
              },
            },
            {
              name: 'pointsPerEditSuggestion',
              type: 'number',
              label: 'Points per Edit Suggestion',
              defaultValue: 15,
              min: 0,
              max: 100,
              admin: {
                description: 'Points for approved edit suggestions',
                width: '25%',
              },
            },
            {
              name: 'pointsPerShare',
              type: 'number',
              label: 'Points per Share',
              defaultValue: 3,
              min: 0,
              max: 100,
              admin: {
                description: 'Points for sharing content',
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
        {
          name: 'showPointsToast',
          type: 'checkbox',
          label: 'Show Points Toast',
          defaultValue: true,
          admin: {
            description: 'Show toast notification when points are earned',
          },
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
        {
          name: 'showAnonymousUsers',
          type: 'checkbox',
          label: 'Show Anonymous Users',
          defaultValue: false,
          admin: {
            description: 'Include users who opted out of leaderboard',
            condition: (data) => data?.leaderboard?.enabled,
          },
        },
        {
          name: 'minimumPointsToShow',
          type: 'number',
          label: 'Minimum Points to Show',
          defaultValue: 10,
          min: 0,
          admin: {
            description: 'Minimum points required to appear on leaderboard',
            condition: (data) => data?.leaderboard?.enabled,
          },
        },
      ],
    },

    // ========== Moderation Settings (NEW) ==========
    {
      name: 'moderation',
      type: 'group',
      label: 'Moderation Settings',
      admin: {
        description: 'Settings for gamification abuse prevention and moderation',
      },
      fields: [
        {
          name: 'enableAbuseDetection',
          type: 'checkbox',
          label: 'Enable Abuse Detection',
          defaultValue: true,
          admin: {
            description: 'Automatically detect suspicious point farming',
          },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'maxActionsPerHour',
              type: 'number',
              label: 'Max Actions/Hour',
              defaultValue: 50,
              min: 10,
              max: 500,
              admin: {
                description: 'Max point-earning actions per hour',
                width: '50%',
              },
            },
            {
              name: 'suspiciousThreshold',
              type: 'number',
              label: 'Suspicious Threshold',
              defaultValue: 100,
              min: 20,
              max: 500,
              admin: {
                description: 'Points/hour that triggers review',
                width: '50%',
              },
            },
          ],
        },
        {
          name: 'autoSuspendOnAbuse',
          type: 'checkbox',
          label: 'Auto-Suspend on Abuse',
          defaultValue: false,
          admin: {
            description: 'Automatically suspend gamification for suspicious accounts',
          },
        },
        {
          name: 'moderatorCanAdjustPoints',
          type: 'checkbox',
          label: 'Moderators Can Adjust Points',
          defaultValue: true,
          admin: {
            description: 'Allow moderators to add/remove user points',
          },
        },
        {
          name: 'maxPointsAdjustment',
          type: 'number',
          label: 'Max Points Adjustment',
          defaultValue: 500,
          min: 10,
          max: 10000,
          admin: {
            description: 'Maximum points a moderator can adjust at once',
            condition: (data) => data?.moderation?.moderatorCanAdjustPoints,
          },
        },
        {
          name: 'requireAdjustmentReason',
          type: 'checkbox',
          label: 'Require Adjustment Reason',
          defaultValue: true,
          admin: {
            description: 'Require moderators to provide reason for adjustments',
            condition: (data) => data?.moderation?.moderatorCanAdjustPoints,
          },
        },
        {
          name: 'moderatorCanRevokeAchievements',
          type: 'checkbox',
          label: 'Moderators Can Revoke Achievements',
          defaultValue: true,
          admin: {
            description: 'Allow moderators to revoke user achievements',
          },
        },
      ],
    },

    // ========== Achievement Settings (NEW) ==========
    {
      name: 'achievements',
      type: 'group',
      label: 'Achievement Settings',
      admin: {
        description: 'Configure how achievements work',
      },
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          label: 'Enable Achievements',
          defaultValue: true,
        },
        {
          name: 'showHiddenProgress',
          type: 'checkbox',
          label: 'Show Hidden Achievement Progress',
          defaultValue: false,
          admin: {
            description: 'Show progress toward hidden achievements',
            condition: (data) => data?.achievements?.enabled,
          },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'maxBadgesDisplayed',
              type: 'number',
              label: 'Max Badges Displayed',
              defaultValue: 5,
              min: 1,
              max: 20,
              admin: {
                description: 'Max badges on profile preview',
                width: '50%',
                condition: (data) => data?.achievements?.enabled,
              },
            },
            {
              name: 'showcaseLimit',
              type: 'number',
              label: 'Showcase Limit',
              defaultValue: 3,
              min: 1,
              max: 10,
              admin: {
                description: 'Max achievements user can showcase',
                width: '50%',
                condition: (data) => data?.achievements?.enabled,
              },
            },
          ],
        },
        {
          name: 'retroactiveAwards',
          type: 'checkbox',
          label: 'Retroactive Awards',
          defaultValue: true,
          admin: {
            description: 'Award achievements for past actions when new achievement is created',
            condition: (data) => data?.achievements?.enabled,
          },
        },
      ],
    },

    // ========== Event Triggers (NEW) ==========
    {
      name: 'eventTriggers',
      type: 'group',
      label: 'Event Triggers',
      admin: {
        description: 'Configure when points and achievements are awarded',
      },
      fields: [
        {
          name: 'awardOnFirstAction',
          type: 'checkbox',
          label: 'Award on First Action',
          defaultValue: true,
          admin: {
            description: 'Award bonus points for first-time actions (first message, first review, etc.)',
          },
        },
        {
          name: 'firstActionMultiplier',
          type: 'number',
          label: 'First Action Multiplier',
          defaultValue: 5,
          min: 1,
          max: 20,
          admin: {
            description: 'Multiply points by this for first-time actions',
            condition: (data) => data?.eventTriggers?.awardOnFirstAction,
          },
        },
        {
          name: 'awardOnQuality',
          type: 'checkbox',
          label: 'Award on Quality',
          defaultValue: true,
          admin: {
            description: 'Bonus points for high-quality contributions (upvoted reviews, etc.)',
          },
        },
        {
          name: 'qualityBonusPoints',
          type: 'number',
          label: 'Quality Bonus Points',
          defaultValue: 10,
          min: 1,
          max: 100,
          admin: {
            description: 'Extra points for quality contributions',
            condition: (data) => data?.eventTriggers?.awardOnQuality,
          },
        },
        {
          name: 'delayAwardsMinutes',
          type: 'number',
          label: 'Award Delay (minutes)',
          defaultValue: 0,
          min: 0,
          max: 60,
          admin: {
            description: 'Delay before points are credited (prevents rapid undo/redo farming)',
          },
        },
      ],
    },
  ],
};
