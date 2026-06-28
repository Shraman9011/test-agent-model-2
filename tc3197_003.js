/**
 * TC-3197-003: Successfully edit a PENDING leave request
 * Opens the edit modal, updates the reason, and checks for success message
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

    // Click the Edit button on the first PENDING row
    const editButton = page.locator('button[aria-label="Edit Request"]').first();
    const editButtonCount = await editButton.count();
    if (editButtonCount === 0) {
      result.error = 'No Edit button found — no PENDING requests exist';
      await page.screenshot({ path: 'tc3197-003-error.png' });
      result.screenshot = 'tc3197-003-error.png';
      await browser.close();
      console.log(JSON.stringify(result));
      return;
    }

    await editButton.click();

    // Wait for the Edit Leave Request form to appear
    await page.waitForSelector('h2:has-text("Edit Leave Request")', { timeout: 5000 });

    // Update the reason
    await page.fill('textarea#editReason', 'Updated reason for leave - automated test edit');

    // Click Save Changes
    await page.click('button[type="submit"]:has-text("Save Changes")');

    // Assert success message
    await page.waitForSelector('text=Request Updated Successfully', { timeout: 6000 });
    result.passed = true;
  } catch (err) {
    result.error = err.toString();
    await page.screenshot({ path: 'tc3197-003-error.png' });
    result.screenshot = 'tc3197-003-error.png';
  } finally {
    await browser.close();
    console.log(JSON.stringify(result));
  }
})();
