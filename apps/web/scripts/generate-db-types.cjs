#!/usr/bin/env node
/**
 * Generate TypeScript types from Supabase database schema
 *
 * This script:
 * 1. Runs `supabase gen types typescript` to get schema types
 * 2. Appends convenience type exports for commonly used tables
 *
 * Usage: pnpm db:types
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'pmsnjddolwngdeygkcfn';
const OUTPUT_PATH = path.join(__dirname, '..', 'lib', 'database.types.ts');

// Convenience exports to append after generated types
const CONVENIENCE_EXPORTS = `
// ============================================================
// Convenience Type Exports
// ============================================================
// Auto-generated from Supabase. Regenerate with: pnpm db:types
// ============================================================

// Core User Tables
export type User = Tables<'user'>
export type Account = Tables<'account'>
export type Session = Tables<'session'>
export type Profile = Tables<'profiles'>

// Content Interaction Tables
export type Favorite = Tables<'favorites'>
export type Rating = Tables<'ratings'>
export type Comment = Tables<'comments'>
export type CommentVote = Tables<'comment_votes'>
export type Collection = Tables<'collections'>
export type CollectionItem = Tables<'collection_items'>

// Activity & Analytics
export type UserActivity = Tables<'user_activity'>
export type ViewHistory = Tables<'view_history'>
export type SearchHistory = Tables<'search_history'>

// Notifications
export type Notification = Tables<'notifications'>
export type NotificationPreference = Tables<'notification_preferences'>
export type AdminNotification = Tables<'admin_notifications'>
export type PushSubscription = Tables<'push_subscriptions'>

// Gamification
export type Achievement = Tables<'achievements'>
export type UserAchievement = Tables<'user_achievements'>
export type AchievementProgress = Tables<'achievement_progress'>

// Social Features
export type UserFollow = Tables<'user_follows'>
export type UserBlock = Tables<'user_blocks'>

// AI & Assistant
export type AiConversation = Tables<'ai_conversations'>
export type AiMessage = Tables<'ai_messages'>
export type AssistantSettings = Tables<'assistant_settings'>
export type UserApiKey = Tables<'user_api_keys'>
export type ApiKeyUsageLog = Tables<'api_key_usage_logs'>

// Security & Auth
export type Passkey = Tables<'passkeys'>
export type WebauthnChallenge = Tables<'webauthn_challenges'>
export type EmailVerificationCode = Tables<'email_verification_codes'>
export type TwoFactorSession = Tables<'two_factor_sessions'>

// Admin
export type AdminLog = Tables<'admin_logs'>
export type Feedback = Tables<'feedback'>
export type EditSuggestion = Tables<'edit_suggestions'>

// Views
export type RatingStats = Tables<'rating_stats'>
`;

async function main() {
  console.log('🔄 Generating TypeScript types from Supabase...');

  try {
    // Generate types from Supabase
    const types = execSync(
      `npx supabase gen types typescript --project-id ${PROJECT_ID}`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    );

    // Write types + convenience exports
    const output = types + CONVENIENCE_EXPORTS;
    fs.writeFileSync(OUTPUT_PATH, output);

    // Count tables
    const tableCount = (types.match(/Row: {/g) || []).length;

    console.log(`✅ Generated types for ${tableCount} tables`);
    console.log(`📁 Written to: ${OUTPUT_PATH}`);
    console.log('💡 Convenience exports added for commonly used types');
  } catch (error) {
    console.error('❌ Failed to generate types:', error.message);
    process.exit(1);
  }
}

main();
