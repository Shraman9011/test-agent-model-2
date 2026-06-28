/**
 * TC-3190-003: Empty state message when filter yields no results
 * Uses REJECTED filter since test data may not have any REJECTED records
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

    // Try REJECTED filter — likely to return no records in test DB
    await page.selectOption('select[aria-label="Filter by Status"]', 'REJECTED');
    await page.waitForTimeout(1000);

    const rows = await page.locator('tbody tr').count();
    if (rows === 0) {
      // Verify empty state message appears
      const emptyMsg = page.locator('p:has-text("No requests found matching your filters.")');
      const msgCount = await emptyMsg.count();
      if (msgCount > 0) {
        result.passed = true;
      } else {
        result.error = 'Zero rows but empty-state message not shown';
        await page.screenshot({ path: 'tc3190-003-error.png' });
        result.screenshot = 'tc3190-003-error.png';
      }
    } else {
      // REJECTED records exist; try a leave type filter that doesn't match
      // Reset status filter and apply a mismatched leave type
      await page.selectOption('select[aria-label="Filter by Status"]', '');
      await page.waitForTimeout(500);

      // Get all available leave type options
      const leaveTypeSelect = page.locator('select[aria-label="Filter by Leave Type"]');
      const options = await leaveTypeSelect.locator('option').all();
      if (options.length > 1) {
        // Select the last leave type option which may not have records
        const lastOptionValue = await options[options.length - 1].getAttribute('value');
        await page.selectOption('select[aria-label="Filter by Leave Type"]', lastOptionValue);
        await page.waitForTimeout(1000);
        // Also filter REJECTED status to reduce results to zero
        await page.selectOption('select[aria-label="Filter by Status"]', 'REJECTED');
        await page.waitForTimeout(1000);

        const finalRows = await page.locator('tbody tr').count();
        if (finalRows === 0) {
          const emptyMsg = await page.locator('p:has-text("No requests found matching your filters.")').count();
          result.passed = emptyMsg > 0;
          if (!result.passed) {
            result.error = 'Zero rows with combined filter but empty-state message not shown';
            await page.screenshot({ path: 'tc3190-003-error.png' });
            result.screenshot = 'tc3190-003-error.png';
          }
        } else {
          result.error = 'Could not create an empty filter scenario with available data';
          await page.screenshot({ path: 'tc3190-003-error.png' });
          result.screenshot = 'tc3190-003-error.png';
        }
      } else {
        result.error = 'No leave type options to test empty filter state';
        await page.screenshot({ path: 'tc3190-003-error.png' });
        result.screenshot = 'tc3190-003-error.png';
      }
    }
  } catch (err) {
    result.error = err.toString();
    await page.screenshot({ path: 'tc3190-003-error.png' });
    result.screenshot = 'tc3190-003-error.png';
  } finally {
    await browser.close();
    console.log(JSON.stringify(result));
  }
})();
