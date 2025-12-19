/**
 * Achievement Definitions
 *
 * Comprehensive achievement system with beautiful Lucide icons.
 * All achievements use consistent visual styling and categories.
 *
 * Categories:
 * - onboarding: First-time user milestones
 * - engagement: Community interaction
 * - learning: Documentation exploration
 * - social: Following, followers, connections
 * - content: Creating and sharing
 * - streak: Daily activity
 * - collector: Favorites, collections
 * - expert: Mastery achievements
 */

import {
  // Onboarding & Welcome
  Rocket,
  UserCheck,
  ShieldCheck,
  Mail,
  Key,
  Link2,
  // Engagement
  MessageCircle,
  Heart,
  Star,
  ThumbsUp,
  Award,
  // Learning & Exploration
  BookOpen,
  GraduationCap,
  Compass,
  Map,
  Lightbulb,
  Search,
  // Social
  Users,
  UserPlus,
  UsersRound,
  Handshake,
  Globe,
  // Content & Creation
  PenTool,
  FileText,
  Code2,
  Sparkles,
  // Streaks & Time
  Flame,
  Calendar,
  Zap,
  Timer,
  // Collections & Organization
  Bookmark,
  FolderHeart,
  Library,
  Archive,
  // Expert & Mastery
  Crown,
  Trophy,
  Medal,
  Target,
  Gem,
  // Special
  PartyPopper,
  Gift,
  Cake,
  Sun,
  Moon,
  Coffee,
  type LucideIcon,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

export type AchievementRarity = "common" | "rare" | "epic" | "legendary";

export type AchievementCategory =
  | "onboarding"
  | "engagement"
  | "learning"
  | "social"
  | "content"
  | "streak"
  | "collector"
  | "expert"
  | "supporter"
  | "special";

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  rarity: AchievementRarity;
  category: AchievementCategory;
  points: number;
  // Optional unlock criteria description
  criteria?: string;
  // Optional hidden until unlocked
  hidden?: boolean;
}

// ============================================
// RARITY CONFIGURATION
// ============================================

export const RARITY_CONFIG: Record<
  AchievementRarity,
  {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    glowColor: string;
    iconBg: string;
  }
> = {
  common: {
    label: "Common",
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    borderColor: "border-gray-300 dark:border-gray-600",
    glowColor: "",
    iconBg: "bg-gray-200 dark:bg-gray-700",
  },
  rare: {
    label: "Rare",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/50",
    borderColor: "border-blue-400 dark:border-blue-600",
    glowColor: "shadow-blue-500/30",
    iconBg: "bg-blue-100 dark:bg-blue-900/50",
  },
  epic: {
    label: "Epic",
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-50 dark:bg-violet-950/50",
    borderColor: "border-violet-400 dark:border-violet-600",
    glowColor: "shadow-violet-500/40",
    iconBg: "bg-violet-100 dark:bg-violet-900/50",
  },
  legendary: {
    label: "Legendary",
    color: "text-amber-600 dark:text-amber-400",
    bgColor:
      "bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/50 dark:via-yellow-950/50 dark:to-orange-950/50",
    borderColor: "border-amber-400 dark:border-amber-500",
    glowColor: "shadow-amber-500/50",
    iconBg: "bg-gradient-to-br from-amber-200 to-yellow-200 dark:from-amber-800 dark:to-yellow-800",
  },
};

// ============================================
// CATEGORY CONFIGURATION
// ============================================

export const CATEGORY_CONFIG: Record<
  AchievementCategory,
  {
    label: string;
    description: string;
    icon: LucideIcon;
  }
> = {
  onboarding: {
    label: "Getting Started",
    description: "First steps in your journey",
    icon: Rocket,
  },
  engagement: {
    label: "Engagement",
    description: "Community participation",
    icon: MessageCircle,
  },
  learning: {
    label: "Learning",
    description: "Knowledge exploration",
    icon: BookOpen,
  },
  social: {
    label: "Social",
    description: "Building connections",
    icon: Users,
  },
  content: {
    label: "Content",
    description: "Creating and sharing",
    icon: PenTool,
  },
  streak: {
    label: "Streaks",
    description: "Consistent activity",
    icon: Flame,
  },
  collector: {
    label: "Collector",
    description: "Curating favorites",
    icon: Bookmark,
  },
  expert: {
    label: "Expert",
    description: "Mastery achievements",
    icon: Crown,
  },
  supporter: {
    label: "Supporter",
    description: "Community contributions",
    icon: Heart,
  },
  special: {
    label: "Special",
    description: "Unique milestones",
    icon: Gift,
  },
};

// ============================================
// ACHIEVEMENT DEFINITIONS
// ============================================

export const ACHIEVEMENTS: Record<string, AchievementDefinition> = {
  // ========== ONBOARDING ==========
  welcome_aboard: {
    id: "welcome_aboard",
    name: "Welcome Aboard",
    description: "Complete the onboarding process and join the community",
    icon: Rocket,
    rarity: "common",
    category: "onboarding",
    points: 50,
    criteria: "Complete onboarding",
  },
  profile_complete: {
    id: "profile_complete",
    name: "Looking Good",
    description: "Set up your profile with a display name and bio",
    icon: UserCheck,
    rarity: "common",
    category: "onboarding",
    points: 25,
    criteria: "Add display name and bio",
  },
  avatar_uploaded: {
    id: "avatar_uploaded",
    name: "Face in the Crowd",
    description: "Upload a profile picture",
    icon: UserCheck,
    rarity: "common",
    category: "onboarding",
    points: 25,
    criteria: "Upload avatar",
  },
  email_verified: {
    id: "email_verified",
    name: "Verified Identity",
    description: "Verify your email address",
    icon: Mail,
    rarity: "common",
    category: "onboarding",
    points: 30,
    criteria: "Verify email",
  },
  security_setup: {
    id: "security_setup",
    name: "Fort Knox",
    description: "Enable two-factor authentication or passkeys",
    icon: ShieldCheck,
    rarity: "rare",
    category: "onboarding",
    points: 75,
    criteria: "Set up 2FA or passkeys",
  },
  api_key_added: {
    id: "api_key_added",
    name: "Key Master",
    description: "Connect your Anthropic API key",
    icon: Key,
    rarity: "rare",
    category: "onboarding",
    points: 100,
    criteria: "Add API key",
  },
  social_connected: {
    id: "social_connected",
    name: "Networker",
    description: "Add social links to your profile",
    icon: Link2,
    rarity: "common",
    category: "onboarding",
    points: 25,
    criteria: "Add at least one social link",
  },

  // ========== ENGAGEMENT ==========
  first_comment: {
    id: "first_comment",
    name: "Ice Breaker",
    description: "Leave your first comment on documentation",
    icon: MessageCircle,
    rarity: "common",
    category: "engagement",
    points: 25,
    criteria: "Post a comment",
  },
  ten_comments: {
    id: "ten_comments",
    name: "Conversation Starter",
    description: "Leave 10 comments across the documentation",
    icon: MessageCircle,
    rarity: "rare",
    category: "engagement",
    points: 100,
    criteria: "Post 10 comments",
  },
  first_rating: {
    id: "first_rating",
    name: "Judge of Quality",
    description: "Rate a documentation page",
    icon: Star,
    rarity: "common",
    category: "engagement",
    points: 20,
    criteria: "Rate a page",
  },
  feedback_given: {
    id: "feedback_given",
    name: "Voice Heard",
    description: "Submit feedback to help improve the site",
    icon: ThumbsUp,
    rarity: "rare",
    category: "engagement",
    points: 75,
    criteria: "Submit feedback",
  },
  suggestion_accepted: {
    id: "suggestion_accepted",
    name: "Change Maker",
    description: "Have an edit suggestion accepted",
    icon: Award,
    rarity: "epic",
    category: "engagement",
    points: 200,
    criteria: "Accepted suggestion",
  },

  // ========== LEARNING ==========
  first_doc_read: {
    id: "first_doc_read",
    name: "Curious Mind",
    description: "Read your first documentation page",
    icon: BookOpen,
    rarity: "common",
    category: "learning",
    points: 10,
    criteria: "Read a doc page",
  },
  ten_docs_read: {
    id: "ten_docs_read",
    name: "Knowledge Seeker",
    description: "Read 10 documentation pages",
    icon: Compass,
    rarity: "common",
    category: "learning",
    points: 50,
    criteria: "Read 10 pages",
  },
  all_getting_started: {
    id: "all_getting_started",
    name: "Foundation Builder",
    description: "Complete all Getting Started guides",
    icon: Map,
    rarity: "rare",
    category: "learning",
    points: 100,
    criteria: "Complete Getting Started",
  },
  all_tutorials: {
    id: "all_tutorials",
    name: "Tutorial Graduate",
    description: "Complete all tutorials",
    icon: GraduationCap,
    rarity: "epic",
    category: "learning",
    points: 250,
    criteria: "Complete all tutorials",
  },
  ai_chat_first: {
    id: "ai_chat_first",
    name: "AI Whisperer",
    description: "Have your first conversation with the AI assistant",
    icon: Lightbulb,
    rarity: "common",
    category: "learning",
    points: 30,
    criteria: "Chat with AI assistant",
  },
  search_master: {
    id: "search_master",
    name: "Search Master",
    description: "Use the search feature 20 times",
    icon: Search,
    rarity: "rare",
    category: "learning",
    points: 75,
    criteria: "Search 20 times",
  },

  // ========== SOCIAL ==========
  first_follow: {
    id: "first_follow",
    name: "Social Butterfly",
    description: "Follow your first user",
    icon: UserPlus,
    rarity: "common",
    category: "social",
    points: 20,
    criteria: "Follow someone",
  },
  first_follower: {
    id: "first_follower",
    name: "Rising Star",
    description: "Get your first follower",
    icon: UsersRound,
    rarity: "common",
    category: "social",
    points: 30,
    criteria: "Get a follower",
  },
  ten_followers: {
    id: "ten_followers",
    name: "Community Figure",
    description: "Reach 10 followers",
    icon: Users,
    rarity: "rare",
    category: "social",
    points: 150,
    criteria: "Get 10 followers",
  },
  fifty_followers: {
    id: "fifty_followers",
    name: "Influencer",
    description: "Reach 50 followers",
    icon: Globe,
    rarity: "epic",
    category: "social",
    points: 500,
    criteria: "Get 50 followers",
  },
  first_dm: {
    id: "first_dm",
    name: "Direct Connection",
    description: "Send your first direct message",
    icon: Handshake,
    rarity: "common",
    category: "social",
    points: 25,
    criteria: "Send a DM",
  },

  // ========== CONTENT ==========
  first_suggestion: {
    id: "first_suggestion",
    name: "Editor's Eye",
    description: "Submit your first edit suggestion",
    icon: PenTool,
    rarity: "common",
    category: "content",
    points: 40,
    criteria: "Submit an edit suggestion",
  },
  playground_explorer: {
    id: "playground_explorer",
    name: "Code Explorer",
    description: "Run code in the playground",
    icon: Code2,
    rarity: "common",
    category: "content",
    points: 35,
    criteria: "Use the playground",
  },
  resource_submit: {
    id: "resource_submit",
    name: "Resource Contributor",
    description: "Submit a resource to the library",
    icon: FileText,
    rarity: "rare",
    category: "content",
    points: 100,
    criteria: "Submit a resource",
  },
  creative_prompt: {
    id: "creative_prompt",
    name: "Prompt Artist",
    description: "Create a creative prompt in the playground",
    icon: Sparkles,
    rarity: "rare",
    category: "content",
    points: 75,
    criteria: "Create in playground",
  },

  // ========== STREAKS ==========
  three_day_streak: {
    id: "three_day_streak",
    name: "Getting Warmed Up",
    description: "Visit the site 3 days in a row",
    icon: Flame,
    rarity: "common",
    category: "streak",
    points: 50,
    criteria: "3-day streak",
  },
  seven_day_streak: {
    id: "seven_day_streak",
    name: "Week Warrior",
    description: "Visit the site 7 days in a row",
    icon: Calendar,
    rarity: "rare",
    category: "streak",
    points: 150,
    criteria: "7-day streak",
  },
  thirty_day_streak: {
    id: "thirty_day_streak",
    name: "Monthly Master",
    description: "Visit the site 30 days in a row",
    icon: Zap,
    rarity: "epic",
    category: "streak",
    points: 500,
    criteria: "30-day streak",
  },
  hundred_day_streak: {
    id: "hundred_day_streak",
    name: "Centurion",
    description: "Visit the site 100 days in a row",
    icon: Timer,
    rarity: "legendary",
    category: "streak",
    points: 1500,
    criteria: "100-day streak",
  },

  // ========== COLLECTOR ==========
  first_favorite: {
    id: "first_favorite",
    name: "Bookmark Beginner",
    description: "Add your first favorite",
    icon: Heart,
    rarity: "common",
    category: "collector",
    points: 15,
    criteria: "Add a favorite",
  },
  ten_favorites: {
    id: "ten_favorites",
    name: "Curator",
    description: "Add 10 items to your favorites",
    icon: Bookmark,
    rarity: "common",
    category: "collector",
    points: 50,
    criteria: "Add 10 favorites",
  },
  first_collection: {
    id: "first_collection",
    name: "Organized Mind",
    description: "Create your first collection",
    icon: FolderHeart,
    rarity: "common",
    category: "collector",
    points: 30,
    criteria: "Create a collection",
  },
  five_collections: {
    id: "five_collections",
    name: "Librarian",
    description: "Create 5 collections",
    icon: Library,
    rarity: "rare",
    category: "collector",
    points: 100,
    criteria: "Create 5 collections",
  },
  resource_hoarder: {
    id: "resource_hoarder",
    name: "Resource Hoarder",
    description: "Save 50 resources to your favorites",
    icon: Archive,
    rarity: "epic",
    category: "collector",
    points: 250,
    criteria: "Save 50 resources",
  },

  // ========== EXPERT ==========
  beta_tester: {
    id: "beta_tester",
    name: "Beta Pioneer",
    description: "Join the beta testing program",
    icon: Medal,
    rarity: "epic",
    category: "expert",
    points: 300,
    criteria: "Become a beta tester",
  },
  power_user: {
    id: "power_user",
    name: "Power User",
    description: "Unlock 20 achievements",
    icon: Target,
    rarity: "epic",
    category: "expert",
    points: 400,
    criteria: "Unlock 20 achievements",
  },
  master_achiever: {
    id: "master_achiever",
    name: "Master Achiever",
    description: "Unlock 50 achievements",
    icon: Trophy,
    rarity: "legendary",
    category: "expert",
    points: 1000,
    criteria: "Unlock 50 achievements",
  },
  completionist: {
    id: "completionist",
    name: "Completionist",
    description: "Unlock all achievements",
    icon: Crown,
    rarity: "legendary",
    category: "expert",
    points: 2500,
    criteria: "Unlock all achievements",
    hidden: true,
  },
  diamond_member: {
    id: "diamond_member",
    name: "Diamond Member",
    description: "Reach 5000 total points",
    icon: Gem,
    rarity: "legendary",
    category: "expert",
    points: 500,
    criteria: "Earn 5000 points",
  },

  // ========== SUPPORTER ==========
  bronze_supporter: {
    id: "bronze_supporter",
    name: "Bronze Supporter",
    description: "Support Claude Insider with a donation of $10+",
    icon: Heart,
    rarity: "common",
    category: "supporter",
    points: 100,
    criteria: "Donate $10+",
  },
  silver_supporter: {
    id: "silver_supporter",
    name: "Silver Supporter",
    description: "Support Claude Insider with a donation of $50+",
    icon: Heart,
    rarity: "rare",
    category: "supporter",
    points: 250,
    criteria: "Donate $50+",
  },
  gold_supporter: {
    id: "gold_supporter",
    name: "Gold Supporter",
    description: "Support Claude Insider with a donation of $100+",
    icon: Medal,
    rarity: "epic",
    category: "supporter",
    points: 500,
    criteria: "Donate $100+",
  },
  platinum_supporter: {
    id: "platinum_supporter",
    name: "Platinum Supporter",
    description: "Support Claude Insider with a donation of $500+",
    icon: Gem,
    rarity: "legendary",
    category: "supporter",
    points: 1500,
    criteria: "Donate $500+",
  },
  first_donation: {
    id: "first_donation",
    name: "Heart of Gold",
    description: "Make your first donation to support the project",
    icon: Gift,
    rarity: "rare",
    category: "supporter",
    points: 150,
    criteria: "Make any donation",
  },
  recurring_supporter: {
    id: "recurring_supporter",
    name: "Patron Saint",
    description: "Become a monthly recurring supporter",
    icon: Crown,
    rarity: "legendary",
    category: "supporter",
    points: 1000,
    criteria: "Set up recurring donations",
    hidden: true,
  },

  // ========== SPECIAL ==========
  early_adopter: {
    id: "early_adopter",
    name: "Early Adopter",
    description: "Join during the first month of launch",
    icon: PartyPopper,
    rarity: "epic",
    category: "special",
    points: 250,
    criteria: "Join early",
    hidden: true,
  },
  birthday: {
    id: "birthday",
    name: "Birthday Celebration",
    description: "Visit on your account's anniversary",
    icon: Cake,
    rarity: "rare",
    category: "special",
    points: 100,
    criteria: "Visit on anniversary",
  },
  night_owl: {
    id: "night_owl",
    name: "Night Owl",
    description: "Browse documentation after midnight",
    icon: Moon,
    rarity: "common",
    category: "special",
    points: 25,
    criteria: "Visit after midnight",
  },
  early_bird: {
    id: "early_bird",
    name: "Early Bird",
    description: "Browse documentation before 6 AM",
    icon: Sun,
    rarity: "common",
    category: "special",
    points: 25,
    criteria: "Visit before 6 AM",
  },
  coffee_break: {
    id: "coffee_break",
    name: "Coffee Break",
    description: "Use the site for 30 minutes straight",
    icon: Coffee,
    rarity: "rare",
    category: "special",
    points: 75,
    criteria: "30-minute session",
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getAchievement(id: string): AchievementDefinition | undefined {
  return ACHIEVEMENTS[id];
}

export function getAchievementsByCategory(
  category: AchievementCategory
): AchievementDefinition[] {
  return Object.values(ACHIEVEMENTS).filter((a) => a.category === category);
}

export function getAchievementsByRarity(
  rarity: AchievementRarity
): AchievementDefinition[] {
  return Object.values(ACHIEVEMENTS).filter((a) => a.rarity === rarity);
}

export function getAllAchievements(): AchievementDefinition[] {
  return Object.values(ACHIEVEMENTS);
}

export function getVisibleAchievements(): AchievementDefinition[] {
  return Object.values(ACHIEVEMENTS).filter((a) => !a.hidden);
}

export function getTotalPossiblePoints(): number {
  return Object.values(ACHIEVEMENTS).reduce((sum, a) => sum + a.points, 0);
}
