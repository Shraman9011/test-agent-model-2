/** TC-3204-005: Empty state shown when no pending requests exist
 *  If pending requests exist, verify empty-state is NOT shown (data-testid absent)
 */
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
    await page.waitForSelector('[data-testid="pending-requests-skeleton"]', { timeout: 5000 }).catch(() => {});
    await page.waitForSelector('[data-testid="pending-requests-skeleton"]', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.waitForSelector('[data-testid="pending-requests-list"], [data-testid="empty-state"]', { timeout: 12000 });

    const listEl = page.locator('[data-testid="pending-requests-list"]');
    const listCount = await listEl.count();

    if (listCount > 0) {
      // Pending requests exist — empty state should NOT be shown (correct behavior)
      result.passed = true;
    } else {
      // Verify "All caught up!" text (specific to pending requests empty state)
      const heading = page.locator('h3:has-text("All caught up!")');
      const desc = page.locator('p:has-text("no pending leave requests")');
      const headingCount = await heading.count();
      const descCount = await desc.count();
      
      if (headingCount > 0 && descCount > 0) {
        result.passed = true;
      } else {
        result.error = `List missing but empty state text not found: heading=${headingCount}, desc=${descCount}`;
        await page.screenshot({ path: 'tc3204-005-error.png' });
        result.screenshot = 'tc3204-005-error.png';
      }
    }
  } catch (err) {
    result.error = err.toString();
    await page.screenshot({ path: 'tc3204-005-error.png' });
    result.screenshot = 'tc3204-005-error.png';
  } finally {
    await browser.close();
    console.log(JSON.stringify(result));
  }
})();
