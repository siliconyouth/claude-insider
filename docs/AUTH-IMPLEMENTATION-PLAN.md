# User Authentication Implementation Plan

## Claude Insider - Community Features Roadmap

**Version:** 1.0
**Created:** December 12, 2025
**Author:** Vladimir Dukelic
**Status:** Planning

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Technology Stack](#technology-stack)
4. [Phase 1: Extend Payload CMS Users](#phase-1-extend-payload-cms-users)
5. [Phase 2: Better Auth for Public Users](#phase-2-better-auth-for-public-users)
6. [Phase 3: User Data with Supabase RLS](#phase-3-user-data-with-supabase-rls)
7. [Phase 4: Frontend Components](#phase-4-frontend-components)
8. [Phase 5: Editorial Workflow](#phase-5-editorial-workflow)
9. [Phase 6: Advanced Features](#phase-6-advanced-features)
10. [Database Schema](#database-schema)
11. [API Endpoints](#api-endpoints)
12. [Security Considerations](#security-considerations)
13. [Testing Strategy](#testing-strategy)
14. [Deployment Checklist](#deployment-checklist)
15. [Future Enhancements](#future-enhancements)

---

## Executive Summary

This document outlines the implementation plan for adding user authentication and community features to Claude Insider. The goal is to transform the site from a static documentation hub into an interactive community platform while maintaining the existing content management workflow.

### Key Objectives

1. **User Authentication** - Allow visitors to create accounts and personalize their experience
2. **Community Features** - Favorites, ratings, comments, and private collections
3. **Editorial Workflow** - Enable users to suggest edits with moderator review
4. **Role-Based Access** - Admins, editors, moderators, beta testers, and regular users
5. **Data Ownership** - All data stays in our Supabase PostgreSQL database

### Chosen Architecture

**Hybrid Approach:**
- **Payload CMS** - Admin/editorial users (existing)
- **Better Auth** - Public user authentication (new)
- **Supabase RLS** - User-generated content security (new)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLAUDE INSIDER                                │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                        FRONTEND (Next.js 16)                       │ │
│  │                                                                    │ │
│  │   ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐  │ │
│  │   │   Public     │   │   Authed     │   │    Admin Panel       │  │ │
│  │   │   Pages      │   │   Features   │   │    (Payload CMS)     │  │ │
│  │   │              │   │              │   │                      │  │ │
│  │   │  • Docs      │   │  • Favorites │   │  • Content CRUD      │  │ │
│  │   │  • Resources │   │  • Ratings   │   │  • User Management   │  │ │
│  │   │  • Search    │   │  • Comments  │   │  • Moderation Queue  │  │ │
│  │   │  • AI Chat   │   │  • Profile   │   │  • Analytics         │  │ │
│  │   └──────────────┘   └──────────────┘   └──────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                    │
│                                    ▼                                    │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                         API LAYER                                  │ │
│  │                                                                    │ │
│  │   ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐  │ │
│  │   │ Better Auth  │   │ Payload API  │   │   Supabase Client    │  │ │
│  │   │   Routes     │   │   Routes     │   │   (with RLS)         │  │ │
│  │   │              │   │              │   │                      │  │ │
│  │   │ /api/auth/*  │   │ /api/*       │   │ Direct DB queries    │  │ │
│  │   └──────────────┘   └──────────────┘   └──────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                    │
│                                    ▼                                    │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    SUPABASE POSTGRESQL                             │ │
│  │                                                                    │ │
│  │   ┌────────────────────────────────────────────────────────────┐  │ │
│  │   │                      SCHEMAS                               │  │ │
│  │   │                                                            │  │ │
│  │   │  payload_*          │  public.*           │  auth.*        │  │ │
│  │   │  ─────────          │  ────────           │  ──────        │  │ │
│  │   │  • users (cms)      │  • profiles         │  • users       │  │ │
│  │   │  • resources        │  • favorites        │  • sessions    │  │ │
│  │   │  • categories       │  • ratings          │  • accounts    │  │ │
│  │   │  • tags             │  • comments         │                │  │ │
│  │   │  • edit_suggestions │  • collections      │                │  │ │
│  │   │                     │  • collection_items │                │  │ │
│  │   └────────────────────────────────────────────────────────────┘  │ │
│  │                                                                    │ │
│  │   ┌────────────────────────────────────────────────────────────┐  │ │
│  │   │                 ROW LEVEL SECURITY (RLS)                   │  │ │
│  │   │                                                            │  │ │
│  │   │  • Users can only access their own favorites/ratings       │  │ │
│  │   │  • Approved comments visible to all, pending to owner only │  │ │
│  │   │  • Private collections only visible to owner               │  │ │
│  │   │  • Public collections visible to all                       │  │ │
│  │   └────────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Authentication Layer

| Component | Technology | Purpose |
|-----------|------------|---------|
| CMS Auth | Payload CMS 3.x | Admin, Editor, Moderator accounts |
| Public Auth | Better Auth | Visitor registration & login |
| Session Storage | JWT + Cookies | Stateless authentication |
| OAuth Providers | GitHub, Google | Social login |

### Database Layer

| Component | Technology | Purpose |
|-----------|------------|---------|
| Primary Database | Supabase PostgreSQL | All data storage |
| ORM (Payload) | Drizzle | CMS data access |
| Direct Access | @supabase/ssr | User data with RLS |
| Row Level Security | PostgreSQL RLS | Data isolation |

### Frontend Layer

| Component | Technology | Purpose |
|-----------|------------|---------|
| Framework | Next.js 16 (App Router) | SSR/SSG |
| UI Components | React 19 + Tailwind CSS 4 | Interface |
| State Management | React Context + localStorage | User preferences |
| Forms | React Hook Form + Zod | Validation |

---

## Phase 1: Extend Payload CMS Users

**Duration:** 1 week
**Priority:** High
**Dependencies:** None (uses existing infrastructure)

### 1.1 Update User Roles

**File:** `apps/web/collections/Users.ts`

```typescript
import type { CollectionConfig } from 'payload';

// Role definitions
export type UserRole = 'admin' | 'editor' | 'moderator' | 'beta_tester';

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    useSessions: false, // JWT-based auth
    tokenExpiration: 7200, // 2 hours
    maxLoginAttempts: 5,
    lockTime: 600000, // 10 minutes
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'role', 'createdAt'],
    group: 'Admin',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (user.role === 'admin') return true;
      // Users can read their own profile
      return { id: { equals: user.id } };
    },
    create: ({ req: { user } }) => user?.role === 'admin',
    update: ({ req: { user }, id }) => {
      if (!user) return false;
      if (user.role === 'admin') return true;
      // Users can update their own profile (except role)
      return user.id === id;
    },
    delete: ({ req: { user } }) => user?.role === 'admin',
    admin: ({ req: { user } }) => !!user,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media', // Create Media collection
      admin: {
        description: 'Profile picture',
      },
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'Moderator', value: 'moderator' },
        { label: 'Beta Tester', value: 'beta_tester' },
      ],
      access: {
        update: ({ req: { user } }) => user?.role === 'admin',
      },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'bio',
      type: 'textarea',
      admin: {
        description: 'Short biography',
      },
    },
    {
      name: 'permissions',
      type: 'group',
      admin: {
        condition: (data) => ['admin', 'moderator'].includes(data?.role),
      },
      fields: [
        {
          name: 'canApproveComments',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'canApproveEdits',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'canManageUsers',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
  ],
  timestamps: true,
};
```

### 1.2 Create EditSuggestions Collection

**File:** `apps/web/collections/EditSuggestions.ts`

```typescript
import type { CollectionConfig } from 'payload';

export const EditSuggestions: CollectionConfig = {
  slug: 'edit-suggestions',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'targetType', 'submittedBy', 'createdAt'],
    group: 'Moderation',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (['admin', 'moderator', 'editor'].includes(user.role)) return true;
      // Public users can read their own suggestions (via API)
      return false;
    },
    create: () => true, // Anyone can suggest (handled via API)
    update: ({ req: { user } }) =>
      ['admin', 'moderator'].includes(user?.role || ''),
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Brief description of the suggested change',
      },
    },
    {
      name: 'targetType',
      type: 'select',
      required: true,
      options: [
        { label: 'Documentation', value: 'doc' },
        { label: 'Resource', value: 'resource' },
      ],
    },
    {
      name: 'targetId',
      type: 'text',
      required: true,
      admin: {
        description: 'ID or slug of the target content',
      },
    },
    {
      name: 'targetUrl',
      type: 'text',
      admin: {
        description: 'URL where the suggestion was made',
      },
    },
    {
      name: 'currentContent',
      type: 'richText',
      admin: {
        description: 'The current content (for reference)',
      },
    },
    {
      name: 'suggestedContent',
      type: 'richText',
      required: true,
      admin: {
        description: 'The proposed changes',
      },
    },
    {
      name: 'reason',
      type: 'textarea',
      admin: {
        description: 'Why this change should be made',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending Review', value: 'pending' },
        { label: 'Under Review', value: 'reviewing' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Merged', value: 'merged' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'submittedBy',
      type: 'group',
      fields: [
        {
          name: 'type',
          type: 'select',
          options: [
            { label: 'Public User', value: 'public' },
            { label: 'CMS User', value: 'cms' },
            { label: 'Anonymous', value: 'anonymous' },
          ],
        },
        {
          name: 'userId',
          type: 'text',
          admin: {
            description: 'User ID (public or CMS)',
          },
        },
        {
          name: 'email',
          type: 'email',
        },
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
    {
      name: 'reviewedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        condition: (data) => data?.status !== 'pending',
      },
    },
    {
      name: 'reviewNotes',
      type: 'textarea',
      admin: {
        description: 'Notes from the reviewer',
        condition: (data) => data?.status !== 'pending',
      },
    },
    {
      name: 'reviewedAt',
      type: 'date',
      admin: {
        condition: (data) => data?.status !== 'pending',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        if (operation === 'update' && data.status !== 'pending') {
          data.reviewedBy = req.user?.id;
          data.reviewedAt = new Date().toISOString();
        }
        return data;
      },
    ],
  },
  timestamps: true,
};
```

### 1.3 Create Media Collection (for avatars)

**File:** `apps/web/collections/Media.ts`

```typescript
import type { CollectionConfig } from 'payload';

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Admin',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  upload: {
    staticDir: 'media',
    mimeTypes: ['image/*'],
    imageSizes: [
      {
        name: 'thumbnail',
        width: 100,
        height: 100,
        position: 'centre',
      },
      {
        name: 'card',
        width: 300,
        height: 300,
        position: 'centre',
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
};
```

### 1.4 Update payload.config.ts

```typescript
import { EditSuggestions } from './collections/EditSuggestions';
import { Media } from './collections/Media';

// Add to collections array:
collections: [
  Users,
  Media,
  Categories,
  Subcategories,
  Tags,
  Resources,
  DifficultyLevels,
  ProgrammingLanguages,
  EditSuggestions, // New
],
```

### 1.5 Tasks Checklist

- [ ] Update `Users.ts` with new roles and fields
- [ ] Create `EditSuggestions.ts` collection
- [ ] Create `Media.ts` collection for uploads
- [ ] Update `payload.config.ts` with new collections
- [ ] Run `payload generate:types` to update TypeScript types
- [ ] Run database migration
- [ ] Test role-based access in admin panel
- [ ] Seed initial moderator account

---

## Phase 2: Better Auth for Public Users

**Duration:** 1 week
**Priority:** High
**Dependencies:** Phase 1 (for integration)

### 2.1 Install Dependencies

```bash
pnpm add better-auth @better-auth/cli
```

### 2.2 Create Better Auth Configuration

**File:** `apps/web/lib/auth.ts`

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { twoFactor } from "better-auth/plugins/two-factor";
import { organization } from "better-auth/plugins/organization";
import { db } from "./db"; // Your Drizzle instance

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  // Email/Password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      // Use Resend to send password reset email
      await sendEmail({
        to: user.email,
        subject: "Reset your Claude Insider password",
        html: `<a href="${url}">Reset Password</a>`,
      });
    },
  },

  // Social providers
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  // Plugins
  plugins: [
    twoFactor({
      issuer: "Claude Insider",
    }),
    organization({
      // For future team features
    }),
  ],

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  // Rate limiting
  rateLimit: {
    window: 60, // 1 minute
    max: 10, // 10 requests per minute
  },

  // User schema extension
  user: {
    additionalFields: {
      displayName: {
        type: "string",
        required: false,
      },
      bio: {
        type: "string",
        required: false,
      },
      avatarUrl: {
        type: "string",
        required: false,
      },
      isBetaTester: {
        type: "boolean",
        defaultValue: false,
      },
      preferredTheme: {
        type: "string",
        defaultValue: "system",
      },
    },
  },

  // Callbacks
  callbacks: {
    onUserCreated: async ({ user }) => {
      // Create profile in public schema
      console.log("New user created:", user.email);
    },
  },
});

// Export types
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.User;
```

### 2.3 Create Auth API Route

**File:** `apps/web/app/api/auth/[...all]/route.ts`

```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

### 2.4 Create Auth Client

**File:** `apps/web/lib/auth-client.ts`

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;
```

### 2.5 Create Auth Context Provider

**File:** `apps/web/components/providers/auth-provider.tsx`

```typescript
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import type { Session, User } from "@/lib/auth";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();

  const value: AuthContextValue = {
    user: session?.user ?? null,
    session: session ?? null,
    isLoading: isPending,
    isAuthenticated: !!session?.user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### 2.6 Environment Variables

**Add to `.env.local`:**

```env
# Better Auth
BETTER_AUTH_SECRET=your-secret-key-here-min-32-chars

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### 2.7 Tasks Checklist

- [ ] Install `better-auth` package
- [ ] Create `lib/auth.ts` configuration
- [ ] Create API route handler
- [ ] Create auth client for React
- [ ] Create AuthProvider component
- [ ] Add to root layout
- [ ] Configure GitHub OAuth app
- [ ] Configure Google OAuth app
- [ ] Set up email verification with Resend
- [ ] Test sign up flow
- [ ] Test sign in flow
- [ ] Test social login
- [ ] Test password reset

---

## Phase 3: User Data with Supabase RLS

**Duration:** 1 week
**Priority:** High
**Dependencies:** Phase 2 (requires auth)

### 3.1 Database Schema (SQL)

**File:** `apps/web/supabase/migrations/001_user_data.sql`

```sql
-- =============================================================================
-- PUBLIC USER PROFILES (linked to Better Auth users)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  website_url TEXT,
  github_username TEXT,
  twitter_handle TEXT,
  is_beta_tester BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  notification_preferences JSONB DEFAULT '{"email": true, "browser": false}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Index
CREATE INDEX idx_profiles_display_name ON public.profiles(display_name);

-- =============================================================================
-- FAVORITES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('resource', 'doc')),
  resource_id TEXT NOT NULL, -- Can be numeric ID or slug
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, resource_type, resource_id)
);

-- Enable RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own favorites"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own favorites"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX idx_favorites_resource ON public.favorites(resource_type, resource_id);

-- =============================================================================
-- RATINGS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('resource', 'doc')),
  resource_id TEXT NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, resource_type, resource_id)
);

-- Enable RLS
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view ratings"
  ON public.ratings FOR SELECT
  USING (true);

CREATE POLICY "Users can add ratings"
  ON public.ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings"
  ON public.ratings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ratings"
  ON public.ratings FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_ratings_resource ON public.ratings(resource_type, resource_id);
CREATE INDEX idx_ratings_user_id ON public.ratings(user_id);

-- Aggregation view
CREATE OR REPLACE VIEW public.rating_stats AS
SELECT
  resource_type,
  resource_id,
  COUNT(*) as total_ratings,
  ROUND(AVG(rating)::numeric, 2) as average_rating,
  COUNT(*) FILTER (WHERE rating = 5) as five_star,
  COUNT(*) FILTER (WHERE rating = 4) as four_star,
  COUNT(*) FILTER (WHERE rating = 3) as three_star,
  COUNT(*) FILTER (WHERE rating = 2) as two_star,
  COUNT(*) FILTER (WHERE rating = 1) as one_star
FROM public.ratings
GROUP BY resource_type, resource_id;

-- =============================================================================
-- COMMENTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('resource', 'doc')),
  resource_id TEXT NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE, -- For replies
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  moderated_by UUID REFERENCES auth.users(id),
  moderated_at TIMESTAMPTZ,
  moderation_reason TEXT,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Approved comments are public"
  ON public.comments FOR SELECT
  USING (status = 'approved' OR auth.uid() = user_id);

CREATE POLICY "Users can create comments"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can edit own pending comments"
  ON public.comments FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_comments_resource ON public.comments(resource_type, resource_id);
CREATE INDEX idx_comments_user_id ON public.comments(user_id);
CREATE INDEX idx_comments_parent ON public.comments(parent_id);
CREATE INDEX idx_comments_status ON public.comments(status);

-- =============================================================================
-- COMMENT VOTES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.comment_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, comment_id)
);

-- Enable RLS
ALTER TABLE public.comment_votes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view votes"
  ON public.comment_votes FOR SELECT
  USING (true);

CREATE POLICY "Users can vote"
  ON public.comment_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can change vote"
  ON public.comment_votes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can remove vote"
  ON public.comment_votes FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update comment vote counts
CREATE OR REPLACE FUNCTION update_comment_votes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'up' THEN
      UPDATE public.comments SET upvotes = upvotes + 1 WHERE id = NEW.comment_id;
    ELSE
      UPDATE public.comments SET downvotes = downvotes + 1 WHERE id = NEW.comment_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'up' THEN
      UPDATE public.comments SET upvotes = upvotes - 1 WHERE id = OLD.comment_id;
    ELSE
      UPDATE public.comments SET downvotes = downvotes - 1 WHERE id = OLD.comment_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.vote_type != NEW.vote_type THEN
      IF NEW.vote_type = 'up' THEN
        UPDATE public.comments SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id = NEW.comment_id;
      ELSE
        UPDATE public.comments SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = NEW.comment_id;
      END IF;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_vote
  AFTER INSERT OR UPDATE OR DELETE ON public.comment_votes
  FOR EACH ROW EXECUTE FUNCTION update_comment_votes();

-- =============================================================================
-- COLLECTIONS (Private lists of resources)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  slug TEXT,
  cover_image_url TEXT,
  item_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, slug)
);

-- Enable RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public collections are viewable"
  ON public.collections FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create collections"
  ON public.collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections"
  ON public.collections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
  ON public.collections FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_collections_user_id ON public.collections(user_id);
CREATE INDEX idx_collections_public ON public.collections(is_public) WHERE is_public = true;

-- =============================================================================
-- COLLECTION ITEMS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('resource', 'doc')),
  resource_id TEXT NOT NULL,
  notes TEXT,
  position INTEGER DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(collection_id, resource_type, resource_id)
);

-- Enable RLS
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

-- Policies (inherit from parent collection)
CREATE POLICY "Items viewable if collection is viewable"
  ON public.collection_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_id
      AND (c.is_public = true OR c.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can add items to own collections"
  ON public.collection_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update items in own collections"
  ON public.collection_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove items from own collections"
  ON public.collection_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_id AND c.user_id = auth.uid()
    )
  );

-- Trigger to update collection item count
CREATE OR REPLACE FUNCTION update_collection_item_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.collections SET item_count = item_count + 1, updated_at = NOW() WHERE id = NEW.collection_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.collections SET item_count = item_count - 1, updated_at = NOW() WHERE id = OLD.collection_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_collection_item_change
  AFTER INSERT OR DELETE ON public.collection_items
  FOR EACH ROW EXECUTE FUNCTION update_collection_item_count();

-- Indexes
CREATE INDEX idx_collection_items_collection ON public.collection_items(collection_id);
CREATE INDEX idx_collection_items_resource ON public.collection_items(resource_type, resource_id);

-- =============================================================================
-- USER ACTIVITY LOG (for personalization)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'view_resource', 'view_doc', 'search', 'favorite', 'unfavorite',
    'rate', 'comment', 'collection_create', 'collection_add'
  )),
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own activity"
  ON public.user_activity FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can log activity"
  ON public.user_activity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_user_activity_user ON public.user_activity(user_id);
CREATE INDEX idx_user_activity_type ON public.user_activity(activity_type);
CREATE INDEX idx_user_activity_created ON public.user_activity(created_at DESC);

-- Cleanup old activity (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_activity()
RETURNS void AS $$
BEGIN
  DELETE FROM public.user_activity WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Get user's favorites count
CREATE OR REPLACE FUNCTION get_favorites_count(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM public.favorites WHERE user_id = p_user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Check if user has favorited a resource
CREATE OR REPLACE FUNCTION is_favorited(p_user_id UUID, p_resource_type TEXT, p_resource_id TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.favorites
    WHERE user_id = p_user_id
    AND resource_type = p_resource_type
    AND resource_id = p_resource_id
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Get user's rating for a resource
CREATE OR REPLACE FUNCTION get_user_rating(p_user_id UUID, p_resource_type TEXT, p_resource_id TEXT)
RETURNS INTEGER AS $$
  SELECT rating FROM public.ratings
  WHERE user_id = p_user_id
  AND resource_type = p_resource_type
  AND resource_id = p_resource_id;
$$ LANGUAGE sql SECURITY DEFINER;
```

### 3.2 Supabase Client Setup

**File:** `apps/web/lib/supabase/client.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**File:** `apps/web/lib/supabase/server.ts`

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component - ignore
          }
        },
      },
    }
  );
}
```

### 3.3 Tasks Checklist

- [ ] Create SQL migration file
- [ ] Run migration in Supabase
- [ ] Set up Supabase client (browser)
- [ ] Set up Supabase client (server)
- [ ] Create TypeScript types for tables
- [ ] Test RLS policies with different users
- [ ] Verify aggregation views work
- [ ] Test triggers for vote counts
- [ ] Test collection item count updates

---

## Phase 4: Frontend Components

**Duration:** 1.5 weeks
**Priority:** High
**Dependencies:** Phase 2 & 3

### 4.1 Auth UI Components

**Directory Structure:**
```
components/
  auth/
    sign-in-modal.tsx
    sign-up-modal.tsx
    user-menu.tsx
    auth-guard.tsx
    social-buttons.tsx
```

### 4.2 Interaction Components

**Directory Structure:**
```
components/
  interactions/
    favorite-button.tsx
    rating-stars.tsx
    comment-section.tsx
    comment-item.tsx
    comment-form.tsx
    collection-button.tsx
    collection-modal.tsx
    share-button.tsx
```

### 4.3 User Profile Components

**Directory Structure:**
```
components/
  profile/
    profile-header.tsx
    profile-stats.tsx
    profile-tabs.tsx
    favorites-list.tsx
    ratings-list.tsx
    collections-grid.tsx
    activity-feed.tsx
    settings-form.tsx
```

### 4.4 Key Component: FavoriteButton

```typescript
"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/design-system";
import { useAuth } from "@/components/providers/auth-provider";
import { toggleFavorite } from "@/app/actions/favorites";
import { useToast } from "@/hooks/use-toast";

interface FavoriteButtonProps {
  resourceType: "resource" | "doc";
  resourceId: string;
  initialIsFavorited?: boolean;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  count?: number;
}

export function FavoriteButton({
  resourceType,
  resourceId,
  initialIsFavorited = false,
  size = "md",
  showCount = false,
  count = 0,
}: FavoriteButtonProps) {
  const { isAuthenticated, user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleClick = () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save favorites",
        variant: "warning",
      });
      // Open sign-in modal
      return;
    }

    // Optimistic update
    setIsFavorited(!isFavorited);

    startTransition(async () => {
      const result = await toggleFavorite(resourceType, resourceId);

      if (result.error) {
        // Revert on error
        setIsFavorited(isFavorited);
        toast({
          title: "Error",
          description: result.error,
          variant: "error",
        });
      }
    });
  };

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "inline-flex items-center justify-center rounded-full",
        "transition-all duration-200",
        "hover:bg-gray-100 dark:hover:bg-gray-800",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        sizeClasses[size],
        isPending && "opacity-50 cursor-not-allowed"
      )}
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        size={iconSizes[size]}
        className={cn(
          "transition-colors duration-200",
          isFavorited
            ? "fill-red-500 text-red-500"
            : "text-gray-400 hover:text-red-500"
        )}
      />
      {showCount && count > 0 && (
        <span className="ml-1 text-sm text-gray-500">{count}</span>
      )}
    </button>
  );
}
```

### 4.5 Key Component: RatingStars

```typescript
"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/design-system";
import { useAuth } from "@/components/providers/auth-provider";
import { submitRating } from "@/app/actions/ratings";

interface RatingStarsProps {
  resourceType: "resource" | "doc";
  resourceId: string;
  initialRating?: number;
  averageRating?: number;
  totalRatings?: number;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

export function RatingStars({
  resourceType,
  resourceId,
  initialRating = 0,
  averageRating,
  totalRatings,
  readonly = false,
  size = "md",
}: RatingStarsProps) {
  const { isAuthenticated } = useAuth();
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [isPending, startTransition] = useTransition();

  const handleRate = (value: number) => {
    if (readonly || !isAuthenticated) return;

    setRating(value);
    startTransition(async () => {
      await submitRating(resourceType, resourceId, value);
    });
  };

  const displayRating = hoverRating || rating || averageRating || 0;

  const sizeClasses = {
    sm: 14,
    md: 18,
    lg: 24,
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            onClick={() => handleRate(value)}
            onMouseEnter={() => !readonly && setHoverRating(value)}
            onMouseLeave={() => setHoverRating(0)}
            disabled={readonly || isPending}
            className={cn(
              "transition-colors duration-150",
              !readonly && "cursor-pointer hover:scale-110",
              readonly && "cursor-default"
            )}
          >
            <Star
              size={sizeClasses[size]}
              className={cn(
                value <= displayRating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300 dark:text-gray-600"
              )}
            />
          </button>
        ))}
      </div>
      {totalRatings !== undefined && (
        <span className="text-sm text-gray-500 ml-2">
          ({totalRatings})
        </span>
      )}
    </div>
  );
}
```

### 4.6 Tasks Checklist

- [ ] Create SignInModal component
- [ ] Create SignUpModal component
- [ ] Create UserMenu dropdown
- [ ] Create AuthGuard wrapper
- [ ] Create FavoriteButton component
- [ ] Create RatingStars component
- [ ] Create CommentSection component
- [ ] Create CollectionButton component
- [ ] Create user profile page `/profile`
- [ ] Create user settings page `/settings`
- [ ] Create collection page `/collections/[id]`
- [ ] Add interactions to resource cards
- [ ] Add interactions to doc pages
- [ ] Test all components with auth

---

## Phase 5: Editorial Workflow

**Duration:** 1 week
**Priority:** Medium
**Dependencies:** Phase 1 & 4

### 5.1 Suggest Edit Component

```typescript
"use client";

import { useState } from "react";
import { Edit3 } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { SuggestEditModal } from "./suggest-edit-modal";

interface SuggestEditButtonProps {
  targetType: "doc" | "resource";
  targetId: string;
  targetUrl: string;
  currentContent?: string;
}

export function SuggestEditButton({
  targetType,
  targetId,
  targetUrl,
  currentContent,
}: SuggestEditButtonProps) {
  const { isAuthenticated, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5",
          "text-sm text-gray-500 hover:text-blue-600",
          "rounded-md hover:bg-gray-100 dark:hover:bg-gray-800",
          "transition-colors duration-200"
        )}
      >
        <Edit3 size={14} />
        Suggest Edit
      </button>

      <SuggestEditModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        targetType={targetType}
        targetId={targetId}
        targetUrl={targetUrl}
        currentContent={currentContent}
        isAuthenticated={isAuthenticated}
        user={user}
      />
    </>
  );
}
```

### 5.2 Moderation Queue View

The moderation queue is handled in Payload CMS admin panel with the EditSuggestions collection created in Phase 1.

### 5.3 Tasks Checklist

- [ ] Create SuggestEditButton component
- [ ] Create SuggestEditModal component
- [ ] Create API endpoint for submissions
- [ ] Add button to all doc pages
- [ ] Add button to resource cards
- [ ] Configure email notifications for moderators
- [ ] Create moderation dashboard widgets
- [ ] Test full workflow: submit → review → approve/reject

---

## Phase 6: Advanced Features

**Duration:** 2 weeks
**Priority:** Low (Future)
**Dependencies:** All previous phases

### 6.1 Beta Tester Program

- Feature flags system
- Early access to new features
- Feedback collection
- Beta tester dashboard

### 6.2 Gamification

- Badges for contributions
- Reputation system
- Leaderboards
- Achievement unlocks

### 6.3 Notifications

- Email notifications
- Browser push notifications
- In-app notification center
- Digest emails

### 6.4 Analytics Dashboard

- Personal stats
- Content engagement metrics
- Contribution tracking
- Activity trends

---

## Database Schema (Visual)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SCHEMA: auth                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  users                    │  sessions                 │  accounts           │
│  ────────                 │  ──────────               │  ──────────         │
│  id (uuid) PK             │  id (uuid) PK             │  id (uuid) PK       │
│  email                    │  user_id FK→users         │  user_id FK→users   │
│  email_verified           │  expires_at               │  provider           │
│  created_at               │  token                    │  provider_id        │
│  updated_at               │  created_at               │  access_token       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              SCHEMA: public                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  profiles                                                                   │
│  ──────────                                                                 │
│  id (uuid) PK FK→auth.users                                                │
│  display_name                                                               │
│  bio                                                                        │
│  avatar_url                                                                 │
│  is_beta_tester                                                             │
│  created_at                                                                 │
│                                                                             │
│  ┌───────────────┐     ┌───────────────┐     ┌────────────────────────┐   │
│  │  favorites    │     │   ratings     │     │      comments          │   │
│  │  ───────────  │     │   ─────────   │     │      ──────────        │   │
│  │  id PK        │     │   id PK       │     │      id PK             │   │
│  │  user_id FK   │     │   user_id FK  │     │      user_id FK        │   │
│  │  resource_type│     │   resource_type│    │      resource_type     │   │
│  │  resource_id  │     │   resource_id │     │      resource_id       │   │
│  │  created_at   │     │   rating 1-5  │     │      parent_id FK      │   │
│  └───────────────┘     │   created_at  │     │      content           │   │
│                        └───────────────┘     │      status            │   │
│                                              │      upvotes           │   │
│  ┌───────────────┐     ┌───────────────┐     │      downvotes         │   │
│  │  collections  │     │collection_items│    └────────────────────────┘   │
│  │  ───────────  │     │───────────────│                                  │
│  │  id PK        │────▶│  id PK        │     ┌────────────────────────┐   │
│  │  user_id FK   │     │  collection_id│     │    comment_votes       │   │
│  │  name         │     │  resource_type│     │    ──────────────      │   │
│  │  is_public    │     │  resource_id  │     │    id PK               │   │
│  │  item_count   │     │  notes        │     │    user_id FK          │   │
│  └───────────────┘     │  position     │     │    comment_id FK       │   │
│                        └───────────────┘     │    vote_type up/down   │   │
│                                              └────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              SCHEMA: payload                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  users (CMS)              │  edit_suggestions         │  media              │
│  ──────────               │  ─────────────────        │  ───────            │
│  id PK                    │  id PK                    │  id PK              │
│  email                    │  title                    │  filename           │
│  name                     │  target_type              │  mime_type          │
│  role (admin/editor/...)  │  target_id                │  url                │
│  permissions              │  suggested_content        │  alt                │
│  created_at               │  status                   │  sizes              │
│                           │  submitted_by             │                     │
│                           │  reviewed_by FK→users     │                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Authentication (Better Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/sign-up` | Create account |
| POST | `/api/auth/sign-in` | Sign in |
| POST | `/api/auth/sign-out` | Sign out |
| GET | `/api/auth/session` | Get current session |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password |
| GET | `/api/auth/callback/:provider` | OAuth callback |

### User Data (Next.js API Routes)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/profile` | Get own profile |
| PATCH | `/api/user/profile` | Update profile |
| GET | `/api/user/favorites` | Get favorites |
| POST | `/api/user/favorites` | Add favorite |
| DELETE | `/api/user/favorites/:id` | Remove favorite |
| GET | `/api/user/ratings` | Get ratings |
| POST | `/api/user/ratings` | Submit rating |
| GET | `/api/user/collections` | Get collections |
| POST | `/api/user/collections` | Create collection |
| PATCH | `/api/user/collections/:id` | Update collection |
| DELETE | `/api/user/collections/:id` | Delete collection |
| POST | `/api/user/collections/:id/items` | Add item to collection |
| DELETE | `/api/user/collections/:id/items/:itemId` | Remove item |

### Comments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/comments` | Get comments for resource |
| POST | `/api/comments` | Create comment |
| PATCH | `/api/comments/:id` | Edit comment |
| DELETE | `/api/comments/:id` | Delete comment |
| POST | `/api/comments/:id/vote` | Vote on comment |

### Edit Suggestions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/suggestions` | Submit suggestion |
| GET | `/api/suggestions/mine` | Get own suggestions |

---

## Security Considerations

### Authentication Security

- [x] JWT tokens with short expiration
- [x] HTTP-only cookies for session
- [x] CSRF protection via SameSite cookies
- [x] Rate limiting on auth endpoints
- [x] Password hashing with bcrypt
- [x] Email verification required
- [ ] 2FA available (optional)

### Data Security

- [x] Row Level Security on all user data
- [x] Input validation with Zod
- [x] SQL injection prevention (parameterized queries)
- [x] XSS prevention (React escaping + CSP)
- [ ] Regular security audits

### API Security

- [x] Authentication required for mutations
- [x] Rate limiting per IP/user
- [x] Request size limits
- [x] CORS configuration
- [ ] API key rotation for third-party services

---

## Testing Strategy

### Unit Tests

- Auth flows (sign up, sign in, sign out)
- RLS policies (positive and negative cases)
- Component rendering
- Hook behavior

### Integration Tests

- Full user journeys
- API endpoint responses
- Database operations

### E2E Tests

- Sign up → verify email → sign in
- Add favorite → view in profile
- Submit edit → moderator review → approval
- Create collection → add items → share

---

## Deployment Checklist

### Pre-Deployment

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] OAuth apps configured (GitHub, Google)
- [ ] Resend email domain verified
- [ ] RLS policies tested
- [ ] Security headers configured

### Deployment

- [ ] Deploy to Vercel
- [ ] Verify OAuth callbacks
- [ ] Test email sending
- [ ] Test all auth flows
- [ ] Monitor error rates

### Post-Deployment

- [ ] Set up monitoring alerts
- [ ] Create admin accounts
- [ ] Document rollback procedure
- [ ] Schedule security review

---

## Future Enhancements

### Short-term (v1.1)

- Email digest of activity
- Export data feature
- Improved search with user context
- Reading history

### Medium-term (v1.2)

- Teams/Organizations
- Shared collections
- @mentions in comments
- Markdown in comments

### Long-term (v2.0)

- API for third-party apps
- Mobile app (React Native)
- Real-time collaboration
- AI-powered recommendations

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-12 | Initial plan |

---

## References

- [Better Auth Documentation](https://www.better-auth.com/docs)
- [Payload CMS Access Control](https://payloadcms.com/docs/access-control/overview)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Next.js Authentication Patterns](https://nextjs.org/docs/app/building-your-application/authentication)

---

**Document Author:** Vladimir Dukelic
**Contact:** vladimir@dukelic.com
**Repository:** https://github.com/siliconyouth/claude-insider
