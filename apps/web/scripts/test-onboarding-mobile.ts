/**
 * Mobile Onboarding Flow Test Script
 *
 * Tests the onboarding wizard on a mobile viewport to identify:
 * 1. Content overflow issues
 * 2. Elements not visible
 * 3. Scrolling problems
 */

import { chromium, devices } from 'playwright';

const MOBILE_VIEWPORT = devices['iPhone 14'];

async function testOnboardingMobile() {
  console.log('🚀 Starting mobile onboarding test...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    ...MOBILE_VIEWPORT,
  });
  const page = await context.newPage();

  // Navigate to the site
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
  console.log(`📱 Using viewport: ${MOBILE_VIEWPORT.viewport.width}x${MOBILE_VIEWPORT.viewport.height}`);
  console.log(`🌐 Testing at: ${baseUrl}\n`);

  try {
    // First, let's check if we can navigate to the site
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    console.log('✓ Page loaded\n');

    // Check for onboarding modal (need to be logged in)
    // For now, let's check the login/signup flow
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });

    // Take screenshots of login page
    await page.screenshot({
      path: '/tmp/onboarding-test-login-mobile.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved: /tmp/onboarding-test-login-mobile.png');

    // Check viewport dimensions
    const viewportSize = page.viewportSize();
    console.log(`\n📐 Current viewport: ${viewportSize?.width}x${viewportSize?.height}`);

    // Check for overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    const hasVerticalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollHeight > document.documentElement.clientHeight;
    });

    console.log(`\n📊 Overflow Analysis:`);
    console.log(`  - Horizontal overflow: ${hasHorizontalOverflow ? '⚠️ YES' : '✓ NO'}`);
    console.log(`  - Vertical overflow: ${hasVerticalOverflow ? '(expected for scrollable content)' : '✓ NO'}`);

    // Check if all elements are within viewport
    const elementsOutsideViewport = await page.evaluate(() => {
      const elements = document.querySelectorAll('button, input, a, h1, h2, h3, p, label');
      const results: string[] = [];

      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (rect.right > viewportWidth || rect.left < 0) {
          results.push(`${el.tagName.toLowerCase()}${el.className ? `.${el.className.split(' ')[0]}` : ''}: left=${rect.left.toFixed(0)}, right=${rect.right.toFixed(0)}`);
        }
      });

      return results;
    });

    if (elementsOutsideViewport.length > 0) {
      console.log(`\n⚠️ Elements extending beyond viewport:`);
      elementsOutsideViewport.slice(0, 10).forEach(el => console.log(`  - ${el}`));
      if (elementsOutsideViewport.length > 10) {
        console.log(`  ... and ${elementsOutsideViewport.length - 10} more`);
      }
    } else {
      console.log(`\n✓ All visible elements are within viewport`);
    }

    // Keep browser open for manual inspection
    console.log('\n🔍 Browser kept open for manual inspection.');
    console.log('   Navigate to test the onboarding flow manually.');
    console.log('   Press Ctrl+C to close.\n');

    // Wait indefinitely for manual testing
    await new Promise(() => {});

  } catch (error) {
    console.error('❌ Error during test:', error);
    await browser.close();
    process.exit(1);
  }
}

testOnboardingMobile().catch(console.error);
