/**
 * Send Version Update Notification Script
 *
 * Usage: npx dotenvx run -f .env.local -- npx tsx scripts/send-version-notification.ts
 *
 * This script sends a version update notification to all users who have
 * opted in to version update notifications.
 */

import pg from "pg";
const { Pool } = pg;

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  console.log("🔔 Sending version 1.18.1 notification to all opted-in users...\n");

  const version = "1.18.1";
  const title = "Claude Insider v1.18.1 - Documentation Optimization";
  const message =
    "📚 Documentation Optimization: CLAUDE.md reduced by 69.5% (2,414 → 735 lines) • 🔗 DRY Architecture: Rules in CLAUDE.md, code examples in PATTERNS.md • 📖 Glossary Added: RLS, E2EE, TTS, LRU, OG, MCP, RAG abbreviations defined • 🏗️ Sections Consolidated: Design+Icon System, E2E+Unit Testing merged";

  try {
    // Get all users who have in_app_version_updates enabled (or no preference = default enabled)
    const prefsResult = await pool.query(`
      SELECT user_id
      FROM notification_preferences
      WHERE in_app_version_updates = false
    `);

    const optOutUserIds = prefsResult.rows.map((r) => r.user_id);

    // Get all users except those who opted out
    let usersQuery = `SELECT id, name FROM "user"`;
    if (optOutUserIds.length > 0) {
      usersQuery += ` WHERE id NOT IN (${optOutUserIds.map((_, i) => `$${i + 1}`).join(", ")})`;
    }

    const usersResult = await pool.query(usersQuery, optOutUserIds);
    const users = usersResult.rows;

    if (users.length === 0) {
      console.log("No users to notify");
      await pool.end();
      process.exit(0);
    }

    console.log(`Found ${users.length} users to notify\n`);

    // Create notifications for each user
    let successCount = 0;
    for (const user of users) {
      try {
        await pool.query(
          `
          INSERT INTO notifications (user_id, type, title, message, data)
          VALUES ($1, 'system', $2, $3, $4)
          `,
          [
            user.id,
            title,
            message,
            JSON.stringify({
              type: "version_update",
              version,
              // Note: link is handled by getNotificationUrl() which routes version_update to /changelog
            }),
          ]
        );
        successCount++;
        process.stdout.write(`\r✅ Sent to ${successCount}/${users.length} users`);
      } catch (error) {
        console.error(`\n❌ Failed to notify user ${user.id}:`, error);
      }
    }

    console.log(`\n\n✅ Successfully sent notifications to ${successCount} users`);
  } catch (error) {
    console.error("❌ Failed to send notifications:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }

  process.exit(0);
}

main();
