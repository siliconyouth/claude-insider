#!/usr/bin/env node

/**
 * Updates build info to data/build-info.json before each build
 *
 * IMPORTANT: This writes to a JSON file, NOT to footer.tsx!
 * Writing to footer.tsx would invalidate the Turbo cache on every build.
 *
 * Run with: node scripts/update-build-info.cjs
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const buildInfoPath = path.join(__dirname, "../data/build-info.json");

// Get current date in YYYY-MM-DD format
const buildDate = new Date().toISOString().split("T")[0];

// Get git commit SHA (short)
let commitSha = "dev";
try {
  commitSha = execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
} catch (e) {
  console.warn("Could not get git commit SHA, using 'dev'");
}

// Get version from package.json
const packageJsonPath = path.join(__dirname, "../package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
const version = packageJson.version || "0.0.0";

// Create build info object
const buildInfo = {
  version,
  buildDate,
  commitSha,
  timestamp: Date.now(),
};

// Write to JSON file (this is in outputs, not inputs)
fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));

console.log(`✓ Updated build info: v${version} · ${buildDate} · ${commitSha}`);

// Parse CHANGELOG.md and output as JSON for Vercel deployment
// fs.readFileSync doesn't work in Vercel serverless functions
const changelogSource = path.join(__dirname, "../../../CHANGELOG.md");
const changelogJsonDest = path.join(__dirname, "../data/changelog.json");

function parseChangelog(content) {
  const versions = [];
  const lines = content.split("\n");

  let currentVersion = null;
  let currentSection = null;

  for (const line of lines) {
    // Match version headers: ## [x.x.x] - YYYY-MM-DD
    const versionMatch = line.match(/^## \[([^\]]+)\] - (\d{4}-\d{2}-\d{2})/);
    if (versionMatch && versionMatch[1] && versionMatch[2]) {
      if (currentVersion) {
        if (currentSection) {
          currentVersion.sections.push(currentSection);
        }
        versions.push(currentVersion);
      }
      currentVersion = {
        version: versionMatch[1],
        date: versionMatch[2],
        sections: [],
      };
      currentSection = null;
      continue;
    }

    // Match section headers: ### Added, ### Changed, etc.
    const sectionMatch = line.match(/^### (.+)/);
    if (sectionMatch && sectionMatch[1] && currentVersion) {
      if (currentSection) {
        currentVersion.sections.push(currentSection);
      }
      currentSection = {
        title: sectionMatch[1],
        items: [],
      };
      continue;
    }

    // Match list items: - item
    const itemMatch = line.match(/^- (.+)/);
    if (itemMatch && itemMatch[1] && currentSection) {
      currentSection.items.push(itemMatch[1]);
    }
  }

  // Push the last version and section
  if (currentVersion) {
    if (currentSection) {
      currentVersion.sections.push(currentSection);
    }
    versions.push(currentVersion);
  }

  return versions;
}

try {
  if (fs.existsSync(changelogSource)) {
    const content = fs.readFileSync(changelogSource, "utf-8");
    const versions = parseChangelog(content);
    fs.writeFileSync(changelogJsonDest, JSON.stringify(versions, null, 2));
    console.log(`✓ Parsed CHANGELOG.md to data/changelog.json (${versions.length} versions)`);
  } else {
    console.warn("⚠ CHANGELOG.md not found at monorepo root");
    fs.writeFileSync(changelogJsonDest, "[]");
  }
} catch (e) {
  console.warn("⚠ Could not parse CHANGELOG.md:", e.message);
  fs.writeFileSync(changelogJsonDest, "[]");
}
