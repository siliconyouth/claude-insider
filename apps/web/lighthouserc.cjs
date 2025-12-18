/**
 * Lighthouse Configuration
 *
 * Configuration for running Lighthouse audits locally and in CI.
 * Run with: pnpm lighthouse
 *
 * @see https://github.com/GoogleChrome/lighthouse
 */

module.exports = {
  ci: {
    collect: {
      // URLs to audit
      url: [
        'http://localhost:3001/',
        'http://localhost:3001/docs/getting-started',
        'http://localhost:3001/resources',
      ],
      // Number of runs per URL (median score used)
      numberOfRuns: 1,
      // Settings for the audit
      settings: {
        // Use desktop preset for more realistic scores
        preset: 'desktop',
        // Throttling settings (simulate real network)
        throttlingMethod: 'devtools',
        // Categories to audit
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        // Skip PWA for local testing (requires HTTPS)
        skipAudits: ['is-on-https', 'redirects-http', 'service-worker', 'works-offline'],
      },
    },
    assert: {
      // Assertion configuration
      assertions: {
        // Performance assertions
        'categories:performance': ['warn', { minScore: 0.6 }],
        'categories:accessibility': ['error', { minScore: 0.85 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],

        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 3000 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 500 }],

        // Accessibility (critical audits)
        'color-contrast': 'error',
        'button-name': 'error',
        'image-alt': 'error',
        'link-name': 'error',

        // SEO (critical audits)
        'meta-description': 'error',
        'document-title': 'error',
        'viewport': 'error',
      },
    },
    upload: {
      // Don't upload to LHCI server by default
      target: 'temporary-public-storage',
    },
  },

  // Standalone Lighthouse settings (for script usage)
  standalone: {
    // Default URL for standalone audits
    defaultUrl: 'http://localhost:3001',

    // Production URL
    productionUrl: 'https://www.claudeinsider.com',

    // Output directory for reports
    outputDir: '.lighthouse',

    // Thresholds for pass/fail
    thresholds: {
      performance: 60,
      accessibility: 85,
      'best-practices': 90,
      seo: 90,
    },

    // Pages to audit
    pages: [
      { name: 'homepage', path: '/' },
      { name: 'docs', path: '/docs/getting-started' },
      { name: 'resources', path: '/resources' },
      { name: 'changelog', path: '/changelog' },
    ],
  },
};
