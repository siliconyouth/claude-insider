/**
 * Honeypot System
 *
 * Decision logic for serving fake content to bots and suspicious visitors.
 * Integrates with honeypot configs from the database.
 */

import { pool } from "@/lib/db";
import { NextResponse } from "next/server";
import { getFakeResponseForEndpoint } from "@/lib/honeypot-templates";

export interface HoneypotConfig {
  id: string;
  name: string;
  description: string | null;
  pathPattern: string;
  method: string;
  priority: number;
  responseType: HoneypotResponseType;
  responseDelayMs: number;
  responseData: unknown | null;
  responseTemplate: string | null;
  redirectUrl: string | null;
  statusCode: number;
  targetBotsOnly: boolean;
  targetLowTrust: boolean;
  trustThreshold: number;
  targetBlockedVisitors: boolean;
  triggerCount: number;
  lastTriggeredAt: Date | null;
  uniqueVisitorsTriggered: number;
  enabled: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type HoneypotResponseType =
  | "fake_data"
  | "delay"
  | "redirect"
  | "block"
  | "template";

export interface HoneypotDecision {
  shouldTrigger: boolean;
  config: HoneypotConfig | null;
  reason: string;
}

export interface HoneypotContext {
  path: string;
  method: string;
  isBot: boolean;
  isVerifiedBot?: boolean;
  trustScore?: number;
  isBlocked?: boolean;
  visitorId?: string | null;
}

/**
 * Check if a request should trigger a honeypot
 */
export async function shouldServeHoneypot(
  context: HoneypotContext
): Promise<HoneypotDecision> {
  const { path, method, isBot, isVerifiedBot, trustScore, isBlocked } = context;

  // Get enabled honeypot configs sorted by priority
  const configs = await getEnabledHoneypots();

  for (const config of configs) {
    // Check if path matches pattern
    if (!matchesPattern(path, config.pathPattern)) {
      continue;
    }

    // Check if method matches
    if (config.method !== "ALL" && config.method !== method.toUpperCase()) {
      continue;
    }

    // Check targeting rules
    const shouldTarget = evaluateTargeting(config, {
      isBot,
      isVerifiedBot,
      trustScore,
      isBlocked,
    });

    if (shouldTarget) {
      return {
        shouldTrigger: true,
        config,
        reason: getTargetingReason(config, { isBot, trustScore, isBlocked }),
      };
    }
  }

  return {
    shouldTrigger: false,
    config: null,
    reason: "No matching honeypot config",
  };
}

/**
 * Generate honeypot response based on config
 */
export async function generateHoneypotResponse(
  config: HoneypotConfig,
  context: { path: string; method: string }
): Promise<NextResponse> {
  // Apply tarpit delay if configured
  if (config.responseDelayMs > 0) {
    await delay(config.responseDelayMs);
  }

  // Increment trigger count
  await incrementHoneypotTriggerCount(config.id);

  switch (config.responseType) {
    case "fake_data":
      return generateFakeDataResponse(config, context);

    case "template":
      return generateTemplateResponse(config, context);

    case "redirect":
      return generateRedirectResponse(config);

    case "block":
      return generateBlockResponse(config);

    case "delay":
      // Already delayed above, return fake data
      return generateFakeDataResponse(config, context);

    default:
      return generateFakeDataResponse(config, context);
  }
}

/**
 * Get all enabled honeypot configs sorted by priority
 */
export async function getEnabledHoneypots(): Promise<HoneypotConfig[]> {
  const result = await pool.query(
    `SELECT * FROM honeypot_configs WHERE enabled = TRUE ORDER BY priority ASC`
  );

  return result.rows.map(mapRowToConfig);
}

/**
 * Get honeypot config by ID
 */
export async function getHoneypotById(
  id: string
): Promise<HoneypotConfig | null> {
  const result = await pool.query(
    `SELECT * FROM honeypot_configs WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapRowToConfig(result.rows[0]);
}

/**
 * Create a new honeypot config
 */
export async function createHoneypot(
  config: Omit<
    HoneypotConfig,
    | "id"
    | "triggerCount"
    | "lastTriggeredAt"
    | "uniqueVisitorsTriggered"
    | "createdAt"
    | "updatedAt"
  >
): Promise<HoneypotConfig> {
  const result = await pool.query(
    `INSERT INTO honeypot_configs (
      name, description, path_pattern, method, priority,
      response_type, response_delay_ms, response_data, response_template,
      redirect_url, status_code, target_bots_only, target_low_trust,
      trust_threshold, target_blocked_visitors, enabled, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING *`,
    [
      config.name,
      config.description,
      config.pathPattern,
      config.method,
      config.priority,
      config.responseType,
      config.responseDelayMs,
      config.responseData ? JSON.stringify(config.responseData) : null,
      config.responseTemplate,
      config.redirectUrl,
      config.statusCode,
      config.targetBotsOnly,
      config.targetLowTrust,
      config.trustThreshold,
      config.targetBlockedVisitors,
      config.enabled,
      config.createdBy,
    ]
  );

  return mapRowToConfig(result.rows[0]);
}

/**
 * Update a honeypot config
 */
export async function updateHoneypot(
  id: string,
  updates: Partial<
    Omit<
      HoneypotConfig,
      | "id"
      | "triggerCount"
      | "lastTriggeredAt"
      | "uniqueVisitorsTriggered"
      | "createdAt"
      | "updatedAt"
    >
  >
): Promise<HoneypotConfig | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(updates.description);
  }
  if (updates.pathPattern !== undefined) {
    fields.push(`path_pattern = $${paramIndex++}`);
    values.push(updates.pathPattern);
  }
  if (updates.method !== undefined) {
    fields.push(`method = $${paramIndex++}`);
    values.push(updates.method);
  }
  if (updates.priority !== undefined) {
    fields.push(`priority = $${paramIndex++}`);
    values.push(updates.priority);
  }
  if (updates.responseType !== undefined) {
    fields.push(`response_type = $${paramIndex++}`);
    values.push(updates.responseType);
  }
  if (updates.responseDelayMs !== undefined) {
    fields.push(`response_delay_ms = $${paramIndex++}`);
    values.push(updates.responseDelayMs);
  }
  if (updates.responseData !== undefined) {
    fields.push(`response_data = $${paramIndex++}`);
    values.push(
      updates.responseData ? JSON.stringify(updates.responseData) : null
    );
  }
  if (updates.responseTemplate !== undefined) {
    fields.push(`response_template = $${paramIndex++}`);
    values.push(updates.responseTemplate);
  }
  if (updates.redirectUrl !== undefined) {
    fields.push(`redirect_url = $${paramIndex++}`);
    values.push(updates.redirectUrl);
  }
  if (updates.statusCode !== undefined) {
    fields.push(`status_code = $${paramIndex++}`);
    values.push(updates.statusCode);
  }
  if (updates.targetBotsOnly !== undefined) {
    fields.push(`target_bots_only = $${paramIndex++}`);
    values.push(updates.targetBotsOnly);
  }
  if (updates.targetLowTrust !== undefined) {
    fields.push(`target_low_trust = $${paramIndex++}`);
    values.push(updates.targetLowTrust);
  }
  if (updates.trustThreshold !== undefined) {
    fields.push(`trust_threshold = $${paramIndex++}`);
    values.push(updates.trustThreshold);
  }
  if (updates.targetBlockedVisitors !== undefined) {
    fields.push(`target_blocked_visitors = $${paramIndex++}`);
    values.push(updates.targetBlockedVisitors);
  }
  if (updates.enabled !== undefined) {
    fields.push(`enabled = $${paramIndex++}`);
    values.push(updates.enabled);
  }
  if (updates.updatedBy !== undefined) {
    fields.push(`updated_by = $${paramIndex++}`);
    values.push(updates.updatedBy);
  }

  if (fields.length === 0) {
    return getHoneypotById(id);
  }

  values.push(id);
  const result = await pool.query(
    `UPDATE honeypot_configs SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapRowToConfig(result.rows[0]);
}

/**
 * Delete a honeypot config
 */
export async function deleteHoneypot(id: string): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM honeypot_configs WHERE id = $1`,
    [id]
  );

  return (result.rowCount ?? 0) > 0;
}

/**
 * Get honeypot statistics
 */
export async function getHoneypotStats(): Promise<HoneypotStats[]> {
  const result = await pool.query(`SELECT * FROM honeypot_stats`);
  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    pathPattern: row.path_pattern,
    responseType: row.response_type,
    enabled: row.enabled,
    triggerCount: parseInt(row.trigger_count, 10),
    lastTriggeredAt: row.last_triggered_at
      ? new Date(row.last_triggered_at)
      : null,
    uniqueVisitors: parseInt(row.unique_visitors || "0", 10),
    triggers24h: parseInt(row.triggers_24h || "0", 10),
    triggers7d: parseInt(row.triggers_7d || "0", 10),
  }));
}

// Helper functions

function matchesPattern(path: string, pattern: string): boolean {
  // Convert glob pattern to regex
  // e.g., /api/* -> /api/[^/]+
  // e.g., /api/** -> /api/.*
  const regexPattern = pattern
    .replace(/\*\*/g, "<<<DOUBLE_STAR>>>")
    .replace(/\*/g, "[^/]+")
    .replace(/<<<DOUBLE_STAR>>>/g, ".*")
    .replace(/\//g, "\\/");

  const regex = new RegExp(`^${regexPattern}$`, "i");
  return regex.test(path);
}

function evaluateTargeting(
  config: HoneypotConfig,
  context: {
    isBot: boolean;
    isVerifiedBot?: boolean;
    trustScore?: number;
    isBlocked?: boolean;
  }
): boolean {
  // If targeting bots only and this isn't a bot, skip
  if (config.targetBotsOnly && !context.isBot) {
    // Unless also targeting low trust scores
    if (
      config.targetLowTrust &&
      context.trustScore !== undefined &&
      context.trustScore <= config.trustThreshold
    ) {
      return true;
    }
    // Unless also targeting blocked visitors
    if (config.targetBlockedVisitors && context.isBlocked) {
      return true;
    }
    return false;
  }

  // If targeting low trust and score is below threshold
  if (
    config.targetLowTrust &&
    context.trustScore !== undefined &&
    context.trustScore <= config.trustThreshold
  ) {
    return true;
  }

  // If targeting blocked visitors
  if (config.targetBlockedVisitors && context.isBlocked) {
    return true;
  }

  // If it's a bot and we target bots
  if (config.targetBotsOnly && context.isBot) {
    return true;
  }

  // If none of the specific targeting rules apply
  return !config.targetBotsOnly && !config.targetLowTrust;
}

function getTargetingReason(
  config: HoneypotConfig,
  context: {
    isBot: boolean;
    trustScore?: number;
    isBlocked?: boolean;
  }
): string {
  if (context.isBlocked) {
    return "Visitor is blocked";
  }
  if (context.isBot) {
    return "Bot detected";
  }
  if (context.trustScore !== undefined && context.trustScore <= config.trustThreshold) {
    return `Low trust score (${context.trustScore}/${config.trustThreshold})`;
  }
  return "Matched honeypot pattern";
}

function generateFakeDataResponse(
  config: HoneypotConfig,
  context: { path: string; method: string }
): NextResponse {
  // Use custom response data if provided
  if (config.responseData) {
    return NextResponse.json(config.responseData, {
      status: config.statusCode,
      headers: {
        "X-Honeypot": "true",
        "Cache-Control": "no-store",
      },
    });
  }

  // Generate fake data based on endpoint
  const fakeData = getFakeResponseForEndpoint(context.path, context.method);
  return NextResponse.json(fakeData, {
    status: config.statusCode,
    headers: {
      "X-Honeypot": "true",
      "Cache-Control": "no-store",
    },
  });
}

function generateTemplateResponse(
  config: HoneypotConfig,
  context: { path: string; method: string }
): NextResponse {
  // Templates are handled by getFakeResponseForEndpoint
  const fakeData = getFakeResponseForEndpoint(context.path, context.method);
  return NextResponse.json(fakeData, {
    status: config.statusCode,
    headers: {
      "X-Honeypot": "true",
      "Cache-Control": "no-store",
    },
  });
}

function generateRedirectResponse(config: HoneypotConfig): NextResponse {
  if (!config.redirectUrl) {
    return NextResponse.json(
      { error: "Redirect URL not configured" },
      { status: 500 }
    );
  }

  return NextResponse.redirect(config.redirectUrl, {
    status: 302,
    headers: {
      "X-Honeypot": "true",
    },
  });
}

function generateBlockResponse(config: HoneypotConfig): NextResponse {
  return NextResponse.json(
    {
      error: "Access denied",
      code: "FORBIDDEN",
      message: "You do not have permission to access this resource.",
    },
    {
      status: config.statusCode || 403,
      headers: {
        "X-Honeypot": "true",
        "Cache-Control": "no-store",
      },
    }
  );
}

async function incrementHoneypotTriggerCount(configId: string): Promise<void> {
  await pool.query(
    `UPDATE honeypot_configs SET
      trigger_count = trigger_count + 1,
      last_triggered_at = NOW()
    WHERE id = $1`,
    [configId]
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mapRowToConfig(row: Record<string, unknown>): HoneypotConfig {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string | null,
    pathPattern: row.path_pattern as string,
    method: row.method as string,
    priority: row.priority as number,
    responseType: row.response_type as HoneypotResponseType,
    responseDelayMs: row.response_delay_ms as number,
    responseData: row.response_data,
    responseTemplate: row.response_template as string | null,
    redirectUrl: row.redirect_url as string | null,
    statusCode: row.status_code as number,
    targetBotsOnly: row.target_bots_only as boolean,
    targetLowTrust: row.target_low_trust as boolean,
    trustThreshold: parseFloat(row.trust_threshold as string),
    targetBlockedVisitors: row.target_blocked_visitors as boolean,
    triggerCount: row.trigger_count as number,
    lastTriggeredAt: row.last_triggered_at
      ? new Date(row.last_triggered_at as string)
      : null,
    uniqueVisitorsTriggered: row.unique_visitors_triggered as number,
    enabled: row.enabled as boolean,
    createdBy: row.created_by as string | null,
    updatedBy: row.updated_by as string | null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

// Types
export interface HoneypotStats {
  id: string;
  name: string;
  pathPattern: string;
  responseType: string;
  enabled: boolean;
  triggerCount: number;
  lastTriggeredAt: Date | null;
  uniqueVisitors: number;
  triggers24h: number;
  triggers7d: number;
}
