/**
 * TC-3190-002: Status filter returns only rows matching selected status
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
    await page.waitForSelector('h3:has-text("Recent Leave Requests")', { timeout: 8000 });
    await page.waitForTimeout(1500);

    // Test PENDING filter
    await page.selectOption('select[aria-label="Filter by Status"]', 'PENDING');
    await page.waitForTimeout(1000);

    const pendingRows = await page.locator('tbody tr').count();
    if (pendingRows > 0) {
      // All visible status badges must be yellow (PENDING)
      const nonPending = await page.locator('tbody span:not(.bg-yellow-100):not(.bg-gray-200)').count();
      // bg-gray-200 is used for loading shimmer — we can safely ignore zero-count
      const pendingBadges = await page.locator('tbody span.bg-yellow-100').count();
      if (pendingBadges === pendingRows) {
        // Now test CANCELLED filter
        await page.selectOption('select[aria-label="Filter by Status"]', 'CANCELLED');
        await page.waitForTimeout(1000);

        const cancelledRows = await page.locator('tbody tr').count();
        if (cancelledRows > 0) {
          const cancelledBadges = await page.locator('tbody span.bg-gray-100:has-text("CANCELLED")').count();
          if (cancelledBadges === cancelledRows) {
            result.passed = true;
          } else {
            result.error = `CANCELLED filter: ${cancelledRows} rows but only ${cancelledBadges} CANCELLED badges`;
            await page.screenshot({ path: 'tc3190-002-error.png' });
            result.screenshot = 'tc3190-002-error.png';
          }
        } else {
          // No cancelled — just verify empty state or skip
          const emptyMsg = await page.locator('p:has-text("No requests found")').count();
          result.passed = emptyMsg > 0; // empty state shown = correct filter behavior
          if (!result.passed) {
            result.error = 'CANCELLED filter showed neither rows nor empty state';
            await page.screenshot({ path: 'tc3190-002-error.png' });
            result.screenshot = 'tc3190-002-error.png';
          }
        }
      } else {
        result.error = `PENDING filter: ${pendingRows} rows but only ${pendingBadges} PENDING badges`;
        await page.screenshot({ path: 'tc3190-002-error.png' });
        result.screenshot = 'tc3190-002-error.png';
      }
    } else {
      // No pending rows — check empty state
      const emptyMsg = await page.locator('p:has-text("No requests found")').count();
      result.passed = emptyMsg > 0;
      if (!result.passed) {
        result.error = 'PENDING filter showed neither rows nor empty state';
        await page.screenshot({ path: 'tc3190-002-error.png' });
        result.screenshot = 'tc3190-002-error.png';
      }
    }
  } catch (err) {
    result.error = err.toString();
    await page.screenshot({ path: 'tc3190-002-error.png' });
    result.screenshot = 'tc3190-002-error.png';
  } finally {
    await browser.close();
    console.log(JSON.stringify(result));
  }
})();
