/**
 * Send Version Update Notification Script
 *
 * Usage: npx dotenvx run -f .env.local -- npx tsx scripts/send-version-notification.ts
 *
 * This script sends a version update notification to all users who have
 * opted in to version update notifications.
 */

import { notifyVersionUpdate } from "../lib/admin-notifications";

async function main() {
  console.log("🔔 Sending version 1.11.1 notification to all opted-in users...\n");

  const result = await notifyVersionUpdate({
    version: "1.11.1",
    title: "Claude Insider v1.11.1 - Hero Section & Device Mockups",
    highlights: [
      "📱 Full Viewport Hero: Hero section now covers 100% viewport on desktop and mobile",
      "🖥️ Device Mockups: New MANDATORY screenshot rules with perfect aspect ratio matching",
      "⌨️ Keyboard Shortcut Styling: AI Assistant tooltip uses styled ⌘. badge",
      "📚 Documentation: Updated CLAUDE.md with Device Mockups section",
      "🎯 iPhone Mockup: Proper 446×932 viewport eliminates cropping issues",
    ],
  });

  if (result.success) {
    console.log(`✅ Successfully sent notifications to ${result.notifiedCount} users`);
  } else {
    console.error(`❌ Failed to send notifications: ${result.error}`);
    process.exit(1);
  }

  process.exit(0);
}

main();
