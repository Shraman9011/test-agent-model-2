/**
 * TC-3200-004: Keep Request button dismisses modal without cancelling
 */
const { chromium } = require('playwright');
(async () => {
  let result = { passed: false, error: null, screenshot: null };
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'employee@unichronic.com');
    await page.fill('input[type="password"]', 'employee123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:5173/dashboard/employee');
    await page.waitForSelector('h3:has-text("Recent Leave Requests")');
    await page.waitForTimeout(1500);

    const cancelBtn = page.locator('button[aria-label="Cancel Request"]').first();
    const count = await cancelBtn.count();
    if (count === 0) {
      result.error = 'No Cancel button found — no cancelable requests exist';
      await page.screenshot({ path: 'tc3200-004-error.png' });
      result.screenshot = 'tc3200-004-error.png';
      await browser.close();
      console.log(JSON.stringify(result));
      return;
    }

    await cancelBtn.click();
    await page.waitForSelector('[data-testid="cancel-leave-confirmation"]', { timeout: 5000 });

    // Click Keep Request
    await page.click('button:has-text("Keep Request")');

    // Modal should close — the confirmation element should no longer be visible
    await page.waitForTimeout(500);
    const stillOpen = await page.locator('[data-testid="cancel-leave-confirmation"]').count();
    if (stillOpen === 0) {
      // Verify the request is still in the table (PENDING badge still present)
      const pendingBadge = page.locator('span.bg-yellow-100:has-text("PENDING")').first();
      const pendingCount = await pendingBadge.count();
      if (pendingCount > 0) {
        result.passed = true;
      } else {
        result.error = 'Modal closed but PENDING badge not found — request may have been cancelled';
        await page.screenshot({ path: 'tc3200-004-error.png' });
        result.screenshot = 'tc3200-004-error.png';
      }
    } else {
      result.error = 'Confirmation modal still visible after clicking Keep Request';
      await page.screenshot({ path: 'tc3200-004-error.png' });
      result.screenshot = 'tc3200-004-error.png';
    }
  } catch (err) {
    result.error = err.toString();
    await page.screenshot({ path: 'tc3200-004-error.png' });
    result.screenshot = 'tc3200-004-error.png';
  } finally {
    await browser.close();
    console.log(JSON.stringify(result));
  }
})();
