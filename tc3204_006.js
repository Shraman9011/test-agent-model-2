/** TC-3204-006: Pending requests list loads within 2 seconds */
const { chromium } = require('playwright');
(async () => {
  let result = { passed: false, error: null, screenshot: null };
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'manager@unichronic.com');
    await page.fill('input[type="password"]', 'manager123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard/manager', { timeout: 10000 });

    // Measure from page reload to content render
    const startTime = Date.now();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="pending-requests-list"], [data-testid="empty-state"]', { timeout: 10000 });
    const elapsed = Date.now() - startTime;

    if (elapsed < 2000) {
      result.passed = true;
    } else {
      result.error = `Pending section took ${elapsed}ms — exceeds 2000ms threshold`;
      await page.screenshot({ path: 'tc3204-006-error.png' });
      result.screenshot = 'tc3204-006-error.png';
    }
  } catch (err) {
    result.error = err.toString();
    await page.screenshot({ path: 'tc3204-006-error.png' });
    result.screenshot = 'tc3204-006-error.png';
  } finally {
    await browser.close();
    console.log(JSON.stringify(result));
  }
})();
