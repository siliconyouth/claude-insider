/**
 * PWA Icon Generator
 *
 * Generates all required PWA icon sizes from the source 512x512 icon.
 * Includes regular icons, maskable icons, and favicon.ico.
 *
 * Run: node scripts/generate-pwa-icons.cjs
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '../public/icons');
const SOURCE_ICON = path.join(ICONS_DIR, 'icon-512x512.png');

// All required icon sizes for complete PWA support
const ICON_SIZES = [
  // Standard PWA icons
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 48, name: 'icon-48x48.png' },
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 120, name: 'icon-120x120.png' },  // iOS
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 167, name: 'icon-167x167.png' },  // iPad Pro
  { size: 180, name: 'icon-180x180.png' },  // iOS (apple-touch-icon size)
  { size: 192, name: 'icon-192x192.png' },
  { size: 256, name: 'icon-256x256.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },

  // Maskable icons (with safe zone padding for Android adaptive icons)
  { size: 192, name: 'icon-192x192-maskable.png', maskable: true },
  { size: 512, name: 'icon-512x512-maskable.png', maskable: true },
];

// Maskable icon needs 10% padding on each side (icon should be 80% of canvas)
async function generateMaskableIcon(sourceBuffer, size, outputPath) {
  const iconSize = Math.round(size * 0.8);
  const padding = Math.round((size - iconSize) / 2);

  // Resize the icon to 80% of target size
  const resizedIcon = await sharp(sourceBuffer)
    .resize(iconSize, iconSize, {
      fit: 'contain',
      background: { r: 59, g: 130, b: 246, alpha: 1 } // blue-500 background
    })
    .toBuffer();

  // Create canvas with background and center the icon
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 59, g: 130, b: 246, alpha: 1 } // blue-500 background
    }
  })
  .composite([{
    input: resizedIcon,
    top: padding,
    left: padding
  }])
  .png()
  .toFile(outputPath);
}

async function generateFavicon(sourceBuffer) {
  // Generate ICO file with multiple sizes
  const sizes = [16, 32, 48];
  const buffers = [];

  for (const size of sizes) {
    const buffer = await sharp(sourceBuffer)
      .resize(size, size, { fit: 'contain' })
      .png()
      .toBuffer();
    buffers.push({ size, buffer });
  }

  // For simplicity, we'll create individual PNGs and note that
  // a proper .ico would need additional tooling
  // Modern browsers prefer PNG favicons anyway
  console.log('  Note: For .ico file, use favicon-32x32.png as favicon.ico or use a converter');

  // Copy 32x32 as favicon.ico (browsers accept PNG with .ico extension)
  const favicon32 = await sharp(sourceBuffer)
    .resize(32, 32, { fit: 'contain' })
    .png()
    .toBuffer();

  fs.writeFileSync(path.join(__dirname, '../public/favicon.ico'), favicon32);
  console.log('  Created: favicon.ico (32x32 PNG)');
}

async function generateSafariPinnedTab(sourceBuffer) {
  // Safari pinned tab requires a monochrome SVG
  // We'll create a simple circular SVG since we can't convert PNG to SVG automatically
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <circle cx="256" cy="256" r="240" fill="#000"/>
  <text x="256" y="320" text-anchor="middle" font-family="system-ui, sans-serif" font-size="280" font-weight="bold" fill="#fff">C</text>
</svg>`;

  fs.writeFileSync(path.join(ICONS_DIR, 'safari-pinned-tab.svg'), svg);
  console.log('  Created: safari-pinned-tab.svg');
}

async function generateIcons() {
  console.log('PWA Icon Generator');
  console.log('==================\n');

  // Check if source icon exists
  if (!fs.existsSync(SOURCE_ICON)) {
    console.error(`Error: Source icon not found at ${SOURCE_ICON}`);
    process.exit(1);
  }

  console.log(`Source: ${SOURCE_ICON}\n`);

  // Read source icon
  const sourceBuffer = fs.readFileSync(SOURCE_ICON);

  // Generate all icons
  console.log('Generating icons...\n');

  for (const { size, name, maskable } of ICON_SIZES) {
    const outputPath = path.join(ICONS_DIR, name);

    try {
      if (maskable) {
        await generateMaskableIcon(sourceBuffer, size, outputPath);
        console.log(`  Created: ${name} (maskable)`);
      } else {
        await sharp(sourceBuffer)
          .resize(size, size, { fit: 'contain' })
          .png()
          .toFile(outputPath);
        console.log(`  Created: ${name}`);
      }
    } catch (error) {
      console.error(`  Error creating ${name}:`, error.message);
    }
  }

  // Generate favicon.ico
  console.log('\nGenerating favicon...');
  await generateFavicon(sourceBuffer);

  // Generate Safari pinned tab SVG
  console.log('\nGenerating Safari pinned tab...');
  await generateSafariPinnedTab(sourceBuffer);

  // Also update apple-touch-icon to be the correct size (180x180)
  console.log('\nUpdating apple-touch-icon...');
  await sharp(sourceBuffer)
    .resize(180, 180, { fit: 'contain' })
    .png()
    .toFile(path.join(ICONS_DIR, 'apple-touch-icon.png'));
  console.log('  Updated: apple-touch-icon.png (180x180)');

  console.log('\n✅ All icons generated successfully!');
  console.log('\nGenerated icons:');
  const files = fs.readdirSync(ICONS_DIR);
  files.forEach(f => console.log(`  - ${f}`));
}

generateIcons().catch(console.error);
