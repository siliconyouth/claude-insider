import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, '../public/images/mobile-screenshot.png');

async function takeScreenshot() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 446, height: 932 },
    deviceScaleFactor: 2,
    colorScheme: 'dark'
  });
  
  const page = await context.newPage();
  
  console.log('Navigating to https://www.claudeinsider.com...');
  await page.goto('https://www.claudeinsider.com', { waitUntil: 'networkidle' });
  
  // Ensure dark mode
  await page.evaluate(() => {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
    
    // Dismiss version popup by setting the version as seen
    localStorage.setItem('lastSeenVersion', '1.18.2');
    localStorage.setItem('versionPopupDismissed', 'true');
  });
  
  // Wait a moment
  await page.waitForTimeout(500);
  
  // Try to click dismiss button if popup is showing
  try {
    const gotItButton = await page.locator('button:has-text("Got it!")');
    if (await gotItButton.isVisible({ timeout: 1000 })) {
      console.log('Dismissing version popup...');
      await gotItButton.click();
      await page.waitForTimeout(500);
    }
  } catch (e) {
    // Popup not showing, continue
  }
  
  // Reload to get clean state without popup
  console.log('Reloading for clean state...');
  await page.reload({ waitUntil: 'networkidle' });
  
  // Wait for any animations to settle
  await page.waitForTimeout(1500);
  
  console.log('Taking screenshot...');
  await page.screenshot({
    path: OUTPUT_PATH,
    type: 'png'
  });
  
  console.log(`Screenshot saved to: ${OUTPUT_PATH}`);
  
  await browser.close();
}

takeScreenshot().catch(console.error);
