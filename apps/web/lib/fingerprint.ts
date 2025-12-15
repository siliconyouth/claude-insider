/**
 * Server-Side Fingerprint Utilities
 *
 * Manages visitor fingerprints stored in the database.
 * Works with FingerprintJS visitorIds sent from the client.
 */

import { pool } from "@/lib/db";
import { calculateTrustScore, type TrustScoreResult } from "@/lib/trust-score";

export interface VisitorFingerprint {
  id: string;
  visitorId: string;
  firstSeenAt: Date;
  firstIp: string | null;
  firstUserAgent: string | null;
  firstEndpoint: string | null;
  lastSeenAt: Date;
  lastIp: string | null;
  lastUserAgent: string | null;
  lastEndpoint: string | null;
  totalRequests: number;
  botRequests: number;
  humanRequests: number;
  honeypotTriggers: number;
  trustScore: number;
  trustLevel: string;
  isBlocked: boolean;
  blockReason: string | null;
  blockedAt: Date | null;
  blockedBy: string | null;
  autoBlocked: boolean;
  autoBlockRule: string | null;
  linkedUserId: string | null;
  linkedAt: Date | null;
  components: Record<string, unknown>;
  notes: string | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateVisitorOptions {
  visitorId: string;
  ip?: string | null;
  userAgent?: string | null;
  endpoint?: string | null;
  isBot?: boolean;
  components?: Record<string, unknown>;
}

/**
 * Get or create visitor fingerprint record
 */
export async function getOrCreateVisitor(
  visitorId: string,
  options?: {
    ip?: string | null;
    userAgent?: string | null;
    endpoint?: string | null;
    components?: Record<string, unknown>;
  }
): Promise<VisitorFingerprint> {
  // Try to get existing visitor
  const existing = await getVisitorByFingerprint(visitorId);
  if (existing) {
    return existing;
  }

  // Create new visitor
  const result = await pool.query(
    `INSERT INTO visitor_fingerprints (
      visitor_id, first_ip, first_user_agent, first_endpoint,
      last_ip, last_user_agent, last_endpoint, components
    ) VALUES ($1, $2, $3, $4, $2, $3, $4, $5)
    RETURNING *`,
    [
      visitorId,
      options?.ip || null,
      options?.userAgent || null,
      options?.endpoint || null,
      options?.components ? JSON.stringify(options.components) : "{}",
    ]
  );

  return mapRowToVisitor(result.rows[0]);
}

/**
 * Get visitor by fingerprint ID
 */
export async function getVisitorByFingerprint(
  visitorId: string
): Promise<VisitorFingerprint | null> {
  const result = await pool.query(
    `SELECT * FROM visitor_fingerprints WHERE visitor_id = $1`,
    [visitorId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapRowToVisitor(result.rows[0]);
}

/**
 * Update visitor stats after a request
 */
export async function updateVisitorStats(
  options: UpdateVisitorOptions
): Promise<VisitorFingerprint | null> {
  const { visitorId, ip, userAgent, endpoint, isBot = false } = options;

  // Update visitor record
  const result = await pool.query(
    `UPDATE visitor_fingerprints SET
      last_seen_at = NOW(),
      last_ip = COALESCE($2, last_ip),
      last_user_agent = COALESCE($3, last_user_agent),
      last_endpoint = COALESCE($4, last_endpoint),
      total_requests = total_requests + 1,
      bot_requests = bot_requests + $5,
      human_requests = human_requests + $6
    WHERE visitor_id = $1
    RETURNING *`,
    [visitorId, ip, userAgent, endpoint, isBot ? 1 : 0, isBot ? 0 : 1]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapRowToVisitor(result.rows[0]);
}

/**
 * Increment honeypot trigger count for a visitor
 */
export async function incrementHoneypotTriggers(
  visitorId: string
): Promise<void> {
  await pool.query(
    `UPDATE visitor_fingerprints SET
      honeypot_triggers = honeypot_triggers + 1,
      last_seen_at = NOW()
    WHERE visitor_id = $1`,
    [visitorId]
  );
}

/**
 * Update visitor trust score
 */
export async function updateVisitorTrustScore(
  visitorId: string
): Promise<TrustScoreResult | null> {
  const visitor = await getVisitorByFingerprint(visitorId);
  if (!visitor) {
    return null;
  }

  const trustResult = calculateTrustScore({
    visitorId: visitor.visitorId,
    linkedUserId: visitor.linkedUserId,
    totalRequests: visitor.totalRequests,
    botRequests: visitor.botRequests,
    humanRequests: visitor.humanRequests,
    honeypotTriggers: visitor.honeypotTriggers,
    lastSeenAt: visitor.lastSeenAt,
    firstSeenAt: visitor.firstSeenAt,
    isBlocked: visitor.isBlocked,
  });

  // Update score in database (trigger will auto-calculate trust_level)
  await pool.query(
    `UPDATE visitor_fingerprints SET trust_score = $1 WHERE visitor_id = $2`,
    [trustResult.score, visitorId]
  );

  return trustResult;
}

/**
 * Block a visitor
 */
export async function blockVisitor(
  visitorId: string,
  reason: string,
  blockedBy?: string,
  autoBlocked: boolean = false,
  autoBlockRule?: string
): Promise<void> {
  await pool.query(
    `UPDATE visitor_fingerprints SET
      is_blocked = TRUE,
      block_reason = $2,
      blocked_at = NOW(),
      blocked_by = $3,
      auto_blocked = $4,
      auto_block_rule = $5
    WHERE visitor_id = $1`,
    [visitorId, reason, blockedBy || null, autoBlocked, autoBlockRule || null]
  );
}

/**
 * Unblock a visitor
 */
export async function unblockVisitor(visitorId: string): Promise<void> {
  await pool.query(
    `UPDATE visitor_fingerprints SET
      is_blocked = FALSE,
      block_reason = NULL,
      blocked_at = NULL,
      blocked_by = NULL,
      auto_blocked = FALSE,
      auto_block_rule = NULL
    WHERE visitor_id = $1`,
    [visitorId]
  );
}

/**
 * Link visitor to authenticated user
 */
export async function linkVisitorToUser(
  visitorId: string,
  userId: string
): Promise<void> {
  await pool.query(
    `UPDATE visitor_fingerprints SET
      linked_user_id = $2,
      linked_at = NOW()
    WHERE visitor_id = $1 AND linked_user_id IS NULL`,
    [visitorId, userId]
  );
}

/**
 * Check if visitor is blocked
 */
export async function isVisitorBlocked(visitorId: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT is_blocked FROM visitor_fingerprints WHERE visitor_id = $1`,
    [visitorId]
  );

  return result.rows[0]?.is_blocked === true;
}

/**
 * Get visitor trust score
 */
export async function getVisitorTrustScore(
  visitorId: string
): Promise<number | null> {
  const result = await pool.query(
    `SELECT trust_score FROM visitor_fingerprints WHERE visitor_id = $1`,
    [visitorId]
  );

  return result.rows[0]?.trust_score ?? null;
}

/**
 * Get visitors with pagination and filters
 */
export async function getVisitors(options: {
  limit?: number;
  offset?: number;
  isBlocked?: boolean;
  trustLevel?: string;
  hasLinkedUser?: boolean;
  sortBy?: "last_seen" | "trust_score" | "total_requests" | "bot_requests";
  sortOrder?: "asc" | "desc";
}): Promise<{ visitors: VisitorFingerprint[]; total: number }> {
  const {
    limit = 50,
    offset = 0,
    isBlocked,
    trustLevel,
    hasLinkedUser,
    sortBy = "last_seen",
    sortOrder = "desc",
  } = options;

  const conditions: string[] = [];
  const params: (string | number | boolean)[] = [];
  let paramIndex = 1;

  if (isBlocked !== undefined) {
    conditions.push(`is_blocked = $${paramIndex++}`);
    params.push(isBlocked);
  }

  if (trustLevel) {
    conditions.push(`trust_level = $${paramIndex++}`);
    params.push(trustLevel);
  }

  if (hasLinkedUser !== undefined) {
    conditions.push(
      hasLinkedUser
        ? `linked_user_id IS NOT NULL`
        : `linked_user_id IS NULL`
    );
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const sortColumn = {
    last_seen: "last_seen_at",
    trust_score: "trust_score",
    total_requests: "total_requests",
    bot_requests: "bot_requests",
  }[sortBy];

  // Get total count
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM visitor_fingerprints ${whereClause}`,
    params
  );

  // Get paginated results
  const result = await pool.query(
    `SELECT * FROM visitor_fingerprints ${whereClause}
     ORDER BY ${sortColumn} ${sortOrder.toUpperCase()}
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset]
  );

  return {
    visitors: result.rows.map(mapRowToVisitor),
    total: parseInt(countResult.rows[0].count, 10),
  };
}

/**
 * Add tags to visitor
 */
export async function addVisitorTags(
  visitorId: string,
  tags: string[]
): Promise<void> {
  await pool.query(
    `UPDATE visitor_fingerprints SET
      tags = array_cat(tags, $2::text[])
    WHERE visitor_id = $1`,
    [visitorId, tags]
  );
}

/**
 * Add note to visitor
 */
export async function addVisitorNote(
  visitorId: string,
  note: string
): Promise<void> {
  await pool.query(
    `UPDATE visitor_fingerprints SET
      notes = CASE WHEN notes IS NULL THEN $2 ELSE notes || E'\n' || $2 END
    WHERE visitor_id = $1`,
    [visitorId, note]
  );
}

// Map database row to VisitorFingerprint interface
function mapRowToVisitor(row: Record<string, unknown>): VisitorFingerprint {
  return {
    id: row.id as string,
    visitorId: row.visitor_id as string,
    firstSeenAt: new Date(row.first_seen_at as string),
    firstIp: row.first_ip as string | null,
    firstUserAgent: row.first_user_agent as string | null,
    firstEndpoint: row.first_endpoint as string | null,
    lastSeenAt: new Date(row.last_seen_at as string),
    lastIp: row.last_ip as string | null,
    lastUserAgent: row.last_user_agent as string | null,
    lastEndpoint: row.last_endpoint as string | null,
    totalRequests: row.total_requests as number,
    botRequests: row.bot_requests as number,
    humanRequests: row.human_requests as number,
    honeypotTriggers: row.honeypot_triggers as number,
    trustScore: parseFloat(row.trust_score as string),
    trustLevel: row.trust_level as string,
    isBlocked: row.is_blocked as boolean,
    blockReason: row.block_reason as string | null,
    blockedAt: row.blocked_at ? new Date(row.blocked_at as string) : null,
    blockedBy: row.blocked_by as string | null,
    autoBlocked: row.auto_blocked as boolean,
    autoBlockRule: row.auto_block_rule as string | null,
    linkedUserId: row.linked_user_id as string | null,
    linkedAt: row.linked_at ? new Date(row.linked_at as string) : null,
    components: (row.components as Record<string, unknown>) || {},
    notes: row.notes as string | null,
    tags: (row.tags as string[]) || [],
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}
