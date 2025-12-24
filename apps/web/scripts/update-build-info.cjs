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
