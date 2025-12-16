/**
 * E2EE Key Backup API
 *
 * Endpoints for password-protected cloud backup:
 * - POST: Create/update backup
 * - GET: Check if backup exists and retrieve encrypted backup
 * - DELETE: Remove backup
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pool } from "@/lib/db";

// ============================================================================
// POST - Create/Update Backup
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      encryptedBackup,
      backupIv,
      backupAuthTag,
      salt,
      iterations,
    } = body;

    // Validate required fields
    if (!encryptedBackup || !backupIv || !backupAuthTag || !salt) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Count user's devices for metadata
    const deviceCountResult = await pool.query(
      `SELECT COUNT(*)::int as count FROM device_keys WHERE user_id = $1`,
      [session.user.id]
    );
    const deviceCount = deviceCountResult.rows[0].count;

    // Upsert backup (one per user)
    await pool.query(
      `INSERT INTO e2ee_key_backups (
        user_id,
        encrypted_backup,
        backup_iv,
        backup_auth_tag,
        salt,
        iterations,
        device_count,
        backup_version
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 1)
      ON CONFLICT (user_id) DO UPDATE SET
        encrypted_backup = EXCLUDED.encrypted_backup,
        backup_iv = EXCLUDED.backup_iv,
        backup_auth_tag = EXCLUDED.backup_auth_tag,
        salt = EXCLUDED.salt,
        iterations = EXCLUDED.iterations,
        device_count = EXCLUDED.device_count,
        backup_version = e2ee_key_backups.backup_version + 1,
        updated_at = NOW()`,
      [
        session.user.id,
        encryptedBackup,
        backupIv,
        backupAuthTag,
        salt,
        iterations || 100000,
        deviceCount,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Backup created successfully",
    });
  } catch (error) {
    console.error("[E2EE API] Failed to create backup:", error);
    return NextResponse.json(
      { error: "Failed to create backup" },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Check/Retrieve Backup
// ============================================================================

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT
        encrypted_backup,
        backup_iv,
        backup_auth_tag,
        salt,
        iterations,
        device_count,
        backup_version,
        created_at,
        updated_at
      FROM e2ee_key_backups
      WHERE user_id = $1`,
      [session.user.id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({
        hasBackup: false,
        backup: null,
      });
    }

    const backup = result.rows[0];

    return NextResponse.json({
      hasBackup: true,
      backup: {
        encrypted_backup: backup.encrypted_backup,
        backup_iv: backup.backup_iv,
        backup_auth_tag: backup.backup_auth_tag,
        salt: backup.salt,
        iterations: backup.iterations,
        device_count: backup.device_count,
        backup_version: backup.backup_version,
        created_at: backup.created_at,
        updated_at: backup.updated_at,
      },
    });
  } catch (error) {
    console.error("[E2EE API] Failed to get backup:", error);
    return NextResponse.json(
      { error: "Failed to get backup" },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Remove Backup
// ============================================================================

export async function DELETE(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await pool.query(
      `DELETE FROM e2ee_key_backups WHERE user_id = $1 RETURNING id`,
      [session.user.id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "No backup found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Backup deleted successfully",
    });
  } catch (error) {
    console.error("[E2EE API] Failed to delete backup:", error);
    return NextResponse.json(
      { error: "Failed to delete backup" },
      { status: 500 }
    );
  }
}
