/**
 * Algorithmic Resource Enhancement Script
 *
 * Generates ai_summary, key_features, use_cases, pros, cons,
 * target_audience, and prerequisites based on existing resource data.
 *
 * Run with: npx dotenvx run -f .env.local -- node scripts/enhance-resources-algorithmically.mjs
 */

import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Category-specific enhancement templates
const CATEGORY_TEMPLATES = {
  'mcp-servers': {
    defaultPros: [
      'Standardized MCP protocol integration',
      'Works seamlessly with Claude Desktop and Claude Code',
      'Extends Claude\'s capabilities with external services',
      'Active community support and development'
    ],
    defaultCons: [
      'Requires initial configuration setup',
      'May need API keys or authentication',
      'Performance depends on external service availability'
    ],
    targetAudience: [
      'Developers using Claude Code or Claude Desktop',
      'Teams building AI-powered workflows',
      'Users wanting to extend Claude\'s capabilities'
    ],
    prerequisites: [
      'Claude Desktop or Claude Code installed',
      'Basic understanding of MCP configuration',
      'Node.js or Python runtime (depending on server)'
    ],
    useCasePatterns: [
      'Integrate {service} data into Claude conversations',
      'Automate {action} workflows with AI assistance',
      'Access {resource} information directly from Claude'
    ]
  },
  'tools': {
    defaultPros: [
      'Enhances productivity with Claude AI',
      'Streamlines common development tasks',
      'Reduces manual work and errors',
      'Community-tested and maintained'
    ],
    defaultCons: [
      'May require learning curve for new users',
      'Depends on Claude API availability',
      'Configuration may vary by environment'
    ],
    targetAudience: [
      'Software developers and engineers',
      'DevOps professionals',
      'Technical teams using Claude for development'
    ],
    prerequisites: [
      'Development environment setup',
      'Claude API access or Claude subscription',
      'Basic command line familiarity'
    ],
    useCasePatterns: [
      'Automate {task} in development workflow',
      'Integrate Claude assistance into {context}',
      'Streamline {process} with AI support'
    ]
  },
  'sdks': {
    defaultPros: [
      'Official or well-maintained client library',
      'Type-safe API interactions',
      'Handles authentication and error handling',
      'Regular updates with new features'
    ],
    defaultCons: [
      'Version compatibility requirements',
      'May have language-specific limitations',
      'Requires API key management'
    ],
    targetAudience: [
      'Backend developers',
      'Full-stack engineers',
      'API integration specialists'
    ],
    prerequisites: [
      'Anthropic API key',
      'Programming language runtime installed',
      'Package manager for the language'
    ],
    useCasePatterns: [
      'Build {type} applications with Claude AI',
      'Integrate Claude into {platform} backend',
      'Create AI-powered {feature} functionality'
    ]
  },
  'agents': {
    defaultPros: [
      'Autonomous task execution capability',
      'Multi-step reasoning and planning',
      'Extensible with custom tools and actions',
      'Reduces manual intervention in complex tasks'
    ],
    defaultCons: [
      'Requires careful prompt engineering',
      'May consume significant API credits',
      'Complex debugging for multi-step failures'
    ],
    targetAudience: [
      'AI researchers and engineers',
      'Automation specialists',
      'Developers building autonomous systems'
    ],
    prerequisites: [
      'Understanding of agent architectures',
      'Claude API access with sufficient credits',
      'Python or JavaScript development experience'
    ],
    useCasePatterns: [
      'Automate complex {domain} workflows',
      'Create autonomous {task} agents',
      'Build self-improving {system} pipelines'
    ]
  },
  'official': {
    defaultPros: [
      'Officially supported by Anthropic',
      'Comprehensive documentation and examples',
      'Regular updates and security patches',
      'Enterprise-grade reliability'
    ],
    defaultCons: [
      'May have usage limits or quotas',
      'Premium features may require higher tiers',
      'Bound to Anthropic\'s service terms'
    ],
    targetAudience: [
      'Enterprise developers',
      'Teams requiring official support',
      'Organizations with compliance requirements'
    ],
    prerequisites: [
      'Anthropic account',
      'Understanding of Claude capabilities',
      'Appropriate API tier for intended use'
    ],
    useCasePatterns: [
      'Deploy production-grade {application}',
      'Integrate Claude into {enterprise} systems',
      'Build compliant AI solutions for {industry}'
    ]
  },
  'prompts': {
    defaultPros: [
      'Ready-to-use prompt templates',
      'Tested for consistent results',
      'Saves time on prompt engineering',
      'Community-validated approaches'
    ],
    defaultCons: [
      'May need customization for specific use cases',
      'Results vary based on context',
      'Requires understanding of prompt principles'
    ],
    targetAudience: [
      'Content creators using Claude',
      'Developers integrating AI prompts',
      'Business users automating workflows'
    ],
    prerequisites: [
      'Access to Claude (web or API)',
      'Basic understanding of prompt structure',
      'Clear use case for the prompt'
    ],
    useCasePatterns: [
      'Generate {content_type} consistently',
      'Automate {creative_task} with AI',
      'Improve {output_quality} with structured prompts'
    ]
  },
  'rules': {
    defaultPros: [
      'Enforces consistent coding standards',
      'Integrates with development workflow',
      'Improves code quality automatically',
      'Customizable to team preferences'
    ],
    defaultCons: [
      'May conflict with existing linting rules',
      'Requires configuration for optimal results',
      'Team adoption may take time'
    ],
    targetAudience: [
      'Development teams',
      'Code reviewers',
      'Technical leads setting standards'
    ],
    prerequisites: [
      'Claude Code or compatible IDE',
      'Understanding of the rule purpose',
      'Project configuration access'
    ],
    useCasePatterns: [
      'Enforce {standard} in codebase',
      'Automate {quality_check} validation',
      'Maintain {consistency} across team'
    ]
  },
  'showcases': {
    defaultPros: [
      'Real-world implementation example',
      'Demonstrates Claude\'s capabilities',
      'Source code often available for learning',
      'Inspiration for your own projects'
    ],
    defaultCons: [
      'May be tailored to specific use cases',
      'Could require adaptation for your needs',
      'Maintenance varies by creator'
    ],
    targetAudience: [
      'Developers seeking inspiration',
      'Teams evaluating Claude capabilities',
      'Anyone learning Claude integration patterns'
    ],
    prerequisites: [
      'Interest in Claude AI applications',
      'Basic development knowledge',
      'Claude access for experimentation'
    ],
    useCasePatterns: [
      'Learn how to build {application_type}',
      'Explore {technology} integration patterns',
      'Understand best practices for {domain}'
    ]
  },
  'tutorials': {
    defaultPros: [
      'Step-by-step learning path',
      'Beginner-friendly explanations',
      'Practical hands-on examples',
      'Structured knowledge building'
    ],
    defaultCons: [
      'May become outdated with API changes',
      'Pace may not suit all learners',
      'May not cover advanced topics'
    ],
    targetAudience: [
      'Developers new to Claude',
      'Teams onboarding to AI tools',
      'Students learning AI development'
    ],
    prerequisites: [
      'Basic programming knowledge',
      'Claude account for practice',
      'Time commitment for learning'
    ],
    useCasePatterns: [
      'Learn to {skill} with Claude',
      'Master {topic} fundamentals',
      'Build your first {project_type}'
    ]
  },
  'community': {
    defaultPros: [
      'Community-driven development',
      'Often free and open source',
      'Diverse perspectives and solutions',
      'Active discussion and support'
    ],
    defaultCons: [
      'Support depends on community activity',
      'Quality may vary between projects',
      'May lack official endorsement'
    ],
    targetAudience: [
      'Open source enthusiasts',
      'Developers seeking alternatives',
      'Community members wanting to contribute'
    ],
    prerequisites: [
      'Willingness to explore community tools',
      'Ability to troubleshoot independently',
      'Interest in community engagement'
    ],
    useCasePatterns: [
      'Contribute to {type} development',
      'Explore alternative {solutions}',
      'Engage with {community} ecosystem'
    ]
  }
};

// Feature extraction patterns
const FEATURE_PATTERNS = [
  { pattern: /(?:enables?|allows?|lets?\s+you)\s+([^.!?]+)/gi, type: 'capability' },
  { pattern: /(?:supports?|compatible\s+with)\s+([^.!?]+)/gi, type: 'compatibility' },
  { pattern: /(?:provides?|includes?|offers?)\s+([^.!?]+)/gi, type: 'feature' },
  { pattern: /(?:integrates?\s+with|connects?\s+to)\s+([^.!?]+)/gi, type: 'integration' },
  { pattern: /(?:automates?|streamlines?)\s+([^.!?]+)/gi, type: 'automation' },
  { pattern: /(?:real-time|realtime)\s+([^.!?]+)/gi, type: 'realtime' },
  { pattern: /(?:secure|encrypted|safe)\s+([^.!?]+)/gi, type: 'security' },
];

/**
 * Generate a concise summary from description
 */
function generateSummary(title, description, category) {
  if (!description) {
    return `${title} - A ${category.replace(/-/g, ' ')} resource for Claude AI.`;
  }

  // Clean up description
  let summary = description
    .replace(/\[.*?\]/g, '') // Remove markdown links
    .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // Get first 2 sentences or 200 characters
  const sentences = summary.match(/[^.!?]+[.!?]+/g) || [summary];
  let result = sentences.slice(0, 2).join(' ').trim();

  // Truncate if still too long
  if (result.length > 250) {
    result = result.substring(0, 247) + '...';
  }

  // Ensure it doesn't start with common filler
  result = result.replace(/^(This is |A |An |The )/i, '');

  return result || `${title} for Claude AI integration.`;
}

/**
 * Extract key features from description
 */
function extractKeyFeatures(description, category) {
  const features = new Set();

  if (!description) {
    const template = CATEGORY_TEMPLATES[category] || CATEGORY_TEMPLATES['tools'];
    return template.defaultPros.slice(0, 4);
  }

  // Extract using patterns
  for (const { pattern } of FEATURE_PATTERNS) {
    const matches = description.matchAll(pattern);
    for (const match of matches) {
      let feature = match[1].trim();
      // Clean up and capitalize
      feature = feature
        .replace(/\s+/g, ' ')
        .replace(/[,;].*$/, '') // Stop at comma/semicolon
        .trim();

      if (feature.length > 10 && feature.length < 100) {
        features.add(feature.charAt(0).toUpperCase() + feature.slice(1));
      }
    }
  }

  // Add category-specific features if we don't have enough
  const template = CATEGORY_TEMPLATES[category] || CATEGORY_TEMPLATES['tools'];
  const featureArray = Array.from(features).slice(0, 6);

  while (featureArray.length < 3 && template.defaultPros.length > 0) {
    const defaultFeature = template.defaultPros[featureArray.length];
    if (defaultFeature && !featureArray.includes(defaultFeature)) {
      featureArray.push(defaultFeature);
    }
  }

  return featureArray.slice(0, 6);
}

/**
 * Generate use cases from description and category
 */
function generateUseCases(title, description, category) {
  const useCases = new Set();
  const template = CATEGORY_TEMPLATES[category] || CATEGORY_TEMPLATES['tools'];

  // Extract domain-specific terms from description
  const domainTerms = [];
  if (description) {
    const termPatterns = [
      /(?:for|with)\s+(\w+(?:\s+\w+)?)/gi,
      /(\w+)\s+(?:integration|automation|workflow)/gi,
    ];

    for (const pattern of termPatterns) {
      const matches = description.matchAll(pattern);
      for (const match of matches) {
        const term = match[1].toLowerCase();
        if (term.length > 2 && !['the', 'and', 'for', 'with', 'this', 'that'].includes(term)) {
          domainTerms.push(term);
        }
      }
    }
  }

  // Generate use cases based on category and extracted terms
  if (category === 'mcp-servers') {
    useCases.add(`Extend Claude Desktop with ${title} capabilities`);
    useCases.add('Integrate external data sources into AI conversations');
    useCases.add('Automate workflows that combine Claude with specialized services');
    if (domainTerms.length > 0) {
      useCases.add(`Access ${domainTerms[0]} functionality directly from Claude`);
    }
  } else if (category === 'tools') {
    useCases.add('Enhance development workflow with AI assistance');
    useCases.add('Automate repetitive coding tasks');
    useCases.add('Integrate Claude into existing toolchain');
  } else if (category === 'sdks') {
    useCases.add('Build AI-powered applications');
    useCases.add('Integrate Claude API into backend services');
    useCases.add('Create conversational interfaces');
  } else if (category === 'agents') {
    useCases.add('Create autonomous AI workflows');
    useCases.add('Build multi-step reasoning systems');
    useCases.add('Automate complex decision-making processes');
  } else {
    useCases.add(`Leverage ${title} for Claude-powered solutions`);
    useCases.add('Improve productivity with AI integration');
    useCases.add('Explore Claude ecosystem capabilities');
  }

  return Array.from(useCases).slice(0, 4);
}

/**
 * Process a single resource and generate enhancements
 */
function enhanceResource(resource) {
  const { title, description, category } = resource;
  const template = CATEGORY_TEMPLATES[category] || CATEGORY_TEMPLATES['tools'];

  return {
    ai_summary: generateSummary(title, description, category),
    key_features: extractKeyFeatures(description, category),
    use_cases: generateUseCases(title, description, category),
    pros: template.defaultPros.slice(0, 4),
    cons: template.defaultCons.slice(0, 3),
    target_audience: template.targetAudience.slice(0, 3),
    prerequisites: template.prerequisites.slice(0, 3),
    ai_analyzed_at: new Date().toISOString(),
    ai_confidence: 0.7 // Algorithmic enhancement, not AI-generated
  };
}

/**
 * Main enhancement function
 */
async function enhanceAllResources() {
  console.log('🚀 Starting Algorithmic Resource Enhancement\n');
  console.log('='.repeat(60));

  const client = await pool.connect();
  let enhanced = 0;
  let errors = 0;

  try {
    // Get all resources
    const resources = await client.query(`
      SELECT id, title, description, category
      FROM resources
      ORDER BY category, title
    `);

    console.log(`\n📦 Found ${resources.rows.length} resources to enhance\n`);

    // Process in batches
    const batchSize = 100;
    const totalBatches = Math.ceil(resources.rows.length / batchSize);

    for (let batch = 0; batch < totalBatches; batch++) {
      const start = batch * batchSize;
      const end = Math.min(start + batchSize, resources.rows.length);
      const batchResources = resources.rows.slice(start, end);

      console.log(`Processing batch ${batch + 1}/${totalBatches} (${start + 1}-${end})...`);

      for (const resource of batchResources) {
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
              ai_analyzed_at = $8,
              ai_confidence = $9
            WHERE id = $10
          `, [
            enhancement.ai_summary,
            enhancement.key_features,
            enhancement.use_cases,
            enhancement.pros,
            enhancement.cons,
            enhancement.target_audience,
            enhancement.prerequisites,
            enhancement.ai_analyzed_at,
            enhancement.ai_confidence,
            resource.id
          ]);

          enhanced++;
        } catch (err) {
          console.error(`  ❌ Error enhancing ${resource.title}: ${err.message}`);
          errors++;
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n✅ Enhancement Complete!`);
    console.log(`   📊 Enhanced: ${enhanced} resources`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📈 Success Rate: ${((enhanced / (enhanced + errors)) * 100).toFixed(1)}%`);

  } finally {
    client.release();
    await pool.end();
  }
}

// Run the enhancement
enhanceAllResources().catch(console.error);
