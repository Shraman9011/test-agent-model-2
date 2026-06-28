/** TC-3204-007: Employee user cannot access manager dashboard (RBAC) */
const { chromium } = require('playwright');
(async () => {
  let result = { passed: false, error: null, screenshot: null };
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    // Login as employee (non-manager)
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'employee@unichronic.com');
    await page.fill('input[type="password"]', 'employee123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard/employee', { timeout: 8000 });

    // Attempt to navigate to the manager dashboard
    await page.goto('http://localhost:5173/dashboard/manager');
    await page.waitForTimeout(1500);

    const currentUrl = page.url();
    // Should be redirected away from manager dashboard
    if (!currentUrl.includes('/dashboard/manager')) {
      result.passed = true;
    } else {
      // Still on manager dashboard — check if it shows an error or the section is empty
      const pendingSection = await page.locator('h3:has-text("Pending Approvals")').count();
      if (pendingSection > 0) {
        result.error = 'Employee can access /dashboard/manager — RBAC not enforced';
        await page.screenshot({ path: 'tc3204-007-error.png' });
        result.screenshot = 'tc3204-007-error.png';
      } else {
        // Redirected to login or shows error — acceptable
        result.passed = true;
      }
    }
  } catch (err) {
    result.error = err.toString();
    await page.screenshot({ path: 'tc3204-007-error.png' });
    result.screenshot = 'tc3204-007-error.png';
  } finally {
    await browser.close();
    console.log(JSON.stringify(result));
  }
})();
