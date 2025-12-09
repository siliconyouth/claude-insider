#!/usr/bin/env node

/**
 * Updates build info in footer.tsx before each build
 * Run with: node scripts/update-build-info.js
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const footerPath = path.join(__dirname, "../components/footer.tsx");

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

// Read footer.tsx
let footerContent = fs.readFileSync(footerPath, "utf-8");

// Update the constants
footerContent = footerContent.replace(
  /const APP_VERSION = "[^"]*";/,
  `const APP_VERSION = "${version}";`
);

footerContent = footerContent.replace(
  /const BUILD_DATE = "[^"]*";/,
  `const BUILD_DATE = "${buildDate}";`
);

// Write back
fs.writeFileSync(footerPath, footerContent);

console.log(`✓ Updated build info: v${version} · ${buildDate} · ${commitSha}`);
