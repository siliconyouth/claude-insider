# Interactive Prompt Builder - Strategic Plan

## Executive Summary

Transform the Prompt Library from a static copy-paste repository into an **intelligent, interactive prompt creation experience** that guides users through filling variables, suggests values, and produces optimized final prompts ready for Claude.

---

## Current State Analysis

### What We Have
| Component | Purpose | Location |
|-----------|---------|----------|
| `VariableInputModal` | Simple form for variable filling | `components/prompts/variable-input-modal.tsx` |
| `UseWithAssistantButton` | Opens AI chat with prompt | `components/prompts/use-with-assistant-button.tsx` |
| Variables Schema | `{name, description, default_value, required}` | JSONB in `prompts` table |
| Claude Hints | Optimization metadata | `prompt_claude_hints` table |

### Current User Journey
```
1. Browse prompts → 2. Click "Use with AI" → 3. Fill form fields → 4. Submit → 5. Chat opens
```

### Pain Points
1. **No guidance**: Users don't know what values work best
2. **No context**: Prompts don't adapt to user's actual needs
3. **No preview**: Can't see final prompt before using
4. **No iteration**: Hard to refine based on results
5. **No sharing**: Can't share filled/customized prompts
6. **One-size-fits-all**: Same prompt for different use cases

---

## Strategic Options

### Option A: Enhanced Variable Modal (Quick Win)
**Effort:** 1-2 weeks | **Impact:** Medium

Improve the existing modal with smart features:

```
┌─────────────────────────────────────────────────┐
│  Fill Variables for "Code Review Prompt"        │
├─────────────────────────────────────────────────┤
│  Programming Language *                         │
│  ┌─────────────────────────────────────┐       │
│  │ Python                          ▼   │       │
│  └─────────────────────────────────────┘       │
│  💡 Suggestions: Python, JavaScript, TypeScript │
│                                                 │
│  Code Context *                                 │
│  ┌─────────────────────────────────────┐       │
│  │                                     │       │
│  │                                     │       │
│  └─────────────────────────────────────┘       │
│  ✨ AI: "Paste your code or describe it"       │
│                                                 │
│  ┌─ Preview ──────────────────────────────┐    │
│  │ Review this Python code focusing on... │    │
│  └────────────────────────────────────────┘    │
│                                                 │
│              [Cancel]  [Use with AI ✨]         │
└─────────────────────────────────────────────────┘
```

**Features:**
- Dropdown suggestions for common values
- AI-generated hints per field
- Live preview panel
- Auto-detect from clipboard/context
- Recent values history

**Pros:** Quick to build, works with existing prompts
**Cons:** Still form-based, limited interactivity

---

### Option B: Interactive Prompt Builder (Wizard Mode)
**Effort:** 3-4 weeks | **Impact:** High

Multi-step guided experience:

```
Step 1/4 ─────────────────────────────────────────

  What's your goal?

  ○ I want to review code for bugs
  ○ I want to improve code quality
  ○ I want to optimize performance
  ○ I want security review
  ○ Something else...

                           [← Back]  [Next →]

Step 2/4 ─────────────────────────────────────────

  What programming language?

  [Detect from code]  or select:

  ● Python        ○ JavaScript
  ○ TypeScript    ○ Go
  ○ Rust          ○ Other: [______]

                           [← Back]  [Next →]

Step 3/4 ─────────────────────────────────────────

  Paste or describe your code:

  ┌─────────────────────────────────────────┐
  │                                         │
  │                                         │
  │                                         │
  └─────────────────────────────────────────┘

  [📎 Upload file]  [📋 Paste from clipboard]

                           [← Back]  [Next →]

Step 4/4 ─────────────────────────────────────────

  ✅ Your prompt is ready!

  ┌─────────────────────────────────────────┐
  │ Review this Python code for bugs and    │
  │ security vulnerabilities:               │
  │                                         │
  │ ```python                               │
  │ def process_user_input(data):           │
  │     ...                                 │
  │ ```                                     │
  └─────────────────────────────────────────┘

  [✏️ Edit manually]  [🔄 Start over]

  [Copy]  [Save as template]  [Use with AI ✨]
```

**Features:**
- Goal-based flow
- Smart question ordering (most important first)
- Skip irrelevant questions
- Progress indicator
- Ability to go back and change
- Final preview with edit option
- Save as personal template

**Pros:** Excellent UX for complex prompts, naturally guides users
**Cons:** More steps, may feel slow for power users

---

### Option C: Chat-Based Builder (Conversational AI)
**Effort:** 4-5 weeks | **Impact:** Very High

AI assistant that interviews the user:

```
┌─────────────────────────────────────────────────┐
│  🤖 Prompt Builder                              │
├─────────────────────────────────────────────────┤
│                                                 │
│  You selected "Code Review Prompt"              │
│                                                 │
│  ┌─────────────────────────────────────┐       │
│  │ I'll help you customize this prompt │       │
│  │ for your needs. A few questions:    │       │
│  │                                      │       │
│  │ What language is your code in?       │       │
│  └─────────────────────────────────────┘       │
│                                                 │
│  ○ Python                                       │
│  ○ JavaScript                                   │
│  ○ TypeScript                                   │
│  ○ Other (type below)                           │
│                                                 │
│  ┌─────────────────────────────────────┐       │
│  │ Python                              │       │
│  └─────────────────────────────────────┘       │
│                                                 │
│  ┌─────────────────────────────────────┐       │
│  │ Great! What aspect should I focus   │       │
│  │ on?                                  │       │
│  │                                      │       │
│  │ • Security vulnerabilities           │       │
│  │ • Performance issues                 │       │
│  │ • Code style & best practices        │       │
│  │ • All of the above                   │       │
│  └─────────────────────────────────────┘       │
│                                                 │
│  [Type a message...]            [Send]         │
└─────────────────────────────────────────────────┘
```

**Features:**
- Natural conversation flow
- AI understands context and asks relevant follow-ups
- Can paste code and AI extracts info
- Handles ambiguity gracefully
- Shows reasoning ("I noticed you mentioned X, should I focus on that?")
- Final confirmation before generating

**Pros:** Most natural, handles edge cases, learns from context
**Cons:** Requires API calls, may be slower, less predictable

---

### Option D: Prompt Playground (Power Users)
**Effort:** 4-5 weeks | **Impact:** High (for advanced users)

Full editing environment:

```
┌──────────────────────────────────────────────────────────────┐
│  Prompt Playground                    [Save] [Share] [Fork]  │
├────────────────────────┬─────────────────────────────────────┤
│ Variables              │  Editor                              │
│ ──────────────         │  ────────                            │
│ language: [Python  ▼]  │  You are an expert {{language}}      │
│ focus: [security   ▼]  │  developer. Review the following     │
│ code: [...........   ] │  code for {{focus}} issues:          │
│                        │                                      │
│ + Add variable         │  ```{{language}}                     │
│                        │  {{code}}                            │
│ Claude Hints           │  ```                                 │
│ ──────────────         │                                      │
│ ✓ XML tags             │  Provide:                            │
│ ✓ Examples             │  1. Issues found                     │
│ ○ Chain of thought     │  2. Severity ratings                 │
│                        │  3. Fix suggestions                  │
│ Optimization: 85%      │                                      │
├────────────────────────┼─────────────────────────────────────┤
│ Preview                │  Version History                     │
│ ───────                │  ───────────────                     │
│ You are an expert      │  v3 - Added severity ratings (now)   │
│ Python developer...    │  v2 - Changed focus to security      │
│                        │  v1 - Original template              │
│ [Copy] [Use with AI]   │  [Restore v1]                        │
└────────────────────────┴─────────────────────────────────────┘
```

**Features:**
- Split-pane editor
- Live preview
- Variable sidebar
- Syntax highlighting for `{{variables}}`
- Claude hints editor
- Version history
- Fork from any prompt
- Share permalink
- Export to JSON/Markdown

**Pros:** Maximum flexibility, power users love it
**Cons:** Intimidating, complex, long development

---

### Option E: Hybrid Approach (RECOMMENDED)
**Effort:** 6-8 weeks | **Impact:** Maximum

Combine all modes with smart defaults:

```
┌─────────────────────────────────────────────────┐
│  How do you want to use this prompt?            │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │  ⚡ Quick Mode                            │  │
│  │  Fill in the blanks and go               │  │
│  │  Best for: Simple prompts, repeat use    │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │  🎯 Guided Mode                           │  │
│  │  Step-by-step wizard                      │  │
│  │  Best for: Complex prompts, first time   │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │  💬 Chat Mode                             │  │
│  │  AI helps you build the perfect prompt   │  │
│  │  Best for: Exploration, customization    │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │  🛠️ Playground                            │  │
│  │  Full editor with preview                │  │
│  │  Best for: Power users, forking          │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  □ Remember my preference                       │
└─────────────────────────────────────────────────┘
```

**Smart Mode Selection:**
- Simple prompts (0-2 variables) → Default to Quick Mode
- Complex prompts (3+ variables) → Suggest Guided Mode
- User preference saved → Skip this screen
- Power users can always access Playground

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Option A implementation**

1. Enhanced Variable Modal
   - Add suggestions dropdown (common values)
   - Add live preview panel
   - Add recent values history (localStorage)
   - Add "paste from clipboard" detection

2. Database additions:
   ```sql
   -- Add to prompt_variables schema
   ALTER TABLE prompts
   ADD COLUMN IF NOT EXISTS variable_metadata JSONB DEFAULT '[]';

   -- Structure: [{name, type, suggestions[], examples[], validation}]
   ```

3. New files:
   - `components/prompts/enhanced-variable-modal.tsx`
   - `components/prompts/variable-suggestions.tsx`
   - `components/prompts/prompt-preview.tsx`

### Phase 2: Guided Mode (Week 3-4)
**Option B implementation**

1. Wizard component system:
   - `components/prompts/builder/wizard-container.tsx`
   - `components/prompts/builder/goal-step.tsx`
   - `components/prompts/builder/variable-step.tsx`
   - `components/prompts/builder/preview-step.tsx`

2. Smart question ordering:
   - Analyze variable dependencies
   - Group related variables
   - Skip irrelevant questions

3. Page route:
   - `/prompts/[slug]/builder` → Guided builder

### Phase 3: Chat Mode (Week 5-6)
**Option C implementation**

1. Chat-based builder:
   - `components/prompts/builder/chat-builder.tsx`
   - `app/api/prompts/builder/chat/route.ts`

2. AI integration:
   - System prompt for prompt-building assistance
   - Context-aware questioning
   - Final prompt generation

3. Features:
   - Quick response options (buttons)
   - Code paste detection
   - Undo/redo in conversation

### Phase 4: Playground (Week 7-8)
**Option D implementation**

1. Editor environment:
   - `components/prompts/playground/playground-editor.tsx`
   - `components/prompts/playground/variable-sidebar.tsx`
   - `components/prompts/playground/preview-pane.tsx`
   - `components/prompts/playground/version-history.tsx`

2. Features:
   - Monaco editor integration
   - Split-pane layout
   - Fork functionality
   - Share permalinks

3. Page route:
   - `/prompts/playground?id={promptId}`
   - `/prompts/playground/new` → Create from scratch

### Phase 5: Polish & Integration (Week 9)
1. Mode selector UI
2. User preferences
3. Analytics tracking
4. Documentation
5. Migration of existing prompts

---

## Database Schema Additions

```sql
-- Enhanced variable metadata
CREATE TABLE IF NOT EXISTS prompt_variable_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  variable_name TEXT NOT NULL,

  -- Type and validation
  input_type TEXT DEFAULT 'text', -- text, textarea, select, code, number
  validation_regex TEXT,
  min_length INTEGER,
  max_length INTEGER,

  -- Suggestions and examples
  suggestions JSONB DEFAULT '[]', -- ["Python", "JavaScript", ...]
  examples JSONB DEFAULT '[]', -- [{value, description}, ...]
  ai_suggestion_prompt TEXT, -- "Suggest a programming language based on..."

  -- Display
  display_order INTEGER DEFAULT 0,
  group_name TEXT, -- Group related variables
  placeholder TEXT,
  help_text TEXT,

  -- Smart features
  detect_from_clipboard BOOLEAN DEFAULT false,
  detect_from_context BOOLEAN DEFAULT false,
  dependent_on TEXT, -- Another variable name

  UNIQUE(prompt_id, variable_name)
);

-- User's filled prompts (for sharing and history)
CREATE TABLE IF NOT EXISTS prompt_fills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES "user"(id) ON DELETE SET NULL,

  -- Filled content
  variable_values JSONB NOT NULL, -- {variable_name: value}
  final_content TEXT NOT NULL,

  -- Sharing
  share_token TEXT UNIQUE, -- For shareable links
  is_public BOOLEAN DEFAULT false,

  -- Metadata
  title TEXT, -- User's custom title
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_prompt_fills_user ON prompt_fills(user_id);
CREATE INDEX idx_prompt_fills_prompt ON prompt_fills(prompt_id);
CREATE INDEX idx_prompt_fills_share ON prompt_fills(share_token) WHERE share_token IS NOT NULL;
```

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/prompts/builder/suggest` | POST | AI suggestions for variables |
| `/api/prompts/builder/chat` | POST | Chat-based builder conversation |
| `/api/prompts/builder/preview` | POST | Generate preview with filled variables |
| `/api/prompts/fills` | GET/POST | List/create filled prompts |
| `/api/prompts/fills/[id]` | GET/PATCH/DELETE | Manage filled prompt |
| `/api/prompts/fills/[id]/share` | POST | Generate share link |
| `/api/prompts/share/[token]` | GET | Get shared filled prompt |

---

## New Page Routes

| Route | Purpose |
|-------|---------|
| `/prompts/[slug]/build` | Interactive builder (mode selector) |
| `/prompts/[slug]/build/quick` | Quick mode |
| `/prompts/[slug]/build/guided` | Guided wizard |
| `/prompts/[slug]/build/chat` | Chat-based builder |
| `/prompts/playground` | Full playground editor |
| `/prompts/playground/new` | Create new from scratch |
| `/prompts/share/[token]` | View shared filled prompt |
| `/my-prompts` | User's saved and filled prompts |

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Prompt completion rate | ~40% (guess) | 80%+ |
| Time to first use | ~2 min | < 30 sec |
| Prompt copies per user | 1.5 | 5+ |
| Return usage | 20% | 60%+ |
| Shared prompts | 0 | 10% of fills |

---

## Recommendation

**Start with Phase 1 (Enhanced Modal)** - delivers quick value with minimal effort.

Then evaluate based on user feedback:
- High engagement → Continue to Phase 2 (Guided Mode)
- Users want more AI help → Prioritize Phase 3 (Chat Mode)
- Power users requesting → Add Phase 4 (Playground)

This iterative approach reduces risk while delivering continuous improvements.

---

## Questions for You

1. **Which option resonates most?**
   - A: Enhanced Modal (quick win)
   - B: Guided Wizard (best UX)
   - C: Chat Builder (most intelligent)
   - D: Playground (power users)
   - E: All of the above (phased)

2. **Priority for Claude API usage?**
   - Use API for suggestions (cost per interaction)
   - Pre-compute suggestions (lower cost, less dynamic)
   - User-facing AI chat (highest cost, best experience)

3. **Sharing feature priority?**
   - High: Users want to share filled prompts
   - Medium: Nice to have
   - Low: Focus on personal use first

4. **Timeline preference?**
   - Fast (2-3 weeks): Option A only
   - Medium (6-8 weeks): Options A + B + C
   - Full (10-12 weeks): Complete hybrid system

---

*Plan created: January 2026*
*Author: Claude Opus 4.5*
