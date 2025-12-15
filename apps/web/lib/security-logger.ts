/**
 * Security Event Logger
 *
 * Logs security events to the security_logs table.
 * Used for bot detection, honeypot triggers, blocked requests, etc.
 */

import { pool } from "@/lib/db";
import { getRequestMetadata, generateRequestId } from "@/lib/request-id";
import type { BotCheckResult } from "@/lib/bot-detection";

export type SecurityEventType =
  | "request"
  | "bot_detected"
  | "honeypot_served"
  | "rate_limited"
  | "blocked"
  | "auth_attempt"
  | "auth_success"
  | "auth_failure"
  | "visitor_blocked"
  | "visitor_unblocked";

export type SecuritySeverity = "debug" | "info" | "warning" | "error" | "critical";

export interface SecurityEvent {
  requestId?: string;
  visitorId?: string | null;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  endpoint?: string | null;
  method?: string | null;
  referer?: string | null;
  origin?: string | null;
  isBot?: boolean;
  isHuman?: boolean;
  isVerifiedBot?: boolean;
  botName?: string | null;
  botCategory?: string | null;
  botBypassed?: boolean;
  fingerprintConfidence?: number | null;
  fingerprintComponents?: Record<string, unknown> | null;
  eventType: SecurityEventType;
  severity?: SecuritySeverity;
  statusCode?: number | null;
  responseTimeMs?: number | null;
  honeypotServed?: boolean;
  honeypotConfigId?: string | null;
  metadata?: Record<string, unknown> | null;
  geoCountry?: string | null;
  geoCity?: string | null;
}

/**
 * Log a security event
 */
export async function logSecurityEvent(event: SecurityEvent): Promise<string> {
  const requestId = event.requestId || generateRequestId();

  try {
    const result = await pool.query(
      `INSERT INTO security_logs (
        request_id, visitor_id, user_id, ip_address, user_agent,
        endpoint, method, referer, origin,
        is_bot, is_human, is_verified_bot, bot_name, bot_category, bot_bypassed,
        fingerprint_confidence, fingerprint_components,
        event_type, severity, status_code, response_time_ms,
        honeypot_served, honeypot_config_id, metadata, geo_country, geo_city
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
      ) RETURNING id`,
      [
        requestId,
        event.visitorId || null,
        event.userId || null,
        event.ipAddress || null,
        event.userAgent || null,
        event.endpoint || null,
        event.method || null,
        event.referer || null,
        event.origin || null,
        event.isBot ?? false,
        event.isHuman ?? true,
        event.isVerifiedBot ?? false,
        event.botName || null,
        event.botCategory || null,
        event.botBypassed ?? false,
        event.fingerprintConfidence || null,
        event.fingerprintComponents
          ? JSON.stringify(event.fingerprintComponents)
          : null,
        event.eventType,
        event.severity || "info",
        event.statusCode || null,
        event.responseTimeMs || null,
        event.honeypotServed ?? false,
        event.honeypotConfigId || null,
        event.metadata ? JSON.stringify(event.metadata) : null,
        event.geoCountry || null,
        event.geoCity || null,
      ]
    );

    return result.rows[0].id;
  } catch (error) {
    console.error("[Security Logger] Failed to log event:", error);
    throw error;
  }
}

/**
 * Log a bot detection event
 */
export async function logBotDetection(
  botResult: BotCheckResult,
  options?: {
    requestId?: string;
    visitorId?: string | null;
    userId?: string | null;
    endpoint?: string | null;
    method?: string | null;
  }
): Promise<string> {
  const metadata = await getRequestMetadata();

  return logSecurityEvent({
    requestId: options?.requestId || metadata.requestId,
    visitorId: options?.visitorId || metadata.visitorId,
    userId: options?.userId,
    ipAddress: metadata.ip,
    userAgent: metadata.userAgent,
    endpoint: options?.endpoint,
    method: options?.method,
    referer: metadata.referer,
    origin: metadata.origin,
    isBot: botResult.isBot,
    isHuman: botResult.isHuman,
    isVerifiedBot: botResult.isVerifiedBot,
    botName: botResult.verifiedBotName || null,
    botBypassed: botResult.bypassed,
    eventType: botResult.isBot ? "bot_detected" : "request",
    severity: botResult.isBot ? "warning" : "info",
    metadata: {
      classificationReason: botResult.classificationReason,
    },
  });
}

/**
 * Log a honeypot trigger event
 */
export async function logHoneypotTrigger(options: {
  requestId?: string;
  visitorId?: string | null;
  userId?: string | null;
  endpoint?: string | null;
  method?: string | null;
  honeypotConfigId: string;
  honeypotName: string;
  responseType: string;
  delayMs?: number;
}): Promise<string> {
  const metadata = await getRequestMetadata();

  return logSecurityEvent({
    requestId: options.requestId || metadata.requestId,
    visitorId: options.visitorId || metadata.visitorId,
    userId: options.userId,
    ipAddress: metadata.ip,
    userAgent: metadata.userAgent,
    endpoint: options.endpoint,
    method: options.method,
    referer: metadata.referer,
    origin: metadata.origin,
    eventType: "honeypot_served",
    severity: "warning",
    honeypotServed: true,
    honeypotConfigId: options.honeypotConfigId,
    metadata: {
      honeypotName: options.honeypotName,
      responseType: options.responseType,
      delayMs: options.delayMs,
    },
  });
}

/**
 * Log a blocked request event
 */
export async function logBlockedRequest(options: {
  requestId?: string;
  visitorId?: string | null;
  userId?: string | null;
  endpoint?: string | null;
  method?: string | null;
  reason: string;
  statusCode?: number;
}): Promise<string> {
  const metadata = await getRequestMetadata();

  return logSecurityEvent({
    requestId: options.requestId || metadata.requestId,
    visitorId: options.visitorId || metadata.visitorId,
    userId: options.userId,
    ipAddress: metadata.ip,
    userAgent: metadata.userAgent,
    endpoint: options.endpoint,
    method: options.method,
    referer: metadata.referer,
    origin: metadata.origin,
    eventType: "blocked",
    severity: "warning",
    statusCode: options.statusCode || 403,
    metadata: {
      blockReason: options.reason,
    },
  });
}

/**
 * Get security logs with filters
 */
export async function getSecurityLogs(filters: {
  limit?: number;
  offset?: number;
  eventType?: SecurityEventType;
  severity?: SecuritySeverity;
  isBot?: boolean;
  honeypotServed?: boolean;
  visitorId?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  sortOrder?: "asc" | "desc";
}): Promise<{
  logs: SecurityLogEntry[];
  total: number;
}> {
  const {
    limit = 50,
    offset = 0,
    eventType,
    severity,
    isBot,
    honeypotServed,
    visitorId,
    userId,
    startDate,
    endDate,
    sortOrder = "desc",
  } = filters;

  const conditions: string[] = [];
  const params: (string | number | boolean | Date)[] = [];
  let paramIndex = 1;

  if (eventType) {
    conditions.push(`event_type = $${paramIndex++}`);
    params.push(eventType);
  }

  if (severity) {
    conditions.push(`severity = $${paramIndex++}`);
    params.push(severity);
  }

  if (isBot !== undefined) {
    conditions.push(`is_bot = $${paramIndex++}`);
    params.push(isBot);
  }

  if (honeypotServed !== undefined) {
    conditions.push(`honeypot_served = $${paramIndex++}`);
    params.push(honeypotServed);
  }

  if (visitorId) {
    conditions.push(`visitor_id = $${paramIndex++}`);
    params.push(visitorId);
  }

  if (userId) {
    conditions.push(`user_id = $${paramIndex++}`);
    params.push(userId);
  }

  if (startDate) {
    conditions.push(`created_at >= $${paramIndex++}`);
    params.push(startDate);
  }

  if (endDate) {
    conditions.push(`created_at <= $${paramIndex++}`);
    params.push(endDate);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Get total count
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM security_logs ${whereClause}`,
    params
  );

  // Get paginated results
  const result = await pool.query(
    `SELECT * FROM security_logs ${whereClause}
     ORDER BY created_at ${sortOrder.toUpperCase()}
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset]
  );

  return {
    logs: result.rows.map(mapRowToLog),
    total: parseInt(countResult.rows[0].count, 10),
  };
}

/**
 * Get security statistics
 */
export async function getSecurityStats(): Promise<SecurityStats> {
  const result = await pool.query(`SELECT * FROM security_stats`);
  const row = result.rows[0];

  return {
    totalLogs: parseInt(row.total_logs, 10),
    logs24h: parseInt(row.logs_24h, 10),
    logs7d: parseInt(row.logs_7d, 10),
    totalBotDetections: parseInt(row.total_bot_detections, 10),
    bots24h: parseInt(row.bots_24h, 10),
    verifiedBots: parseInt(row.verified_bots, 10),
    totalHoneypotTriggers: parseInt(row.total_honeypot_triggers, 10),
    honeypots24h: parseInt(row.honeypots_24h, 10),
    criticalEvents: parseInt(row.critical_events, 10),
    errorEvents: parseInt(row.error_events, 10),
    warningEvents: parseInt(row.warning_events, 10),
  };
}

/**
 * Get visitor statistics
 */
export async function getVisitorStats(): Promise<VisitorStats> {
  const result = await pool.query(`SELECT * FROM visitor_stats`);
  const row = result.rows[0];

  return {
    totalVisitors: parseInt(row.total_visitors || "0", 10),
    blockedVisitors: parseInt(row.blocked_visitors || "0", 10),
    trustedVisitors: parseInt(row.trusted_visitors || "0", 10),
    suspiciousVisitors: parseInt(row.suspicious_visitors || "0", 10),
    untrustedVisitors: parseInt(row.untrusted_visitors || "0", 10),
    visitorsWithBotActivity: parseInt(row.visitors_with_bot_activity || "0", 10),
    visitorsWithAccounts: parseInt(row.visitors_with_accounts || "0", 10),
    averageTrustScore: parseFloat(row.average_trust_score || "50"),
  };
}

// Types
export interface SecurityLogEntry {
  id: string;
  requestId: string;
  visitorId: string | null;
  userId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  endpoint: string | null;
  method: string | null;
  referer: string | null;
  origin: string | null;
  isBot: boolean;
  isHuman: boolean;
  isVerifiedBot: boolean;
  botName: string | null;
  botCategory: string | null;
  botBypassed: boolean;
  fingerprintConfidence: number | null;
  fingerprintComponents: Record<string, unknown> | null;
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  statusCode: number | null;
  responseTimeMs: number | null;
  honeypotServed: boolean;
  honeypotConfigId: string | null;
  metadata: Record<string, unknown> | null;
  geoCountry: string | null;
  geoCity: string | null;
  createdAt: Date;
}

export interface SecurityStats {
  totalLogs: number;
  logs24h: number;
  logs7d: number;
  totalBotDetections: number;
  bots24h: number;
  verifiedBots: number;
  totalHoneypotTriggers: number;
  honeypots24h: number;
  criticalEvents: number;
  errorEvents: number;
  warningEvents: number;
}

export interface VisitorStats {
  totalVisitors: number;
  blockedVisitors: number;
  trustedVisitors: number;
  suspiciousVisitors: number;
  untrustedVisitors: number;
  visitorsWithBotActivity: number;
  visitorsWithAccounts: number;
  averageTrustScore: number;
}

// Map database row to SecurityLogEntry
function mapRowToLog(row: Record<string, unknown>): SecurityLogEntry {
  return {
    id: row.id as string,
    requestId: row.request_id as string,
    visitorId: row.visitor_id as string | null,
    userId: row.user_id as string | null,
    ipAddress: row.ip_address as string | null,
    userAgent: row.user_agent as string | null,
    endpoint: row.endpoint as string | null,
    method: row.method as string | null,
    referer: row.referer as string | null,
    origin: row.origin as string | null,
    isBot: row.is_bot as boolean,
    isHuman: row.is_human as boolean,
    isVerifiedBot: row.is_verified_bot as boolean,
    botName: row.bot_name as string | null,
    botCategory: row.bot_category as string | null,
    botBypassed: row.bot_bypassed as boolean,
    fingerprintConfidence: row.fingerprint_confidence
      ? parseFloat(row.fingerprint_confidence as string)
      : null,
    fingerprintComponents: row.fingerprint_components as Record<
      string,
      unknown
    > | null,
    eventType: row.event_type as SecurityEventType,
    severity: row.severity as SecuritySeverity,
    statusCode: row.status_code as number | null,
    responseTimeMs: row.response_time_ms as number | null,
    honeypotServed: row.honeypot_served as boolean,
    honeypotConfigId: row.honeypot_config_id as string | null,
    metadata: row.metadata as Record<string, unknown> | null,
    geoCountry: row.geo_country as string | null,
    geoCity: row.geo_city as string | null,
    createdAt: new Date(row.created_at as string),
  };
}
