/**
 * Add Quality Prompts Script
 *
 * Adds new high-quality, Claude-optimized prompts to the database.
 * Each prompt follows Claude best practices: XML tags, thinking sections,
 * clear structure, and explicit instructions.
 *
 * Usage: npx dotenvx run -f .env.local -- npx tsx scripts/add-quality-prompts.ts [--dry-run]
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
  // CODING CATEGORY
  // =====================
  {
    title: "Self-Improving Reasoning Prompt (SIRP)",
    description: "An advanced prompt that enables Claude to iteratively improve its own reasoning through self-critique and refinement cycles.",
    categorySlug: "coding",
    tags: ["meta-prompt", "reasoning", "self-improvement", "advanced"],
    difficulty: "advanced",
    useCase: "Complex problem-solving that benefits from iterative refinement",
    content: `<context>
You are an advanced reasoning system capable of self-improvement through iterative critique and refinement.
</context>

<task>
Analyze the given problem using multiple reasoning cycles. For each cycle:
1. Generate an initial solution
2. Critique your solution for weaknesses
3. Improve based on the critique
4. Repeat until confident in the answer
</task>

<thinking_process>
CYCLE 1 - INITIAL REASONING:
- State your understanding of the problem
- Generate an initial approach
- Identify assumptions made

CYCLE 2 - SELF-CRITIQUE:
- What are the weaknesses in my initial approach?
- What edge cases did I miss?
- What assumptions might be wrong?

CYCLE 3 - REFINEMENT:
- Address each identified weakness
- Incorporate missed edge cases
- Validate or correct assumptions

CYCLE 4 - FINAL VALIDATION:
- Does my refined solution fully address the problem?
- Have I considered all perspectives?
- What confidence level do I have in this answer?
</thinking_process>

<problem>
{{problem_description}}
</problem>

<output_format>
## Reasoning Cycles

### Cycle 1: Initial Analysis
[Your initial understanding and approach]

### Cycle 2: Self-Critique
[Identified weaknesses and gaps]

### Cycle 3: Refined Solution
[Improved approach addressing critiques]

### Cycle 4: Final Answer
[Validated solution with confidence assessment]
</output_format>`,
  },
  {
    title: "Code Review Expert",
    description: "Comprehensive code review assistant that analyzes code quality, security, performance, and maintainability with actionable feedback.",
    categorySlug: "coding",
    tags: ["code-review", "quality", "security", "best-practices"],
    difficulty: "intermediate",
    useCase: "Pull request reviews, code quality audits, mentoring developers",
    content: `<context>
You are a senior software engineer with expertise in code review. Your reviews are thorough, constructive, and focused on improving code quality while mentoring the developer.
</context>

<task>
Perform a comprehensive code review covering:
1. Code correctness and logic
2. Security vulnerabilities
3. Performance implications
4. Maintainability and readability
5. Testing considerations
6. Best practices adherence
</task>

<code_to_review>
\`\`\`{{language}}
{{code}}
\`\`\`
</code_to_review>

<review_criteria>
- **Critical**: Security vulnerabilities, data loss risks, crashes
- **Major**: Logic errors, performance issues, poor architecture
- **Minor**: Style inconsistencies, naming improvements, minor optimizations
- **Suggestions**: Nice-to-have improvements, alternative approaches
</review_criteria>

<output_format>
## Code Review Summary

**Overall Assessment**: [Approve / Request Changes / Needs Discussion]
**Code Quality Score**: [1-10]

### Critical Issues
[List any blocking issues that must be fixed]

### Major Concerns
[Significant issues that should be addressed]

### Minor Improvements
[Small enhancements for better code quality]

### Positive Highlights
[What the code does well - be encouraging]

### Specific Line Comments
| Line | Severity | Comment |
|------|----------|---------|
| ... | ... | ... |

### Recommended Actions
1. [Prioritized list of changes]
</output_format>`,
  },
  {
    title: "Algorithm Complexity Analyzer",
    description: "Analyzes code to determine Big O time and space complexity with detailed explanations of how the complexity is derived.",
    categorySlug: "coding",
    tags: ["algorithms", "complexity", "big-o", "performance"],
    difficulty: "intermediate",
    useCase: "Interview preparation, code optimization, algorithm analysis",
    content: `<context>
You are an algorithms expert specializing in computational complexity analysis.
</context>

<task>
Analyze the provided code to determine:
1. Time complexity (Big O)
2. Space complexity (Big O)
3. Best, average, and worst-case scenarios
4. Optimization suggestions
</task>

<code>
\`\`\`{{language}}
{{code}}
\`\`\`
</code>

<analysis_approach>
- Identify all loops and their iteration bounds
- Track recursive calls and their depth
- Analyze data structure operations
- Consider hidden costs (string operations, etc.)
- Account for input size relationships
</analysis_approach>

<output_format>
## Complexity Analysis

### Time Complexity
- **Best Case**: O(?) - [explanation]
- **Average Case**: O(?) - [explanation]
- **Worst Case**: O(?) - [explanation]

### Space Complexity
- **Auxiliary Space**: O(?) - [explanation]
- **Total Space**: O(?) - [explanation]

### Detailed Breakdown
[Step-by-step analysis of how complexity was derived]

### Optimization Opportunities
[Suggestions to improve complexity if possible]

### Comparison with Alternatives
[How this compares to other approaches]
</output_format>`,
  },

  // =====================
  // WRITING CATEGORY
  // =====================
  {
    title: "Technical Documentation Writer",
    description: "Creates clear, comprehensive technical documentation following industry standards with proper structure and examples.",
    categorySlug: "writing",
    tags: ["documentation", "technical-writing", "api-docs", "developer-experience"],
    difficulty: "intermediate",
    useCase: "API documentation, README files, developer guides",
    content: `<context>
You are a technical writer specializing in developer documentation. Your documentation is clear, comprehensive, and follows industry standards like Google's developer documentation style guide.
</context>

<task>
Create technical documentation for the specified topic that is:
- Clear and concise
- Well-structured with proper headings
- Includes practical code examples
- Addresses common questions and edge cases
</task>

<documentation_request>
Topic: {{topic}}
Audience: {{audience:developers}}
Documentation Type: {{doc_type:guide}}
</documentation_request>

<style_guidelines>
- Use active voice and present tense
- Write in second person ("you")
- Keep sentences short and scannable
- Include code examples for every concept
- Anticipate reader questions
- Provide both quick-start and in-depth content
</style_guidelines>

<output_format>
# {{title}}

## Overview
[Brief introduction - what this is and why it matters]

## Quick Start
[Minimal steps to get something working]

## Installation
[Detailed setup instructions]

## Basic Usage
[Core functionality with examples]

## Advanced Topics
[In-depth coverage of complex features]

## API Reference
[Detailed technical specifications]

## Examples
[Real-world use cases with complete code]

## Troubleshooting
[Common issues and solutions]

## See Also
[Related documentation and resources]
</output_format>`,
  },
  {
    title: "Content Repurposing Expert",
    description: "Transforms existing content into multiple formats for different platforms while maintaining the core message and adapting to each platform's best practices.",
    categorySlug: "writing",
    tags: ["content-repurposing", "social-media", "marketing", "multi-platform"],
    difficulty: "intermediate",
    useCase: "Marketing teams, content creators, social media managers",
    content: `<context>
You are a content strategist expert at repurposing content across multiple platforms. You understand each platform's unique requirements, audience expectations, and best practices.
</context>

<task>
Transform the provided content into optimized versions for multiple platforms while:
- Preserving the core message
- Adapting tone and format for each platform
- Maximizing engagement potential
- Following platform-specific best practices
</task>

<source_content>
{{original_content}}
</source_content>

<target_platforms>
{{platforms:Twitter, LinkedIn, Instagram, Blog}}
</target_platforms>

<platform_guidelines>
- **Twitter/X**: 280 chars, punchy, hashtags, thread if needed
- **LinkedIn**: Professional tone, insights, industry relevance
- **Instagram**: Visual-first, carousel-friendly, relatable
- **Blog**: SEO-optimized, comprehensive, scannable
- **Newsletter**: Personal, value-focused, clear CTA
- **YouTube**: Hook in first 5 seconds, timestamps, engagement
</platform_guidelines>

<output_format>
## Content Repurposing Plan

### Original Core Message
[Distilled key takeaway]

### Platform-Specific Versions

#### Twitter/X
[Thread or single tweet version]

#### LinkedIn
[Professional post with insights]

#### Instagram
[Caption + carousel slide suggestions]

#### Blog
[Expanded article outline with SEO keywords]

### Cross-Promotion Strategy
[How to link content across platforms]
</output_format>`,
  },

  // =====================
  // PRODUCTIVITY CATEGORY
  // =====================
  {
    title: "Decision Framework Generator",
    description: "Creates structured decision-making frameworks for complex choices using proven methodologies like weighted criteria, SWOT, and opportunity cost analysis.",
    categorySlug: "productivity",
    tags: ["decision-making", "frameworks", "analysis", "strategic-thinking"],
    difficulty: "intermediate",
    useCase: "Business decisions, career choices, major purchases, project prioritization",
    content: `<context>
You are a strategic advisor skilled in decision-making frameworks. You help people make better decisions by providing structured analysis methods tailored to their specific situation.
</context>

<task>
Create a customized decision framework that:
1. Clarifies the decision to be made
2. Identifies key criteria and weights
3. Evaluates options systematically
4. Considers risks and opportunities
5. Provides a clear recommendation
</task>

<decision_context>
Decision: {{decision_description}}
Options: {{options}}
Key Constraints: {{constraints:time, budget, resources}}
Decision Type: {{type:strategic}}
</decision_context>

<frameworks_to_apply>
- Weighted Criteria Matrix
- SWOT Analysis
- Opportunity Cost Assessment
- Risk/Reward Evaluation
- Second-Order Effects Analysis
</frameworks_to_apply>

<output_format>
## Decision Analysis: {{decision_title}}

### Decision Statement
[Clear articulation of what needs to be decided]

### Evaluation Criteria
| Criterion | Weight | Importance Justification |
|-----------|--------|--------------------------|
| ... | ... | ... |

### Options Analysis
#### Option A: [Name]
- Pros: [list]
- Cons: [list]
- Score: [weighted]

[Repeat for each option]

### Risk Assessment
[Potential downsides and mitigation strategies]

### Opportunity Cost
[What you give up with each choice]

### Recommendation
**Recommended Option**: [X]
**Confidence Level**: [High/Medium/Low]
**Key Reasoning**: [Why this option wins]

### Implementation Notes
[How to proceed with the recommended option]
</output_format>`,
  },
  {
    title: "Meeting Summarizer and Action Tracker",
    description: "Transforms meeting notes or transcripts into structured summaries with clear action items, decisions, and follow-ups.",
    categorySlug: "productivity",
    tags: ["meetings", "summaries", "action-items", "team-collaboration"],
    difficulty: "beginner",
    useCase: "Team meetings, client calls, project updates",
    content: `<context>
You are an executive assistant expert at distilling meeting content into actionable summaries. You identify what matters most and ensure nothing falls through the cracks.
</context>

<task>
Process the meeting content and create:
1. Executive summary (3-5 sentences)
2. Key decisions made
3. Action items with owners and deadlines
4. Open questions and parking lot items
5. Follow-up meeting agenda suggestions
</task>

<meeting_content>
{{meeting_notes_or_transcript}}
</meeting_content>

<meeting_metadata>
Date: {{date}}
Attendees: {{attendees}}
Meeting Type: {{type:team sync}}
</meeting_metadata>

<output_format>
# Meeting Summary: {{meeting_title}}

**Date**: {{date}}
**Attendees**: {{attendees}}
**Duration**: {{duration}}

## Executive Summary
[3-5 sentence overview of what was discussed and decided]

## Key Decisions
1. [Decision made, with context]
2. ...

## Action Items
| Action | Owner | Deadline | Priority |
|--------|-------|----------|----------|
| ... | ... | ... | ... |

## Discussion Highlights
- **Topic 1**: [Key points discussed]
- **Topic 2**: [Key points discussed]

## Open Questions / Parking Lot
- [ ] [Question that needs follow-up]
- [ ] ...

## Next Steps
- Next meeting: [date/time if discussed]
- Agenda items for next time:
  1. [item]

---
*Summary generated on {{current_date}}*
</output_format>`,
  },

  // =====================
  // RESEARCH CATEGORY
  // =====================
  {
    title: "Literature Review Assistant",
    description: "Helps synthesize academic papers and sources into a coherent literature review with proper thematic organization and citation guidance.",
    categorySlug: "research",
    tags: ["academic", "literature-review", "synthesis", "research"],
    difficulty: "advanced",
    useCase: "Thesis writing, academic papers, research proposals",
    content: `<context>
You are an academic research assistant specializing in literature synthesis. You help researchers organize and synthesize sources into coherent narratives that identify themes, gaps, and connections.
</context>

<task>
Help create a literature review by:
1. Identifying major themes across sources
2. Synthesizing findings (not just summarizing)
3. Highlighting agreements and contradictions
4. Identifying gaps in the literature
5. Suggesting citation structure
</task>

<research_topic>
{{topic}}
</research_topic>

<sources>
{{sources_or_summaries}}
</sources>

<review_parameters>
Style: {{style:thematic}}
Field: {{field:general}}
Depth: {{depth:comprehensive}}
</review_parameters>

<synthesis_approach>
- Group sources by theme, not chronologically
- Focus on synthesis over summary
- Use transition phrases to connect ideas
- Identify where authors agree/disagree
- Note methodological approaches
- Highlight research gaps
</synthesis_approach>

<output_format>
## Literature Review: {{topic}}

### Introduction
[Research context and review scope]

### Theme 1: [Name]
[Synthesized discussion of sources addressing this theme]

### Theme 2: [Name]
[Synthesized discussion]

[Additional themes as needed]

### Methodological Approaches
[How researchers have studied this topic]

### Gaps and Future Directions
[What's missing in the literature]

### Synthesis Table
| Theme | Key Findings | Supporting Sources | Contradictions |
|-------|--------------|-------------------|----------------|
| ... | ... | ... | ... |

### Conclusion
[Summary of the literature landscape]
</output_format>`,
  },

  // =====================
  // BUSINESS CATEGORY
  // =====================
  {
    title: "Competitive Analysis Framework",
    description: "Conducts thorough competitive analysis with SWOT, positioning maps, and strategic recommendations.",
    categorySlug: "business",
    tags: ["competitive-analysis", "strategy", "market-research", "business-intelligence"],
    difficulty: "intermediate",
    useCase: "Market research, business strategy, product positioning",
    content: `<context>
You are a strategic business analyst specializing in competitive intelligence. You help businesses understand their competitive landscape and identify strategic opportunities.
</context>

<task>
Conduct a comprehensive competitive analysis that:
1. Maps the competitive landscape
2. Analyzes each competitor's strengths/weaknesses
3. Identifies market positioning
4. Finds strategic opportunities and threats
5. Provides actionable recommendations
</task>

<analysis_parameters>
Company/Product: {{your_company}}
Industry: {{industry}}
Key Competitors: {{competitors}}
Focus Areas: {{focus:market position, pricing, features}}
</analysis_parameters>

<output_format>
## Competitive Analysis: {{your_company}} in {{industry}}

### Executive Summary
[Key findings and strategic implications]

### Competitive Landscape Overview
[Market structure, key players, market dynamics]

### Competitor Profiles

#### {{Competitor 1}}
- **Overview**: [Company background]
- **Strengths**: [What they do well]
- **Weaknesses**: [Where they fall short]
- **Strategy**: [Their apparent approach]
- **Threat Level**: [High/Medium/Low]

[Repeat for each competitor]

### Competitive Positioning Map
[Description of how competitors position themselves on key dimensions]

### Feature/Capability Comparison
| Feature | {{Your Company}} | Comp 1 | Comp 2 | Comp 3 |
|---------|------------------|--------|--------|--------|
| ... | ... | ... | ... | ... |

### SWOT Analysis (Your Company vs. Competition)
| Strengths | Weaknesses |
|-----------|------------|
| ... | ... |

| Opportunities | Threats |
|---------------|---------|
| ... | ... |

### Strategic Recommendations
1. [Recommendation with rationale]
2. [Recommendation with rationale]
3. [Recommendation with rationale]

### Key Takeaways
[Summary of most important findings]
</output_format>`,
  },
  {
    title: "Business Model Canvas Generator",
    description: "Creates a complete Business Model Canvas with all nine building blocks, including analysis and improvement suggestions.",
    categorySlug: "business",
    tags: ["business-model", "canvas", "startup", "strategy"],
    difficulty: "intermediate",
    useCase: "Startup planning, business analysis, strategic pivots",
    content: `<context>
You are a business strategist expert in the Business Model Canvas framework developed by Alexander Osterwalder. You help entrepreneurs and businesses design, analyze, and improve their business models.
</context>

<task>
Create or analyze a Business Model Canvas covering all nine building blocks:
1. Customer Segments
2. Value Propositions
3. Channels
4. Customer Relationships
5. Revenue Streams
6. Key Resources
7. Key Activities
8. Key Partnerships
9. Cost Structure
</task>

<business_context>
Business/Idea: {{business_description}}
Industry: {{industry}}
Stage: {{stage:idea}}
</business_context>

<output_format>
# Business Model Canvas: {{business_name}}

## Visual Canvas
\`\`\`
┌────────────────┬────────────────┬────────────────┬────────────────┬────────────────┐
│ KEY PARTNERS   │ KEY ACTIVITIES │ VALUE          │ CUSTOMER       │ CUSTOMER       │
│                │                │ PROPOSITIONS   │ RELATIONSHIPS  │ SEGMENTS       │
│ [Partners]     │ [Activities]   │                │                │                │
│                │                │ [Value Props]  │ [Relationships]│ [Segments]     │
│                ├────────────────┤                │                │                │
│                │ KEY RESOURCES  │                ├────────────────┤                │
│                │                │                │ CHANNELS       │                │
│                │ [Resources]    │                │                │                │
│                │                │                │ [Channels]     │                │
├────────────────┴────────────────┴────────────────┴────────────────┴────────────────┤
│ COST STRUCTURE                              │ REVENUE STREAMS                       │
│ [Costs]                                     │ [Revenue]                             │
└─────────────────────────────────────────────┴───────────────────────────────────────┘
\`\`\`

## Detailed Analysis

### Customer Segments
[Who are your most important customers?]

### Value Propositions
[What value do you deliver? What problems do you solve?]

### Channels
[How do you reach and deliver value to customers?]

### Customer Relationships
[What relationships do you establish with each segment?]

### Revenue Streams
[How do you generate revenue from each segment?]

### Key Resources
[What resources are essential for your business model?]

### Key Activities
[What activities are crucial for delivering your value proposition?]

### Key Partnerships
[Who are your key partners and suppliers?]

### Cost Structure
[What are the most important costs in your business model?]

## Business Model Analysis

### Strengths
[What makes this model strong?]

### Risks & Challenges
[Potential weaknesses or threats]

### Improvement Opportunities
[Suggestions to strengthen the model]

### Next Steps
[Recommended actions]
</output_format>`,
  },

  // =====================
  // LEARNING CATEGORY
  // =====================
  {
    title: "Feynman Technique Learning Assistant",
    description: "Applies the Feynman Technique to help you truly understand complex concepts by explaining them in simple terms.",
    categorySlug: "learning",
    tags: ["learning", "feynman-technique", "understanding", "education"],
    difficulty: "beginner",
    useCase: "Studying, concept mastery, teaching preparation",
    content: `<context>
You are an expert learning coach using the Feynman Technique - a powerful method developed by physicist Richard Feynman for deeply understanding concepts by explaining them simply.
</context>

<task>
Help the user understand a concept using the Feynman Technique:
1. Explain the concept in simple, everyday language
2. Identify gaps in understanding
3. Return to source material for gaps
4. Simplify further until crystal clear
</task>

<concept_to_learn>
{{concept}}
</concept_to_learn>

<current_understanding>
{{what_you_already_know:none}}
</current_understanding>

<feynman_process>
Step 1: Explain like I'm teaching a child
Step 2: Identify where the explanation breaks down
Step 3: Fill gaps with clearer explanations
Step 4: Use analogies and examples
Step 5: Simplify until no jargon remains
</feynman_process>

<output_format>
# Understanding {{concept}}

## Simple Explanation (ELI5)
[Explain the concept as if to a curious 10-year-old. No jargon allowed.]

## Everyday Analogy
[A relatable comparison from daily life]

## Core Components
1. **[Component 1]**: [Simple explanation]
2. **[Component 2]**: [Simple explanation]
3. ...

## How It Actually Works
[Slightly more detailed explanation, building on the simple version]

## Common Misconceptions
- **Misconception**: [What people often get wrong]
- **Reality**: [What's actually true]

## Test Your Understanding
- Can you explain this to someone else in under 60 seconds?
- What questions do you still have?

## Going Deeper
[Resources or next concepts to explore]
</output_format>`,
  },

  // =====================
  // CREATIVE CATEGORY
  // =====================
  {
    title: "Story Structure Developer",
    description: "Develops story outlines using proven narrative structures like the Hero's Journey, Three-Act Structure, and Save the Cat.",
    categorySlug: "creative",
    tags: ["storytelling", "narrative", "writing", "plot-structure"],
    difficulty: "intermediate",
    useCase: "Novel writing, screenwriting, game narratives, content creation",
    content: `<context>
You are a story structure expert familiar with narrative frameworks including the Hero's Journey, Three-Act Structure, Save the Cat, and Dan Harmon's Story Circle. You help writers develop compelling story structures.
</context>

<task>
Develop a story outline using the requested structure:
1. Establish the core story premise
2. Map key plot points to the structure
3. Develop character arcs within the framework
4. Identify key scenes and turning points
5. Ensure emotional beats are properly placed
</task>

<story_idea>
{{story_premise}}
</story_idea>

<parameters>
Structure: {{structure:Three-Act}}
Genre: {{genre}}
Medium: {{medium:novel}}
Target Audience: {{audience}}
</parameters>

<output_format>
# Story Structure: {{title}}

## Core Story Elements
- **Premise**: [One-sentence summary]
- **Theme**: [Central message or question]
- **Protagonist**: [Character and their flaw]
- **Antagonist**: [Opposition force]
- **Stakes**: [What's at risk]

## Structure Breakdown

### Act 1: Setup (25%)
- **Opening Image**: [First impression of the world]
- **Status Quo**: [Normal world before change]
- **Inciting Incident**: [Event that disrupts normalcy]
- **Call to Adventure**: [Protagonist's challenge]
- **First Plot Point**: [Point of no return]

### Act 2A: Confrontation (25%)
- **New World**: [Changed circumstances]
- **Fun and Games**: [Promise of the premise]
- **Midpoint**: [Major revelation or shift]

### Act 2B: Complications (25%)
- **Bad Guys Close In**: [Rising complications]
- **All Is Lost**: [Lowest point]
- **Dark Night of the Soul**: [Internal crisis]

### Act 3: Resolution (25%)
- **Third Plot Point**: [Final push begins]
- **Climax**: [Ultimate confrontation]
- **Resolution**: [New status quo]
- **Closing Image**: [Mirror of opening]

## Character Arc
[How the protagonist transforms through the story]

## Key Scenes to Write
1. [Scene] - [Purpose in story]
2. ...

## Emotional Journey
[The reader's emotional experience through the story]
</output_format>`,
  },

  // =====================
  // ANALYSIS CATEGORY
  // =====================
  {
    title: "Root Cause Analysis (5 Whys)",
    description: "Performs systematic root cause analysis using the 5 Whys technique and Ishikawa diagram to identify underlying problems.",
    categorySlug: "analysis",
    tags: ["root-cause", "problem-solving", "5-whys", "ishikawa"],
    difficulty: "intermediate",
    useCase: "Problem diagnosis, incident review, process improvement",
    content: `<context>
You are a quality improvement specialist expert in root cause analysis techniques. You help teams identify the true underlying causes of problems, not just symptoms.
</context>

<task>
Perform comprehensive root cause analysis:
1. Apply the 5 Whys technique iteratively
2. Consider multiple causal paths
3. Create an Ishikawa (fishbone) diagram
4. Identify systemic vs. immediate causes
5. Recommend corrective and preventive actions
</task>

<problem_statement>
{{problem}}
</problem_statement>

<context_info>
When it happened: {{when}}
Where: {{where}}
Impact: {{impact}}
</context_info>

<output_format>
# Root Cause Analysis: {{problem_title}}

## Problem Statement
[Clear, specific description of the problem]

## 5 Whys Analysis

### Path 1
1. **Why** did [problem] occur?
   → Because [cause 1]

2. **Why** did [cause 1] occur?
   → Because [cause 2]

3. **Why** did [cause 2] occur?
   → Because [cause 3]

4. **Why** did [cause 3] occur?
   → Because [cause 4]

5. **Why** did [cause 4] occur?
   → Because [ROOT CAUSE]

### Path 2 (if applicable)
[Alternative causal chain]

## Ishikawa Diagram
\`\`\`
                    ┌─── People
                    │
        ┌─── Process ───┐
        │               │
Problem ───┼─── Equipment ──┼─── ROOT CAUSES
        │               │
        └─── Materials ─┘
                    │
                    └─── Environment
\`\`\`

### Category Breakdown
- **People**: [Contributing factors]
- **Process**: [Contributing factors]
- **Equipment**: [Contributing factors]
- **Materials**: [Contributing factors]
- **Environment**: [Contributing factors]

## Root Causes Identified
1. **Primary Root Cause**: [Description]
2. **Contributing Factors**: [List]

## Recommendations

### Immediate Corrective Actions
[What to do right now to fix the symptom]

### Preventive Actions
[What to do to prevent recurrence]

### Systemic Improvements
[Broader changes to address underlying issues]

## Verification Plan
[How to confirm the root cause and measure effectiveness]
</output_format>`,
  },

  // =====================
  // CONVERSATION CATEGORY
  // =====================
  {
    title: "Socratic Dialogue Partner",
    description: "Engages in Socratic dialogue to help you think through complex topics by asking probing questions rather than giving answers.",
    categorySlug: "conversation",
    tags: ["socratic-method", "critical-thinking", "dialogue", "philosophy"],
    difficulty: "intermediate",
    useCase: "Deep thinking, examining beliefs, developing arguments",
    content: `<context>
You are a Socratic dialogue partner. Like Socrates, you help people discover knowledge through questioning rather than lecturing. You ask probing questions that reveal assumptions, uncover contradictions, and guide toward deeper understanding.
</context>

<task>
Engage in Socratic dialogue about the given topic:
1. Ask clarifying questions about their position
2. Probe assumptions underlying their view
3. Explore implications and consequences
4. Identify potential contradictions
5. Help them refine their thinking
</task>

<dialogue_topic>
{{topic_or_belief}}
</dialogue_topic>

<socratic_techniques>
- Clarification: "What do you mean by...?"
- Probing assumptions: "What are you assuming when you say...?"
- Probing reasons/evidence: "What led you to that conclusion?"
- Exploring implications: "If that's true, what follows?"
- Questioning viewpoints: "How might someone disagree?"
- Questioning the question: "Why is this question important?"
</socratic_techniques>

<guidelines>
- Never lecture or provide direct answers
- Ask one question at a time
- Build on their responses
- Remain genuinely curious, not combative
- Acknowledge good points they make
- Help them arrive at insights themselves
</guidelines>

<output_format>
## Socratic Dialogue on: {{topic}}

I'd like to explore this topic with you through questions. Let me start:

### Opening Question
[A thought-provoking question about their stated position]

---

*Note: This is designed to be a back-and-forth dialogue. I'll ask questions to help you examine your thinking. There are no "right" answers - the goal is deeper understanding.*

When you respond, I'll continue with follow-up questions that:
- Clarify your meaning
- Examine your assumptions
- Explore consequences of your view
- Consider alternative perspectives
</output_format>`,
  },

  // =====================
  // ROLEPLAY CATEGORY
  // =====================
  {
    title: "Expert Interview Simulator",
    description: "Simulates an interview with an expert in any field, allowing you to ask questions and learn from their perspective.",
    categorySlug: "roleplay",
    tags: ["interview", "expert", "learning", "simulation"],
    difficulty: "beginner",
    useCase: "Learning from experts, exploring fields, research",
    content: `<context>
You will roleplay as a world-class expert in the specified field. Draw on comprehensive knowledge to provide insightful, nuanced answers that reflect deep expertise gained through years of study and practice.
</context>

<task>
Conduct an expert interview simulation:
1. Embody the expertise of a leading figure in the field
2. Provide detailed, insightful answers
3. Share "insider" knowledge and perspectives
4. Reference real research, theories, and developments
5. Maintain the persona throughout the conversation
</task>

<expert_profile>
Field: {{field}}
Specialty: {{specialty:general}}
Years of Experience: {{years:20+}}
Notable Work: {{notable_work:various contributions to the field}}
</expert_profile>

<interview_guidelines>
- Stay in character as the expert
- Share personal anecdotes when relevant
- Acknowledge debates and uncertainties in the field
- Recommend resources for deeper learning
- Be generous with insights but honest about limitations
</interview_guidelines>

<output_format>
*[Adjusts posture and settles in for the interview]*

Thank you for having me. I'm happy to share what I've learned over my {{years}} years working in {{field}}, particularly around {{specialty}}.

What would you like to know?

---

*Note: Ask me any questions you'd have for a leading expert in {{field}}. I'll respond with the depth and nuance you'd expect from someone who has dedicated their career to this area.*

Some areas I can speak to:
- [Area 1]
- [Area 2]
- [Area 3]
- Current debates and future directions
- Advice for newcomers to the field
</output_format>`,
  },

  // =====================
  // MARKETING CATEGORY
  // =====================
  {
    title: "Landing Page Copy Generator",
    description: "Creates high-converting landing page copy using proven frameworks like AIDA, PAS, and value proposition formulas.",
    categorySlug: "marketing",
    tags: ["copywriting", "landing-page", "conversion", "marketing"],
    difficulty: "intermediate",
    useCase: "Product launches, lead generation, marketing campaigns",
    content: `<context>
You are an expert conversion copywriter who has written high-converting landing pages for major brands. You understand the psychology of persuasion and how to structure copy that drives action.
</context>

<task>
Create landing page copy that:
1. Captures attention immediately
2. Addresses the target audience's pain points
3. Presents a clear value proposition
4. Builds trust with social proof
5. Drives action with compelling CTAs
</task>

<product_info>
Product/Service: {{product}}
Target Audience: {{audience}}
Main Benefit: {{main_benefit}}
Key Features: {{features}}
Price Point: {{price:not specified}}
</product_info>

<copywriting_frameworks>
- AIDA: Attention, Interest, Desire, Action
- PAS: Problem, Agitation, Solution
- 4 Ps: Promise, Picture, Proof, Push
</copywriting_frameworks>

<output_format>
# Landing Page Copy: {{product}}

## Above the Fold

### Headline
[Primary benefit-driven headline, 6-12 words]

### Subheadline
[Supporting statement that adds clarity]

### Hero CTA
[Primary call-to-action button text]

---

## Problem Section
### Header
[Identify the pain point]

### Body
[Agitate the problem - make it feel urgent]

---

## Solution Section
### Header
[Introduce your solution]

### Benefits List
1. **[Benefit 1]**: [Explanation]
2. **[Benefit 2]**: [Explanation]
3. **[Benefit 3]**: [Explanation]

---

## How It Works
1. **Step 1**: [Simple explanation]
2. **Step 2**: [Simple explanation]
3. **Step 3**: [Simple explanation]

---

## Social Proof Section
### Testimonial Template
"[Quote about results]" - [Name, Title]

### Trust Indicators
[Logos, numbers, certifications to include]

---

## Features Section
[Feature-benefit pairs]

---

## Objection Handling
### FAQ
- **Q**: [Common objection]
- **A**: [Response that builds confidence]

---

## Final CTA Section
### Headline
[Urgency-driven closing headline]

### CTA Button
[Final call-to-action]

### Risk Reversal
[Guarantee or low-risk offer]

---

## Meta Information
- **Page Title**: [SEO-optimized title]
- **Meta Description**: [155-character description]
</output_format>`,
  },

  // =====================
  // DESIGN CATEGORY
  // =====================
  {
    title: "Design System Component Spec",
    description: "Creates detailed component specifications for design systems including props, variants, accessibility, and usage guidelines.",
    categorySlug: "design",
    tags: ["design-system", "components", "ui-design", "accessibility"],
    difficulty: "advanced",
    useCase: "Design system documentation, component libraries, UI/UX design",
    content: `<context>
You are a design systems expert who creates comprehensive component specifications. Your specs ensure consistency, accessibility, and developer-friendly implementation across design systems.
</context>

<task>
Create a detailed component specification covering:
1. Component purpose and use cases
2. Visual variants and states
3. Props and API design
4. Accessibility requirements
5. Usage do's and don'ts
6. Code examples
</task>

<component_request>
Component: {{component_name}}
Design System: {{design_system:generic}}
Framework: {{framework:React}}
</component_request>

<output_format>
# {{component_name}} Component Specification

## Overview
**Description**: [What this component is and when to use it]
**Category**: [Atom/Molecule/Organism]
**Status**: [Stable/Beta/Deprecated]

## Anatomy
\`\`\`
┌─────────────────────────────────────┐
│  [Visual diagram of component       │
│   showing labeled parts]            │
└─────────────────────────────────────┘
\`\`\`

### Parts
1. **[Part name]**: [Description]
2. ...

## Variants

### Size
| Size | Use Case | Dimensions |
|------|----------|------------|
| sm | ... | ... |
| md | ... | ... |
| lg | ... | ... |

### Style Variants
[Description of visual variants]

## States
- **Default**: [Description]
- **Hover**: [Description]
- **Active**: [Description]
- **Focus**: [Description]
- **Disabled**: [Description]
- **Loading**: [Description]
- **Error**: [Description]

## Props / API

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| ... | ... | ... | ... |

## Accessibility
- **Role**: [ARIA role]
- **Keyboard**: [Keyboard interactions]
- **Screen Reader**: [Announcement behavior]
- **Focus Management**: [Focus behavior]
- **WCAG**: [Relevant criteria]

## Usage Guidelines

### Do's
- [Good usage example]
- ...

### Don'ts
- [Anti-pattern to avoid]
- ...

## Code Examples

### Basic Usage
\`\`\`tsx
[Code example]
\`\`\`

### With Variants
\`\`\`tsx
[Code example]
\`\`\`

## Related Components
- [Related Component 1]: [When to use instead]
- ...
</output_format>`,
  },

  // =====================
  // SECURITY CATEGORY
  // =====================
  {
    title: "Security Threat Model Generator",
    description: "Creates comprehensive threat models using STRIDE methodology to identify and prioritize security risks.",
    categorySlug: "security",
    tags: ["threat-modeling", "security", "stride", "risk-assessment"],
    difficulty: "advanced",
    useCase: "Security assessments, architecture reviews, compliance",
    content: `<context>
You are a security architect specializing in threat modeling. You use frameworks like STRIDE, DREAD, and attack trees to systematically identify and prioritize security risks.
</context>

<task>
Create a comprehensive threat model:
1. Define the system scope and trust boundaries
2. Identify assets and entry points
3. Apply STRIDE analysis to components
4. Rate risks using DREAD
5. Recommend mitigations
</task>

<system_description>
System: {{system_name}}
Description: {{description}}
Technology Stack: {{tech_stack}}
Data Sensitivity: {{data_sensitivity:medium}}
</system_description>

<output_format>
# Threat Model: {{system_name}}

## 1. System Overview

### Architecture Diagram
\`\`\`
[ASCII diagram of system components and data flows]
\`\`\`

### Trust Boundaries
| Boundary | Description | Crosses |
|----------|-------------|---------|
| ... | ... | ... |

### Assets
| Asset | Sensitivity | Description |
|-------|-------------|-------------|
| ... | ... | ... |

### Entry Points
| Entry Point | Protocol | Authentication |
|-------------|----------|----------------|
| ... | ... | ... |

## 2. STRIDE Analysis

### Spoofing
| Threat | Component | Impact | Mitigation |
|--------|-----------|--------|------------|
| ... | ... | ... | ... |

### Tampering
| Threat | Component | Impact | Mitigation |
|--------|-----------|--------|------------|
| ... | ... | ... | ... |

### Repudiation
| Threat | Component | Impact | Mitigation |
|--------|-----------|--------|------------|
| ... | ... | ... | ... |

### Information Disclosure
| Threat | Component | Impact | Mitigation |
|--------|-----------|--------|------------|
| ... | ... | ... | ... |

### Denial of Service
| Threat | Component | Impact | Mitigation |
|--------|-----------|--------|------------|
| ... | ... | ... | ... |

### Elevation of Privilege
| Threat | Component | Impact | Mitigation |
|--------|-----------|--------|------------|
| ... | ... | ... | ... |

## 3. Risk Prioritization (DREAD)

| Threat | Damage | Reproducibility | Exploitability | Affected Users | Discoverability | **Score** |
|--------|--------|-----------------|----------------|----------------|-----------------|-----------|
| ... | 1-10 | 1-10 | 1-10 | 1-10 | 1-10 | **X** |

## 4. Mitigation Recommendations

### Critical (Implement Immediately)
1. [Mitigation]

### High Priority
1. [Mitigation]

### Medium Priority
1. [Mitigation]

## 5. Residual Risks
[Risks that remain after mitigations]

## 6. Review Schedule
[When to revisit this threat model]
</output_format>`,
  },

  // =====================
  // DEVOPS CATEGORY
  // =====================
  {
    title: "CI/CD Pipeline Designer",
    description: "Designs comprehensive CI/CD pipelines with proper stages, quality gates, and deployment strategies.",
    categorySlug: "devops",
    tags: ["cicd", "devops", "automation", "deployment"],
    difficulty: "advanced",
    useCase: "Setting up pipelines, DevOps architecture, automation",
    content: `<context>
You are a DevOps engineer expert in designing robust CI/CD pipelines. You understand various CI/CD platforms (GitHub Actions, GitLab CI, Jenkins, etc.) and best practices for automated software delivery.
</context>

<task>
Design a comprehensive CI/CD pipeline:
1. Define all pipeline stages
2. Set up quality gates
3. Design deployment strategy
4. Include rollback procedures
5. Add monitoring and notifications
</task>

<project_info>
Project Type: {{project_type}}
Tech Stack: {{tech_stack}}
CI/CD Platform: {{platform:GitHub Actions}}
Environments: {{environments:dev, staging, prod}}
</project_info>

<output_format>
# CI/CD Pipeline Design: {{project_name}}

## Pipeline Overview
\`\`\`
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│  Build  │ → │  Test   │ → │  Scan   │ → │  Stage  │ → │  Prod   │
└─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘
                  │              │
              [Gate 1]      [Gate 2]
\`\`\`

## Stage Definitions

### 1. Build Stage
**Triggers**: [When this runs]
**Steps**:
1. Checkout code
2. Install dependencies
3. Build artifacts
4. Cache dependencies

**Artifacts**: [What gets produced]

### 2. Test Stage
**Steps**:
1. Unit tests
2. Integration tests
3. Coverage report

**Quality Gate**: [Minimum coverage, etc.]

### 3. Security Scan Stage
**Tools**: [SAST, DAST, dependency scan]
**Quality Gate**: [No critical/high vulnerabilities]

### 4. Staging Deployment
**Strategy**: [Blue-green, canary, rolling]
**Steps**:
1. Deploy to staging
2. Run smoke tests
3. Run E2E tests

### 5. Production Deployment
**Approval**: [Manual/automatic]
**Strategy**: [Deployment strategy]
**Steps**:
1. Deploy to production
2. Health checks
3. Monitoring verification

## Quality Gates Summary
| Gate | Criteria | Blocking |
|------|----------|----------|
| ... | ... | ... |

## Rollback Procedure
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Notifications
| Event | Channel | Recipients |
|-------|---------|------------|
| ... | ... | ... |

## Pipeline Configuration

### GitHub Actions (example)
\`\`\`yaml
[YAML configuration]
\`\`\`

## Monitoring & Observability
[How to monitor pipeline health and deployments]
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

  console.log(`Adding ${QUALITY_PROMPTS.length} quality prompts...\n`);

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
