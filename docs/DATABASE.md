# Database Schema Reference

This document contains the complete database schema, table catalog, and SQL reference for Claude Insider.

**For core rules and patterns, see [CLAUDE.md](../CLAUDE.md#data-layer-mandatory).**

---

## Table of Contents

1. [Overview](#overview)
2. [Column Naming Convention](#column-naming-convention-critical)
3. [Database Clients](#database-clients)
4. [Table Catalog](#table-catalog-137-tables)
5. [Extended User Columns](#extended-user-columns)
6. [Role Hierarchy](#role-hierarchy)
7. [RLS Security Model](#rls-security-model)
8. [Migration Structure](#migration-structure)
9. [SQL Examples](#sql-examples)
10. [API Route Template](#api-route-template)
11. [Common Queries](#common-queries-reference)

---

## Overview

Claude Insider uses **Supabase** (PostgreSQL) with **Better Auth** for authentication.

| Stat | Value |
|------|-------|
| **Total Tables** | 147 |
| **Categories** | 23 |
| **Migrations** | 119 |

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Database** | PostgreSQL 15+ (Supabase) | Primary data store |
| **Authentication** | Better Auth 1.4.7 | User accounts, sessions, OAuth |
| **ORM/Client** | `pg` Pool | Direct SQL queries |
| **Migrations** | Supabase CLI | Manual SQL files in `supabase/migrations/` |

---

## Column Naming Convention (CRITICAL)

| Table Type | Convention | Example | SQL Syntax |
|------------|------------|---------|------------|
| **Better Auth tables** (`user`, `session`, `account`, `verification`) | **camelCase** | `createdAt`, `emailVerified` | Must quote: `"createdAt"` |
| **Custom tables** (all others) | **snake_case** | `created_at`, `user_id` | No quotes needed |

```sql
-- ✅ CORRECT: Better Auth table (quoted camelCase)
SELECT id, email, role, "createdAt" FROM "user" WHERE id = $1;

-- ✅ CORRECT: Custom table (snake_case)
SELECT id, user_id, created_at FROM favorites WHERE user_id = $1;

-- ❌ WRONG: Using snake_case on Better Auth table
SELECT id, email, created_at FROM "user";  -- FAILS: column doesn't exist

-- ❌ WRONG: Forgetting quotes on camelCase
SELECT id, email, createdAt FROM "user";   -- FAILS: becomes "createdat"
```

### Better Auth Column Reference

| Column | Correct SQL | Common Mistake |
|--------|-------------|----------------|
| Created date | `"createdAt"` | `created_at` |
| Email verified | `"emailVerified"` | `email_verified` |
| 2FA enabled | `"twoFactorEnabled"` | `two_factor_enabled` |
| Onboarding | `"hasCompletedOnboarding"` | `has_completed_onboarding` |

---

## Database Clients

| Client | Location | Use Case |
|--------|----------|----------|
| `pool` | `lib/db.ts` | Direct SQL queries (preferred for writes) |
| `createClient()` | `lib/supabase/client.ts` | Browser-side, RLS-enforced |
| `createServerClient()` | `lib/supabase/server.ts` | Server components, RLS-enforced |
| `createAdminClient()` | `lib/supabase/server.ts` | Server-only, bypasses RLS |

---

## Table Catalog (147 Tables)

### Authentication (Better Auth - DO NOT MODIFY STRUCTURE)

| Table | PK Type | Description |
|-------|---------|-------------|
| `user` | TEXT | User accounts with extended columns |
| `session` | TEXT | Active sessions |
| `account` | TEXT | OAuth accounts |
| `verification` | TEXT | Email verification tokens |

### User Data (14 tables)

`profiles`, `favorites`, `ratings`, `reviews`, `review_helpful_votes`, `comments`, `comment_votes`, `collections`, `collection_items`, `user_activity`, `notifications`, `notification_preferences`, `user_follows`, `user_blocks`

### Gamification (3 tables)

`achievements`, `user_achievements`, `achievement_progress`

### Messaging (14 tables)

`user_presence`, `dm_conversations`, `dm_participants`, `dm_messages`, `dm_typing_indicators`, `dm_group_invitations`, `user_chat_settings`, `message_reactions`, `dm_delivery_receipts`, `dm_voice_metadata`, `dm_pinned_messages`, `dm_device_keys`, `dm_e2ee_settings`, `link_previews`

**Key columns in `dm_messages`:**
- `reply_to_message_id` (UUID, FK → self, ON DELETE SET NULL) - Reply threading (v1.13.4)

**Key columns in `message_reactions`:**
- `message_id` (UUID, FK → dm_messages) - Target message
- `user_id` (TEXT, FK → user) - Reactor
- `emoji` (TEXT) - Unicode emoji character
- UNIQUE constraint: `(message_id, user_id, emoji)`

**Key columns in `dm_delivery_receipts` (v1.17.0):**
- `id` (UUID, PK) - Receipt identifier
- `message_id` (UUID, FK → dm_messages) - Message being tracked
- `recipient_id` (TEXT, FK → user) - Recipient user
- `status` ('sent', 'delivered', 'read') - Delivery status
- `delivered_at`, `read_at` (TIMESTAMPTZ) - Status timestamps
- UNIQUE constraint: `(message_id, recipient_id)`

**Key columns in `dm_voice_metadata` (v1.17.0):**
- `id` (UUID, PK) - Metadata identifier
- `message_id` (UUID, FK → dm_messages) - Associated message
- `duration_ms` (INTEGER) - Audio duration in milliseconds
- `waveform` (FLOAT8[]) - Normalized amplitude array for visualization
- `mime_type` (TEXT) - Audio MIME type (webm, mp4)
- `transcription` (TEXT) - Optional speech-to-text
- `transcription_language` (TEXT) - Detected language

**Key columns in `dm_pinned_messages` (v1.17.0):**
- `id` (UUID, PK) - Pin identifier
- `conversation_id` (UUID, FK → dm_conversations) - Conversation
- `message_id` (UUID, FK → dm_messages) - Pinned message
- `pinned_by` (TEXT, FK → user) - User who pinned
- `pinned_at` (TIMESTAMPTZ) - When pinned
- `note` (TEXT) - Optional pin note
- UNIQUE constraint: `(conversation_id, message_id)`

**Key columns in `dm_device_keys` (v1.17.0):**
- `id` (UUID, PK) - Key identifier
- `user_id` (TEXT, FK → user) - Key owner
- `device_id` (TEXT) - Device identifier
- `identity_key` (TEXT) - Curve25519 identity public key
- `signing_key` (TEXT) - Ed25519 signing public key
- `one_time_keys` (JSONB) - Pre-key bundle
- `is_active` (BOOLEAN) - Whether device is currently active
- UNIQUE constraint: `(user_id, device_id)`

**Key columns in `dm_e2ee_settings` (v1.17.0):**
- `conversation_id` (UUID, PK, FK → dm_conversations) - Conversation
- `e2ee_enabled` (BOOLEAN DEFAULT true) - E2EE status
- `auto_enabled_at` (TIMESTAMPTZ) - When auto-enabled
- `algorithm` ('olm', 'megolm') - Encryption algorithm

**Key columns in `link_previews` (v1.17.0):**
- `id` (UUID, PK) - Preview identifier
- `url` (TEXT UNIQUE) - Normalized URL (source of truth)
- `title`, `description`, `image` (TEXT) - Open Graph metadata
- `site_name`, `favicon` (TEXT) - Site identification
- `type` ('website', 'article', 'video', 'image') - Content type
- `video_url`, `video_type` (TEXT) - Video embed info
- `fetched_at`, `expires_at` (TIMESTAMPTZ) - Cache validity
- `fetch_error` (TEXT) - Error message if fetch failed
- `retry_count` (INTEGER) - Failed fetch attempts

**Optimized SQL Functions (v1.17.0):**
- `get_messages_with_context(uuid, int, timestamptz)` - Single-query message fetch with sender, reactions, replies, delivery status, pins
- `get_users_presence(text[])` - Batch presence lookup
- `get_conversations_with_context(text)` - Conversation list with all metadata

### Security (4 tables)

`security_logs`, `visitor_fingerprints`, `honeypot_configs`, `security_settings`

### E2EE (13 tables)

`device_keys`, `one_time_prekeys`, `e2ee_key_backups`, `megolm_session_shares`, `e2ee_message_keys`, `e2ee_conversation_settings`, `e2ee_sas_verifications`, `e2ee_cross_signing_keys`, `e2ee_device_signatures`, `e2ee_user_trust`, `e2ee_ai_consent`, `e2ee_ai_access_log`, `e2ee_conversation_ai_settings`

### Donations (5 tables)

`donations`, `donor_badges`, `donation_receipts`, `donation_bank_info`, `donation_settings`

### Auth Extensions (9 tables)

`two_factor_sessions`, `two_factor_devices`, `email_verification_codes`, `passkeys`, `webauthn_challenges`, `user_api_keys`, `api_key_usage_logs`, `push_subscriptions`, `assistant_settings`

### Reports & Appeals (3 tables)

`reports`, `ban_appeals`, `ban_history`

### Content & Moderation (4 tables)

`edit_suggestions`, `beta_applications`, `feedback`, `admin_logs`

### Resources (7 tables)

`resources`, `resource_tags`, `resource_comments`, `resource_reviews`, `resource_changelog`, `resource_update_jobs`, `resource_authors`

### Resource Discovery (2 tables)

`resource_discovery_queue`, `resource_submissions`

**Key columns in `resource_submissions` (v1.13.6):**
- `url` (VARCHAR(2048)) - Submitted resource URL
- `submitter_type` ('public', 'anonymous') - Submission type
- `submitter_user_id` (TEXT, FK → user) - User who submitted
- `submitter_ip_hash` (VARCHAR(64)) - Hashed IP for anonymous rate limiting
- `status` ('pending', 'analyzing', 'queued', 'approved', 'rejected') - Workflow status
- `ai_analysis` (JSONB) - AI analysis results (category, tags, etc.)
- `ai_confidence`, `ai_relevance`, `ai_quality` (DECIMAL) - AI scores
- `discovery_queue_id` (UUID, FK → resource_discovery_queue) - Links after analysis
- `created_resource_id` (UUID) - Links after approval

### Link Validation (2 tables) - v1.14.1

`resource_link_validations`, `broken_link_queue`

**Key columns in `resource_link_validations`:**
- `resource_id` (UUID, PK, FK → resources) - Link to validated resource
- `url` (VARCHAR(2048)) - URL being validated
- `last_checked_at` (TIMESTAMPTZ) - Last validation timestamp
- `is_valid` (BOOLEAN) - Current validation status
- `consecutive_failures` (INTEGER) - Failure count before flagging broken
- `last_status_code` (INTEGER) - HTTP status from last check
- `last_error` (TEXT) - Error message from last check
- `created_at`, `updated_at` (TIMESTAMPTZ) - Timestamps

**Key columns in `broken_link_queue`:**
- `id` (UUID, PK) - Queue item ID
- `resource_id` (UUID, FK → resources) - Broken resource
- `reason` (TEXT) - Why link was flagged
- `consecutive_failures` (INTEGER) - How many times validation failed
- `detected_at` (TIMESTAMPTZ) - When broken link was detected
- `status` ('pending', 'fixed', 'removed', 'ignored') - Moderation status
- `reviewed_at` (TIMESTAMPTZ) - When admin reviewed
- `reviewed_by` (TEXT, FK → user) - Admin who reviewed

**Indexes:**
- `idx_link_validations_resource` on `resource_link_validations(resource_id)`
- `idx_link_validations_invalid` on `resource_link_validations(is_valid) WHERE is_valid = FALSE`
- `idx_broken_link_queue_status` on `broken_link_queue(status)`
- `idx_broken_link_queue_resource` on `broken_link_queue(resource_id)` UNIQUE

**Key columns in `resources`:**
- `slug` (TEXT, PK) - URL-friendly identifier
- `title`, `description`, `url` - Basic resource info
- `category`, `difficulty` - Classification
- `github_owner`, `github_repo`, `github_stars`, `github_forks` - GitHub integration
- `key_features`, `pros`, `cons`, `use_cases` (TEXT[]) - Enhanced fields
- `content_hash` (TEXT) - MD5 hash for sync change detection (v1.13.3)

### Reading & Search (8 tables)

`reading_lists`, `reading_list_items`, `view_history`, `resource_views`, `resource_view_stats`, `saved_searches`, `search_history`, `search_analytics`

### Documentation & Relationships (9 tables)

`documentation`, `documentation_sections`, `documentation_history`, `documentation_update_jobs`, `doc_resource_relationships`, `resource_relationships`, `relationship_analysis_jobs`

**Relationship Stats (v1.15.0):**
- `doc_resource_relationships`: 63 relationships linking docs to resources
- `resource_relationships`: 1,800 relationships linking resources to each other
- **Total**: 1,863 cross-references

**Key columns in `resource_relationships`:**
- `source_slug` (TEXT, FK → resources) - Source resource
- `target_slug` (TEXT, FK → resources) - Target resource
- `relationship_type` ('similar', 'alternative', 'complement', 'uses', 'integrates', 'fork', 'inspired_by') - Type
- `confidence` (DECIMAL 0-1) - AI confidence score
- `reason` (TEXT) - Human-readable explanation
- `is_bidirectional` (BOOLEAN) - If true, relationship applies both ways
- UNIQUE constraint: `(source_slug, target_slug)`

### AI Conversations (2 tables)

`ai_conversations`, `ai_messages`

### AI Pipeline (2 tables)

`ai_pipeline_settings`, `ai_operation_queue`

### Admin Exports (1 table)

`export_jobs`

### Prompts (5 tables)

`prompt_categories`, `prompts`, `user_prompt_saves`, `prompt_ratings`, `prompt_usage`

### MCP Playground (4 tables) - v1.16.0

`mcp_configs`, `mcp_config_versions`, `mcp_config_stars`, `mcp_config_reviews`

**Key columns in `mcp_configs`:**
- `id` (UUID, PK) - Config identifier
- `user_id` (TEXT, FK → user) - Owner
- `name`, `description` (TEXT) - Metadata
- `config_json` (JSONB) - MCP server configuration
- `tags`, `use_cases` (TEXT[]) - Classification
- `difficulty` ('beginner', 'intermediate', 'advanced') - Skill level
- `status` ('draft', 'pending_review', 'published', 'rejected') - Publishing workflow
- `is_public` (BOOLEAN) - Visibility
- `stars_count`, `forks_count`, `views_count` (INTEGER) - Denormalized metrics
- `forked_from_id` (UUID, FK → mcp_configs) - Fork attribution
- `server_count` (INTEGER, GENERATED) - Extracted from config_json

**Key columns in `mcp_config_versions`:**
- `config_id` (UUID, FK → mcp_configs) - Parent config
- `version_number` (INTEGER) - Incremental version
- `config_json` (JSONB) - Snapshot of config
- `change_summary` (TEXT) - Description of changes
- UNIQUE constraint: `(config_id, version_number)`

**Key columns in `mcp_config_stars`:**
- `user_id` (TEXT, FK → user) - User who starred
- `config_id` (UUID, FK → mcp_configs) - Starred config
- PRIMARY KEY: `(user_id, config_id)`

**Key columns in `mcp_config_reviews`:**
- `config_id` (UUID, FK → mcp_configs) - Config under review
- `reviewer_id` (TEXT, FK → user) - Moderator
- `status` ('pending', 'approved', 'rejected') - Review status
- `feedback` (TEXT) - Review comments

**Views:**
- `mcp_configs_gallery` - Public configs with author info
- `mcp_configs_moderation_queue` - Pending configs for review

**Triggers:**
- `trg_mcp_config_stars_count` - Updates `stars_count` on star/unstar
- `trg_mcp_config_forks_count` - Updates `forks_count` on fork/delete
- `trg_mcp_config_updated_at` - Updates `updated_at` on modification

**RLS Policies:**
- `mcp_configs_select_own` - Users see their own configs
- `mcp_configs_select_public` - Anyone sees published public configs
- `mcp_configs_insert` - Users insert their own configs
- `mcp_configs_update_own` - Users update their own configs
- `mcp_configs_delete_own` - Users delete their own configs

---

## Extended User Columns

Columns added to the Better Auth `user` table:

| Column | Type | Description |
|--------|------|-------------|
| `username` | TEXT | Unique username |
| `role` | TEXT | user/editor/moderator/admin/superadmin/ai_assistant |
| `"twoFactorEnabled"` | BOOLEAN | 2FA status (camelCase!) |
| `"hasCompletedOnboarding"` | BOOLEAN | Onboarding status (camelCase!) |
| `banned`, `banned_at`, `banned_reason` | BOOLEAN/TIMESTAMPTZ/TEXT | Ban status |
| `followers_count`, `following_count` | INTEGER | Denormalized counts |
| `achievement_points` | INTEGER | Gamification points |

---

## Role Hierarchy

```sql
CHECK (role IN ('user', 'editor', 'moderator', 'admin', 'superadmin', 'ai_assistant'))
```

| Level | Role | API Check |
|-------|------|-----------|
| 0 | `ai_assistant` | Special non-hierarchical |
| 1 | `user` | Default |
| 2 | `editor` | `hasMinRole(userRole, ROLES.EDITOR)` |
| 3 | `moderator` | `hasMinRole(userRole, ROLES.MODERATOR)` |
| 4 | `admin` | `hasMinRole(userRole, ROLES.ADMIN)` |
| 5 | `superadmin` | `isSuperAdmin(userRole)` |

---

## RLS Security Model

RLS policies use `USING (true)` because the app uses the **service_role** key (bypasses RLS). Access control is enforced at the **API route level**:

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

## Migration Structure

```
supabase/migrations/
├── 000_fresh_start.sql          # Consolidated schema (fresh installs)
├── 001-022                      # Core user data tables
├── 023-030                      # Notifications, email verification
├── 031-034                      # 2FA, passkeys, API keys, assistant settings
├── 041-044                      # Reports, bans, messaging, group chats
├── 045-049                      # Security system, materialized views, superadmin
├── 050-053                      # Beta tester role, donation system
├── 054-057                      # E2EE (device keys, messages, verification, AI consent)
├── 058-061                      # Messaging indexes, job queue, donations, notification indexes
├── 062-063                      # Presence indexes, chat performance (RPC functions, indexes)
├── 081-085                      # Resources system (tags, authors, alternatives, favorites, ratings, reviews, comments)
├── 086-088                      # Documentation tables, relationships, resource AI enhancements
├── 089-090                      # AI pipeline settings, operation queue, resource sources, discovery queue
├── 091                          # Resource-resource relationships fix
├── 092-095                      # Release notifications
├── 096                          # Prompts system (categories, prompts, saves, ratings, usage)
├── 097-100                      # Export jobs, release notifications
├── 101-103                      # Dashboard fixes, content_hash column
├── 104                          # Sync follow counts
├── 105                          # Message reactions table (Matrix SDK)
├── 106                          # Reply threading column (reply_to_message_id)
├── 107                          # Resource submissions
├── 108-110                      # Chat performance functions, RPC fixes
├── 111-112                      # Link validation tables
├── 113                          # MCP configs storage (playground)
├── 114                          # Delivery receipts (dm_delivery_receipts)
├── 115                          # Voice messages (dm_voice_metadata)
├── 116                          # Message pinning (dm_pinned_messages)
├── 117                          # Link previews cache (link_previews)
├── 118                          # Optimized chat SQL functions
└── 119                          # E2EE default for DMs (dm_device_keys, dm_e2ee_settings)
```

---

## SQL Examples

### Parameterized Queries (MANDATORY)

```typescript
// ✅ CORRECT
await pool.query('SELECT * FROM favorites WHERE user_id = $1', [userId]);

// ❌ WRONG - SQL Injection vulnerability
await pool.query(`SELECT * FROM favorites WHERE user_id = '${userId}'`);
```

### Defensive Migration Pattern

```sql
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'mytable') THEN
    CREATE INDEX IF NOT EXISTS idx_mytable_col ON mytable(col);
  END IF;
END $$;
```

---

## API Route Template

```typescript
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roleResult = await pool.query(
    `SELECT role FROM "user" WHERE id = $1`,
    [session.user.id]
  );
  const userRole = (roleResult.rows[0]?.role as UserRole) || "user";
  if (!hasMinRole(userRole, ROLES.MODERATOR)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await pool.query(
    `SELECT * FROM table WHERE user_id = $1`,
    [session.user.id]
  );

  return NextResponse.json(result.rows);
}
```

---

## Common Queries Reference

```sql
-- Get user with role (Better Auth - must quote camelCase)
SELECT id, email, role, "createdAt" FROM "user" WHERE id = $1;

-- Get user favorites (custom table - snake_case)
SELECT * FROM favorites WHERE user_id = $1 ORDER BY created_at DESC;

-- Join user and custom table
SELECT f.*, u.name FROM favorites f JOIN "user" u ON f.user_id = u.id;

-- Check online status
SELECT * FROM user_presence WHERE user_id = $1;

-- Get conversations with unread count
SELECT c.*, p.unread_count FROM dm_conversations c
JOIN dm_participants p ON p.conversation_id = c.id
WHERE p.user_id = $1;
```

---

## Checklist for Data Layer Changes

- [ ] Column names match convention (camelCase for Better Auth, snake_case for custom)
- [ ] Migration uses defensive patterns (IF EXISTS, conditional DDL)
- [ ] `000_fresh_start.sql` updated (if adding tables)
- [ ] Parameterized queries only (no string interpolation)
- [ ] Run `pnpm check-types` after changes
