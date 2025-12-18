#!/usr/bin/env node

/**
 * Lighthouse Audit Script
 *
 * Runs Lighthouse audits and generates reports.
 *
 * Usage:
 *   pnpm lighthouse              # Audit localhost
 *   pnpm lighthouse:prod         # Audit production
 *   pnpm lighthouse -- --url=... # Custom URL
 *
 * Options:
 *   --url=<url>          Custom URL to audit
 *   --production         Audit production site
 *   --open               Open report in browser after
 *   --json               Output JSON instead of HTML
 *   --all-pages          Audit all configured pages
 *   --verbose            Show detailed output
 */

const lighthouseModule = require('lighthouse');
const lighthouse = lighthouseModule.default;
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load configuration
const config = require('../lighthouserc.cjs');
const standaloneConfig = config.standalone;

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  url: null,
  production: args.includes('--production') || args.includes('--prod'),
  open: args.includes('--open'),
  json: args.includes('--json'),
  allPages: args.includes('--all-pages') || args.includes('--all'),
  verbose: args.includes('--verbose') || args.includes('-v'),
};

// Parse --url=... argument
const urlArg = args.find((arg) => arg.startsWith('--url='));
if (urlArg) {
  options.url = urlArg.split('=')[1];
}

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
};

// Score color based on value
function getScoreColor(score) {
  if (score >= 90) return colors.green;
  if (score >= 50) return colors.yellow;
  return colors.red;
}

// Score emoji based on value
function getScoreEmoji(score) {
  if (score >= 90) return '🟢';
  if (score >= 50) return '🟡';
  return '🔴';
}

// Format score for display
function formatScore(score) {
  const numScore = Math.round(score * 100);
  const color = getScoreColor(numScore);
  const emoji = getScoreEmoji(numScore);
  return `${color}${emoji} ${numScore}${colors.reset}`;
}

// Print header
function printHeader(title) {
  console.log('\n' + colors.cyan + colors.bright + '═'.repeat(60) + colors.reset);
  console.log(colors.cyan + colors.bright + ' ' + title + colors.reset);
  console.log(colors.cyan + colors.bright + '═'.repeat(60) + colors.reset + '\n');
}

// Print results table
function printResults(results) {
  console.log(colors.bright + '  Category           Score' + colors.reset);
  console.log(colors.dim + '  ─────────────────  ─────' + colors.reset);

  const categories = ['performance', 'accessibility', 'best-practices', 'seo'];
  const categoryNames = {
    performance: 'Performance',
    accessibility: 'Accessibility',
    'best-practices': 'Best Practices',
    seo: 'SEO',
  };

  categories.forEach((cat) => {
    const score = results.categories[cat]?.score ?? 0;
    const name = categoryNames[cat].padEnd(18);
    console.log(`  ${name} ${formatScore(score)}`);
  });

  console.log('');
}

// Print Core Web Vitals
function printCoreWebVitals(audits) {
  console.log(colors.bright + '  Core Web Vitals' + colors.reset);
  console.log(colors.dim + '  ─────────────────────────────────────' + colors.reset);

  const vitals = [
    { key: 'first-contentful-paint', name: 'First Contentful Paint (FCP)', unit: 's' },
    { key: 'largest-contentful-paint', name: 'Largest Contentful Paint (LCP)', unit: 's' },
    { key: 'total-blocking-time', name: 'Total Blocking Time (TBT)', unit: 'ms' },
    { key: 'cumulative-layout-shift', name: 'Cumulative Layout Shift (CLS)', unit: '' },
    { key: 'speed-index', name: 'Speed Index', unit: 's' },
  ];

  vitals.forEach(({ key, name, unit }) => {
    const audit = audits[key];
    if (audit) {
      const value = audit.numericValue;
      const displayValue = unit === 'ms' ? Math.round(value) : (value / 1000).toFixed(1);
      const score = audit.score ?? 0;
      const color = getScoreColor(score * 100);
      console.log(`  ${color}${name}: ${displayValue}${unit}${colors.reset}`);
    }
  });

  console.log('');
}

// Print failed audits
function printFailedAudits(audits, verbose) {
  const failed = Object.values(audits).filter(
    (audit) => audit.score !== null && audit.score < 1 && audit.score < 0.9
  );

  if (failed.length === 0) return;

  const critical = failed.filter((a) => a.score < 0.5);
  const warnings = failed.filter((a) => a.score >= 0.5 && a.score < 0.9);

  if (critical.length > 0) {
    console.log(colors.red + colors.bright + '  ⚠️  Critical Issues (' + critical.length + ')' + colors.reset);
    console.log(colors.dim + '  ─────────────────────────────────────' + colors.reset);
    critical.slice(0, verbose ? 20 : 5).forEach((audit) => {
      console.log(`  ${colors.red}✗${colors.reset} ${audit.title}`);
      if (verbose && audit.description) {
        console.log(`    ${colors.dim}${audit.description.slice(0, 80)}...${colors.reset}`);
      }
    });
    console.log('');
  }

  if (warnings.length > 0 && verbose) {
    console.log(colors.yellow + colors.bright + '  ⚡ Warnings (' + warnings.length + ')' + colors.reset);
    console.log(colors.dim + '  ─────────────────────────────────────' + colors.reset);
    warnings.slice(0, 10).forEach((audit) => {
      console.log(`  ${colors.yellow}!${colors.reset} ${audit.title}`);
    });
    console.log('');
  }
}

// Check thresholds
function checkThresholds(results) {
  const thresholds = standaloneConfig.thresholds;
  let passed = true;

  Object.entries(thresholds).forEach(([category, threshold]) => {
    const score = Math.round((results.categories[category]?.score ?? 0) * 100);
    if (score < threshold) {
      passed = false;
    }
  });

  return passed;
}

// Run Lighthouse audit
async function runLighthouse(url) {
  console.log(`${colors.dim}Launching Chrome...${colors.reset}`);

  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox'],
  });

  console.log(`${colors.dim}Running audit on ${url}...${colors.reset}\n`);

  const lighthouseConfig = {
    extends: 'lighthouse:default',
    settings: {
      formFactor: 'desktop',
      screenEmulation: {
        mobile: false,
        width: 1350,
        height: 940,
        deviceScaleFactor: 1,
        disabled: false,
      },
      throttling: {
        rttMs: 40,
        throughputKbps: 10 * 1024,
        cpuSlowdownMultiplier: 1,
      },
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    },
  };

  const runnerResult = await lighthouse(url, {
    port: chrome.port,
    output: options.json ? 'json' : 'html',
    logLevel: options.verbose ? 'info' : 'error',
  }, lighthouseConfig);

  await chrome.kill();

  return runnerResult;
}

// Save report to file
function saveReport(report, url, format) {
  const outputDir = path.join(__dirname, '..', standaloneConfig.outputDir);

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate filename from URL
  const urlPath = new URL(url).pathname.replace(/\//g, '-').replace(/^-|-$/g, '') || 'homepage';
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `lighthouse-${urlPath}-${timestamp}.${format === 'json' ? 'json' : 'html'}`;
  const filepath = path.join(outputDir, filename);

  fs.writeFileSync(filepath, report);

  return filepath;
}

// Open report in browser
function openReport(filepath) {
  const platform = process.platform;
  let command;

  if (platform === 'darwin') {
    command = `open "${filepath}"`;
  } else if (platform === 'win32') {
    command = `start "" "${filepath}"`;
  } else {
    command = `xdg-open "${filepath}"`;
  }

  try {
    execSync(command, { stdio: 'ignore' });
  } catch (e) {
    console.log(`${colors.dim}Could not open browser automatically${colors.reset}`);
  }
}

// Main function
async function main() {
  printHeader('🔍 Lighthouse Audit');

  // Determine base URL
  const baseUrl = options.production
    ? standaloneConfig.productionUrl
    : (options.url || standaloneConfig.defaultUrl);

  // Determine pages to audit
  const pages = options.allPages
    ? standaloneConfig.pages
    : [{ name: 'homepage', path: new URL(options.url || baseUrl).pathname || '/' }];

  let allPassed = true;
  const summaryResults = [];

  for (const page of pages) {
    const url = options.url || `${baseUrl}${page.path}`;

    console.log(`${colors.bright}Auditing: ${colors.cyan}${url}${colors.reset}`);

    try {
      const result = await runLighthouse(url);
      const lhr = result.lhr;

      // Print results
      printResults(lhr);
      printCoreWebVitals(lhr.audits);

      if (options.verbose) {
        printFailedAudits(lhr.audits, options.verbose);
      }

      // Check thresholds
      const passed = checkThresholds(lhr);
      allPassed = allPassed && passed;

      // Save summary
      summaryResults.push({
        url,
        page: page.name,
        performance: Math.round((lhr.categories.performance?.score ?? 0) * 100),
        accessibility: Math.round((lhr.categories.accessibility?.score ?? 0) * 100),
        bestPractices: Math.round((lhr.categories['best-practices']?.score ?? 0) * 100),
        seo: Math.round((lhr.categories.seo?.score ?? 0) * 100),
        passed,
      });

      // Save report
      const report = result.report;
      const filepath = saveReport(report, url, options.json ? 'json' : 'html');
      console.log(`${colors.dim}Report saved: ${filepath}${colors.reset}\n`);

      // Open report if requested
      if (options.open && !options.json) {
        openReport(filepath);
      }
    } catch (error) {
      console.error(`${colors.red}Error auditing ${url}:${colors.reset}`, error.message);
      allPassed = false;
    }
  }

  // Print summary if multiple pages
  if (pages.length > 1) {
    printHeader('📊 Summary');

    console.log(colors.bright + '  Page              Perf  A11y  Best  SEO   Status' + colors.reset);
    console.log(colors.dim + '  ────────────────  ────  ────  ────  ────  ──────' + colors.reset);

    summaryResults.forEach((r) => {
      const status = r.passed
        ? `${colors.green}PASS${colors.reset}`
        : `${colors.red}FAIL${colors.reset}`;
      const name = r.page.padEnd(16);
      console.log(
        `  ${name}  ${r.performance.toString().padStart(3)}   ${r.accessibility.toString().padStart(3)}   ${r.bestPractices.toString().padStart(3)}   ${r.seo.toString().padStart(3)}   ${status}`
      );
    });

    console.log('');
  }

  // Final status
  if (allPassed) {
    console.log(`${colors.green}${colors.bright}✓ All audits passed!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.yellow}${colors.bright}⚠ Some audits need attention${colors.reset}\n`);
    console.log(`${colors.dim}Thresholds: Performance ${standaloneConfig.thresholds.performance}, Accessibility ${standaloneConfig.thresholds.accessibility}, Best Practices ${standaloneConfig.thresholds['best-practices']}, SEO ${standaloneConfig.thresholds.seo}${colors.reset}\n`);
    process.exit(1);
  }
}

// Run
main().catch((error) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
