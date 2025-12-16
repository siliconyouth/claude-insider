# Data Layer Architecture Document

**Version:** 1.2.0
**Last Updated:** 2025-12-16
**Maintained By:** Claude Code (auto-updated when data layer changes)

> **IMPORTANT**: This document is the source of truth for all database operations. Any changes to the data layer MUST be reflected here. Claude Code MUST update this document when adding/modifying tables, columns, migrations, or API routes that interact with the database.

---

## Table of Contents

1. [Overview](#overview)
2. [Database Technology Stack](#database-technology-stack)
3. [Naming Conventions](#naming-conventions)
4. [Table Catalog](#table-catalog)
5. [Table Relationships](#table-relationships)
6. [Row Level Security (RLS)](#row-level-security-rls)
7. [Migration Patterns](#migration-patterns)
8. [API Data Access Patterns](#api-data-access-patterns)
9. [Role Hierarchy](#role-hierarchy)
10. [Materialized Views](#materialized-views)
11. [Change Log](#change-log)

---

## Overview

Claude Insider uses **Supabase** (PostgreSQL) as its primary database with **Better Auth** for authentication. The data layer follows a strict separation:

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Authentication** | Better Auth | User accounts, sessions, OAuth |
| **User Data** | Supabase/PostgreSQL | Profiles, favorites, ratings, etc. |
| **Content** | Payload CMS | Resources, translations, media |
| **Caching** | Upstash Redis | Session cache, API responses |

---

## Database Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Database | PostgreSQL | 15+ (Supabase) |
| ORM/Client | `pg` Pool | Direct SQL queries |
| Auth | Better Auth | 1.4.6 |
| Migrations | Supabase CLI | Manual SQL files |
| RLS | PostgreSQL RLS | Native |

### Connection Configuration

```typescript
// lib/db.ts - Centralized connection pool
import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
```

---

## Naming Conventions

### CRITICAL: Column Naming Rules

| Table Type | Convention | Example |
|------------|------------|---------|
| **Better Auth tables** (`user`, `session`, `account`, `verification`) | **camelCase** (quoted) | `"createdAt"`, `"emailVerified"`, `"twoFactorEnabled"` |
| **Custom tables** (all others) | **snake_case** | `created_at`, `user_id`, `resource_type` |

### SQL Query Examples

```sql
-- Better Auth table (camelCase, must quote)
SELECT id, email, role, "createdAt" FROM "user" WHERE id = $1;

-- Custom table (snake_case, no quotes needed)
SELECT id, user_id, created_at FROM favorites WHERE user_id = $1;

-- Join between Better Auth and custom tables
SELECT f.*, u.name, u."createdAt" as user_created
FROM favorites f
JOIN "user" u ON f.user_id = u.id;
```

### Table Naming

| Convention | Example |
|------------|---------|
| Plural nouns | `favorites`, `ratings`, `comments` |
| Snake_case | `user_activity`, `beta_applications` |
| Junction tables | `user_achievements`, `collection_items` |

### Foreign Key Naming

```sql
-- Pattern: [referenced_table]_id or descriptive name
user_id TEXT REFERENCES "user"(id)
follower_id TEXT REFERENCES "user"(id)
collection_id UUID REFERENCES collections(id)
```

---

## Table Catalog

### Authentication Tables (Better Auth - DO NOT MODIFY STRUCTURE)

| Table | Primary Key | Description | RLS |
|-------|-------------|-------------|-----|
| `user` | `id` (TEXT) | User accounts | DISABLED |
| `session` | `id` (TEXT) | Active sessions | DISABLED |
| `account` | `id` (TEXT) | OAuth accounts | DISABLED |
| `verification` | `id` (TEXT) | Email verification tokens | DISABLED |

#### `user` Table Extended Columns

Better Auth creates base columns. We extend with:

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `username` | TEXT | NULL | Unique username |
| `role` | TEXT | 'user' | User role (see Role Hierarchy) |
| `"socialLinks"` | JSONB | '{}' | Social media links |
| `"profilePrivacy"` | JSONB | {...} | Privacy settings |
| `followers_count` | INTEGER | 0 | Denormalized follower count |
| `following_count` | INTEGER | 0 | Denormalized following count |
| `achievements_count` | INTEGER | 0 | Total achievements |
| `achievement_points` | INTEGER | 0 | Gamification points |
| `"twoFactorEnabled"` | BOOLEAN | false | 2FA status |
| `"hasCompletedOnboarding"` | BOOLEAN | false | Onboarding status |
| `banned` | BOOLEAN | false | Whether user is banned |
| `banned_at` | TIMESTAMPTZ | NULL | When user was banned |
| `banned_reason` | TEXT | NULL | Reason for ban |
| `banned_by` | TEXT | NULL | Admin who issued ban |
| `ban_expires_at` | TIMESTAMPTZ | NULL | When ban expires (NULL = permanent) |

### User Data Tables

| Table | Primary Key | Foreign Keys | Description |
|-------|-------------|--------------|-------------|
| `profiles` | UUID | `user_id` → user | Public profile data |
| `favorites` | UUID | `user_id` → user | Saved resources/docs |
| `ratings` | UUID | `user_id` → user | 1-5 star ratings |
| `reviews` | UUID | `user_id` → user | Written reviews |
| `review_helpful_votes` | UUID | `user_id`, `review_id` | Review helpfulness votes |
| `comments` | UUID | `user_id`, `parent_id` | Comments with threading |
| `comment_votes` | UUID | `user_id`, `comment_id` | Comment up/downvotes |
| `collections` | UUID | `user_id` → user | User collections |
| `collection_items` | UUID | `collection_id` | Items in collections |
| `user_activity` | UUID | `user_id` → user | Activity log |
| `notifications` | UUID | `user_id`, `actor_id` | User notifications |
| `notification_preferences` | UUID | `user_id` → user (UNIQUE) | Notification settings |
| `user_follows` | UUID | `follower_id`, `following_id` | Follow relationships |
| `user_blocks` | UUID | `blocker_id`, `blocked_id` | Block relationships |

### Content & Moderation Tables

| Table | Primary Key | Foreign Keys | Description |
|-------|-------------|--------------|-------------|
| `edit_suggestions` | UUID | `user_id`, `reviewer_id` | Community edit suggestions |
| `beta_applications` | UUID | `user_id` (UNIQUE) | Beta program applications |
| `feedback` | UUID | `user_id`, `assigned_to` | User feedback/bugs |
| `admin_logs` | UUID | `admin_id` → user | Admin action audit log |
| `superadmin_logs` | UUID | `superadmin_id` → user | Superadmin audit log |

### Security Tables (Migration 045-048)

| Table | Primary Key | Foreign Keys | Description |
|-------|-------------|--------------|-------------|
| `security_logs` | UUID | `user_id` → user | Security event log (bot detections, etc.) |
| `visitor_fingerprints` | UUID | `linked_user_id`, `blocked_by` → user | Browser fingerprint tracking |
| `honeypot_configs` | UUID | `created_by`, `updated_by` → user | Honeypot route configurations |
| `security_settings` | UUID | `updated_by` → user | Global security settings (key-value) |
| `superadmin_logs` | UUID | `superadmin_id` → user | Superadmin audit trail |

#### `security_logs` Table Schema

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | gen_random_uuid() | Primary key |
| `request_id` | VARCHAR(21) | NOT NULL | nanoid correlation ID |
| `visitor_id` | VARCHAR(64) | NULL | FingerprintJS visitor ID |
| `user_id` | TEXT | NULL | Authenticated user (if any) |
| `ip_address` | INET | NULL | Request IP address |
| `user_agent` | TEXT | NULL | Browser user agent |
| `endpoint` | VARCHAR(500) | NULL | Request endpoint |
| `method` | VARCHAR(10) | NULL | HTTP method |
| `is_bot` | BOOLEAN | FALSE | Bot detection result |
| `is_verified_bot` | BOOLEAN | FALSE | Verified bot (Googlebot, etc.) |
| `bot_name` | VARCHAR(100) | NULL | Bot identifier |
| `event_type` | VARCHAR(50) | NOT NULL | request, bot_detected, honeypot_served |
| `severity` | VARCHAR(20) | 'info' | debug, info, warning, error, critical |
| `status_code` | INTEGER | NULL | Response status code |
| `response_time_ms` | INTEGER | NULL | Response time in ms |
| `honeypot_served` | BOOLEAN | FALSE | Honeypot triggered |

#### `visitor_fingerprints` Table Schema

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | gen_random_uuid() | Primary key |
| `visitor_id` | VARCHAR(64) | UNIQUE NOT NULL | FingerprintJS ID |
| `first_seen_at` | TIMESTAMPTZ | NOW() | First visit timestamp |
| `first_ip` | INET | NULL | First seen IP |
| `last_seen_at` | TIMESTAMPTZ | NOW() | Last visit timestamp |
| `last_ip` | INET | NULL | Last seen IP |
| `total_requests` | INTEGER | 1 | Total request count |
| `bot_requests` | INTEGER | 0 | Bot-flagged requests |
| `honeypot_triggers` | INTEGER | 0 | Honeypot trigger count |
| `trust_score` | DECIMAL(5,2) | 50.00 | 0-100 trust score |
| `trust_level` | VARCHAR(20) | 'neutral' | trusted, neutral, suspicious, untrusted |
| `is_blocked` | BOOLEAN | FALSE | Blocked status |
| `block_reason` | TEXT | NULL | Why blocked |
| `linked_user_id` | TEXT | NULL | Linked authenticated user |
| `components` | JSONB | '{}' | Fingerprint components |

#### `honeypot_configs` Table Schema

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | gen_random_uuid() | Primary key |
| `name` | VARCHAR(100) | NOT NULL | Config name |
| `path_pattern` | VARCHAR(500) | NOT NULL | URL pattern to match |
| `method` | VARCHAR(10) | 'ALL' | HTTP method to match |
| `priority` | INTEGER | 100 | Lower = higher priority |
| `response_type` | VARCHAR(50) | NOT NULL | fake_data, delay, redirect, block |
| `response_delay_ms` | INTEGER | 0 | Tarpit delay in ms |
| `response_data` | JSONB | NULL | Custom fake response |
| `response_template` | VARCHAR(100) | NULL | Template name |
| `target_bots_only` | BOOLEAN | TRUE | Only target bots |
| `target_low_trust` | BOOLEAN | FALSE | Also target low trust visitors |
| `trust_threshold` | DECIMAL(5,2) | 30.00 | Trust score threshold |
| `trigger_count` | INTEGER | 0 | Times triggered |
| `enabled` | BOOLEAN | TRUE | Active status |

#### `security_settings` Table Schema

Key-value store with default settings:

| Key | Default Value | Description |
|-----|---------------|-------------|
| `security_enabled` | true | Master security switch |
| `bot_detection_enabled` | true | Enable Vercel BotID |
| `bot_detection_mode` | "monitor" | monitor, protect, honeypot |
| `fingerprint_enabled` | true | Enable FingerprintJS |
| `honeypot_enabled` | true | Enable honeypot system |
| `honeypot_default_delay_ms` | 5000 | Default tarpit delay |
| `log_all_requests` | false | Log all (high volume) |
| `log_bot_requests` | true | Log bot detections |
| `auto_block_enabled` | true | Auto-block suspicious |
| `auto_block_bot_threshold` | 10 | Auto-block after N bots |

#### `superadmin_logs` Table Schema

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | gen_random_uuid() | Primary key |
| `superadmin_id` | TEXT | NOT NULL | Acting superadmin |
| `action` | TEXT | NOT NULL | Action type |
| `target_type` | TEXT | NOT NULL | Target entity type |
| `target_id` | TEXT | NOT NULL | Target entity ID |
| `details` | JSONB | '{}' | Action details |
| `ip_address` | TEXT | NULL | Request IP |
| `user_agent` | TEXT | NULL | Browser user agent |
| `created_at` | TIMESTAMPTZ | NOW() | Action timestamp |

### Gamification Tables

| Table | Primary Key | Foreign Keys | Description |
|-------|-------------|--------------|-------------|
| `achievements` | UUID | - | Achievement definitions |
| `user_achievements` | UUID | `user_id`, `achievement_id` | Earned achievements |
| `achievement_progress` | UUID | `user_id` → user | Progress tracking |

### Reading & Search Tables

| Table | Primary Key | Foreign Keys | Description |
|-------|-------------|--------------|-------------|
| `reading_lists` | UUID | `user_id` → user | Reading lists |
| `reading_list_items` | UUID | `list_id`, `user_id` | Reading list items |
| `view_history` | UUID | `user_id` → user | Page view history |
| `resource_views` | UUID | `user_id` → user | Resource view tracking |
| `resource_view_stats` | Composite | - | Aggregated view stats |
| `saved_searches` | UUID | `user_id` → user | Saved search queries |
| `search_history` | UUID | `user_id` → user | Search history |
| `search_analytics` | UUID | - | Search analytics |

### AI Conversation Tables

| Table | Primary Key | Foreign Keys | Description |
|-------|-------------|--------------|-------------|
| `ai_conversations` | UUID | `user_id` → user | AI chat conversations |
| `ai_messages` | UUID | `conversation_id` | Individual messages |

### Authentication Extension Tables

| Table | Primary Key | Foreign Keys | Description |
|-------|-------------|--------------|-------------|
| `two_factor_sessions` | UUID | `user_id` → user | 2FA session tokens |
| `two_factor_devices` | UUID | `user_id` → user | Multi-device 2FA support |
| `email_verification_codes` | UUID | `user_id` → user | Email verification codes |
| `passkeys` | UUID | `user_id` → user | WebAuthn passkeys for passwordless auth |
| `webauthn_challenges` | UUID | `user_id`, `email` | WebAuthn registration/auth challenges |
| `user_api_keys` | UUID | `user_id` → user | User's own AI API keys (encrypted) |
| `api_key_usage_logs` | UUID | `user_id`, `api_key_id` | API usage tracking per key |
| `push_subscriptions` | UUID | `user_id` → user | Web Push notification subscriptions |
| `assistant_settings` | UUID | `user_id` (UNIQUE) | AI assistant preferences |

#### `two_factor_devices` Table Schema

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | gen_random_uuid() | Primary key |
| `user_id` | TEXT | NOT NULL | User reference |
| `device_name` | VARCHAR(100) | 'Authenticator' | User-friendly device name |
| `device_type` | VARCHAR(50) | 'totp' | Type: 'totp', 'sms', 'email' |
| `secret` | TEXT | NOT NULL | Encrypted TOTP secret |
| `is_primary` | BOOLEAN | FALSE | Primary device for 2FA |
| `is_verified` | BOOLEAN | FALSE | Device verified with code |
| `last_used_at` | TIMESTAMPTZ | NULL | Last authentication time |
| `created_at` | TIMESTAMPTZ | NOW() | Creation timestamp |

#### `passkeys` Table Schema

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | gen_random_uuid() | Primary key |
| `user_id` | TEXT | NOT NULL | User reference |
| `credential_id` | TEXT | UNIQUE NOT NULL | Base64URL credential ID |
| `public_key` | TEXT | NOT NULL | COSE public key (base64) |
| `counter` | BIGINT | 0 | Signature counter (replay prevention) |
| `device_type` | VARCHAR(50) | 'platform' | 'platform' or 'cross-platform' |
| `backed_up` | BOOLEAN | FALSE | Whether synced/backed up |
| `transports` | TEXT[] | NULL | Available: usb, nfc, ble, internal |
| `passkey_name` | VARCHAR(100) | 'Passkey' | User-friendly name |
| `aaguid` | TEXT | NULL | Authenticator GUID |

#### `user_api_keys` Table Schema

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | gen_random_uuid() | Primary key |
| `user_id` | TEXT | NOT NULL | User reference |
| `provider` | VARCHAR(50) | 'anthropic' | API provider |
| `api_key_encrypted` | TEXT | NOT NULL | Encrypted API key |
| `api_key_hint` | VARCHAR(20) | NULL | Last 4 chars for display |
| `is_valid` | BOOLEAN | NULL | Validation status |
| `available_models` | JSONB | '[]' | Models available to user |
| `preferred_model` | VARCHAR(100) | NULL | User's preferred model |
| `usage_this_month` | JSONB | '{}' | Monthly usage stats |

#### `assistant_settings` Table Schema

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | gen_random_uuid() | Primary key |
| `user_id` | TEXT | UNIQUE NOT NULL | User reference |
| `assistant_name` | TEXT | 'Claude' | Custom assistant name |
| `user_display_name` | TEXT | NULL | How user wants to be called |
| `selected_voice_id` | TEXT | 'EXAVITQu4vr4xnSDxMaL' | ElevenLabs voice ID |
| `auto_speak` | BOOLEAN | FALSE | Auto-play TTS responses |
| `speech_rate` | DECIMAL(3,2) | 1.00 | TTS speech rate |
| `show_suggested_questions` | BOOLEAN | TRUE | Show question chips |
| `compact_mode` | BOOLEAN | FALSE | Compact UI mode |

### Messaging Tables (Migration 043-044)

| Table | Primary Key | Foreign Keys | Description |
|-------|-------------|--------------|-------------|
| `user_presence` | TEXT (user_id) | `user_id` → user | Online status tracking |
| `dm_conversations` | UUID | `created_by` → user | Direct/group message conversations |
| `dm_participants` | UUID | `conversation_id`, `user_id` | Conversation participants |
| `dm_messages` | UUID | `conversation_id`, `sender_id` | Direct messages with mentions |
| `dm_typing_indicators` | Composite | `user_id`, `conversation_id` | Real-time typing status |
| `dm_group_invitations` | UUID | `conversation_id`, `inviter_id`, `invitee_id` | Group chat invitations |
| `user_chat_settings` | TEXT (user_id) | `user_id` → user | Chat sound preferences |

#### `dm_conversations` Table Schema

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | gen_random_uuid() | Primary key |
| `type` | TEXT | 'direct' | 'direct' or 'group' |
| `name` | TEXT | NULL | Group chat name |
| `description` | TEXT | NULL | Group description |
| `avatar_url` | TEXT | NULL | Group avatar |
| `created_by` | TEXT | NULL | Group creator |
| `max_participants` | INTEGER | 50 | Max group size |
| `last_message_at` | TIMESTAMPTZ | NULL | For sorting |
| `last_message_preview` | TEXT | NULL | Preview text |

#### `dm_messages` Table Schema

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | gen_random_uuid() | Primary key |
| `conversation_id` | UUID | NOT NULL | Conversation reference |
| `sender_id` | TEXT | NOT NULL | Message sender |
| `content` | TEXT | NOT NULL | Message text |
| `mentions` | TEXT[] | '{}' | Mentioned user IDs |
| `ai_response_to` | UUID | NULL | Links AI response to trigger |
| `is_ai_generated` | BOOLEAN | FALSE | AI-generated message |
| `metadata` | JSONB | '{}' | Link previews, etc. |
| `edited_at` | TIMESTAMPTZ | NULL | Edit timestamp |
| `deleted_at` | TIMESTAMPTZ | NULL | Soft delete |

#### `dm_participants` Table Schema

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | gen_random_uuid() | Primary key |
| `conversation_id` | UUID | NOT NULL | Conversation reference |
| `user_id` | TEXT | NOT NULL | Participant user |
| `role` | TEXT | 'member' | 'owner', 'admin', 'member' |
| `joined_at` | TIMESTAMPTZ | NOW() | Join timestamp |
| `last_read_at` | TIMESTAMPTZ | NULL | Last read marker |
| `is_muted` | BOOLEAN | FALSE | Mute notifications |
| `unread_count` | INTEGER | 0 | Unread messages |
| `invited_by` | TEXT | NULL | Who invited them |

### Reports & Appeals Tables (Migration 041-042)

| Table | Primary Key | Foreign Keys | Description |
|-------|-------------|--------------|-------------|
| `reports` | UUID | `reporter_id`, `reported_user_id`, `reported_comment_id` | User/comment reports |
| `ban_appeals` | UUID | `user_id`, `reviewed_by` | Ban appeal requests |
| `ban_history` | UUID | `user_id`, `performed_by`, `appeal_id` | Ban action audit trail |

#### `reports` Table Schema

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | gen_random_uuid() | Primary key |
| `reporter_id` | TEXT | NOT NULL | Who filed report |
| `report_type` | VARCHAR(20) | NOT NULL | 'user' or 'comment' |
| `reported_user_id` | TEXT | NULL | Target user (if user report) |
| `reported_comment_id` | UUID | NULL | Target comment (if comment report) |
| `reason` | VARCHAR(50) | NOT NULL | spam, harassment, hate_speech, etc. |
| `description` | TEXT | NULL | User description of issue |
| `status` | VARCHAR(20) | 'pending' | pending, investigating, action_taken, dismissed |
| `reviewed_by` | TEXT | NULL | Admin who reviewed |
| `action_taken` | TEXT | NULL | What action was taken |
| `reviewed_at` | TIMESTAMPTZ | NULL | Review timestamp |

#### `ban_appeals` Table Schema

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | gen_random_uuid() | Primary key |
| `user_id` | TEXT | NOT NULL | Banned user |
| `reason` | TEXT | NOT NULL | Why they should be unbanned |
| `additional_context` | TEXT | NULL | Additional information |
| `status` | VARCHAR(20) | 'pending' | pending, approved, rejected |
| `reviewed_by` | TEXT | NULL | Admin who reviewed |
| `review_notes` | TEXT | NULL | Internal admin notes |
| `response_message` | TEXT | NULL | Message sent to user |
| `reviewed_at` | TIMESTAMPTZ | NULL | Review timestamp |
| `ip_address` | VARCHAR(45) | NULL | Appeal IP address |

#### `ban_history` Table Schema

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | gen_random_uuid() | Primary key |
| `user_id` | TEXT | NOT NULL | Target user |
| `action` | VARCHAR(20) | NOT NULL | 'banned' or 'unbanned' |
| `reason` | TEXT | NULL | Reason for action |
| `performed_by` | TEXT | NULL | Admin who acted |
| `appeal_id` | UUID | NULL | Link to appeal if unbanned via appeal |
| `ip_address` | VARCHAR(45) | NULL | IP address |
| `created_at` | TIMESTAMPTZ | NOW() | Action timestamp |

### Donation Tables (Migration 051)

| Table | Primary Key | Foreign Keys | Description |
|-------|-------------|--------------|-------------|
| `donations` | UUID | `user_id`, `confirmed_by` → user | Donation transactions (PayPal, bank transfer) |
| `donor_badges` | UUID | `user_id` → user (UNIQUE) | Donor recognition tiers (bronze/silver/gold/platinum) |
| `donation_receipts` | UUID | `donation_id` → donations | Tax receipts for donations |
| `donation_bank_info` | UUID | None | Admin-configurable bank transfer details |
| `donation_settings` | UUID | `updated_by` → user | Donation system configuration (preset amounts, thresholds) |

#### `donations` Table Schema

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | gen_random_uuid() | Primary key |
| `user_id` | TEXT | NULL | Donor (optional for anonymous) |
| `amount` | DECIMAL(10,2) | NOT NULL | Donation amount (> 0) |
| `currency` | VARCHAR(3) | 'USD' | Currency code |
| `payment_method` | VARCHAR(20) | NOT NULL | 'paypal', 'bank_transfer', 'other' |
| `transaction_id` | VARCHAR(255) | NULL | Payment provider transaction ID |
| `paypal_order_id` | VARCHAR(255) | NULL | PayPal order ID |
| `paypal_payer_id` | VARCHAR(255) | NULL | PayPal payer ID |
| `status` | VARCHAR(20) | 'pending' | pending, completed, failed, refunded, cancelled |
| `is_recurring` | BOOLEAN | FALSE | Recurring donation |
| `recurring_frequency` | VARCHAR(20) | NULL | monthly, quarterly, yearly |
| `subscription_id` | VARCHAR(255) | NULL | Recurring subscription ID |
| `donor_name` | VARCHAR(255) | NULL | Name for anonymous donations |
| `donor_email` | VARCHAR(255) | NULL | Email for anonymous donations |
| `is_anonymous` | BOOLEAN | FALSE | Hide from donor wall |
| `message` | TEXT | NULL | Donor message |
| `admin_notes` | TEXT | NULL | Internal admin notes |
| `confirmed_by` | TEXT | NULL | Admin who confirmed bank transfer |
| `confirmed_at` | TIMESTAMPTZ | NULL | Confirmation timestamp |
| `ip_address` | INET | NULL | Donor IP address |
| `metadata` | JSONB | '{}' | Additional metadata |

#### `donor_badges` Table Schema

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | gen_random_uuid() | Primary key |
| `user_id` | TEXT | NOT NULL (UNIQUE) | Donor user ID |
| `tier` | VARCHAR(20) | NOT NULL | bronze ($10+), silver ($50+), gold ($100+), platinum ($500+) |
| `total_donated` | DECIMAL(10,2) | 0 | Total donation amount |
| `donation_count` | INTEGER | 0 | Number of donations |
| `has_active_subscription` | BOOLEAN | FALSE | Has recurring donation |
| `show_on_donor_wall` | BOOLEAN | TRUE | Public visibility |
| `show_badge_on_profile` | BOOLEAN | TRUE | Show badge on profile |
| `display_name` | VARCHAR(255) | NULL | Custom name for donor wall |
| `first_donation_at` | TIMESTAMPTZ | NULL | First donation timestamp |
| `last_donation_at` | TIMESTAMPTZ | NULL | Last donation timestamp |

### E2EE Tables (Migrations 054-057)

End-to-end encryption using Matrix Olm/Megolm protocol with vodozemac WASM.

| Table | Primary Key | Foreign Keys | Description |
|-------|-------------|--------------|-------------|
| `device_keys` | UUID | `user_id` → user | Device identity keys (Curve25519, Ed25519) |
| `one_time_prekeys` | UUID | `device_key_id` → device_keys | Ephemeral Olm prekeys for forward secrecy |
| `e2ee_key_backups` | UUID | `user_id` → user (UNIQUE) | Password-protected cloud backup of keys |
| `megolm_session_shares` | UUID | `conversation_id`, `sender_user_id`, `recipient_user_id` | Megolm session key sharing |
| `e2ee_message_keys` | UUID | `message_id` → dm_messages | Olm-encrypted message keys per device |
| `e2ee_conversation_settings` | UUID (conv_id) | `conversation_id` → dm_conversations | E2EE settings per conversation |
| `e2ee_sas_verifications` | UUID | `initiator_user_id`, `target_user_id` → user | SAS verification sessions (emoji comparison) |
| `e2ee_cross_signing_keys` | UUID | `user_id` → user | Master/self-signing/user-signing keys |
| `e2ee_device_signatures` | UUID | `device_key_id`, `signer_user_id` | Cross-signed device approvals |
| `e2ee_user_trust` | UUID | `truster_user_id`, `trusted_user_id` → user | User-to-user trust relationships |
| `e2ee_ai_consent` | UUID | `conversation_id`, `user_id` | AI access consent per conversation |
| `e2ee_ai_access_log` | UUID | `conversation_id`, `message_id`, `authorizing_user_id` | AI access audit trail |
| `e2ee_conversation_ai_settings` | UUID (conv_id) | `conversation_id` → dm_conversations | AI feature settings per conversation |

#### `device_keys` Table Schema

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | gen_random_uuid() | Primary key |
| `user_id` | TEXT | NOT NULL | Device owner |
| `device_id` | TEXT | NOT NULL | Unique device identifier |
| `identity_key` | TEXT | NOT NULL | Curve25519 public key (Olm key agreement) |
| `signing_key` | TEXT | NOT NULL | Ed25519 public key (verification) |
| `signed_prekey` | TEXT | '' | Rotatable prekey (monthly rotation) |
| `signed_prekey_id` | INTEGER | 0 | Prekey version ID |
| `signed_prekey_signature` | TEXT | '' | Signature on signed prekey |
| `device_name` | TEXT | NULL | Human-readable device name |
| `device_type` | TEXT | NULL | 'web', 'mobile', 'desktop' |
| `is_verified` | BOOLEAN | FALSE | Device verification status |
| `verified_at` | TIMESTAMPTZ | NULL | When device was verified |
| `verified_by_user_id` | TEXT | NULL | Who verified the device |
| `verification_method` | TEXT | NULL | 'sas', 'cross_sign', 'admin', 'qr' |
| `cross_sign_signature` | TEXT | NULL | Cross-signing signature |
| `last_seen_at` | TIMESTAMPTZ | NOW() | Last activity timestamp |

#### `one_time_prekeys` Table Schema

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | gen_random_uuid() | Primary key |
| `device_key_id` | UUID | NOT NULL | Parent device |
| `key_id` | INTEGER | NOT NULL | Key version ID |
| `public_key` | TEXT | NOT NULL | Curve25519 public key |
| `claimed_at` | TIMESTAMPTZ | NULL | NULL = available, timestamp = consumed |
| `claimed_by_user` | TEXT | NULL | Who claimed this key |
| `claimed_by_device` | TEXT | NULL | Device that claimed this key |

#### `megolm_session_shares` Table Schema

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | gen_random_uuid() | Primary key |
| `conversation_id` | UUID | NOT NULL | Conversation reference |
| `session_id` | TEXT | NOT NULL | Megolm session ID |
| `sender_user_id` | TEXT | NOT NULL | Session creator |
| `sender_device_id` | TEXT | NOT NULL | Sender's device |
| `recipient_user_id` | TEXT | NOT NULL | Key recipient |
| `recipient_device_id` | TEXT | NOT NULL | Recipient's device |
| `encrypted_session_key` | TEXT | NOT NULL | Olm-encrypted session key |
| `key_algorithm` | TEXT | 'olm.v1' | Encryption algorithm |
| `first_known_index` | INTEGER | 0 | Starting message index |
| `forwarded_count` | INTEGER | 0 | Key forwarding chain length |
| `claimed_at` | TIMESTAMPTZ | NULL | When recipient claimed key |

#### `e2ee_sas_verifications` Table Schema

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | gen_random_uuid() | Primary key |
| `initiator_user_id` | TEXT | NOT NULL | Who started verification |
| `initiator_device_id` | TEXT | NOT NULL | Initiator's device |
| `target_user_id` | TEXT | NOT NULL | Who is being verified |
| `target_device_id` | TEXT | NOT NULL | Target's device |
| `status` | TEXT | 'pending' | pending, started, key_exchanged, sas_ready, sas_match, verified, cancelled, expired |
| `initiator_public_key` | TEXT | NULL | Ephemeral Curve25519 key |
| `target_public_key` | TEXT | NULL | Target's ephemeral key |
| `initiator_commitment` | TEXT | NULL | Commitment hash |
| `sas_emoji_indices` | TEXT | NULL | JSON array of 7 emoji indices (0-63) |
| `sas_decimal` | TEXT | NULL | Alternative decimal representation |
| `transaction_id` | TEXT | NOT NULL (UNIQUE) | Transaction identifier |
| `expires_at` | TIMESTAMPTZ | NOW() + 10 min | Verification deadline |

#### `e2ee_ai_consent` Table Schema

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | gen_random_uuid() | Primary key |
| `conversation_id` | UUID | NOT NULL | Conversation reference |
| `user_id` | TEXT | NOT NULL | Consenting user |
| `consent_status` | TEXT | 'pending' | pending, granted, denied, revoked |
| `allowed_features` | JSONB | '[]' | Allowed AI features (mention_response, translation, summary, moderation) |
| `consent_given_at` | TIMESTAMPTZ | NULL | When consent was granted |
| `consent_expires_at` | TIMESTAMPTZ | NULL | Optional expiration |
| `consent_reason` | TEXT | NULL | Reason for denial (if any) |
| `device_id` | TEXT | NULL | Device that gave consent |

---

## Table Relationships

### Entity Relationship Diagram (Key Tables)

```
                                    ┌─────────────────┐
                                    │     "user"      │
                                    │  (Better Auth)  │
                                    │  PK: id (TEXT)  │
                                    └────────┬────────┘
                                             │
              ┌──────────────┬───────────────┼───────────────┬──────────────┐
              │              │               │               │              │
              ▼              ▼               ▼               ▼              ▼
       ┌──────────┐  ┌───────────┐   ┌───────────┐  ┌───────────┐  ┌───────────┐
       │ profiles │  │ favorites │   │  ratings  │  │collections│  │notifications│
       │ (1:1)    │  │ (1:many)  │   │ (1:many)  │  │ (1:many)  │  │  (1:many)  │
       └──────────┘  └───────────┘   └───────────┘  └─────┬─────┘  └───────────┘
                                                          │
                                                          ▼
                                                  ┌───────────────┐
                                                  │collection_items│
                                                  │   (1:many)    │
                                                  └───────────────┘

       ┌─────────────────────────────────────────────────────────────────┐
       │                     SELF-REFERENCING                            │
       │   user_follows: follower_id → user, following_id → user         │
       │   user_blocks: blocker_id → user, blocked_id → user             │
       │   comments: parent_id → comments (threaded replies)             │
       └─────────────────────────────────────────────────────────────────┘
```

### Foreign Key Patterns

| Pattern | ON DELETE | Use Case |
|---------|-----------|----------|
| `CASCADE` | Delete related rows | User data (favorites, ratings) |
| `SET NULL` | Keep row, null FK | Audit logs, assigned_to |
| `RESTRICT` | Prevent deletion | Critical relationships |

---

## Row Level Security (RLS)

### RLS Status by Table Type

| Table Type | RLS Status | Reason |
|------------|------------|--------|
| Better Auth tables | **DISABLED** | Uses service_role key |
| User data tables | **ENABLED** | Per-user access control |
| Admin tables | **ENABLED** | Role-based access |

### RLS Policy Patterns

#### Pattern 1: User Owns Data
```sql
-- User can only see/modify their own data
CREATE POLICY "Users can view own X" ON table_name
  FOR SELECT USING (user_id = current_setting('app.user_id', TRUE));
```

#### Pattern 2: Public Read, Private Write
```sql
-- Anyone can read, only owner can write
CREATE POLICY "Public read" ON table_name FOR SELECT USING (true);
CREATE POLICY "Owner write" ON table_name FOR INSERT
  WITH CHECK (user_id = current_setting('app.user_id', TRUE));
```

#### Pattern 3: Role-Based Access
```sql
-- Admin/moderator access
CREATE POLICY "Admin access" ON table_name FOR ALL
  USING (EXISTS (
    SELECT 1 FROM "user"
    WHERE id = current_setting('app.user_id', TRUE)
    AND role IN ('admin', 'moderator', 'superadmin')
  ));
```

#### Pattern 4: Service Role Bypass (USING true)
```sql
-- Used when app handles auth at API layer (service_role key bypasses RLS)
CREATE POLICY "Service role bypass" ON table_name
  FOR ALL USING (true) WITH CHECK (true);
```

### Current RLS Implementation Note

> **Important**: The current RLS policies use `USING (true)` as placeholders because the application uses the **service_role** key for most operations, which bypasses RLS. Access control is enforced at the **API route level** using session checks. This is by design for performance and flexibility.

**Why USING(true)?**

1. **Service Role Key**: Our app connects using `service_role` which bypasses RLS entirely
2. **Application-Level Auth**: Better Auth handles authentication, session validation at API routes
3. **Performance**: Avoiding per-row RLS checks improves query performance
4. **Flexibility**: Complex access patterns (role hierarchy, ownership + admin access) are easier in TypeScript

**Security Model**:
```
┌─────────────────────────────────────────────────────────┐
│                   API Route Layer                        │
│   ✓ Session validation (Better Auth getSession())       │
│   ✓ Role checks (hasMinRole, ROLES)                     │
│   ✓ Ownership verification (WHERE user_id = session.id) │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Database Layer                         │
│   RLS: USING(true) - service_role bypasses              │
│   Constraints: FK, CHECK, UNIQUE enforced               │
└─────────────────────────────────────────────────────────┘
```

---

## Migration Patterns

### Migration File Structure

```
supabase/migrations/
├── 000_fresh_start.sql          # Consolidated schema (fresh installs)
├── 001_user_data.sql            # Initial user tables
├── 002_better_auth.sql          # Better Auth setup
├── ...
├── 031_multi_device_2fa.sql     # 2FA device management
├── 032_passkeys_webauthn.sql    # WebAuthn/passkeys
├── 033_user_api_keys.sql        # User API key management
├── 034_assistant_settings.sql   # AI assistant preferences
├── ...
├── 041_ban_appeals_system.sql   # Ban appeals
├── 042_reports_system.sql       # User/comment reports
├── 043_messaging_system.sql     # DM conversations
├── 044_group_chats.sql          # Group chat features
├── 045_security_system.sql      # Security tables
├── 046_performance_indexes.sql  # Performance optimizations
├── 047_materialized_views.sql   # Cached aggregates
├── 048_superadmin_role.sql      # Superadmin role
└── 049_add_banned_column.sql    # User ban fields (LATEST)
```

### Migration Naming Convention

```
XXX_descriptive_name.sql

Examples:
001_user_data.sql
029_fix_feedback_schema.sql
045_security_system.sql
```

### Defensive Migration Pattern

Always use conditional DDL to handle partial schema states:

```sql
-- Check table exists before creating indexes
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'mytable') THEN
    CREATE INDEX IF NOT EXISTS idx_mytable_col ON mytable(col);
  END IF;
END $$;

-- Check column exists before altering
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'mytable' AND column_name = 'newcol'
  ) THEN
    ALTER TABLE mytable ADD COLUMN newcol TEXT;
  END IF;
END $$;
```

### Migration Commands

```bash
# Push migrations to remote database
supabase db push

# Generate types (if using Supabase types)
supabase gen types typescript --local > types/database.ts

# Reset local database
supabase db reset
```

---

## API Data Access Patterns

### Standard Query Pattern

```typescript
// lib/db.ts pool usage in API routes
import { pool } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await pool.query(
    `SELECT * FROM favorites WHERE user_id = $1`,
    [session.user.id]
  );

  return NextResponse.json(result.rows);
}
```

### Parameterized Queries (REQUIRED)

```typescript
// ✅ CORRECT - Parameterized
await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

// ❌ WRONG - SQL Injection vulnerability
await pool.query(`SELECT * FROM users WHERE id = '${userId}'`);
```

### Transaction Pattern

```typescript
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('INSERT INTO...', [...]);
  await client.query('UPDATE...', [...]);
  await client.query('COMMIT');
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
} finally {
  client.release();
}
```

### Supabase Client (for Realtime/Storage)

```typescript
// Client-side (lib/supabase/client.ts)
import { createBrowserClient } from '@supabase/ssr';
const supabase = createBrowserClient(url, anonKey);

// Server-side (lib/supabase/server.ts)
import { createServerClient } from '@supabase/ssr';
const supabase = await createServerClient(url, anonKey, { cookies });
```

---

## Role Hierarchy

### Role Levels (Database Constraint)

```sql
CHECK (role IN ('user', 'editor', 'moderator', 'admin', 'superadmin', 'ai_assistant'))
```

### Hierarchy Order

| Level | Role | Permissions |
|-------|------|-------------|
| 0 | `ai_assistant` | Special non-hierarchical role |
| 1 | `user` | Basic access |
| 2 | `editor` | Can edit content |
| 3 | `moderator` | Can moderate comments, view admin dashboard |
| 4 | `admin` | Full admin access |
| 5 | `superadmin` | System-wide access, can modify other admins |

### Role Check Function

```sql
-- Database function for role hierarchy
CREATE FUNCTION user_has_role(user_id TEXT, required_role TEXT)
RETURNS BOOLEAN AS $$
  -- Returns true if user's role level >= required level
$$;
```

### Application Role Check

```typescript
// lib/roles.ts
import { hasMinRole, ROLES } from "@/lib/roles";

// In API routes
if (!hasMinRole(userRole, ROLES.MODERATOR)) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

---

## Materialized Views

### Available Views (Migration 047)

| View | Purpose | Refresh |
|------|---------|---------|
| `mv_dashboard_stats` | Admin dashboard statistics | On demand |
| `mv_rating_stats` | Aggregated rating stats | On demand |
| `mv_user_activity_summary` | User activity summaries | On demand |
| `mv_popular_resources` | Popular resources ranking | On demand |

### Refresh Functions

```sql
-- Refresh all views
SELECT refresh_all_materialized_views();

-- Refresh specific view
SELECT refresh_dashboard_stats();
SELECT refresh_rating_stats();
```

### View Query Example

```sql
-- Fast dashboard stats (from materialized view)
SELECT * FROM mv_dashboard_stats;

-- Refresh before querying if stale
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_stats;
```

---

## Change Log

### 2025-12-16 - v1.2.0 Update

- Added 18 new tables from migrations 050-057
- Added Donation Tables section (5 tables): donations, donor_badges, donation_receipts, donation_bank_info, donation_settings
- Added E2EE Tables section (13 tables): device_keys, one_time_prekeys, e2ee_key_backups, megolm_session_shares, e2ee_message_keys, e2ee_conversation_settings, e2ee_sas_verifications, e2ee_cross_signing_keys, e2ee_device_signatures, e2ee_user_trust, e2ee_ai_consent, e2ee_ai_access_log, e2ee_conversation_ai_settings
- Documented Matrix Olm/Megolm encryption protocol with vodozemac WASM
- Documented AI consent workflow for E2EE conversations
- Added device verification (SAS) and cross-signing documentation
- Extended Migration History Reference with migrations 050-057

### 2025-12-15 - v1.1.0 Update

- Added detailed schemas for all tables from migrations 024-049
- Added 22 missing tables: two_factor_devices, passkeys, webauthn_challenges, user_api_keys, api_key_usage_logs, assistant_settings, ban_appeals, ban_history, reports, user_presence, dm_conversations, dm_participants, dm_messages, dm_typing_indicators, dm_group_invitations, user_chat_settings, security_logs, visitor_fingerprints, honeypot_configs, security_settings, superadmin_logs
- Enhanced RLS documentation with USING(true) pattern explanation and security model diagram
- Added materialized views documentation
- Extended migration history with detailed breakdown of all 49 migrations
- Added migration 049 (banned user columns) documentation

### 2025-12-15 - v1.0.0 Initial Document

- Created comprehensive data layer architecture document
- Documented 40+ tables across all categories
- Established naming conventions (camelCase vs snake_case)
- Documented RLS patterns and migration strategies
- Added role hierarchy documentation

### Migration History Reference

| Migration | Date | Description |
|-----------|------|-------------|
| 000 | 2025-12-14 | Fresh start consolidated schema |
| 001-022 | 2025-12-12 | Core user data tables (profiles, favorites, ratings, comments, collections, activity) |
| 023 | 2025-12-14 | Notification preferences |
| 024 | 2025-12-14 | Push subscriptions |
| 025-029 | 2025-12-14 | Admin notifications, email verification |
| 030 | 2025-12-14 | Email verification codes |
| 031 | 2025-12-14 | Multi-device 2FA (two_factor_devices) |
| 032 | 2025-12-14 | Passkeys/WebAuthn (passkeys, webauthn_challenges) |
| 033 | 2025-12-14 | User API keys (user_api_keys, api_key_usage_logs) |
| 034 | 2025-12-14 | Assistant settings |
| 035-040 | 2025-12-14 | User blocks, onboarding |
| 041 | 2025-12-15 | Ban appeals system (ban_appeals, ban_history) |
| 042 | 2025-12-15 | Reports system |
| 043 | 2025-12-15 | Messaging system (dm_conversations, dm_messages, dm_participants, user_presence) |
| 044 | 2025-12-15 | Group chats (dm_group_invitations, user_chat_settings) |
| 045 | 2025-12-15 | Security system (security_logs, visitor_fingerprints, honeypot_configs, security_settings) |
| 046 | 2025-12-15 | Performance indexes |
| 047 | 2025-12-15 | Materialized views (mv_dashboard_stats, mv_rating_stats, mv_popular_resources) |
| 048 | 2025-12-15 | Superadmin role (superadmin_logs, role constraint update) |
| 049 | 2025-12-15 | Banned user columns (banned, banned_at, banned_reason, banned_by, ban_expires_at) |
| 050 | 2025-12-15 | Add beta_tester role to user role constraint |
| 051 | 2025-12-15 | Donation system (donations, donor_badges, donation_receipts, donation_bank_info, donation_settings) |
| 052 | 2025-12-15 | Promote specific user to admin |
| 053 | 2025-12-15 | Enable PayPal in donation_settings |
| 054 | 2025-12-16 | E2EE device keys (device_keys, one_time_prekeys, e2ee_key_backups) |
| 055 | 2025-12-16 | E2EE messages (megolm_session_shares, e2ee_message_keys, e2ee_conversation_settings) |
| 056 | 2025-12-16 | E2EE device verification (e2ee_sas_verifications, e2ee_cross_signing_keys, e2ee_device_signatures, e2ee_user_trust) |
| 057 | 2025-12-16 | E2EE AI consent (e2ee_ai_consent, e2ee_ai_access_log, e2ee_conversation_ai_settings) |

---

## Quick Reference Card

### Column Naming

```
Better Auth tables → "camelCase" (quoted)
Custom tables → snake_case (unquoted)
```

### Common Queries

```sql
-- Get user with role (Better Auth)
SELECT id, email, role, "createdAt" FROM "user" WHERE id = $1;

-- Get user favorites (custom table)
SELECT * FROM favorites WHERE user_id = $1 ORDER BY created_at DESC;

-- Join user and custom table
SELECT f.*, u.name FROM favorites f JOIN "user" u ON f.user_id = u.id;
```

### API Route Template

```typescript
export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();

  const result = await pool.query(`...`, [session.user.id]);
  return NextResponse.json(result.rows);
}
```
