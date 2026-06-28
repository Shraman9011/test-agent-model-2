/**
 * TC-3190-005: History table is readable on mobile viewport (375px)
 */
const { chromium } = require('playwright');
(async () => {
  let result = { passed: false, error: null, screenshot: null };
  const browser = await chromium.launch({ headless: true });
  // Launch with mobile viewport
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
  });
  const page = await context.newPage();
  try {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'employee@unichronic.com');
    await page.fill('input[type="password"]', 'employee123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:5173/dashboard/employee');
    await page.waitForSelector('h3:has-text("Recent Leave Requests")', { timeout: 8000 });
    await page.waitForTimeout(1500);

    // Assert the table element is present in DOM
    const table = page.locator('table');
    const tableCount = await table.count();

    if (tableCount === 0) {
      // Check if empty state is shown (still valid on mobile)
      const emptyMsg = await page.locator('p:has-text("No requests found")').count();
      if (emptyMsg > 0) {
        result.passed = true; // Table not shown because no data — valid
      } else {
        result.error = 'Table element not found on mobile viewport';
        await page.screenshot({ path: 'tc3190-005-error.png' });
        result.screenshot = 'tc3190-005-error.png';
      }
    } else {
      // Assert the overflow-x wrapper div exists (renders horizontal scroll on mobile)
      const overflowDiv = page.locator('div.overflow-x-auto');
      const overflowCount = await overflowDiv.count();

      if (overflowCount > 0) {
        // Verify table header is still visible (Type, Dates, Status, Actions)
        const typeHeader = await page.locator('th:has-text("Type")').count();
        if (typeHeader > 0) {
          result.passed = true;
        } else {
          result.error = 'Overflow container found but table headers missing on mobile';
          await page.screenshot({ path: 'tc3190-005-error.png' });
          result.screenshot = 'tc3190-005-error.png';
        }
      } else {
        result.error = 'Table found but no overflow-x-auto wrapper — may break on mobile';
        await page.screenshot({ path: 'tc3190-005-error.png' });
        result.screenshot = 'tc3190-005-error.png';
      }
    }
  } catch (err) {
    result.error = err.toString();
    await page.screenshot({ path: 'tc3190-005-error.png' });
    result.screenshot = 'tc3190-005-error.png';
  } finally {
    await browser.close();
    console.log(JSON.stringify(result));
  }
})();
