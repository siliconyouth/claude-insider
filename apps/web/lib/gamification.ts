/**
 * Gamification System
 *
 * Points, streaks, levels, and rewards configuration.
 */

export interface PointAction {
  id: string;
  name: string;
  description: string;
  points: number;
  category: "reading" | "engagement" | "contribution" | "social";
  daily_limit?: number;
  cooldown_minutes?: number;
}

export interface Level {
  level: number;
  name: string;
  min_points: number;
  icon: string;
  color: string;
  perks?: string[];
}

export interface Streak {
  current: number;
  longest: number;
  last_activity_date: string;
  freeze_available: boolean;
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar?: string;
  points: number;
  level: number;
  rank: number;
  streak: number;
}

// Point actions configuration
export const pointActions: PointAction[] = [
  // Reading actions
  {
    id: "read_article",
    name: "Read Article",
    description: "Read a documentation page",
    points: 5,
    category: "reading",
    daily_limit: 20,
  },
  {
    id: "complete_tutorial",
    name: "Complete Tutorial",
    description: "Finish a tutorial from start to end",
    points: 25,
    category: "reading",
    daily_limit: 5,
  },
  {
    id: "explore_resource",
    name: "Explore Resource",
    description: "Visit an external resource",
    points: 3,
    category: "reading",
    daily_limit: 30,
  },

  // Engagement actions
  {
    id: "daily_visit",
    name: "Daily Visit",
    description: "Visit the site each day",
    points: 10,
    category: "engagement",
    daily_limit: 1,
  },
  {
    id: "use_search",
    name: "Use Search",
    description: "Search for documentation",
    points: 2,
    category: "engagement",
    daily_limit: 10,
  },
  {
    id: "add_favorite",
    name: "Add Favorite",
    description: "Save content to favorites",
    points: 5,
    category: "engagement",
    daily_limit: 10,
  },
  {
    id: "create_collection",
    name: "Create Collection",
    description: "Create a new collection",
    points: 15,
    category: "engagement",
    daily_limit: 3,
  },

  // Contribution actions
  {
    id: "submit_suggestion",
    name: "Submit Suggestion",
    description: "Suggest an edit to documentation",
    points: 50,
    category: "contribution",
    daily_limit: 5,
  },
  {
    id: "suggestion_approved",
    name: "Suggestion Approved",
    description: "Your suggestion was approved",
    points: 100,
    category: "contribution",
  },
  {
    id: "post_comment",
    name: "Post Comment",
    description: "Leave a helpful comment",
    points: 10,
    category: "contribution",
    daily_limit: 10,
  },
  {
    id: "helpful_comment",
    name: "Helpful Comment",
    description: "Your comment was marked helpful",
    points: 25,
    category: "contribution",
  },
  {
    id: "write_review",
    name: "Write Review",
    description: "Write a resource review",
    points: 20,
    category: "contribution",
    daily_limit: 5,
  },

  // Social actions
  {
    id: "share_content",
    name: "Share Content",
    description: "Share content on social media",
    points: 10,
    category: "social",
    daily_limit: 5,
    cooldown_minutes: 30,
  },
  {
    id: "refer_user",
    name: "Refer User",
    description: "Invite a friend who signs up",
    points: 100,
    category: "social",
  },
  {
    id: "follow_user",
    name: "Follow User",
    description: "Follow another user",
    points: 5,
    category: "social",
    daily_limit: 10,
  },
];

// Level configuration
export const levels: Level[] = [
  { level: 1, name: "Newcomer", min_points: 0, icon: "🌱", color: "text-gray-500" },
  { level: 2, name: "Explorer", min_points: 100, icon: "🔍", color: "text-green-500" },
  { level: 3, name: "Learner", min_points: 300, icon: "📚", color: "text-blue-500" },
  { level: 4, name: "Contributor", min_points: 750, icon: "✨", color: "text-purple-500" },
  { level: 5, name: "Expert", min_points: 1500, icon: "🎯", color: "text-indigo-500" },
  { level: 6, name: "Master", min_points: 3000, icon: "🏆", color: "text-yellow-500" },
  { level: 7, name: "Legend", min_points: 6000, icon: "👑", color: "text-amber-500" },
  { level: 8, name: "Sage", min_points: 12000, icon: "🌟", color: "text-cyan-500" },
  { level: 9, name: "Guru", min_points: 25000, icon: "💎", color: "text-violet-500" },
  { level: 10, name: "Titan", min_points: 50000, icon: "🔥", color: "text-red-500", perks: ["Custom badge", "Priority support"] },
];

// Streak milestones
export const streakMilestones = [
  { days: 3, bonus: 25, badge: "🔥 3-Day Streak" },
  { days: 7, bonus: 75, badge: "🔥 Week Warrior" },
  { days: 14, bonus: 150, badge: "⚡ Two-Week Champion" },
  { days: 30, bonus: 400, badge: "💪 Monthly Master" },
  { days: 60, bonus: 1000, badge: "🌟 Dedication Star" },
  { days: 100, bonus: 2500, badge: "💎 Century Club" },
  { days: 365, bonus: 10000, badge: "👑 Year Legend" },
];

/**
 * Calculate level from points
 */
export function getLevelFromPoints(points: number): Level {
  for (let i = levels.length - 1; i >= 0; i--) {
    const level = levels[i];
    if (level && points >= level.min_points) {
      return level;
    }
  }
  // Default to first level (always exists)
  return levels[0] as Level;
}

/**
 * Get progress to next level
 */
export function getLevelProgress(points: number): {
  current: Level;
  next: Level | null;
  progress: number;
  pointsToNext: number;
} {
  const current = getLevelFromPoints(points);
  const currentIndex = levels.findIndex((l) => l.level === current.level);
  const next = currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;

  if (!next) {
    return { current, next: null, progress: 100, pointsToNext: 0 };
  }

  const pointsInLevel = points - current.min_points;
  const pointsNeeded = next.min_points - current.min_points;
  const progress = Math.min((pointsInLevel / pointsNeeded) * 100, 100);

  return {
    current,
    next,
    progress,
    pointsToNext: next.min_points - points,
  };
}

/**
 * Check if streak is maintained (visited within last 24 hours)
 */
export function isStreakActive(lastActivityDate: string): boolean {
  const last = new Date(lastActivityDate);
  const now = new Date();
  const hoursSinceActivity = (now.getTime() - last.getTime()) / (1000 * 60 * 60);
  return hoursSinceActivity < 36; // 36 hour grace period
}

/**
 * Calculate streak bonus based on current streak
 */
export function getStreakBonus(streak: number): { bonus: number; milestone: typeof streakMilestones[0] | null } {
  let milestone = null;
  for (const m of streakMilestones) {
    if (streak === m.days) {
      milestone = m;
      break;
    }
  }

  // Base bonus: 5% per day, max 50%
  const baseBonus = Math.min(streak * 5, 50);

  return {
    bonus: baseBonus + (milestone?.bonus || 0),
    milestone,
  };
}

/**
 * Get point action by ID
 */
export function getPointAction(actionId: string): PointAction | undefined {
  return pointActions.find((a) => a.id === actionId);
}

/**
 * Calculate points with streak multiplier
 */
export function calculatePoints(basePoints: number, streak: number): number {
  const multiplier = 1 + Math.min(streak * 0.05, 0.5); // Max 50% bonus
  return Math.round(basePoints * multiplier);
}
