/**
 * TC-3200-005: Successfully cancel a PENDING leave request
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
      await page.screenshot({ path: 'tc3200-005-error.png' });
      result.screenshot = 'tc3200-005-error.png';
      await browser.close();
      console.log(JSON.stringify(result));
      return;
    }

    await cancelBtn.click();
    await page.waitForSelector('[data-testid="cancel-leave-confirmation"]', { timeout: 5000 });

    // Confirm cancellation
    await page.click('button:has-text("Yes, Cancel Request")');

    // Assert success state
    await page.waitForSelector('[data-testid="cancel-success"]', { timeout: 6000 });
    const successHeading = page.locator('h3:has-text("Request Cancelled Successfully")');
    const headingCount = await successHeading.count();
    if (headingCount > 0) {
      result.passed = true;
    } else {
      result.error = 'Success element found but heading text missing';
      await page.screenshot({ path: 'tc3200-005-error.png' });
      result.screenshot = 'tc3200-005-error.png';
    }
  } catch (err) {
    result.error = err.toString();
    await page.screenshot({ path: 'tc3200-005-error.png' });
    result.screenshot = 'tc3200-005-error.png';
  } finally {
    await browser.close();
    console.log(JSON.stringify(result));
  }
})();
