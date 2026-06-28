/**
 * TC-3197-001: Edit button is active (a real <button>) for PENDING requests
 */
const { chromium } = require('playwright');

(async () => {
  let result = { passed: false, error: null, screenshot: null };
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    // Login
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'employee@unichronic.com');
    await page.fill('input[type="password"]', 'employee123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:5173/dashboard/employee');

    // Wait for leave history table to load
    await page.waitForSelector('h3:has-text("Recent Leave Requests")');
    await page.waitForTimeout(1500);

    // Check if there's a PENDING row
    const pendingBadge = page.locator('span.bg-yellow-100:has-text("PENDING")').first();
    const pendingCount = await pendingBadge.count();

    if (pendingCount === 0) {
      // No pending requests visible — try filtering
      result.error = 'No PENDING requests found in history. Seed data required.';
      await page.screenshot({ path: 'tc3197-001-error.png' });
      result.screenshot = 'tc3197-001-error.png';
    } else {
      // Find the Edit button for PENDING row — it should be a <button>
      const editButton = page.locator('button[aria-label="Edit Request"]').first();
      const editButtonCount = await editButton.count();

      if (editButtonCount === 0) {
        result.error = 'No enabled Edit button found for PENDING row';
        await page.screenshot({ path: 'tc3197-001-error.png' });
        result.screenshot = 'tc3197-001-error.png';
      } else {
        const isEnabled = await editButton.isEnabled();
        if (isEnabled) {
          result.passed = true;
        } else {
          result.error = 'Edit button exists but is disabled for PENDING row';
          await page.screenshot({ path: 'tc3197-001-error.png' });
          result.screenshot = 'tc3197-001-error.png';
        }
      }
    }
  } catch (err) {
    result.error = err.toString();
    await page.screenshot({ path: 'tc3197-001-error.png' });
    result.screenshot = 'tc3197-001-error.png';
  } finally {
    await browser.close();
    console.log(JSON.stringify(result));
  }
})();
