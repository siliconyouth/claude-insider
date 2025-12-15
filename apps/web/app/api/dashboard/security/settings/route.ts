/**
 * Security Settings API
 *
 * Get and update security configuration settings.
 * Admin only endpoint.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pool } from "@/lib/db";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";

interface SecuritySetting {
  id: string;
  key: string;
  value: unknown;
  valueType: string;
  description: string | null;
  category: string;
  updatedBy: string | null;
  updatedAt: Date;
  createdAt: Date;
}

/**
 * GET - Get all security settings
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication - admin only
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roleResult = await pool.query(
      `SELECT role FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.ADMIN)) {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
    }

    // Filter by category if provided
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    let query = `SELECT * FROM security_settings`;
    const params: string[] = [];

    if (category) {
      query += ` WHERE category = $1`;
      params.push(category);
    }

    query += ` ORDER BY category, key`;

    const result = await pool.query(query, params);

    const settings = result.rows.map((row) => ({
      id: row.id,
      key: row.key,
      value: parseSettingValue(row.value, row.value_type),
      valueType: row.value_type,
      description: row.description,
      category: row.category,
      updatedBy: row.updated_by,
      updatedAt: row.updated_at,
      createdAt: row.created_at,
    }));

    // Group by category
    const grouped = settings.reduce<Record<string, SecuritySetting[]>>(
      (acc, setting) => {
        const category = setting.category;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category]!.push(setting);
        return acc;
      },
      {}
    );

    return NextResponse.json({
      success: true,
      settings,
      grouped,
    });
  } catch (error) {
    console.error("[Security Settings GET Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get settings" },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update security settings
 */
export async function PATCH(request: NextRequest) {
  try {
    // Check authentication - admin only
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roleResult = await pool.query(
      `SELECT role FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.ADMIN)) {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
    }

    const body = await request.json();
    const { updates } = body as {
      updates: Array<{ key: string; value: unknown }>;
    };

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: "updates array is required" },
        { status: 400 }
      );
    }

    const updatedSettings: SecuritySetting[] = [];

    for (const update of updates) {
      const { key, value } = update;

      if (!key) {
        continue;
      }

      // Get current setting to determine value type
      const currentResult = await pool.query(
        `SELECT value_type FROM security_settings WHERE key = $1`,
        [key]
      );

      if (currentResult.rows.length === 0) {
        continue;
      }

      const valueType = currentResult.rows[0].value_type;
      const serializedValue = serializeSettingValue(value, valueType);

      const result = await pool.query(
        `UPDATE security_settings SET value = $1, updated_by = $2 WHERE key = $3 RETURNING *`,
        [serializedValue, session.user.id, key]
      );

      if (result.rows.length > 0) {
        const row = result.rows[0];
        updatedSettings.push({
          id: row.id,
          key: row.key,
          value: parseSettingValue(row.value, row.value_type),
          valueType: row.value_type,
          description: row.description,
          category: row.category,
          updatedBy: row.updated_by,
          updatedAt: row.updated_at,
          createdAt: row.created_at,
        });
      }
    }

    return NextResponse.json({
      success: true,
      updated: updatedSettings.length,
      settings: updatedSettings,
    });
  } catch (error) {
    console.error("[Security Settings PATCH Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update settings" },
      { status: 500 }
    );
  }
}

/**
 * Parse setting value from JSONB storage based on type
 */
function parseSettingValue(value: unknown, valueType: string): unknown {
  try {
    // Value is already parsed from JSONB, but strings are double-quoted
    if (valueType === "boolean") {
      if (typeof value === "string") {
        return value === "true";
      }
      return Boolean(value);
    }

    if (valueType === "number") {
      if (typeof value === "string") {
        return parseFloat(value);
      }
      return Number(value);
    }

    if (valueType === "string") {
      // JSONB stores strings with quotes, so we get the raw string
      if (typeof value === "string") {
        return value;
      }
      return String(value);
    }

    // JSON type - return as-is
    return value;
  } catch {
    return value;
  }
}

/**
 * Serialize setting value for JSONB storage
 */
function serializeSettingValue(value: unknown, valueType: string): string {
  if (valueType === "boolean") {
    return JSON.stringify(String(Boolean(value)));
  }

  if (valueType === "number") {
    return JSON.stringify(String(Number(value)));
  }

  if (valueType === "string") {
    return JSON.stringify(String(value));
  }

  // JSON type
  return JSON.stringify(value);
}
