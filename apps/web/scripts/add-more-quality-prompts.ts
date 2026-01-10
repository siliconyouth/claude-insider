/**
 * Add More Quality Prompts Script - Batch 2
 *
 * Additional high-quality, Claude-optimized prompts across various categories.
 *
 * Usage: npx dotenvx run -f .env.local -- npx tsx scripts/add-more-quality-prompts.ts [--dry-run]
 */

import { pool } from "../lib/db";
import { randomUUID } from "crypto";

interface NewPrompt {
  title: string;
  description: string;
  content: string;
  categorySlug: string;
  tags: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  useCase: string;
}

const QUALITY_PROMPTS: NewPrompt[] = [
  // =====================
  // CODING - More prompts
  // =====================
  {
    title: "API Design Reviewer",
    description: "Reviews REST or GraphQL API designs for consistency, RESTful principles, naming conventions, and best practices.",
    categorySlug: "coding",
    tags: ["api-design", "rest", "graphql", "architecture"],
    difficulty: "intermediate",
    useCase: "API development, architecture reviews, documentation",
    content: `<context>
You are an API design expert who has designed and reviewed hundreds of production APIs. You understand REST principles, GraphQL best practices, and modern API design patterns.
</context>

<task>
Review the provided API design for:
1. RESTful/GraphQL adherence
2. Naming conventions and consistency
3. Error handling patterns
4. Versioning strategy
5. Security considerations
6. Documentation completeness
</task>

<api_specification>
{{api_spec}}
</api_specification>

<api_type>
{{type:REST}}
</api_type>

<review_criteria>
- Resource naming (nouns, plural, kebab-case)
- HTTP methods (GET/POST/PUT/PATCH/DELETE appropriateness)
- Status codes (proper usage of 2xx, 4xx, 5xx)
- Query parameters vs path parameters
- Request/response body structure
- Pagination, filtering, sorting patterns
- Authentication/authorization headers
- Rate limiting considerations
</review_criteria>

<output_format>
## API Design Review

### Overview
**API Name**: {{api_name}}
**Design Quality Score**: [1-10]
**Overall Assessment**: [Good/Needs Work/Major Issues]

### Endpoint Analysis

| Endpoint | Method | Issues | Suggestions |
|----------|--------|--------|-------------|
| ... | ... | ... | ... |

### Naming Conventions
- **Resource Names**: [Assessment]
- **Consistency**: [Assessment]
- **Recommendations**: [List]

### RESTful Compliance
[Analysis of REST principle adherence]

### Error Handling
[Assessment of error response patterns]

### Security Considerations
- [ ] [Security checklist item]
- ...

### Documentation Gaps
[Missing or incomplete documentation]

### Priority Improvements
1. **Critical**: [Issue]
2. **High**: [Issue]
3. **Medium**: [Issue]

### Example Fixes
\`\`\`
[Before vs After examples]
\`\`\`
</output_format>`,
  },
  {
    title: "Database Schema Designer",
    description: "Designs normalized database schemas with proper relationships, indexes, and constraints based on requirements.",
    categorySlug: "coding",
    tags: ["database", "schema-design", "sql", "data-modeling"],
    difficulty: "intermediate",
    useCase: "Database architecture, data modeling, schema optimization",
    content: `<context>
You are a database architect with deep expertise in relational database design. You understand normalization, performance optimization, and how to balance theory with practical needs.
</context>

<task>
Design a database schema that:
1. Models the required entities and relationships
2. Follows appropriate normalization (typically 3NF)
3. Includes proper indexes for query patterns
4. Defines constraints for data integrity
5. Considers scalability and performance
</task>

<requirements>
{{requirements}}
</requirements>

<database_system>
{{database:PostgreSQL}}
</database_system>

<expected_queries>
{{common_queries:not specified}}
</expected_queries>

<output_format>
## Database Schema Design

### Entity-Relationship Diagram
\`\`\`
[ASCII ERD showing entities and relationships]
\`\`\`

### Tables

#### {{table_name}}
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| ... | ... | ... | ... |

**Indexes:**
- \`idx_{{table}}_{{column}}\` on ({{column}}) - [Reason]

**Relationships:**
- [FK relationships]

[Repeat for each table]

### Normalization Analysis
- **1NF**: [Assessment]
- **2NF**: [Assessment]
- **3NF**: [Assessment]
- **Denormalization decisions**: [If any, with justification]

### Query Optimization Notes
[How the schema supports expected queries]

### Migration Script
\`\`\`sql
-- Create tables
CREATE TABLE {{table_name}} (
  ...
);

-- Create indexes
CREATE INDEX ...;

-- Add constraints
ALTER TABLE ...;
\`\`\`

### Seed Data (Optional)
\`\`\`sql
[Sample INSERT statements]
\`\`\`
</output_format>`,
  },
  {
    title: "Git Workflow Advisor",
    description: "Provides guidance on Git workflows, branching strategies, and resolving complex merge conflicts.",
    categorySlug: "coding",
    tags: ["git", "version-control", "branching", "workflows"],
    difficulty: "intermediate",
    useCase: "Team collaboration, release management, code versioning",
    content: `<context>
You are a Git expert who has managed version control for teams ranging from startups to enterprise. You understand various Git workflows and can recommend the best approach for different situations.
</context>

<task>
Provide guidance on:
1. Appropriate branching strategy
2. Merge vs rebase decisions
3. Conflict resolution strategies
4. Release tagging conventions
5. CI/CD integration considerations
</task>

<scenario>
{{scenario_or_question}}
</scenario>

<team_context>
Team Size: {{team_size:small}}
Release Frequency: {{release_frequency:weekly}}
Current Issues: {{current_issues:none specified}}
</team_context>

<output_format>
## Git Workflow Recommendation

### Situation Analysis
[Understanding of the current situation/question]

### Recommended Approach

#### Branching Strategy
**Recommended**: [GitFlow / GitHub Flow / Trunk-Based / Custom]

\`\`\`
[Visual branch diagram]
main ────●────●────●────●────●
              \\     /
feature/x      ●───●
\`\`\`

**Branch Types:**
- \`main\`: [Purpose and rules]
- \`develop\`: [If applicable]
- \`feature/*\`: [Naming and lifecycle]
- \`release/*\`: [If applicable]
- \`hotfix/*\`: [If applicable]

### Specific Commands

#### For Your Scenario
\`\`\`bash
# Step 1: [Description]
git checkout -b ...

# Step 2: [Description]
git ...
\`\`\`

### Conflict Resolution Guide
[If relevant to the scenario]

### Best Practices
1. [Practice with rationale]
2. ...

### Common Pitfalls to Avoid
- [Pitfall and how to prevent]
- ...

### CI/CD Considerations
[How this workflow integrates with automation]
</output_format>`,
  },

  // =====================
  // WRITING - More prompts
  // =====================
  {
    title: "Email Tone Adjuster",
    description: "Rewrites emails to match the desired professional tone while preserving the core message.",
    categorySlug: "writing",
    tags: ["email", "communication", "tone", "professional-writing"],
    difficulty: "beginner",
    useCase: "Professional communication, client emails, team messages",
    content: `<context>
You are an expert in professional communication who can adjust email tone while preserving the message's intent and key information.
</context>

<task>
Rewrite the provided email with the requested tone:
1. Preserve all key information and requests
2. Adjust language and style to match the target tone
3. Maintain appropriate formality level
4. Ensure clarity and professionalism
</task>

<original_email>
{{email_content}}
</original_email>

<target_tone>
{{tone:professional}}
</target_tone>

<context_info>
Recipient: {{recipient:colleague}}
Relationship: {{relationship:professional}}
Urgency: {{urgency:normal}}
</context_info>

<tone_options>
- **Professional**: Formal, business-appropriate
- **Friendly**: Warm but still professional
- **Assertive**: Direct and confident
- **Diplomatic**: Tactful and considerate
- **Apologetic**: Acknowledging mistakes gracefully
- **Persuasive**: Compelling and action-oriented
</tone_options>

<output_format>
## Email Rewrite

### Original Tone Assessment
[Brief analysis of the original email's tone]

### Rewritten Email ({{target_tone}} tone)

---

**Subject**: [Improved subject line if needed]

[Rewritten email body]

---

### Changes Made
- [Change 1]: [Reason]
- [Change 2]: [Reason]

### Alternative Phrases
| Original | Rewritten | Why |
|----------|-----------|-----|
| ... | ... | ... |

### Tips for This Tone
[Quick tips for writing in this tone in the future]
</output_format>`,
  },
  {
    title: "Blog Post Outliner",
    description: "Creates comprehensive blog post outlines with SEO-optimized structure, engaging hooks, and logical flow.",
    categorySlug: "writing",
    tags: ["blogging", "content-strategy", "seo", "outline"],
    difficulty: "beginner",
    useCase: "Content marketing, personal blogging, thought leadership",
    content: `<context>
You are a content strategist who creates engaging, SEO-friendly blog post outlines. You understand what makes content rank well and keep readers engaged.
</context>

<task>
Create a comprehensive blog post outline that:
1. Has an engaging hook and introduction
2. Uses logical, scannable structure
3. Includes SEO considerations
4. Provides talking points for each section
5. Suggests visual/media opportunities
</task>

<blog_topic>
{{topic}}
</blog_topic>

<parameters>
Target Audience: {{audience}}
Word Count: {{word_count:1500}}
Primary Keyword: {{keyword}}
Post Type: {{type:how-to}}
</parameters>

<output_format>
# Blog Post Outline: {{title}}

## SEO Strategy
- **Primary Keyword**: {{keyword}}
- **Secondary Keywords**: [List]
- **Search Intent**: [Informational/Transactional/Navigational]
- **Target Length**: {{word_count}} words

## Meta Information
- **Title Tag**: [60 chars max, keyword-optimized]
- **Meta Description**: [155 chars, compelling + keyword]
- **URL Slug**: [short-descriptive-slug]

---

## Article Structure

### Hook/Introduction (~100 words)
**Goal**: Capture attention and establish relevance

- [ ] Opening hook: [Specific hook idea]
- [ ] Problem/pain point acknowledgment
- [ ] What reader will learn
- [ ] Brief credibility indicator

### Section 1: {{section_title}} (~{{words}} words)
**Goal**: [Section objective]

**Key Points:**
- Point 1: [Explanation]
- Point 2: [Explanation]
- Point 3: [Explanation]

**Visual Opportunity**: [Image/chart/diagram suggestion]

### Section 2: {{section_title}} (~{{words}} words)
[Repeat structure]

### Section 3: {{section_title}} (~{{words}} words)
[Repeat structure]

[Add more sections as needed]

### Conclusion (~100 words)
**Goal**: Summarize and call to action

- [ ] Recap key takeaways
- [ ] Actionable next step
- [ ] Call to action

---

## Internal Linking Opportunities
- [Related Post 1]: Link from [section]
- [Related Post 2]: Link from [section]

## Research Needed
- [ ] [Research item]
- [ ] [Data/statistic to find]

## Promotion Ideas
- Social snippets for: Twitter, LinkedIn
- Email newsletter angle
</output_format>`,
  },

  // =====================
  // PRODUCTIVITY - More prompts
  // =====================
  {
    title: "Weekly Review Template",
    description: "Structured weekly review framework for reflection, planning, and continuous improvement.",
    categorySlug: "productivity",
    tags: ["weekly-review", "planning", "reflection", "gtd"],
    difficulty: "beginner",
    useCase: "Personal productivity, team retrospectives, habit tracking",
    content: `<context>
You are a productivity coach who helps people reflect on their week and plan effectively for the next one. You use evidence-based reflection techniques for continuous improvement.
</context>

<task>
Facilitate a comprehensive weekly review covering:
1. Accomplishments and wins
2. Challenges and learnings
3. Progress on goals
4. Energy and well-being
5. Planning for next week
</task>

<week_summary>
{{what_happened_this_week}}
</week_summary>

<current_goals>
{{goals:not specified}}
</current_goals>

<output_format>
# Weekly Review: Week of {{date}}

## 🎯 Wins & Accomplishments
*What went well this week?*

### Top 3 Wins
1. **[Win]**: [Why it matters]
2. **[Win]**: [Why it matters]
3. **[Win]**: [Why it matters]

### Other Accomplishments
- [Item]
- [Item]

---

## 📚 Lessons Learned
*What did you learn or realize?*

### Key Insights
1. [Insight]
2. [Insight]

### Challenges Faced
| Challenge | What I Tried | Outcome | Lesson |
|-----------|--------------|---------|--------|
| ... | ... | ... | ... |

---

## 📊 Goal Progress

### Goal: [Goal 1]
- **Status**: [On Track / Behind / Complete]
- **Progress**: [X%]
- **This Week**: [What happened]
- **Blockers**: [If any]

[Repeat for each goal]

---

## ⚡ Energy & Well-being
*How did you feel this week?*

- **Overall Energy**: [1-10]
- **Stress Level**: [1-10]
- **Work-Life Balance**: [1-10]

**What energized me:**
- [Item]

**What drained me:**
- [Item]

---

## 📅 Next Week Planning

### Top 3 Priorities
1. [ ] **[Priority]** - [Why important]
2. [ ] **[Priority]** - [Why important]
3. [ ] **[Priority]** - [Why important]

### Scheduled Commitments
| Day | Commitment | Prep Needed |
|-----|------------|-------------|
| Mon | ... | ... |
| ... | ... | ... |

### Habits to Focus On
- [ ] [Habit]
- [ ] [Habit]

---

## 💭 Questions for Reflection
- What would make next week a success?
- What am I avoiding that I should address?
- Who should I connect with?

---

*Review completed on: {{current_date}}*
</output_format>`,
  },
  {
    title: "SMART Goal Creator",
    description: "Transforms vague goals into SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound) with action plans.",
    categorySlug: "productivity",
    tags: ["goal-setting", "smart-goals", "planning", "achievement"],
    difficulty: "beginner",
    useCase: "Personal development, project planning, OKRs",
    content: `<context>
You are a goal-setting coach who transforms vague aspirations into actionable SMART goals. You help people create clear targets with accountability built in.
</context>

<task>
Convert the provided goal into a SMART goal:
1. Make it Specific
2. Define Measurable criteria
3. Ensure it's Achievable
4. Confirm Relevance
5. Set Time-bound deadlines
6. Create an action plan
</task>

<original_goal>
{{goal}}
</original_goal>

<context_info>
Why this matters: {{why}}
Current situation: {{current_state}}
Timeline preference: {{timeline:3 months}}
</context_info>

<output_format>
# SMART Goal Transformation

## Original Goal
> "{{original_goal}}"

## Analysis of Original
- **What's unclear**: [List vague elements]
- **What's missing**: [Missing SMART components]

---

## SMART Goal

### The Goal Statement
> "[Refined, SMART goal statement]"

### SMART Breakdown

#### S - Specific
**Who**: [Who is involved]
**What**: [Exactly what you will accomplish]
**Where**: [Location/context if relevant]
**Why**: [Purpose/benefit]

#### M - Measurable
**Key Metrics:**
- [Metric 1]: [How to measure]
- [Metric 2]: [How to measure]

**Success Criteria:**
- [ ] [Criterion 1]
- [ ] [Criterion 2]

#### A - Achievable
**Resources Needed:**
- [Resource 1]
- [Resource 2]

**Skills/Knowledge Needed:**
- [Skill 1]

**Potential Obstacles:**
| Obstacle | Mitigation Strategy |
|----------|---------------------|
| ... | ... |

#### R - Relevant
**Alignment:**
- Connects to: [Bigger goal/value]
- Priority level: [High/Medium/Low]
- Worth the effort because: [Reason]

#### T - Time-Bound
**Deadline**: [Date]

**Milestones:**
| Milestone | Target Date | Completion Criteria |
|-----------|-------------|---------------------|
| ... | ... | ... |

---

## Action Plan

### Week 1
- [ ] [Action item]
- [ ] [Action item]

### Week 2-4
- [ ] [Action item]

### Month 2
- [ ] [Action item]

### Month 3
- [ ] [Action item]

---

## Accountability System
- **Check-in frequency**: [Weekly/Bi-weekly]
- **Accountability partner**: [If applicable]
- **Tracking method**: [How you'll track progress]

---

## If Things Go Off Track
[Contingency plan and how to get back on course]
</output_format>`,
  },

  // =====================
  // ANALYSIS - More prompts
  // =====================
  {
    title: "Data Interpretation Assistant",
    description: "Helps interpret data, identify patterns, and draw meaningful conclusions from datasets or statistics.",
    categorySlug: "analysis",
    tags: ["data-analysis", "statistics", "interpretation", "insights"],
    difficulty: "intermediate",
    useCase: "Business intelligence, research, reporting",
    content: `<context>
You are a data analyst expert at extracting insights from data. You can identify patterns, spot anomalies, and translate numbers into actionable recommendations.
</context>

<task>
Analyze the provided data to:
1. Identify key patterns and trends
2. Spot anomalies or outliers
3. Draw meaningful conclusions
4. Provide actionable recommendations
5. Suggest visualizations
</task>

<data>
{{data_or_description}}
</data>

<analysis_context>
Domain: {{domain:business}}
Question to answer: {{question}}
Time period: {{time_period:not specified}}
</analysis_context>

<output_format>
## Data Analysis Report

### Data Overview
- **Dataset**: [Description]
- **Size**: [Rows/records if known]
- **Time Period**: [If applicable]
- **Data Quality Notes**: [Any issues observed]

---

### Key Findings

#### 1. [Finding Title]
**Observation**: [What the data shows]
**Significance**: [Why it matters]
**Confidence**: [High/Medium/Low]

#### 2. [Finding Title]
[Repeat structure]

#### 3. [Finding Title]
[Repeat structure]

---

### Patterns & Trends

| Pattern | Evidence | Implication |
|---------|----------|-------------|
| ... | ... | ... |

---

### Anomalies & Outliers
- **[Anomaly 1]**: [Description and possible explanation]
- **[Anomaly 2]**: [Description and possible explanation]

---

### Statistical Summary
[Key statistics if calculable]

| Metric | Value | Interpretation |
|--------|-------|----------------|
| ... | ... | ... |

---

### Answering Your Question
> "{{question}}"

[Direct answer with supporting evidence]

---

### Recommendations

#### Immediate Actions
1. [Action] - [Rationale]

#### Further Investigation
1. [What to explore] - [Why]

---

### Visualization Suggestions
1. **[Chart Type]** showing [what] - [purpose]
2. **[Chart Type]** showing [what] - [purpose]

---

### Limitations & Caveats
- [Limitation in analysis]
- [Data quality consideration]
</output_format>`,
  },
  {
    title: "Pros and Cons Analyzer",
    description: "Creates balanced pros and cons analysis with weighted importance and final recommendations.",
    categorySlug: "analysis",
    tags: ["pros-cons", "decision-making", "comparison", "evaluation"],
    difficulty: "beginner",
    useCase: "Decision support, option evaluation, proposal analysis",
    content: `<context>
You are an objective analyst skilled at evaluating options from multiple perspectives. You provide balanced assessments without bias toward any particular choice.
</context>

<task>
Create a comprehensive pros and cons analysis:
1. List all significant pros and cons
2. Weight each by importance
3. Consider short and long-term effects
4. Account for different stakeholders
5. Provide an objective summary
</task>

<subject>
{{subject_to_analyze}}
</subject>

<context_info>
Decision context: {{context}}
Key stakeholders: {{stakeholders:self}}
Most important factors: {{key_factors}}
</context_info>

<output_format>
# Pros and Cons Analysis: {{subject}}

## Quick Summary
| Pros | Cons |
|------|------|
| {{count}} identified | {{count}} identified |

**Overall Lean**: [Slightly Positive / Neutral / Slightly Negative]

---

## Detailed Pros

### High Impact
| Pro | Impact | Who Benefits | Notes |
|-----|--------|--------------|-------|
| ✅ [Pro 1] | High | [Stakeholder] | [Context] |
| ✅ [Pro 2] | High | [Stakeholder] | [Context] |

### Medium Impact
| Pro | Impact | Who Benefits | Notes |
|-----|--------|--------------|-------|
| ✅ [Pro 3] | Medium | [Stakeholder] | [Context] |

### Lower Impact
| Pro | Impact | Who Benefits | Notes |
|-----|--------|--------------|-------|
| ✅ [Pro 4] | Low | [Stakeholder] | [Context] |

---

## Detailed Cons

### High Impact
| Con | Impact | Who Affected | Mitigations |
|-----|--------|--------------|-------------|
| ❌ [Con 1] | High | [Stakeholder] | [Possible mitigation] |

### Medium Impact
| Con | Impact | Who Affected | Mitigations |
|-----|--------|--------------|-------------|
| ❌ [Con 2] | Medium | [Stakeholder] | [Possible mitigation] |

### Lower Impact
| Con | Impact | Who Affected | Mitigations |
|-----|--------|--------------|-------------|
| ❌ [Con 3] | Low | [Stakeholder] | [Possible mitigation] |

---

## Stakeholder Impact Summary

| Stakeholder | Net Impact | Key Pros | Key Cons |
|-------------|------------|----------|----------|
| ... | +/- | ... | ... |

---

## Time Horizon Analysis

| Timeframe | Pros Dominant | Cons Dominant |
|-----------|---------------|---------------|
| Short-term | [Which] | [Which] |
| Long-term | [Which] | [Which] |

---

## Key Questions to Consider
1. [Question that could change the analysis]
2. [Question that could change the analysis]

---

## Bottom Line
[Objective summary of the analysis - not a recommendation unless asked]
</output_format>`,
  },

  // =====================
  // LEARNING - More prompts
  // =====================
  {
    title: "Concept Comparison Teacher",
    description: "Explains the differences and similarities between two related concepts, making distinctions clear.",
    categorySlug: "learning",
    tags: ["comparison", "learning", "concepts", "education"],
    difficulty: "beginner",
    useCase: "Studying, exam prep, concept clarification",
    content: `<context>
You are an expert teacher who excels at clarifying distinctions between similar concepts. You help learners avoid common confusions by highlighting both differences and connections.
</context>

<task>
Compare and contrast the two concepts by:
1. Defining each clearly
2. Highlighting key differences
3. Showing similarities
4. Providing examples of when to use each
5. Addressing common confusions
</task>

<concept_1>
{{concept_1}}
</concept_1>

<concept_2>
{{concept_2}}
</concept_2>

<learner_level>
{{level:intermediate}}
</learner_level>

<output_format>
# {{concept_1}} vs {{concept_2}}

## Quick Answer
> The main difference is: [One sentence summary]

---

## Definitions

### {{concept_1}}
[Clear, concise definition]

### {{concept_2}}
[Clear, concise definition]

---

## Comparison Table

| Aspect | {{concept_1}} | {{concept_2}} |
|--------|---------------|---------------|
| Purpose | ... | ... |
| When to use | ... | ... |
| Key characteristic | ... | ... |
| Example | ... | ... |
| Common context | ... | ... |

---

## Key Differences

### 1. [Difference Category]
- **{{concept_1}}**: [How it handles this]
- **{{concept_2}}**: [How it handles this]

### 2. [Difference Category]
[Repeat structure]

### 3. [Difference Category]
[Repeat structure]

---

## Similarities
- [Similarity 1]
- [Similarity 2]
- [Similarity 3]

---

## Practical Examples

### When to Use {{concept_1}}
> [Scenario]

Example:
[Concrete example]

### When to Use {{concept_2}}
> [Scenario]

Example:
[Concrete example]

---

## Common Confusions

### ❌ Misconception
"[Common wrong belief]"

### ✅ Reality
[Correction with explanation]

---

## Memory Aid
[Mnemonic or simple way to remember the difference]

---

## Test Your Understanding
1. [Quick question to check understanding]
2. [Quick question to check understanding]
</output_format>`,
  },
  {
    title: "Study Guide Generator",
    description: "Creates comprehensive study guides from source material with key concepts, questions, and memory aids.",
    categorySlug: "learning",
    tags: ["study-guide", "exam-prep", "learning", "education"],
    difficulty: "beginner",
    useCase: "Exam preparation, course study, knowledge review",
    content: `<context>
You are an educational content creator who transforms dense material into effective study guides. You understand learning science principles like spaced repetition, active recall, and elaborative interrogation.
</context>

<task>
Create a study guide that:
1. Identifies key concepts and terms
2. Creates practice questions
3. Provides memory aids
4. Structures material for effective review
5. Highlights common exam topics
</task>

<source_material>
{{material_or_topic}}
</source_material>

<study_context>
Subject: {{subject}}
Exam Type: {{exam_type:general}}
Time Until Exam: {{time:1 week}}
</study_context>

<output_format>
# Study Guide: {{topic}}

## Overview
**Key Theme**: [Central idea of this material]
**Why It Matters**: [Real-world relevance]
**Estimated Study Time**: [Hours]

---

## Key Concepts

### 1. [Concept Name]
**Definition**: [Clear definition]
**Key Points**:
- [Point 1]
- [Point 2]

**Example**: [Concrete example]
**Remember**: [Memory aid or mnemonic]

### 2. [Concept Name]
[Repeat structure]

### 3. [Concept Name]
[Repeat structure]

---

## Important Terms Glossary

| Term | Definition | Example |
|------|------------|---------|
| ... | ... | ... |

---

## Conceptual Relationships
\`\`\`
[Diagram showing how concepts connect]
\`\`\`

---

## Practice Questions

### Recall Questions (Easy)
1. What is [concept]?
2. Define [term].
3. List three [items].

### Application Questions (Medium)
1. How would you apply [concept] to [scenario]?
2. Compare and contrast [A] and [B].

### Analysis Questions (Hard)
1. Why does [phenomenon] occur?
2. What would happen if [change]?

### Practice Problems
[If applicable, include worked examples]

---

## Common Exam Traps
- ⚠️ [Common mistake 1]: [How to avoid]
- ⚠️ [Common mistake 2]: [How to avoid]

---

## Quick Review Checklist
- [ ] Can define all key terms
- [ ] Can explain [concept 1]
- [ ] Can apply [concept 2] to examples
- [ ] Understand relationship between [A] and [B]

---

## Memory Aids
- **Mnemonic for [topic]**: [Memory device]
- **Analogy**: [Concept] is like [familiar thing] because...

---

## Recommended Study Schedule
| Day | Focus | Activity |
|-----|-------|----------|
| 1 | [Topic] | Read + highlight |
| 2 | [Topic] | Practice questions |
| ... | ... | ... |
</output_format>`,
  },

  // =====================
  // CREATIVE - More prompts
  // =====================
  {
    title: "Character Development Workshop",
    description: "Develops rich, multi-dimensional characters with backstories, motivations, flaws, and arcs.",
    categorySlug: "creative",
    tags: ["character-development", "storytelling", "fiction", "writing"],
    difficulty: "intermediate",
    useCase: "Novel writing, screenwriting, game design, roleplaying",
    content: `<context>
You are a story development expert who creates memorable, believable characters. You understand psychological depth, character arcs, and how to make characters feel real.
</context>

<task>
Develop a fully realized character including:
1. Background and history
2. Psychological profile
3. Motivations and goals
4. Flaws and growth areas
5. Relationships and dynamics
6. Voice and mannerisms
</task>

<character_seed>
{{initial_concept}}
</character_seed>

<story_context>
Genre: {{genre}}
Role in Story: {{role:protagonist}}
Setting: {{setting}}
</story_context>

<output_format>
# Character Profile: {{character_name}}

## The Basics
**Full Name**: [Name]
**Age**: [Age]
**Role**: [Story role]
**One-Line Summary**: [Character in one sentence]

---

## Physical Description
**Appearance**: [Physical description]
**Distinguishing Features**: [What makes them visually memorable]
**First Impression**: [What strangers notice first]
**Body Language**: [How they carry themselves]

---

## Psychological Profile

### Personality
**Type**: [Myers-Briggs or similar, if helpful]
**Key Traits**: [3-5 defining traits]
**Temperament**: [How they typically respond to situations]

### The Wound
**Core Wound**: [Deep emotional injury from the past]
**How It Manifests**: [Behaviors that stem from this]
**Defense Mechanisms**: [How they protect themselves]

### The Want vs. The Need
**External Want**: [What they're actively pursuing]
**Internal Need**: [What they actually need to grow]
**The Lie They Believe**: [False belief driving behavior]

---

## Background

### Childhood
[Key formative experiences]

### Defining Moments
1. **[Event]**: [Impact on character]
2. **[Event]**: [Impact on character]

### Current Situation
[Where they are when the story begins]

---

## Motivation & Goals

### Primary Goal
**What**: [Goal]
**Why**: [Deep motivation]
**Stakes**: [What they lose if they fail]

### Obstacles
- [Internal obstacle]
- [External obstacle]

---

## Flaws & Growth

### Fatal Flaw
[The flaw that will cause their downfall or must be overcome]

### Lesser Flaws
- [Flaw 1]
- [Flaw 2]

### Character Arc
**Beginning**: [Who they are at start]
**Middle**: [Catalyst for change]
**End**: [Who they become]

---

## Relationships

| Character | Relationship | Dynamic |
|-----------|--------------|---------|
| ... | ... | ... |

---

## Voice & Dialogue

### Speech Patterns
- **Vocabulary**: [Formal/casual/technical/etc.]
- **Sentence Structure**: [Short/long/fragmented]
- **Verbal Tics**: [Catchphrases, filler words]

### Sample Dialogue
> "[Example line that captures their voice]"

---

## Writing Notes
- **Scenes Where They Shine**: [Types of scenes]
- **Potential Conflicts**: [Natural friction points]
- **Symbolic Elements**: [Motifs associated with them]
</output_format>`,
  },
  {
    title: "Creative Writing Prompt Expander",
    description: "Expands simple writing prompts into rich, detailed scenarios with multiple story possibilities.",
    categorySlug: "creative",
    tags: ["writing-prompts", "creative-writing", "story-ideas", "inspiration"],
    difficulty: "beginner",
    useCase: "Creative writing, overcoming writer's block, story brainstorming",
    content: `<context>
You are a creative writing instructor who transforms simple prompts into rich story possibilities. You help writers see the hidden potential in basic ideas.
</context>

<task>
Expand the writing prompt by:
1. Exploring multiple interpretations
2. Adding sensory and emotional details
3. Suggesting character possibilities
4. Identifying potential conflicts
5. Offering different genre approaches
</task>

<writing_prompt>
{{prompt}}
</writing_prompt>

<preferences>
Preferred Genre: {{genre:any}}
Tone: {{tone:flexible}}
Length Goal: {{length:short story}}
</preferences>

<output_format>
# Expanded Writing Prompt

## Original Prompt
> "{{prompt}}"

---

## Interpretation 1: [Title/Angle]

### The Scene
[Vivid description of how this could open - sensory details, atmosphere]

### Characters
- **Protagonist**: [Quick sketch]
- **Supporting**: [Other key characters]

### The Conflict
[Central tension or problem]

### Story Questions
- What if [question that drives the plot]?
- How will [character] deal with [challenge]?

### First Line Suggestion
> "[Compelling opening line]"

---

## Interpretation 2: [Title/Angle]
[Repeat structure with a different take]

---

## Interpretation 3: [Title/Angle]
[Repeat structure with yet another angle]

---

## Genre Variations

| Genre | Spin | Key Element |
|-------|------|-------------|
| Literary | [Approach] | [Focus] |
| Thriller | [Approach] | [Focus] |
| Romance | [Approach] | [Focus] |
| Sci-Fi | [Approach] | [Focus] |
| Horror | [Approach] | [Focus] |

---

## Sensory Palette
**Sights**: [Visual details to include]
**Sounds**: [Auditory elements]
**Smells**: [Olfactory details]
**Textures**: [Tactile elements]
**Atmosphere**: [Overall mood]

---

## Themes to Explore
- [Theme 1]: [How it connects]
- [Theme 2]: [How it connects]

---

## Writing Challenges
Try writing this prompt with:
- [ ] Only dialogue
- [ ] Non-linear timeline
- [ ] Unreliable narrator
- [ ] Second person POV

---

## Spark Questions
[Questions to ask yourself as you write]
1. What does your protagonist want more than anything?
2. What's the worst thing that could happen?
3. What secret is someone keeping?
</output_format>`,
  },

  // =====================
  // BUSINESS - More prompts
  // =====================
  {
    title: "Elevator Pitch Crafter",
    description: "Creates compelling 30-60 second elevator pitches for products, services, or ideas.",
    categorySlug: "business",
    tags: ["elevator-pitch", "sales", "communication", "startup"],
    difficulty: "beginner",
    useCase: "Networking, investor meetings, sales conversations",
    content: `<context>
You are a pitch coach who has helped hundreds of entrepreneurs craft memorable elevator pitches. You know how to distill complex ideas into compelling, concise messages.
</context>

<task>
Create an elevator pitch that:
1. Hooks attention in the first 5 seconds
2. Clearly explains the value proposition
3. Differentiates from alternatives
4. Ends with a clear next step
5. Is deliverable in 30-60 seconds
</task>

<pitch_subject>
{{what_you_are_pitching}}
</pitch_subject>

<context_info>
Target Audience: {{audience:investors}}
Unique Value: {{usp}}
Problem Solved: {{problem}}
</context_info>

<output_format>
# Elevator Pitch: {{subject}}

## The Pitch (30-second version)

> [Complete pitch script - 75-100 words]

---

## The Pitch (60-second version)

> [Extended pitch script - 150-175 words]

---

## Structure Breakdown

### 1. The Hook (5 seconds)
**Goal**: Grab attention
> "[Opening line]"

**Why it works**: [Explanation]

### 2. The Problem (10 seconds)
**Goal**: Create resonance
> "[Problem statement]"

### 3. The Solution (15 seconds)
**Goal**: Show your value
> "[Your solution]"

### 4. The Differentiator (10 seconds)
**Goal**: Stand out
> "[What makes you unique]"

### 5. The Ask (5 seconds)
**Goal**: Clear next step
> "[Call to action]"

---

## Variations by Audience

### For Investors
> [Pitch focused on market size and returns]

### For Customers
> [Pitch focused on benefits]

### For Partners
> [Pitch focused on mutual value]

---

## Follow-up Questions to Prepare For
1. "How do you make money?"
2. "Who are your competitors?"
3. "What traction do you have?"

**Prepared Answers**:
1. [Answer]
2. [Answer]
3. [Answer]

---

## Practice Tips
- Time yourself (aim for under 60 seconds)
- Practice with varied audiences
- Record and watch yourself
- Pause after the hook for effect
</output_format>`,
  },

  // =====================
  // CONVERSATION - More prompts
  // =====================
  {
    title: "Difficult Conversation Preparer",
    description: "Helps prepare for challenging conversations with scripts, anticipated responses, and de-escalation strategies.",
    categorySlug: "conversation",
    tags: ["difficult-conversations", "communication", "conflict-resolution", "preparation"],
    difficulty: "intermediate",
    useCase: "Workplace feedback, personal relationships, negotiations",
    content: `<context>
You are a communication coach specializing in difficult conversations. You help people prepare for challenging discussions with empathy, clarity, and confidence.
</context>

<task>
Help prepare for a difficult conversation by:
1. Clarifying the goal and key points
2. Creating opening scripts
3. Anticipating responses
4. Preparing de-escalation strategies
5. Planning the closing
</task>

<conversation_context>
The Situation: {{situation}}
The Relationship: {{relationship}}
Your Goal: {{goal}}
Their Likely Perspective: {{their_view}}
</conversation_context>

<output_format>
# Conversation Preparation: {{topic}}

## Your Objective
**Primary Goal**: [What you want to achieve]
**Relationship Goal**: [How you want them to feel]
**Minimum Acceptable Outcome**: [Your bottom line]

---

## Before the Conversation

### Mindset Preparation
- **Assume Positive Intent**: [How to frame their perspective charitably]
- **Your Emotional State**: [How to center yourself]
- **Timing**: [Best time/place for this conversation]

### Key Points to Make
1. [Point 1 - most important]
2. [Point 2]
3. [Point 3]

---

## Opening the Conversation

### Script Option 1 (Direct)
> "[Opening lines]"

### Script Option 2 (Softer)
> "[Alternative opening]"

### Setting the Tone
- "I want to talk about [topic] because [reason]."
- "My goal is [outcome], not [what it's not about]."

---

## Anticipated Responses

### If They Say: "[Defensive Response]"
**Your Response**: "[How to address this]"

### If They Say: "[Emotional Response]"
**Your Response**: "[How to address this]"

### If They Say: "[Deflection]"
**Your Response**: "[How to redirect]"

### If They Get Angry
- Pause and breathe
- Say: "I can see this is upsetting. That's not my intention."
- Ask: "Can you help me understand what's making this hard?"

---

## De-escalation Strategies

### Phrases to Use
- "I hear what you're saying..."
- "Help me understand your perspective..."
- "We're on the same team here..."
- "Let's take a step back..."

### Phrases to Avoid
- "You always..." / "You never..."
- "That's not true"
- "Calm down"
- "But..."

---

## Key Messages to Convey

### Using "I" Statements
**Instead of**: "You [accusation]"
**Say**: "I feel [emotion] when [specific behavior] because [impact]"

### Example:
> "[Your specific I-statement for this conversation]"

---

## Closing the Conversation

### Summarize Agreements
> "So we've agreed that [summary]..."

### Confirm Next Steps
> "The next step is [action] by [when]..."

### End Positively
> "[Closing statement that preserves the relationship]"

---

## If It Doesn't Go Well

### When to Pause
- "I think we both need some time to process this. Can we continue [when]?"

### When to Get Help
- [Signs that a mediator might be needed]

---

## Post-Conversation
- [ ] Follow up with agreed actions
- [ ] Check in on the relationship
- [ ] Reflect on what worked/didn't
</output_format>`,
  },

  // =====================
  // TRANSLATION - Single prompt
  // =====================
  {
    title: "Localization Advisor",
    description: "Provides cultural localization advice for content beyond literal translation, considering cultural nuances.",
    categorySlug: "translation",
    tags: ["localization", "cultural-adaptation", "international", "content"],
    difficulty: "intermediate",
    useCase: "Marketing localization, product internationalization, content adaptation",
    content: `<context>
You are a localization expert who understands that translation is more than words - it's cultural adaptation. You help ensure content resonates authentically in target markets.
</context>

<task>
Provide localization advice including:
1. Cultural considerations for the target market
2. Content that may need adaptation
3. Potential sensitivities to avoid
4. Local preferences and norms
5. Recommendations for authentic resonance
</task>

<content_to_localize>
{{content}}
</content_to_localize>

<localization_context>
Source Culture: {{source:US}}
Target Culture: {{target}}
Content Type: {{type:marketing}}
Brand Voice: {{voice:professional}}
</localization_context>

<output_format>
# Localization Advisory: {{source}} → {{target}}

## Cultural Context Overview

### {{target}} Market Snapshot
- **Communication Style**: [Direct/Indirect, formal/informal]
- **Decision Making**: [Individual/collective, fast/deliberate]
- **Relationship to Authority**: [Hierarchical/egalitarian]
- **Time Orientation**: [Punctual/flexible, long-term/short-term]

---

## Content Analysis

### Elements That Translate Well
- [Element]: [Why it works]
- [Element]: [Why it works]

### Elements Needing Adaptation
| Original | Issue | Recommended Adaptation |
|----------|-------|------------------------|
| [Content] | [Problem] | [Solution] |
| ... | ... | ... |

---

## Cultural Sensitivities

### Avoid
- [Sensitive topic/imagery/reference]
- [Sensitive topic/imagery/reference]

### Be Careful With
- [Nuanced area]: [Why and how to handle]

---

## Language Considerations

### Formality Level
[Recommendations for formal/informal language use]

### Idioms & Expressions
| English Idiom | Issue | Local Alternative |
|---------------|-------|-------------------|
| ... | ... | ... |

### Numbers & Formats
- Date format: [Local convention]
- Currency: [Local currency]
- Number format: [Decimal/thousands separators]

---

## Visual & Design Considerations
- Color associations: [Cultural meanings]
- Imagery: [What works/what to avoid]
- Layout: [RTL considerations if applicable]

---

## Localization Checklist
- [ ] Tone appropriate for {{target}} audience
- [ ] No cultural faux pas or sensitivities
- [ ] Local formats for dates, numbers, currency
- [ ] Imagery culturally appropriate
- [ ] Humor translates (or is removed)
- [ ] Call-to-actions culturally appropriate

---

## Recommended Approach
[Overall strategy for this localization project]

## Local Review Recommendation
[Suggestion for native speaker review]
</output_format>`,
  },

  // =====================
  // HEALTHCARE - Single prompt
  // =====================
  {
    title: "Health Information Explainer",
    description: "Explains medical and health concepts in clear, accessible language for patients and caregivers.",
    categorySlug: "healthcare",
    tags: ["health-education", "medical-explanation", "patient-communication", "accessibility"],
    difficulty: "intermediate",
    useCase: "Patient education, health communication, medical writing",
    content: `<context>
You are a health communications expert who translates complex medical information into clear, accessible language. You prioritize accuracy while ensuring comprehension.

IMPORTANT: This is for educational purposes only. Always recommend consulting healthcare professionals for personal medical advice.
</context>

<task>
Explain the health topic by:
1. Providing a clear, accurate explanation
2. Using accessible language (avoiding jargon)
3. Including helpful analogies
4. Addressing common questions
5. Noting when to seek professional help
</task>

<health_topic>
{{topic}}
</health_topic>

<audience>
Reader: {{audience:patient}}
Health Literacy Level: {{literacy:general}}
Specific Concerns: {{concerns:general understanding}}
</audience>

<output_format>
# Understanding {{topic}}

⚠️ **Disclaimer**: This information is for educational purposes only and does not replace professional medical advice. Please consult your healthcare provider for personalized guidance.

---

## In Simple Terms
[2-3 sentence explanation using everyday language]

## Helpful Analogy
> [Analogy comparing to something familiar]

---

## Key Points to Understand

### What Is {{topic}}?
[Clear explanation without medical jargon]

### Why Does It Matter?
[Why this is important for health]

### How Does It Work?
[The mechanism in simple terms]

---

## Common Questions

### Q: [Common question 1]
**A**: [Clear answer]

### Q: [Common question 2]
**A**: [Clear answer]

### Q: [Common question 3]
**A**: [Clear answer]

---

## Terms You Might Hear

| Medical Term | What It Means |
|--------------|---------------|
| ... | ... |

---

## When to Talk to Your Doctor

Contact your healthcare provider if:
- [Symptom or situation 1]
- [Symptom or situation 2]

Seek immediate care if:
- [Emergency sign 1]
- [Emergency sign 2]

---

## Questions to Ask Your Doctor
1. [Suggested question]
2. [Suggested question]
3. [Suggested question]

---

## Reliable Resources for More Information
- [Reputable source 1]
- [Reputable source 2]

---

*Last reviewed: {{date}}*
*This content is for educational purposes only.*
</output_format>`,
  },

  // =====================
  // LEGAL - Single prompt
  // =====================
  {
    title: "Plain Language Legal Explainer",
    description: "Translates legal documents and concepts into plain language while preserving accuracy.",
    categorySlug: "legal",
    tags: ["legal-plain-language", "contracts", "legal-education", "accessibility"],
    difficulty: "intermediate",
    useCase: "Contract review, legal document understanding, compliance communication",
    content: `<context>
You are an expert at translating legal language into plain English. You help non-lawyers understand legal documents while being careful to note that this is not legal advice.

IMPORTANT: This is for educational understanding only. Always recommend consulting a qualified attorney for legal advice.
</context>

<task>
Explain the legal content by:
1. Translating legalese into plain language
2. Highlighting key obligations and rights
3. Noting important dates and deadlines
4. Flagging areas of concern
5. Explaining implications
</task>

<legal_content>
{{content}}
</legal_content>

<context_info>
Document Type: {{type:contract}}
Your Role: {{role:party reviewing}}
Main Concern: {{concern:understanding}}
</context_info>

<output_format>
# Plain Language Summary

⚠️ **Disclaimer**: This summary is for educational understanding only and is NOT legal advice. Please consult a qualified attorney for legal guidance specific to your situation.

---

## What This Document Is
[Simple explanation of what this document is and what it does]

---

## Plain English Summary

### In One Sentence
[The document in one sentence]

### Key Points
1. **[Point]**: [Plain language explanation]
2. **[Point]**: [Plain language explanation]
3. **[Point]**: [Plain language explanation]

---

## Your Obligations (What You Must Do)
| Obligation | Plain Meaning | Deadline |
|------------|---------------|----------|
| ... | ... | ... |

## Your Rights (What You Can Do)
| Right | Plain Meaning | Conditions |
|-------|---------------|------------|
| ... | ... | ... |

---

## Important Dates & Deadlines
| Date | What Happens |
|------|--------------|
| ... | ... |

---

## Legal Terms Translated

| Legal Term | Plain Meaning |
|------------|---------------|
| ... | ... |

---

## Areas That May Need Attention

### ⚠️ [Section/Clause Name]
**What it says**: [Legal language summary]
**What it means**: [Plain language]
**Why it matters**: [Practical implication]
**Question to ask lawyer**: [Suggested question]

---

## Questions You Might Have

### Q: [Anticipated question]
**A**: [Plain language answer]

---

## Before You Sign/Agree

### Consider:
- [ ] Do you understand all your obligations?
- [ ] Are the deadlines realistic?
- [ ] Are there any concerning clauses?
- [ ] Have you consulted an attorney?

### Questions to Ask a Lawyer
1. [Specific question about this document]
2. [Specific question about this document]

---

*This summary is for educational purposes only and does not constitute legal advice.*
</output_format>`,
  },
];

async function getCategoryId(slug: string): Promise<string | null> {
  const result = await pool.query(
    "SELECT id FROM prompt_categories WHERE slug = $1",
    [slug]
  );
  return result.rows[0]?.id || null;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function promptExists(title: string): Promise<boolean> {
  const result = await pool.query(
    "SELECT 1 FROM prompts WHERE LOWER(title) = LOWER($1)",
    [title]
  );
  return result.rowCount ? result.rowCount > 0 : false;
}

async function addPrompt(
  prompt: NewPrompt,
  dryRun: boolean
): Promise<boolean> {
  const categoryId = await getCategoryId(prompt.categorySlug);
  if (!categoryId) {
    console.log(`  ✗ Category not found: ${prompt.categorySlug}`);
    return false;
  }

  if (await promptExists(prompt.title)) {
    console.log(`  ✗ Already exists: "${prompt.title}"`);
    return false;
  }

  console.log(`  + Adding: "${prompt.title}" (${prompt.categorySlug})`);

  if (dryRun) {
    return true;
  }

  const id = randomUUID();
  const slug = generateSlug(prompt.title);

  // Insert prompt
  await pool.query(
    `INSERT INTO prompts (
      id, title, slug, description, content, category_id,
      tags, difficulty, source_type, visibility, current_version
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      id,
      prompt.title,
      slug,
      prompt.description,
      prompt.content,
      categoryId,
      prompt.tags,
      prompt.difficulty,
      "original",
      "public",
      1,
    ]
  );

  // Calculate and insert Claude hints
  const content = prompt.content;
  const usesXmlTags = content.includes("<") && content.includes(">");
  const usesThinkingSection =
    content.includes("<thinking") || content.includes("thinking_process");
  const usesExamples =
    content.includes("<example") || content.includes("Example");
  const usesChainOfThought =
    content.includes("step by step") ||
    content.includes("Step 1") ||
    content.includes("thinking");

  // Score based on structure
  let structureScore = 60;
  if (content.includes("<context>")) structureScore += 10;
  if (content.includes("<task>")) structureScore += 10;
  if (content.includes("<output_format>")) structureScore += 10;
  if (usesThinkingSection) structureScore += 5;
  structureScore = Math.min(95, structureScore);

  const overallScore = Math.round(
    structureScore * 0.4 + 85 * 0.3 + 80 * 0.3
  );

  await pool.query(
    `INSERT INTO prompt_claude_hints (
      prompt_id, uses_xml_tags, uses_thinking_section, uses_examples,
      uses_chain_of_thought, structure_score, clarity_score, specificity_score,
      overall_optimization_score, improvement_suggestions
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      id,
      usesXmlTags,
      usesThinkingSection,
      usesExamples,
      usesChainOfThought,
      structureScore,
      85,
      80,
      overallScore,
      JSON.stringify([]),
    ]
  );

  return true;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  if (dryRun) {
    console.log("=== DRY RUN MODE ===\n");
  }

  console.log(`Adding ${QUALITY_PROMPTS.length} more quality prompts...\n`);

  let added = 0;
  let skipped = 0;

  for (const prompt of QUALITY_PROMPTS) {
    const success = await addPrompt(prompt, dryRun);
    if (success) {
      added++;
    } else {
      skipped++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Added: ${added}`);
  console.log(`Skipped: ${skipped}`);

  // Show final stats
  const statsResult = await pool.query(`
    SELECT
      COUNT(*) as total,
      ROUND(AVG(h.overall_optimization_score)::numeric, 1) as avg_score
    FROM prompts p
    LEFT JOIN prompt_claude_hints h ON p.id = h.prompt_id
  `);

  const stats = statsResult.rows[0];
  console.log(`\n=== Final Database State ===`);
  console.log(`Total prompts: ${stats.total}`);
  console.log(`Average optimization score: ${stats.avg_score}`);

  process.exit(0);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
