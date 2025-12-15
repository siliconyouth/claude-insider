/**
 * Trust Score Algorithm
 *
 * Rules-based visitor trust scoring system.
 * Scores range from 0-100 (higher = more trusted).
 */

export interface VisitorData {
  visitorId: string;
  linkedUserId?: string | null;
  totalRequests: number;
  botRequests: number;
  humanRequests: number;
  honeypotTriggers: number;
  lastSeenAt: Date;
  firstSeenAt: Date;
  isBlocked: boolean;
}

export interface TrustScoreResult {
  score: number;
  level: TrustLevel;
  factors: TrustFactor[];
}

export type TrustLevel = "trusted" | "neutral" | "suspicious" | "untrusted";

export interface TrustFactor {
  name: string;
  impact: number; // Positive or negative
  description: string;
}

// Trust level thresholds
export const TRUST_THRESHOLDS = {
  TRUSTED: 80,
  NEUTRAL: 50,
  SUSPICIOUS: 20,
  // Below 20 = untrusted
} as const;

// Scoring weights
const SCORING_WEIGHTS = {
  // Positive factors
  HAS_ACCOUNT: 20,
  REGULAR_VISITOR: 10, // 100+ requests
  NEVER_BOT: 15,
  LONG_HISTORY: 5, // 30+ days since first seen

  // Negative factors
  BOT_DETECTION_PENALTY: 5, // Per detection
  HONEYPOT_TRIGGER_PENALTY: 10, // Per trigger
  INACTIVITY_DECAY: 1, // Per week since last seen

  // Base score
  BASE_SCORE: 50,
} as const;

/**
 * Calculate trust score for a visitor
 */
export function calculateTrustScore(visitor: VisitorData): TrustScoreResult {
  const factors: TrustFactor[] = [];
  let score: number = SCORING_WEIGHTS.BASE_SCORE;

  // If blocked, return minimum score
  if (visitor.isBlocked) {
    return {
      score: 0,
      level: "untrusted",
      factors: [
        {
          name: "blocked",
          impact: -100,
          description: "Visitor has been blocked",
        },
      ],
    };
  }

  // POSITIVE FACTORS

  // Has linked authenticated user
  if (visitor.linkedUserId) {
    score += SCORING_WEIGHTS.HAS_ACCOUNT;
    factors.push({
      name: "has_account",
      impact: SCORING_WEIGHTS.HAS_ACCOUNT,
      description: "Has authenticated with a user account",
    });
  }

  // Regular visitor (100+ requests)
  if (visitor.totalRequests >= 100) {
    score += SCORING_WEIGHTS.REGULAR_VISITOR;
    factors.push({
      name: "regular_visitor",
      impact: SCORING_WEIGHTS.REGULAR_VISITOR,
      description: `Regular visitor with ${visitor.totalRequests} requests`,
    });
  }

  // Never flagged as bot
  if (visitor.botRequests === 0 && visitor.totalRequests >= 10) {
    score += SCORING_WEIGHTS.NEVER_BOT;
    factors.push({
      name: "never_bot",
      impact: SCORING_WEIGHTS.NEVER_BOT,
      description: "No bot detection flags",
    });
  }

  // Long history (30+ days)
  const daysSinceFirstSeen = daysBetween(visitor.firstSeenAt, new Date());
  if (daysSinceFirstSeen >= 30) {
    score += SCORING_WEIGHTS.LONG_HISTORY;
    factors.push({
      name: "long_history",
      impact: SCORING_WEIGHTS.LONG_HISTORY,
      description: `Account active for ${daysSinceFirstSeen} days`,
    });
  }

  // NEGATIVE FACTORS

  // Bot detection penalties
  if (visitor.botRequests > 0) {
    const penalty = visitor.botRequests * SCORING_WEIGHTS.BOT_DETECTION_PENALTY;
    score -= penalty;
    factors.push({
      name: "bot_detections",
      impact: -penalty,
      description: `${visitor.botRequests} bot detection(s)`,
    });
  }

  // Honeypot trigger penalties
  if (visitor.honeypotTriggers > 0) {
    const penalty =
      visitor.honeypotTriggers * SCORING_WEIGHTS.HONEYPOT_TRIGGER_PENALTY;
    score -= penalty;
    factors.push({
      name: "honeypot_triggers",
      impact: -penalty,
      description: `${visitor.honeypotTriggers} honeypot trigger(s)`,
    });
  }

  // Inactivity decay (1 point per week since last seen)
  const weeksSinceLastSeen = daysBetween(visitor.lastSeenAt, new Date()) / 7;
  if (weeksSinceLastSeen >= 1) {
    const decay =
      Math.floor(weeksSinceLastSeen) * SCORING_WEIGHTS.INACTIVITY_DECAY;
    score -= decay;
    factors.push({
      name: "inactivity_decay",
      impact: -decay,
      description: `${Math.floor(weeksSinceLastSeen)} weeks since last visit`,
    });
  }

  // Clamp score to 0-100
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    level: getTrustLevel(score),
    factors,
  };
}

/**
 * Get trust level from score
 */
export function getTrustLevel(score: number): TrustLevel {
  if (score >= TRUST_THRESHOLDS.TRUSTED) return "trusted";
  if (score >= TRUST_THRESHOLDS.NEUTRAL) return "neutral";
  if (score >= TRUST_THRESHOLDS.SUSPICIOUS) return "suspicious";
  return "untrusted";
}

/**
 * Check if visitor should be auto-blocked based on thresholds
 */
export function shouldAutoBlock(
  visitor: VisitorData,
  settings: {
    botThreshold: number;
    honeypotThreshold: number;
    trustThreshold: number;
  }
): { shouldBlock: boolean; reason: string | null } {
  // Too many bot detections
  if (visitor.botRequests >= settings.botThreshold) {
    return {
      shouldBlock: true,
      reason: `Exceeded bot detection threshold (${visitor.botRequests}/${settings.botThreshold})`,
    };
  }

  // Too many honeypot triggers
  if (visitor.honeypotTriggers >= settings.honeypotThreshold) {
    return {
      shouldBlock: true,
      reason: `Exceeded honeypot trigger threshold (${visitor.honeypotTriggers}/${settings.honeypotThreshold})`,
    };
  }

  // Trust score too low
  const { score } = calculateTrustScore(visitor);
  if (score <= settings.trustThreshold) {
    return {
      shouldBlock: true,
      reason: `Trust score below threshold (${score}/${settings.trustThreshold})`,
    };
  }

  return { shouldBlock: false, reason: null };
}

/**
 * Get color class for trust level (Tailwind)
 */
export function getTrustLevelColor(level: TrustLevel): string {
  switch (level) {
    case "trusted":
      return "text-emerald-500";
    case "neutral":
      return "text-blue-500";
    case "suspicious":
      return "text-amber-500";
    case "untrusted":
      return "text-red-500";
  }
}

/**
 * Get badge color classes for trust level
 */
export function getTrustLevelBadgeClasses(level: TrustLevel): string {
  switch (level) {
    case "trusted":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    case "neutral":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "suspicious":
      return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    case "untrusted":
      return "bg-red-500/10 text-red-500 border-red-500/20";
  }
}

// Helper: Calculate days between two dates
function daysBetween(date1: Date, date2: Date): number {
  const diffMs = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
