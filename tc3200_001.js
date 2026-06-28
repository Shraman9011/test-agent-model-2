/**
 * TC-3200-001: Cancel button is an enabled <button> for PENDING requests
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
      result.error = 'No Cancel button found — no cancelable PENDING requests exist';
      await page.screenshot({ path: 'tc3200-001-error.png' });
      result.screenshot = 'tc3200-001-error.png';
    } else {
      const isEnabled = await cancelBtn.isEnabled();
      if (isEnabled) {
        result.passed = true;
      } else {
        result.error = 'Cancel button found but is disabled for PENDING row';
        await page.screenshot({ path: 'tc3200-001-error.png' });
        result.screenshot = 'tc3200-001-error.png';
      }
    }
  } catch (err) {
    result.error = err.toString();
    await page.screenshot({ path: 'tc3200-001-error.png' });
    result.screenshot = 'tc3200-001-error.png';
  } finally {
    await browser.close();
    console.log(JSON.stringify(result));
  }
})();
