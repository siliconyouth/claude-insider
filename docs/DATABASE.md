# Database Schema Reference

This document contains the complete database schema, table catalog, and SQL reference for Claude Insider.

**For core rules and patterns, see [CLAUDE.md](../CLAUDE.md#data-layer-architecture-mandatory).**

---

## Table of Contents

1. [Overview](#overview)
2. [Column Naming Convention](#column-naming-convention-critical)
3. [Database Clients](#database-clients)
4. [Table Catalog](#table-catalog-126-tables)
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
| **Total Tables** | 126 |
| **Categories** | 19 |
| **Migrations** | 97 |

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

## Table Catalog (126 Tables)

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

### Messaging (7 tables)

`user_presence`, `dm_conversations`, `dm_participants`, `dm_messages`, `dm_typing_indicators`, `dm_group_invitations`, `user_chat_settings`

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

### Reading & Search (8 tables)

`reading_lists`, `reading_list_items`, `view_history`, `resource_views`, `resource_view_stats`, `saved_searches`, `search_history`, `search_analytics`

### Documentation & Relationships (7 tables)

`documentation`, `documentation_sections`, `documentation_history`, `documentation_update_jobs`, `doc_resource_relationships`, `resource_relationships`, `relationship_analysis_jobs`

### AI Conversations (2 tables)

`ai_conversations`, `ai_messages`

### AI Pipeline (2 tables)

`ai_pipeline_settings`, `ai_operation_queue`

### Admin Exports (1 table)

`export_jobs`

### Prompts (5 tables)

`prompt_categories`, `prompts`, `user_prompt_saves`, `prompt_ratings`, `prompt_usage`

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
└── 096                          # Prompts system (categories, prompts, saves, ratings, usage)
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
