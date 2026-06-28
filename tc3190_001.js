/**
 * TC-3190-001: History table renders with rows on dashboard load
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

    // Wait for the section heading
    await page.waitForSelector('h3:has-text("Recent Leave Requests")', { timeout: 8000 });
    await page.waitForTimeout(1500);

    // Assert table body has at least one row
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    if (rowCount >= 1) {
      result.passed = true;
    } else {
      // Check if empty state is shown — that means table rendered but no data
      const emptyMsg = await page.locator('p:has-text("No requests found")').count();
      if (emptyMsg > 0) {
        result.error = 'Table rendered but no history rows found — seed data needed';
      } else {
        result.error = 'Table body not rendered at all';
      }
      await page.screenshot({ path: 'tc3190-001-error.png' });
      result.screenshot = 'tc3190-001-error.png';
    }
  } catch (err) {
    result.error = err.toString();
    await page.screenshot({ path: 'tc3190-001-error.png' });
    result.screenshot = 'tc3190-001-error.png';
  } finally {
    await browser.close();
    console.log(JSON.stringify(result));
  }
})();
