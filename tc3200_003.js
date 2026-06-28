/**
 * TC-3200-003: Cancel confirmation modal renders correctly
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
      await page.screenshot({ path: 'tc3200-003-error.png' });
      result.screenshot = 'tc3200-003-error.png';
      await browser.close();
      console.log(JSON.stringify(result));
      return;
    }

    await cancelBtn.click();

    // Wait for the confirmation dialog
    await page.waitForSelector('[data-testid="cancel-leave-confirmation"]', { timeout: 5000 });

    // Assert heading
    const heading = page.locator('h3:has-text("Cancel Leave Request")');
    const headingCount = await heading.count();

    // Assert Yes Cancel button
    const confirmBtn = page.locator('button:has-text("Yes, Cancel Request")');
    const confirmCount = await confirmBtn.count();

    // Assert Keep Request button
    const keepBtn = page.locator('button:has-text("Keep Request")');
    const keepCount = await keepBtn.count();

    if (headingCount > 0 && confirmCount > 0 && keepCount > 0) {
      result.passed = true;
    } else {
      result.error = `Modal missing elements: heading=${headingCount}, confirmBtn=${confirmCount}, keepBtn=${keepCount}`;
      await page.screenshot({ path: 'tc3200-003-error.png' });
      result.screenshot = 'tc3200-003-error.png';
    }
  } catch (err) {
    result.error = err.toString();
    await page.screenshot({ path: 'tc3200-003-error.png' });
    result.screenshot = 'tc3200-003-error.png';
  } finally {
    await browser.close();
    console.log(JSON.stringify(result));
  }
})();
