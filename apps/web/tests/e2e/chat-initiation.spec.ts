/**
 * Chat Initiation E2E Tests
 *
 * Tests the complete flow of starting a conversation from a profile hover card.
 * Requires authentication to see the Message button.
 */

import { test, expect, Page } from "@playwright/test";

// Helper to capture all console logs
async function captureConsoleLogs(page: Page) {
  const logs: string[] = [];
  page.on("console", (msg) => {
    const text = msg.text();
    logs.push(`[${msg.type()}] ${text}`);
    // Print DEBUG logs immediately for visibility
    if (text.includes("[DEBUG:")) {
      console.log(`BROWSER: ${text}`);
    }
  });
  return logs;
}

// Helper to wait for hydration
async function waitForHydration(page: Page) {
  await page.waitForLoadState("networkidle");
  // Wait for Next.js to hydrate
  await page.waitForFunction(() => {
    return document.readyState === "complete";
  });
  await page.waitForTimeout(500);
}

// Helper to dismiss any blocking modals (like version update popup)
async function dismissModals(page: Page) {
  // Try to click "Got it!" button if version popup is visible
  const gotItButton = page.locator('button:has-text("Got it!")').first();
  const hasGotIt = await gotItButton.isVisible().catch(() => false);
  if (hasGotIt) {
    console.log("Found 'Got it!' button, clicking to dismiss version popup...");
    await gotItButton.click();
    await page.waitForTimeout(500);
  }

  // Also try to click any visible backdrop to dismiss other modals
  const backdrop = page.locator(".fixed.inset-0.bg-black\\/50").first();
  const hasBackdrop = await backdrop.isVisible().catch(() => false);
  if (hasBackdrop) {
    console.log("Found modal backdrop, clicking to dismiss...");
    await backdrop.click({ force: true });
    await page.waitForTimeout(300);
  }

  // Set localStorage to prevent future version popups
  await page.evaluate(() => {
    localStorage.setItem("claude-insider-last-seen-version", "99.99.99");
  });
}

test.describe("Chat Initiation Flow", () => {
  test.describe.configure({ mode: "serial" });

  test("should verify openMessages global function is registered", async ({ page }) => {
    const consoleLogs = await captureConsoleLogs(page);

    await page.goto("http://localhost:3001");
    await waitForHydration(page);

    // Wait for provider to register
    await page.waitForTimeout(2000);

    // Check for provider registration logs
    const providerReady = consoleLogs.some((log) =>
      log.includes("Provider is now ready")
    );

    console.log("\n=== Provider Registration Check ===");
    const debugLogs = consoleLogs.filter((log) => log.includes("[DEBUG:"));
    debugLogs.forEach((log) => console.log(log));

    expect(providerReady).toBe(true);
  });

  test("should test openMessages function directly via window exposure", async ({ page }) => {
    const consoleLogs = await captureConsoleLogs(page);

    await page.goto("http://localhost:3001");
    await waitForHydration(page);
    await page.waitForTimeout(2000);

    // Inject a test helper into the page that can call the module's openMessages
    // We'll expose the function via a script that imports it
    const result = await page.evaluate(async () => {
      // Try to dispatch a custom event that the provider listens to
      // Or directly manipulate the React state

      // First, let's check if we can find the React fiber
      const findReactFiber = (dom: Element | null): { stateNode?: { state?: unknown }; memoizedProps?: unknown } | null => {
        if (!dom) return null;
        const key = Object.keys(dom).find((k) => k.startsWith("__reactFiber$") || k.startsWith("__reactInternalInstance$"));
        // @ts-ignore
        return key ? dom[key] : null;
      };

      // Check if provider state is accessible
      const body = document.body;
      const fiber = findReactFiber(body);
      console.log("[TEST] React fiber check:", fiber ? "found" : "not found");

      // Dispatch custom event to trigger chat
      console.log("[TEST] Dispatching unified-chat-open event");
      window.dispatchEvent(
        new CustomEvent("unified-chat-open", {
          detail: { mode: "messages", userId: "test-user-id" },
        })
      );

      return { success: true };
    });

    console.log("Evaluation result:", result);

    // Check if any state changes occurred
    await page.waitForTimeout(1000);

    console.log("\n=== All Console Logs ===");
    consoleLogs.forEach((log) => console.log(log));
  });

  test("should check if MessagesTab renders when chat is opened", async ({ page }) => {
    const consoleLogs = await captureConsoleLogs(page);

    await page.goto("http://localhost:3001");
    await waitForHydration(page);
    await page.waitForTimeout(2000);

    // Look for the floating chat button
    const chatButton = page.locator('[aria-label*="assistant"], [aria-label*="chat"], [title*="chat"]').first();
    const hasChatButton = await chatButton.isVisible().catch(() => false);

    console.log("Chat button found:", hasChatButton);

    if (hasChatButton) {
      // Click the chat button to open the chat window
      console.log("Clicking chat button...");
      await chatButton.click();
      await page.waitForTimeout(500);

      // Look for the Messages tab
      const messagesTab = page.locator('button:has-text("Messages"), [role="tab"]:has-text("Messages")').first();
      const hasMessagesTab = await messagesTab.isVisible().catch(() => false);

      console.log("Messages tab found:", hasMessagesTab);

      if (hasMessagesTab) {
        // Click the Messages tab
        console.log("Clicking Messages tab...");
        await messagesTab.click();
        await page.waitForTimeout(1000);

        // Check if MessagesTab rendered
        const messagesTabRendered = consoleLogs.some((log) =>
          log.includes("MessagesTab") && log.includes("RENDERING")
        );
        console.log("MessagesTab rendered:", messagesTabRendered);
      }
    }

    console.log("\n=== Debug Logs ===");
    const debugLogs = consoleLogs.filter((log) => log.includes("[DEBUG:"));
    debugLogs.forEach((log) => console.log(log));
  });

  test("should navigate to users page and test hover card", async ({ page }) => {
    const consoleLogs = await captureConsoleLogs(page);

    // Set localStorage before navigation to prevent version update popup
    await page.goto("http://localhost:3001");
    await dismissModals(page);

    await page.goto("http://localhost:3001/users");
    await waitForHydration(page);
    await dismissModals(page);
    await page.waitForTimeout(2000);

    // Find a user link that is NOT the test user (e2etestuser)
    // ProfileHoverCard wraps user links - hover over another user to see Message button
    // The test user's profile won't show Message button (can't message yourself)
    const userLinks = page.locator('a[href*="/users/"]:not([href*="e2etestuser"])').first();
    const hasUserLinks = await userLinks.isVisible().catch(() => false);

    console.log("User links found (excluding test user):", hasUserLinks);

    if (hasUserLinks) {
      const href = await userLinks.getAttribute('href');
      console.log("Hovering over user link:", href);

      // Hover over the user link to trigger ProfileHoverCard
      await userLinks.hover();
      // Wait for hover delay (300ms) + animation + buffer
      await page.waitForTimeout(800);

      // Check if the hover card appeared - it uses portal with fixed z-[100] wrapper
      // Inner card has rounded-2xl shadow-xl - look for the structure: .fixed > div > .rounded-2xl
      const hoverCard = page.locator('.fixed.z-\\[100\\] .rounded-2xl.shadow-xl').last();
      const hasHoverCard = await hoverCard.isVisible().catch(() => false);

      console.log("Hover card appeared:", hasHoverCard);

      if (hasHoverCard) {
        // Look for the Message button inside the hover card
        const messageButton = page.locator('button:has-text("Message")').first();
        const hasMessageButton = await messageButton.isVisible().catch(() => false);

        console.log("Message button found:", hasMessageButton);

        if (hasMessageButton) {
          console.log("Clicking Message button...");
          await messageButton.click();
          await page.waitForTimeout(2000);

          // Check console logs for the click handler and subsequent calls
          const clickLogged = consoleLogs.some((log) =>
            log.includes("ProfileHoverCard.MessageButton") && log.includes("CLICKED")
          );
          const openMessagesLogged = consoleLogs.some((log) =>
            log.includes("[DEBUG:openMessages] CALLED")
          );
          const openMessagesFnLogged = consoleLogs.some((log) =>
            log.includes("[DEBUG:openMessagesFn] CALLED")
          );

          console.log("\n=== Click Flow Analysis ===");
          console.log("1. Click handler fired:", clickLogged);
          console.log("2. openMessages() called:", openMessagesLogged);
          console.log("3. openMessagesFn() called:", openMessagesFnLogged);

          expect(clickLogged).toBe(true);
          expect(openMessagesLogged).toBe(true);
        } else {
          console.log("Message button not visible - check if logged in and not own profile");
        }
      } else {
        console.log("Hover card did not appear - checking for any fixed elements...");
        const fixedElements = await page.locator('.fixed').count();
        console.log("Number of fixed elements:", fixedElements);
      }
    }

    console.log("\n=== All Console Logs ===");
    consoleLogs.forEach((log) => console.log(log));
  });

  // Test the actual flow with auth context
  test.describe("Authenticated Flow", () => {
    // Use the auth storage state
    test.use({ storageState: "tests/e2e/.auth/user.json" });

    test("should have session and be able to message", async ({ page }) => {
      const consoleLogs = await captureConsoleLogs(page);

      await page.goto("http://localhost:3001/users");
      await waitForHydration(page);
      await page.waitForTimeout(3000);

      // Check if we have a session
      const hasSession = await page.evaluate(() => {
        // Check various session indicators
        const localStorage_session = localStorage.getItem("test_user");
        const cookies = document.cookie;
        console.log("[TEST] localStorage test_user:", localStorage_session);
        console.log("[TEST] cookies:", cookies.substring(0, 100));
        return !!localStorage_session || cookies.includes("auth");
      });

      console.log("Has session indicators:", hasSession);

      // Try to find and hover over a user
      const userCards = page.locator('[data-testid="user-card"], .group.relative').first();
      const hasUserCards = await userCards.isVisible().catch(() => false);

      if (!hasUserCards) {
        // Try alternative selectors for user links
        const userLinks = page.locator('a[href^="/users/"]').first();
        const hasLinks = await userLinks.isVisible().catch(() => false);

        if (hasLinks) {
          console.log("Found user link, hovering...");
          await userLinks.hover();
          await page.waitForTimeout(500);
        }
      }

      console.log("\n=== Auth Flow Logs ===");
      const authLogs = consoleLogs.filter((log) =>
        log.includes("[Auth]") || log.includes("[DEBUG:")
      );
      authLogs.forEach((log) => console.log(log));

      // Check auth state
      const authState = consoleLogs.find((log) => log.includes("[Auth] State:"));
      console.log("\nFinal Auth State:", authState || "Not found");
    });
  });
});
