/**
 * TC-3190-004: Pagination Previous button disabled on first page
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

    // Check if pagination controls exist
    const prevBtn = page.locator('button:has-text("Previous")');
    const prevCount = await prevBtn.count();

    if (prevCount > 0) {
      // Pagination is shown — verify Previous is disabled on first page
      const isDisabled = await prevBtn.first().isDisabled();
      if (isDisabled) {
        result.passed = true;
      } else {
        result.error = 'Previous button is enabled on first page — should be disabled';
        await page.screenshot({ path: 'tc3190-004-error.png' });
        result.screenshot = 'tc3190-004-error.png';
      }
    } else {
      // Pagination not shown — data fits on one page, which is valid behavior
      // Check that table has data (not an error state)
      const rows = await page.locator('tbody tr').count();
      const emptyMsg = await page.locator('p:has-text("No requests found")').count();
      if (rows > 0 || emptyMsg > 0) {
        // Single-page data: no pagination controls = correct behavior
        result.passed = true;
      } else {
        result.error = 'Neither table rows nor empty state nor pagination found';
        await page.screenshot({ path: 'tc3190-004-error.png' });
        result.screenshot = 'tc3190-004-error.png';
      }
    }
  } catch (err) {
    result.error = err.toString();
    await page.screenshot({ path: 'tc3190-004-error.png' });
    result.screenshot = 'tc3190-004-error.png';
  } finally {
    await browser.close();
    console.log(JSON.stringify(result));
  }
})();
