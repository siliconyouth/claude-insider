#!/usr/bin/env node

/**
 * Generates project knowledge chunks from source documentation files
 * for the RAG (Retrieval-Augmented Generation) system.
 *
 * This script reads project files and generates detailed knowledge chunks
 * that help the AI Assistant answer questions about Claude Insider.
 *
 * Knowledge Categories (v0.83.0):
 * - Project Overview & Author
 * - Tech Stack (frameworks, libraries, versions)
 * - Documentation Structure
 * - User Features (auth, profile, gamification, messaging, API keys)
 * - Admin Features (dashboard, security, user management, diagnostics)
 * - Voice Assistant Capabilities
 * - Website Features (search, themes, i18n, code blocks)
 * - Resources Section
 * - Security System (fingerprinting, trust scores, honeypots)
 * - Claude Models Comparison
 * - CLAUDE.md Configuration Guide
 *
 * Run with: node scripts/generate-project-knowledge.cjs
 * Called automatically by generate-rag-index.cjs during prebuild
 *
 * Built with Claude Code powered by Claude Opus 4.5
 */

const fs = require("fs");
const path = require("path");

// ===========================================================================
// CONFIGURATION
// ===========================================================================

const VERBOSE = true; // Enable verbose logging

// Paths to source documentation files
const DOCS_ROOT = path.join(__dirname, "..", "..", "..");
const WEB_ROOT = path.join(__dirname, "..");

// ===========================================================================
// LOGGING UTILITIES
// ===========================================================================

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  if (!VERBOSE) return;
  console.log("");
  log(`${"─".repeat(60)}`, colors.dim);
  log(`  ${title}`, colors.cyan + colors.bright);
  log(`${"─".repeat(60)}`, colors.dim);
}

function logChunk(id, title, contentLength, keywords) {
  if (!VERBOSE) return;
  const keywordStr = keywords.slice(0, 5).join(", ");
  log(`  ✓ ${id}`, colors.green);
  log(`    Title: ${title}`, colors.dim);
  log(`    Content: ${contentLength} chars | Keywords: ${keywordStr}...`, colors.dim);
}

function logStats(stats) {
  console.log("");
  log(`${"═".repeat(60)}`, colors.cyan);
  log(`  PROJECT KNOWLEDGE GENERATION COMPLETE`, colors.cyan + colors.bright);
  log(`${"═".repeat(60)}`, colors.cyan);
  log(`  Total Chunks: ${stats.total}`, colors.green + colors.bright);
  log(`  Categories:`, colors.yellow);
  Object.entries(stats.byCategory).forEach(([cat, count]) => {
    log(`    - ${cat}: ${count}`, colors.dim);
  });
  log(`  Total Content: ${stats.totalChars.toLocaleString()} characters`, colors.blue);
  log(`  Total Keywords: ${stats.totalKeywords}`, colors.magenta);
  log(`${"═".repeat(60)}`, colors.cyan);
  console.log("");
}

// ===========================================================================
// FILE UTILITIES
// ===========================================================================

/**
 * Read a file safely, returning empty string if not found
 */
function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    if (VERBOSE) log(`  Warning: Could not read ${filePath}`, colors.yellow);
    return "";
  }
}

/**
 * Extract version from package.json
 */
function getVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(WEB_ROOT, "package.json"), "utf-8"));
    return pkg.version || "0.83.0";
  } catch {
    return "0.83.0";
  }
}

/**
 * Extract key sections from markdown content
 */
function extractSection(content, sectionName) {
  const regex = new RegExp(`## ${sectionName}[\\s\\S]*?(?=\\n## |$)`, "i");
  const match = content.match(regex);
  return match ? match[0].replace(/^## [^\n]+\n/, "").trim() : "";
}

/**
 * Extract version history entries from changelog
 */
function extractRecentVersions(changelog, count = 5) {
  const versionRegex = /## \[(\d+\.\d+\.\d+)\] - (\d{4}-\d{2}-\d{2})\n([\s\S]*?)(?=\n## \[|$)/g;
  const versions = [];
  let match;

  while ((match = versionRegex.exec(changelog)) !== null && versions.length < count) {
    versions.push({
      version: match[1],
      date: match[2],
      changes: match[3].trim().slice(0, 500)
    });
  }

  return versions;
}

// ===========================================================================
// KNOWLEDGE CHUNK DEFINITIONS
// ===========================================================================

/**
 * Generate project knowledge chunks from documentation files
 * Returns chunks that align with system-prompt.ts PROJECT_KNOWLEDGE_CHUNKS
 */
function generateProjectKnowledge() {
  logSection("GENERATING PROJECT KNOWLEDGE CHUNKS");
  log("  Built with Claude Code powered by Claude Opus 4.5", colors.magenta);

  // Read all source files
  const changelog = readFileSafe(path.join(DOCS_ROOT, "CHANGELOG.md"));
  const version = getVersion();
  const buildDate = new Date().toISOString().split("T")[0];

  const chunks = [];
  const stats = { total: 0, byCategory: {}, totalChars: 0, totalKeywords: 0 };

  function addChunk(chunk) {
    chunks.push(chunk);
    stats.total++;
    stats.byCategory[chunk.category] = (stats.byCategory[chunk.category] || 0) + 1;
    stats.totalChars += chunk.content.length;
    stats.totalKeywords += chunk.keywords.length;
    logChunk(chunk.id, chunk.title, chunk.content.length, chunk.keywords);
  }

  // ==========================================================================
  // CHUNK 1: Project Overview
  // ==========================================================================
  logSection("PROJECT CORE");

  addChunk({
    id: "project-overview",
    title: "About Claude Insider",
    section: "Project Overview",
    content: `Claude Insider is a comprehensive documentation website for Claude AI, Claude Code, and the Anthropic ecosystem. Version ${version} (${buildDate}). Built by Vladimir Dukelic (@siliconyouth) using Claude Code powered by Claude Opus 4.5. Live at https://www.claudeinsider.com. Repository at https://github.com/siliconyouth/claude-insider. The site features 34 documentation pages across 7 categories, a voice-powered AI assistant with 42 premium voices, fuzzy search with Cmd/Ctrl+K, dark/light themes, and WCAG 2.1 AA accessibility compliance. The site supports 18 languages. MIT License with Attribution.`,
    url: "/",
    category: "Project",
    keywords: ["claude insider", "documentation", "vladimir dukelic", "anthropic", "claude ai", "overview", "about"]
  });

  // ==========================================================================
  // CHUNK 2: Author & Attribution
  // ==========================================================================
  addChunk({
    id: "project-author",
    title: "About the Creator",
    section: "Vladimir Dukelic",
    content: `Claude Insider was created by Vladimir Dukelic, a developer based in Serbia. His GitHub profile is https://github.com/siliconyouth (username: @siliconyouth). Email: vladimir@dukelic.com. The entire project was built using Claude Code powered by Claude Opus 4.5, demonstrating the power of AI-assisted development. Vladimir built this as a comprehensive resource for the Claude AI community, providing documentation, tips, tutorials, and examples for working with Claude Code and the Anthropic API. MIT License with Attribution - when using this software or derivatives, you must link to the repository and credit Vladimir Dukelic.`,
    url: "/",
    category: "Project",
    keywords: ["vladimir dukelic", "creator", "author", "siliconyouth", "github", "serbia", "license"]
  });

  // ==========================================================================
  // CHUNK 3: Complete Tech Stack
  // ==========================================================================
  logSection("TECH STACK");

  addChunk({
    id: "project-tech-stack",
    title: "Technical Architecture",
    section: "Tech Stack",
    content: `Claude Insider is built with Next.js 16.0.10 using App Router, API Routes, Server Components, SSR, ISR. TypeScript 5.9.3 with strict mode. React 19.2.3 for UI. Tailwind CSS 4.1.5 with dark mode, glass morphism, violet-blue-cyan gradient system. Turborepo 2.6.3 for monorepo. pnpm 10.19.0 package manager. AI features use @anthropic-ai/sdk with Claude Sonnet 4 for the assistant. Voice uses ElevenLabs with 42 voices and eleven_turbo_v2_5 model. Search uses Fuse.js 7.1.0 for fuzzy search. RAG uses TF-IDF with 1,933 indexed chunks and 3,866 terms. Authentication via Better Auth 1.4.6 with OAuth, passkeys, 2FA. Database is Supabase 2.87.1 with PostgreSQL 15+, 73 tables across 13 categories, RLS. End-to-end encryption via Matrix Olm/Megolm protocol with vodozemac WASM. CMS is Payload CMS 3.68.3. Hosted on Vercel.`,
    url: "/",
    category: "Project",
    keywords: ["next.js", "typescript", "react", "tailwind", "turborepo", "anthropic", "elevenlabs", "vercel", "supabase", "better auth", "tech stack"]
  });

  // ==========================================================================
  // CHUNK 4: Documentation Structure
  // ==========================================================================
  logSection("DOCUMENTATION");

  addChunk({
    id: "project-documentation",
    title: "Documentation Structure",
    section: "Content Overview",
    content: `Claude Insider contains 34 documentation pages across 7 categories. Getting Started (5 pages): Installation, Quickstart, Troubleshooting, Migration guides for GitHub Copilot, Cursor, ChatGPT. Configuration (6 pages): CLAUDE.md guide, Settings, Environment variables, Permissions, Account Security. Tips & Tricks (5 pages): Prompting strategies, Productivity hacks, Advanced prompting, Debugging techniques. API Reference (7 pages): Authentication, Tool use, Streaming, Error handling, Rate limits, Models comparison. Integrations (7 pages): MCP Servers, IDE Plugins, Hooks, GitHub Actions, Docker, Databases. Tutorials (4 pages): Code review, Documentation generation, Test generation. Examples (2 pages): Real-world projects. Legal pages: Privacy Policy, Terms, Disclaimer, Accessibility. Utility pages: Changelog, RSS Feed, Sitemap, Resources, FAQ.`,
    url: "/docs",
    category: "Project",
    keywords: ["documentation", "getting started", "configuration", "api", "integrations", "tutorials", "examples", "categories"]
  });

  // ==========================================================================
  // CHUNK 5: Voice Assistant Capabilities
  // ==========================================================================
  logSection("VOICE ASSISTANT");

  addChunk({
    id: "project-assistant",
    title: "Voice Assistant Features",
    section: "AI Assistant",
    content: `The Claude Insider Assistant is powered by Claude Sonnet 4 (claude-sonnet-4-20250514) - NOT Opus, the website was built with Opus but the assistant runs on Sonnet for speed. Speech-to-text uses Web Speech API. Text-to-speech uses ElevenLabs Turbo v2.5 model with 42 premium voices (17 female, 25 male). Default voice is Sarah (soft, young female). Audio format is MP3 44100Hz 128kbps. Features include: Streaming responses with SSE, voice starts after first sentence for fast feedback, 42 voice options with preview, auto-speak toggle for hands-free use, conversation export, context-aware responses using RAG (1,933 chunks), model selection (Opus, Sonnet, Haiku), custom assistant name personalization, user name personalization. Available in unified chat window with tabs for AI Assistant and Messages. Settings in-window panel (not modal).`,
    url: "/assistant",
    category: "Project",
    keywords: ["voice assistant", "elevenlabs", "claude sonnet", "streaming", "tts", "speech", "sarah", "voices"]
  });

  // ==========================================================================
  // CHUNK 6: User Features
  // ==========================================================================
  logSection("USER FEATURES");

  addChunk({
    id: "project-user-features",
    title: "User Features",
    section: "User Experience",
    content: `Claude Insider offers extensive user features. Authentication via GitHub OAuth, Google OAuth, Email/Password, Magic Links. Security options: Passkeys/WebAuthn, Multi-device TOTP 2FA, Session management. Onboarding wizard: Profile setup, Avatar upload, Social links, Optional passkey/2FA setup. Profile customization: Display name, Username, Bio, Avatar, Social links, Privacy settings. Social features: Favorites (save pages for quick access), 1-5 star ratings, Threaded comments with voting, Custom collections, Follow other users. Messaging: Direct messages, Group chats up to 50 members, Typing indicators, Online presence, Message mentions, AI assistant @mentions, Group roles (Owner, Admin, Member).`,
    url: "/profile",
    category: "Project",
    keywords: ["authentication", "profile", "favorites", "comments", "messaging", "oauth", "passkeys", "2fa", "user features"]
  });

  // ==========================================================================
  // CHUNK 7: Gamification System
  // ==========================================================================
  addChunk({
    id: "project-gamification",
    title: "Achievement System",
    section: "Gamification",
    content: `Claude Insider includes a gamification system with 50+ achievements across 9 categories: Onboarding (account setup), Engagement (site interactions), Learning (reading docs), Social (follows, comments), Content (favorites, ratings), Streak (daily visits), Collector (collections), Expert (advanced tasks), Special (secret achievements). Rarities: Common (10-50 XP), Rare (75-150 XP), Epic (200-500 XP), Legendary (500-2500 XP). Effects: Confetti animations, Sound effects (Web Audio API), Glow animations, Achievement queue for multiple unlocks. Levels are calculated from total XP. Streaks track consecutive days. Stats dashboard shows all progress.`,
    url: "/profile",
    category: "Project",
    keywords: ["achievements", "gamification", "xp", "levels", "streaks", "badges", "rewards", "confetti"]
  });

  // ==========================================================================
  // CHUNK 8: API Keys (BYOK)
  // ==========================================================================
  addChunk({
    id: "project-api-keys",
    title: "API Key Management",
    section: "BYOK Feature",
    content: `Claude Insider supports Bring Your Own Key (BYOK) for AI features. Users can add their own Anthropic API key in Settings. Keys are encrypted with AES-256-GCM before storage. Features: Model selection (Opus 4, Sonnet 4, Haiku 3.5), Usage tracking, Credits display, Secure key preview (shows last 4 characters only). When using a custom key, users can access all Claude models directly. Without a key, the site uses the built-in Claude Sonnet 4 assistant with standard rate limits.`,
    url: "/settings",
    category: "Project",
    keywords: ["api keys", "byok", "anthropic", "encryption", "aes-256", "model selection", "credits"]
  });

  // ==========================================================================
  // CHUNK 9: Admin Features
  // ==========================================================================
  logSection("ADMIN FEATURES");

  addChunk({
    id: "project-admin-features",
    title: "Admin Dashboard",
    section: "Administration",
    content: `Claude Insider includes a comprehensive admin dashboard for moderators and administrators. Stats: User count, New users (week/month), Beta applications, Feedback count. Dashboard sections: Users, Beta Applications, Feedback, Suggestions, Security, Diagnostics. User management actions: View profiles, Change roles, Ban/unban users, Review reports. User roles hierarchy: User, Beta Tester, Editor, Moderator, Admin, Superadmin, AI Assistant. Superadmins have ultimate access including viewing private data, deleting anything, and managing other superadmins.`,
    url: "/dashboard",
    category: "Project",
    keywords: ["admin", "dashboard", "user management", "roles", "moderation", "ban", "superadmin"]
  });

  // ==========================================================================
  // CHUNK 10: Security System
  // ==========================================================================
  addChunk({
    id: "project-security",
    title: "Security System",
    section: "Security Features",
    content: `Claude Insider includes advanced security features. Browser fingerprinting via FingerprintJS 5.0.1 for visitor identification. Request correlation with nanoid 5.1.6 for tracing. Fake data generation with @faker-js/faker 10.1.0 for honeypots. Security dashboard pages: Overview (real-time stats, bot detections, trust score distribution), Analytics (bot trends, visitor patterns, protected routes), Logs (searchable security event log with filters), Visitors (fingerprint browser with trust scores, block/unblock), Honeypots (configure routes, response types: fake_data, delay, redirect, block), Settings (thresholds, rate limits, auto-block rules). Trust score 0-100, auto-blocking after repeated violations.`,
    url: "/dashboard/security",
    category: "Project",
    keywords: ["security", "fingerprint", "bot detection", "honeypot", "trust score", "rate limiting", "visitor tracking"]
  });

  // ==========================================================================
  // CHUNK 11: Diagnostics System
  // ==========================================================================
  addChunk({
    id: "project-diagnostics",
    title: "System Diagnostics",
    section: "Diagnostics",
    content: `Claude Insider includes a diagnostics page with 17 test suites for troubleshooting: Environment Variables, Supabase Admin Client, Direct PostgreSQL Pool, RLS Status, Auth Session, Dashboard Users API, Sound Effects System, Achievement System, Fingerprint Provider, Security Logger, Trust Score Calculator, Honeypot System, Request ID Generation, Fingerprint Caching, Realtime Subscription, Activity Feed Loading, Log Search. Features: TEST ALL button to run everything, AI-powered analysis of failures, Auto console capture for debugging, Claude Code fix prompts with copy-paste commands, Individual test re-run capability.`,
    url: "/dashboard/diagnostics",
    category: "Project",
    keywords: ["diagnostics", "testing", "troubleshooting", "debug", "supabase", "environment", "health check"]
  });

  // ==========================================================================
  // CHUNK 12: Website Features
  // ==========================================================================
  logSection("WEBSITE FEATURES");

  addChunk({
    id: "project-features",
    title: "Website Features",
    section: "Features Overview",
    content: `Claude Insider features: Search with Cmd/Ctrl+K or search button using Fuse.js fuzzy search. Modes: Quick Search (instant results) and AI Search (conversational). Recent search history, Category filtering, Keyboard navigation. Themes: Dark (default), Light, System with localStorage persistence. Design uses Vercel-inspired blacks (#0a0a0a, #111111, #1a1a1a) with violet-blue-cyan gradients. Code blocks support 33 languages with highlight.js: JavaScript, TypeScript, Python, Shell, JSON, YAML, Go, Rust, Java, and more. Features copy button and language badges. WCAG 2.1 AA accessibility: Skip links, ARIA labels, Keyboard navigation, Screen reader support, Focus trapping. Sound effects for notifications, feedback, UI, chat, achievements using Web Audio API (no audio files).`,
    url: "/",
    category: "Project",
    keywords: ["search", "themes", "accessibility", "code highlighting", "sound effects", "dark mode", "wcag"]
  });

  // ==========================================================================
  // CHUNK 13: Internationalization
  // ==========================================================================
  addChunk({
    id: "project-i18n",
    title: "Internationalization",
    section: "Languages",
    content: `Claude Insider supports 18 languages organized by region. Americas: English (en), Spanish (es), Portuguese (pt). Europe: French (fr), German (de), Italian (it), Dutch (nl), Polish (pl), Swedish (sv), Norwegian (no), Danish (da), Finnish (fi), Greek (el), Serbian (sr), Russian (ru). Asia: Japanese (ja), Chinese (zh), Korean (ko). Language selection in footer. Locale detection via NEXT_LOCALE cookie or browser Accept-Language header. Translations managed via i18n/messages/*.json files and Payload CMS Translations collection. Uses next-intl for React integration.`,
    url: "/",
    category: "Project",
    keywords: ["i18n", "languages", "translations", "international", "localization", "multilingual"]
  });

  // ==========================================================================
  // CHUNK 14: Resources Section
  // ==========================================================================
  logSection("RESOURCES");

  addChunk({
    id: "project-resources",
    title: "Curated Resources",
    section: "Resources Section",
    content: `Claude Insider curates 122+ resources across 10 categories at /resources. Categories: Official (Anthropic docs, SDKs, console), Tools (CLI utilities, development aids), MCP Servers (database, API, filesystem servers), Rules (CLAUDE.md templates, best practices), Prompts (system prompts library), Agents (agent frameworks, multi-agent systems), Tutorials (video courses, guides, workshops), SDKs (Python, TypeScript, Go, Rust, Java, Ruby libraries), Showcases (example projects, demos), Community (forums, Discord, Reddit, newsletters). Features: Full-text search with weighted fields, Category and tag filtering, GitHub integration (stars, forks, language), Status badges (stable/beta/experimental), Difficulty levels (beginner/intermediate/advanced), Featured resources on homepage.`,
    url: "/resources",
    category: "Project",
    keywords: ["resources", "tools", "mcp servers", "sdks", "tutorials", "agents", "community", "prompts"]
  });

  // ==========================================================================
  // CHUNK 15: Claude Models Comparison
  // ==========================================================================
  logSection("CLAUDE AI KNOWLEDGE");

  addChunk({
    id: "claude-models",
    title: "Claude Model Comparison",
    section: "AI Models",
    content: `Claude offers three main model families. Claude Opus 4 (claude-opus-4-20250514): Most capable, best for complex reasoning, analysis, creative work. $15/M input, $75/M output. 200K context. Ideal for research, writing, code architecture. Claude Sonnet 4 (claude-sonnet-4-20250514): Balanced choice, excellent for coding, general purpose. $3/M input, $15/M output. 200K context. This powers the Claude Insider assistant - fast and capable. Claude 3.5 Haiku (claude-3-5-haiku-20241022): Fastest and cheapest, good for simple tasks, high volume. $0.25/M input, $1.25/M output. 200K context. All models support: Tool use (function calling), Streaming responses, Vision (image understanding), System prompts. Choose based on complexity needs and budget.`,
    url: "/docs/api/models",
    category: "API",
    keywords: ["opus", "sonnet", "haiku", "models", "pricing", "comparison", "tokens", "context window", "tool use"]
  });

  // ==========================================================================
  // CHUNK 16: CLAUDE.md Configuration
  // ==========================================================================
  addChunk({
    id: "claude-md-guide",
    title: "CLAUDE.md Configuration",
    section: "Configuration Guide",
    content: `The CLAUDE.md file is the primary way to give Claude Code context about your project. Locations (precedence order): Directory-specific (highest), Project root (most common), ~/.claude/CLAUDE.md (global, lowest). Key sections to include: Project Overview (name, purpose, status), Tech Stack (frameworks, versions, tools), Project Structure (directories, important files), Coding Conventions (style guide, patterns, naming), Common Tasks (build, test, deploy commands), Environment Variables (required secrets, configs). Benefits: Reduce repetition across sessions, Ensure consistent behavior, Speed up workflows with context, Improve accuracy of suggestions. Claude automatically reads CLAUDE.md at session start. Max recommended size: 2000 lines. Use markdown headings for organization.`,
    url: "/docs/configuration/claude-md",
    category: "Configuration",
    keywords: ["claude.md", "configuration", "project context", "conventions", "settings", "guidelines"]
  });

  // ==========================================================================
  // CHUNK 17: MCP Servers
  // ==========================================================================
  addChunk({
    id: "mcp-servers",
    title: "MCP Server Integration",
    section: "Model Context Protocol",
    content: `MCP (Model Context Protocol) extends Claude with external tools and data sources. Official servers: Filesystem (file operations), PostgreSQL (database queries), SQLite (local databases), GitHub (repos, issues, PRs), Slack (messages, channels), Google Drive (docs, sheets), Brave Search (web search). Configuration in claude_desktop_config.json or via Claude Code settings. Server types: stdio (local process), SSE (HTTP streaming). Each server provides: Tools (callable functions), Resources (readable data), Prompts (reusable templates). Benefits: Access private data, Run local commands, Query databases, Integrate with services. See /docs/integrations/mcp-servers for setup guides and examples.`,
    url: "/docs/integrations/mcp-servers",
    category: "Integrations",
    keywords: ["mcp", "model context protocol", "servers", "tools", "resources", "filesystem", "database", "github"]
  });

  // ==========================================================================
  // CHUNK 18: Version History
  // ==========================================================================
  logSection("VERSION HISTORY");

  const recentVersions = extractRecentVersions(changelog, 5);
  const versionSummary = recentVersions.map(v =>
    `v${v.version} (${v.date}): ${v.changes.split('\n')[0].replace(/^### /, '').replace(/^- /, '')}`
  ).join('\n');

  addChunk({
    id: "project-versions",
    title: "Version History",
    section: "Recent Updates",
    content: `Claude Insider version history. Current: v${version} (${buildDate}).

Recent Releases:
${versionSummary || "See CHANGELOG.md for full history"}

Major Milestones:
- v0.82.0 - Unified Chat Window (AI + Messages in tabbed interface)
- v0.81.0 - RAG Index Generator v6.0 (1,933 chunks, 20 knowledge categories)
- v0.80.0 - Zero ESLint warnings, TypeScript type safety improvements
- v0.79.0 - Security dashboard, fingerprinting, honeypot system
- v0.70.x - Achievements, gamification, XP system
- v0.60.x - Messaging, group chats, AI mentions
- v0.50.x - Authentication, Better Auth, passkeys
- v0.40.x - User profiles, favorites, ratings, comments
- v0.30.x - Resources section with 122+ curated entries
- v0.20.x - Voice assistant, ElevenLabs TTS, 42 voices
- v0.10.x - Initial release, documentation, search

Full changelog at /changelog or CHANGELOG.md`,
    url: "/changelog",
    category: "Project",
    keywords: ["version", "history", "changelog", "updates", "releases", "milestones"]
  });

  // ==========================================================================
  // CHUNK 19: Development Guidelines
  // ==========================================================================
  logSection("DEVELOPMENT");

  addChunk({
    id: "project-development",
    title: "Development Guidelines",
    section: "Contributing",
    content: `Guidelines for developing Claude Insider. Prerequisites: Node.js 18+ LTS, pnpm 9+, Git 2.x. Getting Started: Clone repo, pnpm install, pnpm dev (localhost:3001), pnpm build, pnpm lint, pnpm check-types. Code Style: TypeScript strict mode, explicit types. Components: Functional with hooks, named exports. Styling: Tailwind CSS only, use cn() utility. Files: PascalCase components, camelCase utilities. Pages: lowercase-with-hyphens. Design System: Dark-first with Vercel blacks (#0a0a0a, #111111). Gradients: violet-600 via blue-600 to cyan-600. PROHIBITED: orange-*, amber-*, yellow-* for accents (old design). Adding Documentation: Create MDX in content/[category]/, add frontmatter, update search index, add ContentMeta component, run pnpm build.`,
    url: "/",
    category: "Project",
    keywords: ["development", "contributing", "guidelines", "code style", "design system", "setup", "typescript"]
  });

  // ==========================================================================
  // CHUNK 20: Deployment Configuration
  // ==========================================================================
  addChunk({
    id: "project-deployment",
    title: "Deployment Configuration",
    section: "Vercel Deployment",
    content: `Claude Insider is deployed on Vercel. Settings: Root Directory apps/web, Framework Next.js (auto-detected). Primary domain: www.claudeinsider.com. Redirects: claudeinsider.com, claude-insider.com, www.claude-insider.com, claude-insider.vercel.app all redirect to www.claudeinsider.com. Environment Variables: ANTHROPIC_API_KEY (Claude AI), ELEVENLABS_API_KEY (TTS), BETTER_AUTH_SECRET (auth), GITHUB_CLIENT_ID/SECRET (OAuth), GOOGLE_CLIENT_ID/SECRET (OAuth), NEXT_PUBLIC_SUPABASE_URL/ANON_KEY (database), DATABASE_URL (PostgreSQL), NEXT_PUBLIC_APP_URL. Build Process: Prebuild generates RAG index (1,933 chunks, 3,866 terms), Next.js builds with static generation, Edge deployment via Vercel CDN. Automatic deployments: main branch to production, PRs to preview.`,
    url: "/",
    category: "Project",
    keywords: ["deployment", "vercel", "hosting", "domains", "configuration", "environment", "build", "cdn"]
  });

  // Print final stats
  logStats(stats);

  return chunks;
}

// ===========================================================================
// MAIN EXECUTION
// ===========================================================================

module.exports = { generateProjectKnowledge };

// Run directly if called as main script
if (require.main === module) {
  log("\n🚀 Starting Project Knowledge Generation", colors.cyan + colors.bright);
  log("   Built with Claude Code powered by Claude Opus 4.5\n", colors.magenta);

  const chunks = generateProjectKnowledge();

  // Output JSON when run directly (for debugging)
  // console.log(JSON.stringify(chunks, null, 2));
}
