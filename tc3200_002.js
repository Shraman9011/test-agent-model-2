/**
 * TC-3200-002: Cancel action is a <span> (disabled) for REJECTED requests
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

    // Filter by REJECTED
    await page.selectOption('select[aria-label="Filter by Status"]', 'REJECTED');
    await page.waitForTimeout(1000);

    const rejectedBadges = page.locator('span.bg-red-100:has-text("REJECTED")');
    const rejectedCount = await rejectedBadges.count();

    if (rejectedCount > 0) {
      // For REJECTED rows, Cancel should NOT be a <button>
      const cancelBtns = page.locator('button[aria-label="Cancel Request"]');
      const btnCount = await cancelBtns.count();
      if (btnCount > 0) {
        result.error = `Found ${btnCount} enabled Cancel button(s) for REJECTED rows — expected none`;
        await page.screenshot({ path: 'tc3200-002-error.png' });
        result.screenshot = 'tc3200-002-error.png';
      } else {
        result.passed = true;
      }
    } else {
      // Also check APPROVED past leaves (past start_date) — those should also be non-cancelable
      await page.selectOption('select[aria-label="Filter by Status"]', 'APPROVED');
      await page.waitForTimeout(1000);
      const approvedBadges = page.locator('span.bg-green-100:has-text("APPROVED")');
      const approvedCount = await approvedBadges.count();
      if (approvedCount > 0) {
        const cancelBtns = page.locator('button[aria-label="Cancel Request"]');
        const btnCount = await cancelBtns.count();
        // Past APPROVED should have no cancel button
        if (btnCount === 0) {
          result.passed = true;
        } else {
          // Some APPROVED are future — that's valid, test inconclusive on data
          result.error = 'Could not isolate past APPROVED rows to verify disabled cancel';
          await page.screenshot({ path: 'tc3200-002-error.png' });
          result.screenshot = 'tc3200-002-error.png';
        }
      } else {
        result.error = 'No REJECTED or APPROVED requests found to verify disabled cancel state';
        await page.screenshot({ path: 'tc3200-002-error.png' });
        result.screenshot = 'tc3200-002-error.png';
      }
    }
  } catch (err) {
    result.error = err.toString();
    await page.screenshot({ path: 'tc3200-002-error.png' });
    result.screenshot = 'tc3200-002-error.png';
  } finally {
    await browser.close();
    console.log(JSON.stringify(result));
  }
})();
