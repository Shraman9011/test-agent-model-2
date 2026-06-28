/**
 * TC-3197-002: Edit action is a <span> (disabled) for APPROVED/REJECTED requests
 * Strategy: Filter by APPROVED, check that edit action is NOT a <button>
 */
const { chromium } = require('playwright');

(async () => {
  let result = { passed: false, error: null, screenshot: null };
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    // Login
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'employee@unichronic.com');
    await page.fill('input[type="password"]', 'employee123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:5173/dashboard/employee');

    // Wait for the leave history section
    await page.waitForSelector('h3:has-text("Recent Leave Requests")');
    await page.waitForTimeout(1500);

    // Filter by APPROVED
    await page.selectOption('select[aria-label="Filter by Status"]', 'APPROVED');
    await page.waitForTimeout(1000);

    const approvedBadges = page.locator('span.bg-green-100:has-text("APPROVED")');
    const approvedCount = await approvedBadges.count();

    if (approvedCount > 0) {
      // Verify edit button for APPROVED rows is a span, not a button
      const editButtons = page.locator('button[aria-label="Edit Request"]');
      const editButtonCount = await editButtons.count();

      if (editButtonCount > 0) {
        result.error = `Found ${editButtonCount} enabled Edit button(s) for APPROVED rows — expected none`;
        await page.screenshot({ path: 'tc3197-002-error.png' });
        result.screenshot = 'tc3197-002-error.png';
      } else {
        // Check the span placeholder is there instead
        const editSpan = page.locator('span:has-text("Edit")').first();
        const spanCount = await editSpan.count();
        if (spanCount > 0) {
          result.passed = true;
        } else {
          result.error = 'Neither button nor span Edit found for APPROVED row';
          await page.screenshot({ path: 'tc3197-002-error.png' });
          result.screenshot = 'tc3197-002-error.png';
        }
      }
    } else {
      // No approved requests — try REJECTED
      await page.selectOption('select[aria-label="Filter by Status"]', 'REJECTED');
      await page.waitForTimeout(1000);

      const rejectedBadges = page.locator('span.bg-red-100:has-text("REJECTED")');
      const rejectedCount = await rejectedBadges.count();

      if (rejectedCount > 0) {
        const editButtons = page.locator('button[aria-label="Edit Request"]');
        const editButtonCount = await editButtons.count();
        if (editButtonCount > 0) {
          result.error = `Found ${editButtonCount} enabled Edit button(s) for REJECTED rows — expected none`;
          await page.screenshot({ path: 'tc3197-002-error.png' });
          result.screenshot = 'tc3197-002-error.png';
        } else {
          result.passed = true;
        }
      } else {
        result.error = 'No APPROVED or REJECTED requests found to test disabled edit state';
        await page.screenshot({ path: 'tc3197-002-error.png' });
        result.screenshot = 'tc3197-002-error.png';
      }
    }
  } catch (err) {
    result.error = err.toString();
    await page.screenshot({ path: 'tc3197-002-error.png' });
    result.screenshot = 'tc3197-002-error.png';
  } finally {
    await browser.close();
    console.log(JSON.stringify(result));
  }
})();
