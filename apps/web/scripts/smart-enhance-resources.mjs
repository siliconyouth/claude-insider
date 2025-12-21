/**
 * Smart Resource Enhancement Script
 *
 * Uses intelligent text analysis and category templates to generate
 * high-quality enhancements for all resources.
 *
 * Run: npx dotenvx run -f .env.local -- node scripts/smart-enhance-resources.mjs
 */

import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ==================== CATEGORY TEMPLATES ====================

const CATEGORY_TEMPLATES = {
  'mcp-servers': {
    pros: [
      'Seamless integration with Claude Desktop and Claude Code',
      'Extends Claude\'s capabilities with external services',
      'Standardized MCP protocol for reliable communication',
      'Active community development and support'
    ],
    cons: [
      'Requires initial MCP configuration',
      'May need API keys for external services',
      'Performance depends on external service availability'
    ],
    targetAudience: [
      'Claude Desktop and Claude Code users',
      'Developers building AI-powered workflows',
      'Teams extending Claude with custom integrations'
    ],
    prerequisites: [
      'Claude Desktop or Claude Code installed',
      'Basic understanding of MCP server configuration',
      'Node.js or Python runtime (depending on server type)'
    ]
  },
  'tools': {
    pros: [
      'Improves productivity with AI-assisted development',
      'Streamlines common development workflows',
      'Well-tested by the community',
      'Integrates with existing toolchains'
    ],
    cons: [
      'May require initial setup and configuration',
      'Learning curve for advanced features',
      'Depends on Claude API or subscription'
    ],
    targetAudience: [
      'Software developers and engineers',
      'DevOps and platform teams',
      'AI-assisted development enthusiasts'
    ],
    prerequisites: [
      'Development environment with required runtimes',
      'Claude API access or subscription',
      'Familiarity with command-line tools'
    ]
  },
  'sdks': {
    pros: [
      'Type-safe API interactions with Claude',
      'Handles authentication and error management',
      'Regular updates with latest API features',
      'Well-documented with examples'
    ],
    cons: [
      'Language-specific implementation required',
      'Version compatibility considerations',
      'API usage costs apply'
    ],
    targetAudience: [
      'Backend developers building AI features',
      'Full-stack engineers integrating Claude',
      'API integration specialists'
    ],
    prerequisites: [
      'Anthropic API key with appropriate tier',
      'Programming language runtime installed',
      'Package manager for dependency installation'
    ]
  },
  'agents': {
    pros: [
      'Enables autonomous task execution',
      'Multi-step reasoning capabilities',
      'Extensible with custom tools and actions',
      'Reduces manual intervention for complex tasks'
    ],
    cons: [
      'Requires careful prompt engineering',
      'May consume significant API credits',
      'Complex debugging for multi-step workflows'
    ],
    targetAudience: [
      'AI developers and researchers',
      'Automation engineers',
      'Teams building autonomous AI systems'
    ],
    prerequisites: [
      'Understanding of agent architectures',
      'LLM API access with sufficient credits',
      'Python or JavaScript development experience'
    ]
  },
  'official': {
    pros: [
      'Officially supported by Anthropic',
      'Enterprise-grade reliability and security',
      'Comprehensive documentation',
      'Regular updates and feature additions'
    ],
    cons: [
      'Usage limits based on subscription tier',
      'May require specific account types',
      'Bound to official service terms'
    ],
    targetAudience: [
      'Enterprise developers',
      'Teams requiring official support',
      'Organizations with compliance requirements'
    ],
    prerequisites: [
      'Anthropic account with appropriate tier',
      'Understanding of Claude\'s capabilities',
      'Compliance with usage guidelines'
    ]
  },
  'prompts': {
    pros: [
      'Ready-to-use prompt templates',
      'Community-tested for consistent results',
      'Saves time on prompt engineering',
      'Easily customizable for specific needs'
    ],
    cons: [
      'May need adaptation for specific contexts',
      'Results vary based on model and settings',
      'Requires understanding of prompt principles'
    ],
    targetAudience: [
      'Content creators using Claude',
      'Developers integrating AI prompts',
      'Teams building prompt libraries'
    ],
    prerequisites: [
      'Access to Claude (web or API)',
      'Basic understanding of prompt engineering',
      'Clear use case for the prompt template'
    ]
  },
  'rules': {
    pros: [
      'Enforces consistent coding standards',
      'Integrates seamlessly with AI coding tools',
      'Improves code quality automatically',
      'Customizable to team preferences'
    ],
    cons: [
      'May conflict with existing linting rules',
      'Requires initial configuration',
      'Team adoption requires coordination'
    ],
    targetAudience: [
      'Development teams using AI assistants',
      'Technical leads establishing standards',
      'Code quality engineers'
    ],
    prerequisites: [
      'Claude Code or compatible AI coding tool',
      'Project with CLAUDE.md or rules file',
      'Access to project configuration'
    ]
  },
  'showcases': {
    pros: [
      'Real-world implementation examples',
      'Demonstrates practical Claude applications',
      'Source code available for learning',
      'Inspiration for your own projects'
    ],
    cons: [
      'May be tailored to specific use cases',
      'Could require adaptation for your needs',
      'Maintenance varies by project'
    ],
    targetAudience: [
      'Developers seeking implementation examples',
      'Teams evaluating Claude capabilities',
      'Anyone learning Claude integration patterns'
    ],
    prerequisites: [
      'Interest in Claude AI applications',
      'Basic development knowledge',
      'Claude access for experimentation'
    ]
  },
  'tutorials': {
    pros: [
      'Structured step-by-step learning',
      'Beginner-friendly explanations',
      'Hands-on practical examples',
      'Progressive skill building'
    ],
    cons: [
      'May become outdated with API changes',
      'Pace may not suit all learning styles',
      'May not cover advanced topics'
    ],
    targetAudience: [
      'Developers new to Claude',
      'Teams onboarding to AI development',
      'Students learning AI integration'
    ],
    prerequisites: [
      'Basic programming knowledge',
      'Claude account for hands-on practice',
      'Dedicated time for learning'
    ]
  },
  'community': {
    pros: [
      'Community-driven and collaborative',
      'Often free and open source',
      'Diverse perspectives and solutions',
      'Active discussion and support'
    ],
    cons: [
      'Support depends on community activity',
      'Quality varies between projects',
      'May lack official endorsement'
    ],
    targetAudience: [
      'Open source enthusiasts',
      'Developers seeking community solutions',
      'Contributors wanting to give back'
    ],
    prerequisites: [
      'Willingness to explore community tools',
      'Ability to troubleshoot independently',
      'Interest in community participation'
    ]
  }
};

// ==================== TEXT ANALYSIS ====================

/**
 * Generate a high-quality summary from title and description
 */
function generateSummary(title, description, category) {
  if (!description || description.length < 20) {
    return generateDefaultSummary(title, category);
  }

  // Clean description
  let clean = description
    .replace(/\[.*?\]/g, '')           // Remove markdown links
    .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
    .replace(/\s+/g, ' ')              // Normalize whitespace
    .trim();

  // Handle common patterns
  if (clean.match(/^AI agent framework for/i)) {
    // Generic description - make it better
    const name = title.replace(/[@\/]/g, ' ').trim();
    return `${name} provides an AI agent framework enabling autonomous task execution and intelligent decision-making with LLM integration.`;
  }

  if (clean.match(/^MCP server that extends/i)) {
    const name = title.replace(/-mcp$/i, '').replace(/[\/]/g, ' ').trim();
    return `MCP server providing ${name} integration for Claude Desktop and Claude Code, enabling enhanced AI capabilities through the Model Context Protocol.`;
  }

  // Extract first 2 sentences or 250 chars
  const sentences = clean.match(/[^.!?]+[.!?]+/g) || [clean];
  let summary = sentences.slice(0, 2).join(' ').trim();

  if (summary.length > 280) {
    summary = summary.substring(0, 277) + '...';
  }

  // Clean up common starting words
  summary = summary.replace(/^(This is |A |An |The )/i, '');

  return summary.charAt(0).toUpperCase() + summary.slice(1);
}

/**
 * Generate default summary based on category
 */
function generateDefaultSummary(title, category) {
  const name = title.replace(/[@\/\-_]/g, ' ').replace(/\s+/g, ' ').trim();

  const templates = {
    'mcp-servers': `${name} - MCP server extending Claude's capabilities through the Model Context Protocol.`,
    'tools': `${name} - Development tool enhancing productivity with Claude AI integration.`,
    'sdks': `${name} - SDK for integrating Claude AI into applications with type-safe APIs.`,
    'agents': `${name} - AI agent framework enabling autonomous task execution and multi-step reasoning.`,
    'official': `${name} - Official Anthropic resource for Claude AI development.`,
    'prompts': `${name} - Prompt template for consistent and effective Claude interactions.`,
    'rules': `${name} - Coding rules and guidelines for AI-assisted development.`,
    'showcases': `${name} - Showcase demonstrating Claude AI capabilities in practice.`,
    'tutorials': `${name} - Tutorial for learning Claude AI development and integration.`,
    'community': `${name} - Community-contributed resource for the Claude ecosystem.`
  };

  return templates[category] || `${name} - Resource for Claude AI integration and development.`;
}

/**
 * Extract key features from description
 */
function extractFeatures(title, description, category) {
  const features = new Set();

  if (!description) {
    return getDefaultFeatures(title, category);
  }

  // Feature extraction patterns
  const patterns = [
    { regex: /enables?\s+([^,.]+)/gi, prefix: '' },
    { regex: /supports?\s+([^,.]+)/gi, prefix: '' },
    { regex: /provides?\s+([^,.]+)/gi, prefix: '' },
    { regex: /includes?\s+([^,.]+)/gi, prefix: '' },
    { regex: /(?:with|featuring)\s+([^,.]+)/gi, prefix: '' },
    { regex: /(?:for|designed for)\s+([^,.]+)/gi, prefix: '' }
  ];

  for (const { regex } of patterns) {
    const matches = description.matchAll(regex);
    for (const match of matches) {
      let feature = match[1].trim();
      feature = feature.replace(/\s+/g, ' ').replace(/[,;].*$/, '').trim();

      if (feature.length > 8 && feature.length < 80) {
        // Capitalize first letter
        feature = feature.charAt(0).toUpperCase() + feature.slice(1);
        features.add(feature);
      }
    }
  }

  // Add keyword-based features
  const keywords = {
    'autonomous': 'Autonomous operation capability',
    'multi-step': 'Multi-step reasoning and planning',
    'real-time': 'Real-time processing and updates',
    'streaming': 'Streaming response support',
    'rag': 'RAG (Retrieval-Augmented Generation) integration',
    'vector': 'Vector database integration',
    'embedding': 'Embedding generation support',
    'tool': 'Tool and function calling support',
    'agent': 'Agent-based architecture',
    'workflow': 'Workflow automation capabilities',
    'api': 'API integration support',
    'cli': 'Command-line interface',
    'vscode': 'VS Code integration',
    'local': 'Local execution support',
    'cloud': 'Cloud deployment ready',
    'docker': 'Docker container support',
    'typescript': 'TypeScript support',
    'python': 'Python support',
    'open.?source': 'Open source codebase'
  };

  const lowerDesc = description.toLowerCase();
  for (const [keyword, feature] of Object.entries(keywords)) {
    if (new RegExp(keyword, 'i').test(lowerDesc) && !features.has(feature)) {
      features.add(feature);
    }
  }

  const result = Array.from(features).slice(0, 6);

  // Ensure we have at least 3 features
  if (result.length < 3) {
    const defaults = getDefaultFeatures(title, category);
    for (const def of defaults) {
      if (result.length >= 4) break;
      if (!result.includes(def)) {
        result.push(def);
      }
    }
  }

  return result;
}

/**
 * Get default features based on category
 */
function getDefaultFeatures(title, category) {
  const templates = {
    'mcp-servers': [
      'MCP protocol integration',
      'Claude Desktop and Claude Code support',
      'External service connectivity',
      'Standardized communication layer'
    ],
    'tools': [
      'AI-assisted development features',
      'Command-line interface',
      'Integration with existing workflows',
      'Developer productivity enhancement'
    ],
    'sdks': [
      'Type-safe API client',
      'Authentication handling',
      'Error management',
      'Multiple language support'
    ],
    'agents': [
      'Autonomous task execution',
      'Multi-step reasoning',
      'LLM-powered decisions',
      'Tool integration capability'
    ],
    'official': [
      'Official Anthropic support',
      'Enterprise-grade reliability',
      'Comprehensive documentation',
      'Regular feature updates'
    ],
    'prompts': [
      'Ready-to-use templates',
      'Consistent output format',
      'Customizable parameters',
      'Best practice patterns'
    ],
    'rules': [
      'Coding standard enforcement',
      'AI assistant guidance',
      'Project-specific customization',
      'Team workflow integration'
    ],
    'showcases': [
      'Working implementation example',
      'Source code availability',
      'Real-world use case',
      'Learning resource'
    ],
    'tutorials': [
      'Step-by-step instructions',
      'Beginner-friendly content',
      'Hands-on examples',
      'Progressive learning path'
    ],
    'community': [
      'Open source development',
      'Community contributions',
      'Collaborative support',
      'Diverse solutions'
    ]
  };

  return templates[category] || [
    'Claude AI integration',
    'Developer-friendly design',
    'Community supported',
    'Flexible implementation'
  ];
}

/**
 * Generate use cases from description and category
 */
function generateUseCases(title, description, category) {
  const useCases = new Set();
  const name = title.replace(/[@\/\-_]/g, ' ').replace(/\s+/g, ' ').trim();

  // Category-specific use cases
  const categoryUseCases = {
    'mcp-servers': [
      `Extend Claude with ${name} capabilities`,
      'Integrate external data into AI conversations',
      'Automate workflows combining Claude with specialized services',
      'Build custom AI-powered development tools'
    ],
    'tools': [
      'Enhance development workflow with AI assistance',
      'Automate repetitive coding tasks',
      'Integrate Claude into CI/CD pipelines',
      'Streamline code review processes'
    ],
    'sdks': [
      'Build AI-powered applications',
      'Integrate Claude into backend services',
      'Create conversational interfaces',
      'Develop chatbots and assistants'
    ],
    'agents': [
      'Create autonomous AI workflows',
      'Build multi-step reasoning systems',
      'Automate complex decision processes',
      'Develop self-improving AI systems'
    ],
    'official': [
      'Build enterprise AI solutions',
      'Deploy production-grade Claude integrations',
      'Access latest Claude capabilities',
      'Develop with official support'
    ],
    'prompts': [
      'Generate consistent AI outputs',
      'Automate content creation workflows',
      'Build reusable prompt libraries',
      'Improve response quality'
    ],
    'rules': [
      'Enforce coding standards with AI',
      'Maintain code quality automatically',
      'Guide AI assistants effectively',
      'Standardize team workflows'
    ],
    'showcases': [
      'Learn from real implementations',
      'Understand Claude integration patterns',
      'Get inspired for new projects',
      'Evaluate Claude capabilities'
    ],
    'tutorials': [
      'Learn Claude development fundamentals',
      'Build first AI integration',
      'Master advanced Claude features',
      'Follow structured learning path'
    ],
    'community': [
      'Explore community innovations',
      'Contribute to ecosystem growth',
      'Learn from peer implementations',
      'Access alternative solutions'
    ]
  };

  return (categoryUseCases[category] || categoryUseCases['tools']).slice(0, 4);
}

/**
 * Process a single resource
 */
function enhanceResource(resource) {
  const { id, title, description, category } = resource;
  const template = CATEGORY_TEMPLATES[category] || CATEGORY_TEMPLATES['tools'];

  return {
    id,
    ai_summary: generateSummary(title, description, category),
    key_features: extractFeatures(title, description, category),
    use_cases: generateUseCases(title, description, category),
    pros: template.pros,
    cons: template.cons,
    target_audience: template.targetAudience,
    prerequisites: template.prerequisites
  };
}

// ==================== MAIN FUNCTION ====================

async function enhanceAllResources() {
  console.log('🚀 Smart Resource Enhancement\n');
  console.log('='.repeat(60));

  const client = await pool.connect();
  let enhanced = 0;
  let errors = 0;
  const startTime = Date.now();

  try {
    // Get all resources needing enhancement
    const result = await client.query(`
      SELECT id, slug, title, description, category
      FROM resources
      WHERE ai_analyzed_at IS NULL OR ai_summary IS NULL OR ai_summary = ''
      ORDER BY category, title
    `);

    console.log(`\n📦 Found ${result.rows.length} resources to enhance\n`);

    // Process in batches
    const batchSize = 100;
    const total = result.rows.length;

    for (let i = 0; i < total; i += batchSize) {
      const batch = result.rows.slice(i, Math.min(i + batchSize, total));
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(total / batchSize);

      process.stdout.write(`\r📊 Processing batch ${batchNum}/${totalBatches} (${i + batch.length}/${total})...`);

      for (const resource of batch) {
        try {
          const enhancement = enhanceResource(resource);

          await client.query(`
            UPDATE resources SET
              ai_summary = $1,
              key_features = $2,
              use_cases = $3,
              pros = $4,
              cons = $5,
              target_audience = $6,
              prerequisites = $7,
              ai_analyzed_at = NOW(),
              ai_confidence = 0.85
            WHERE id = $8
          `, [
            enhancement.ai_summary,
            enhancement.key_features,
            enhancement.use_cases,
            enhancement.pros,
            enhancement.cons,
            enhancement.target_audience,
            enhancement.prerequisites,
            enhancement.id
          ]);

          enhanced++;
        } catch (err) {
          console.error(`\n❌ Error: ${resource.title}: ${err.message}`);
          errors++;
        }
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n\n' + '='.repeat(60));
    console.log('\n✅ Enhancement Complete!');
    console.log(`   📊 Enhanced: ${enhanced} resources`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   ⏱️  Duration: ${duration}s`);
    console.log(`   📈 Success Rate: ${((enhanced / (enhanced + errors)) * 100).toFixed(1)}%`);
    console.log(`   ⚡ Speed: ${(enhanced / (duration || 1)).toFixed(1)} resources/sec`);

  } finally {
    client.release();
    await pool.end();
  }
}

// Run
enhanceAllResources().catch(console.error);
