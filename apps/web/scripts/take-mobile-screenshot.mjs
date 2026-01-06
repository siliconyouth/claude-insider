import { chromium } from 'playwright';

async function takeScreenshot() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 446, height: 932 },
    colorScheme: 'dark',
    deviceScaleFactor: 2,
  });
  
  const page = await context.newPage();
  
  console.log('Navigating to claudeinsider.com...');
  await page.goto('https://www.claudeinsider.com', { 
    waitUntil: 'networkidle',
    timeout: 60000 
  });
  
  // Wait for hydration and animations
  await page.waitForTimeout(3000);
  
  // Check version on page
  const versionText = await page.locator('text=v1.18').first().textContent().catch(() => null);
  console.log('Version found:', versionText || 'Not found yet (deployment may be in progress)');
  
  console.log('Taking screenshot...');
  await page.screenshot({ 
    path: 'public/images/mobile-screenshot.png',
    type: 'png'
  });
  
  console.log('Screenshot saved to public/images/mobile-screenshot.png');
  
  await browser.close();
  console.log('Done!');
}

takeScreenshot().catch(console.error);
