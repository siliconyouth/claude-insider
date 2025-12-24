/**
 * Generate Static OG Images
 *
 * Creates og-image.png (1200x630) and og-image-square.png (1200x1200)
 * with a big centered gradient logo and wordmark.
 *
 * Usage: node scripts/generate-og-images.cjs
 *
 * Requires: playwright (already in devDependencies)
 */

const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const OUTPUT_DIR = path.join(__dirname, "..", "public");

// Brand colors from design system
const BRAND_GRADIENT = {
  violet: "#7c3aed",
  blue: "#2563eb",
  cyan: "#06b6d4",
};

/**
 * Generate HTML for OG image with centered big logo
 */
function generateOGHTML(width, height, isSquare = false) {
  const logoSize = isSquare ? 200 : 160;
  const fontSize = logoSize * 0.586; // 58.6% ratio from icon-source.svg
  const borderRadius = logoSize * 0.156; // 15.6% ratio
  const wordmarkSize = isSquare ? 56 : 48;
  const taglineSize = isSquare ? 28 : 24;
  const urlSize = isSquare ? 22 : 20;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      width: ${width}px;
      height: ${height}px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #0a0a0a;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }

    /* Background gradient blobs */
    .blob-1 {
      position: absolute;
      top: -15%;
      right: -10%;
      width: 50%;
      height: 80%;
      border-radius: 50%;
      background: radial-gradient(circle, ${BRAND_GRADIENT.violet}25 0%, transparent 70%);
      filter: blur(80px);
    }

    .blob-2 {
      position: absolute;
      bottom: -20%;
      left: -10%;
      width: 60%;
      height: 90%;
      border-radius: 50%;
      background: radial-gradient(circle, ${BRAND_GRADIENT.cyan}20 0%, transparent 70%);
      filter: blur(100px);
    }

    .blob-3 {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 70%;
      height: 60%;
      border-radius: 50%;
      background: radial-gradient(circle, ${BRAND_GRADIENT.blue}10 0%, transparent 70%);
      filter: blur(60px);
    }

    .content {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: ${isSquare ? 32 : 24}px;
    }

    .logo-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: ${isSquare ? 24 : 16}px;
    }

    .logo {
      width: ${logoSize}px;
      height: ${logoSize}px;
      border-radius: ${borderRadius}px;
      background: linear-gradient(135deg, ${BRAND_GRADIENT.violet}, ${BRAND_GRADIENT.blue}, ${BRAND_GRADIENT.cyan});
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 32px rgba(37, 99, 235, 0.35), 0 0 80px rgba(37, 99, 235, 0.15);
    }

    .logo-text {
      font-size: ${fontSize}px;
      font-weight: 800;
      color: white;
      letter-spacing: -1px;
    }

    .wordmark {
      font-size: ${wordmarkSize}px;
      font-weight: 700;
      background: linear-gradient(135deg, ${BRAND_GRADIENT.violet}, ${BRAND_GRADIENT.blue}, ${BRAND_GRADIENT.cyan});
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -1px;
    }

    .tagline {
      font-size: ${taglineSize}px;
      color: #9CA3AF;
      font-weight: 400;
      letter-spacing: -0.3px;
    }

    .url {
      position: absolute;
      bottom: ${isSquare ? 60 : 40}px;
      font-size: ${urlSize}px;
      color: #6B7280;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="blob-1"></div>
  <div class="blob-2"></div>
  <div class="blob-3"></div>

  <div class="content">
    <div class="logo-container">
      <div class="logo">
        <span class="logo-text">Ci</span>
      </div>
      <span class="wordmark">Claude Insider</span>
    </div>
    <p class="tagline">Tips, Tricks & Documentation for Claude AI</p>
  </div>

  <span class="url">claudeinsider.com</span>
</body>
</html>
  `;
}

async function generateOGImages() {
  console.log("🎨 Generating static OG images...\n");

  // Launch browser
  const browser = await chromium.launch();
  const context = await browser.newContext({
    deviceScaleFactor: 1,
  });

  try {
    // Generate 1200x630 (standard OG image for Twitter, Facebook, LinkedIn)
    console.log("📸 Generating og-image.png (1200x630)...");
    const page1 = await context.newPage();
    await page1.setViewportSize({ width: 1200, height: 630 });
    await page1.setContent(generateOGHTML(1200, 630, false));

    // Wait for fonts to load
    await page1.waitForTimeout(500);

    const ogPath = path.join(OUTPUT_DIR, "og-image.png");
    await page1.screenshot({ path: ogPath, type: "png" });
    console.log(`   ✅ Saved: ${ogPath}`);
    await page1.close();

    // Generate 1200x1200 (square for WhatsApp, Telegram, Instagram)
    console.log("📸 Generating og-image-square.png (1200x1200)...");
    const page2 = await context.newPage();
    await page2.setViewportSize({ width: 1200, height: 1200 });
    await page2.setContent(generateOGHTML(1200, 1200, true));

    // Wait for fonts to load
    await page2.waitForTimeout(500);

    const squarePath = path.join(OUTPUT_DIR, "og-image-square.png");
    await page2.screenshot({ path: squarePath, type: "png" });
    console.log(`   ✅ Saved: ${squarePath}`);
    await page2.close();

    console.log("\n✅ All OG images generated successfully!");

    // Show file sizes
    const ogSize = fs.statSync(ogPath).size;
    const squareSize = fs.statSync(squarePath).size;
    console.log(`\n📊 File sizes:`);
    console.log(`   og-image.png: ${(ogSize / 1024).toFixed(1)} KB`);
    console.log(`   og-image-square.png: ${(squareSize / 1024).toFixed(1)} KB`);

  } finally {
    await browser.close();
  }
}

generateOGImages().catch((error) => {
  console.error("❌ Failed to generate OG images:", error);
  process.exit(1);
});
