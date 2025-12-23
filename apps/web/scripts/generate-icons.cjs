/**
 * Icon Generator Script
 *
 * Generates all PWA and favicon icons from the source SVG.
 * Uses Playwright for accurate SVG text rendering, then sharp for resizing.
 *
 * Usage: node scripts/generate-icons.cjs
 */

const { chromium } = require('playwright');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '../public/icons');
const SOURCE_SVG = path.join(ICONS_DIR, 'icon-source.svg');

// All required icon sizes
const ICON_SIZES = [16, 32, 48, 72, 96, 120, 128, 144, 152, 167, 180, 192, 256, 384, 512];
const MASKABLE_SIZES = [192, 512];

// SVG content for rendering (embedded to ensure font works)
const SVG_HTML = `
<!DOCTYPE html>
<html>
<head>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@800&display=swap');
    * { margin: 0; padding: 0; }
    body {
      width: 512px;
      height: 512px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    svg { width: 512px; height: 512px; }
  </style>
</head>
<body>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
    <defs>
      <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#A855F7"/>
        <stop offset="50%" stop-color="#3B82F6"/>
        <stop offset="100%" stop-color="#06B6D4"/>
      </linearGradient>
    </defs>
    <rect width="512" height="512" rx="80" fill="url(#bgGradient)"/>
    <text x="256" y="355" font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif" font-size="300" font-weight="800" fill="#ffffff" text-anchor="middle">Ci</text>
  </svg>
</body>
</html>
`;

// Maskable icon HTML (with padding for safe zone)
// Maskable icons need a 10% safe zone on all sides, so content should be 80% of the icon
const MASKABLE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@800&display=swap');
    * { margin: 0; padding: 0; }
    body {
      width: 512px;
      height: 512px;
      background: linear-gradient(135deg, #A855F7 0%, #3B82F6 50%, #06B6D4 100%);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .icon-content {
      width: 410px;
      height: 410px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    svg { width: 410px; height: 410px; }
  </style>
</head>
<body>
  <div class="icon-content">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="410" height="410">
      <text x="256" y="355" font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif" font-size="300" font-weight="800" fill="#ffffff" text-anchor="middle">Ci</text>
    </svg>
  </div>
</body>
</html>
`;

async function generateIcons() {
  console.log('🎨 Icon Generator - Claude Insider');
  console.log('═'.repeat(50));

  // Launch browser
  console.log('\n📦 Launching browser...');
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 512, height: 512 },
    deviceScaleFactor: 2, // High DPI for crisp icons
  });

  const page = await context.newPage();

  // Render standard icon at 1024px (2x for quality)
  console.log('🖼️  Rendering base icon at 1024px...');
  await page.setContent(SVG_HTML);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500); // Wait for font to load

  const baseBuffer = await page.screenshot({
    type: 'png',
    omitBackground: true, // IMPORTANT: Preserve alpha channel for rounded corners
  });

  // Render maskable icon
  console.log('🖼️  Rendering maskable icon at 1024px...');
  await page.setContent(MASKABLE_HTML);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  const maskableBuffer = await page.screenshot({
    type: 'png',
    omitBackground: false,
  });

  await browser.close();

  // Generate all standard icon sizes
  console.log('\n📐 Generating standard icons...');
  for (const size of ICON_SIZES) {
    let filename;
    if (size === 16) filename = 'favicon-16x16.png';
    else if (size === 32) filename = 'favicon-32x32.png';
    else if (size === 180) filename = 'apple-touch-icon.png';
    else filename = `icon-${size}x${size}.png`;

    const outputPath = path.join(ICONS_DIR, filename);

    await sharp(baseBuffer)
      .resize(size, size, {
        fit: 'contain',
        kernel: sharp.kernel.lanczos3,
      })
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(outputPath);

    console.log(`   ✓ ${filename}`);
  }

  // Generate maskable icons
  console.log('\n📐 Generating maskable icons...');
  for (const size of MASKABLE_SIZES) {
    const filename = `icon-${size}x${size}-maskable.png`;
    const outputPath = path.join(ICONS_DIR, filename);

    await sharp(maskableBuffer)
      .resize(size, size, {
        fit: 'contain',
        kernel: sharp.kernel.lanczos3,
      })
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(outputPath);

    console.log(`   ✓ ${filename}`);
  }

  // Generate favicon.ico (multi-resolution)
  // IMPORTANT: Must use .ensureAlpha() to guarantee RGBA format for ICO embedding
  // Next.js/Turbopack requires PNG data in ICO files to be RGBA (4 channels)
  console.log('\n🔖 Generating favicon.ico...');
  const favicon16 = await sharp(baseBuffer).resize(16, 16).ensureAlpha().png().toBuffer();
  const favicon32 = await sharp(baseBuffer).resize(32, 32).ensureAlpha().png().toBuffer();
  const favicon48 = await sharp(baseBuffer).resize(48, 48).ensureAlpha().png().toBuffer();

  // Create ICO file (simple format with PNG data)
  const icoBuffer = createIcoFromPngs([
    { buffer: favicon16, size: 16 },
    { buffer: favicon32, size: 32 },
    { buffer: favicon48, size: 48 },
  ]);

  fs.writeFileSync(path.join(__dirname, '../public/favicon.ico'), icoBuffer);
  console.log('   ✓ favicon.ico');

  // Create Safari pinned tab SVG (monochrome)
  console.log('\n🧭 Generating Safari pinned tab SVG...');
  const safariSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#000000"/>
  <text x="256" y="355" font-family="Inter, -apple-system, sans-serif" font-size="300" font-weight="800" fill="#ffffff" text-anchor="middle">Ci</text>
</svg>`;

  fs.writeFileSync(path.join(ICONS_DIR, 'safari-pinned-tab.svg'), safariSvg);
  console.log('   ✓ safari-pinned-tab.svg');

  // Copy favicon.ico to app folder for Next.js App Router
  console.log('\n📋 Copying favicon to app folder...');
  const appFaviconPath = path.join(__dirname, '../app/favicon.ico');
  const publicFaviconPath = path.join(__dirname, '../public/favicon.ico');
  fs.copyFileSync(publicFaviconPath, appFaviconPath);
  console.log('   ✓ app/favicon.ico');

  console.log('\n' + '═'.repeat(50));
  console.log('✅ All icons generated successfully!');
  console.log(`   📁 Output: ${ICONS_DIR}`);
  console.log(`   📊 Total: ${ICON_SIZES.length + MASKABLE_SIZES.length + 3} files`);
}

/**
 * Create ICO file from PNG buffers
 * ICO format: https://en.wikipedia.org/wiki/ICO_(file_format)
 */
function createIcoFromPngs(images) {
  const numImages = images.length;

  // ICO header (6 bytes)
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);     // Reserved
  header.writeUInt16LE(1, 2);     // Type: 1 = ICO
  header.writeUInt16LE(numImages, 4); // Number of images

  // Directory entries (16 bytes each)
  const entries = [];
  let dataOffset = 6 + (numImages * 16);

  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.size === 256 ? 0 : img.size, 0);  // Width
    entry.writeUInt8(img.size === 256 ? 0 : img.size, 1);  // Height
    entry.writeUInt8(0, 2);       // Color palette
    entry.writeUInt8(0, 3);       // Reserved
    entry.writeUInt16LE(1, 4);    // Color planes
    entry.writeUInt16LE(32, 6);   // Bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8);  // Size of image data
    entry.writeUInt32LE(dataOffset, 12);        // Offset to image data

    entries.push(entry);
    dataOffset += img.buffer.length;
  }

  // Combine all parts
  return Buffer.concat([
    header,
    ...entries,
    ...images.map(img => img.buffer),
  ]);
}

// Run the generator
generateIcons().catch(err => {
  console.error('❌ Error generating icons:', err);
  process.exit(1);
});
