/** TC-3204-001: Manager dashboard renders Pending Approvals section */
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

    // Wait for skeleton to disappear (skeleton uses data-testid="pending-requests-skeleton")
    await page.waitForSelector('[data-testid="pending-requests-skeleton"]', { timeout: 5000 }).catch(() => {});
    await page.waitForSelector('[data-testid="pending-requests-skeleton"]', { state: 'hidden', timeout: 10000 }).catch(() => {});

    // Wait for either pending list or empty state to show
    await page.waitForSelector('[data-testid="pending-requests-list"], [data-testid="empty-state"]', { timeout: 12000 });

    // Assert Pending Approvals heading
    const heading = page.locator('h3:has-text("Pending Approvals")');
    const headingCount = await heading.count();
    if (headingCount > 0) {
      result.passed = true;
    } else {
      result.error = 'Pending Approvals heading not found after data loaded';
      await page.screenshot({ path: 'tc3204-001-error.png' });
      result.screenshot = 'tc3204-001-error.png';
    }
  } catch (err) {
    result.error = err.toString();
    await page.screenshot({ path: 'tc3204-001-error.png' });
    result.screenshot = 'tc3204-001-error.png';
  } finally {
    await browser.close();
    console.log(JSON.stringify(result));
  }
})();
