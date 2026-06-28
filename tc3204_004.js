/** TC-3204-004: Approve and Reject buttons present for each pending request */
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

    if (listCount === 0) {
      result.error = 'Empty state shown — no pending requests to check buttons on';
      await page.screenshot({ path: 'tc3204-004-error.png' });
      result.screenshot = 'tc3204-004-error.png';
    } else {
      const firstCard = listEl.locator('> div').first();
      const approveBtn = firstCard.locator('button[aria-label*="Approve"]');
      const rejectBtn = firstCard.locator('button[aria-label*="Reject"]');
      const approveCount = await approveBtn.count();
      const rejectCount = await rejectBtn.count();

      if (approveCount > 0 && rejectCount > 0) {
        const approveEnabled = await approveBtn.first().isEnabled();
        const rejectEnabled = await rejectBtn.first().isEnabled();
        if (approveEnabled && rejectEnabled) {
          result.passed = true;
        } else {
          result.error = `Buttons found but disabled: approve=${approveEnabled}, reject=${rejectEnabled}`;
          await page.screenshot({ path: 'tc3204-004-error.png' });
          result.screenshot = 'tc3204-004-error.png';
        }
      } else {
        result.error = `Buttons missing: approveCount=${approveCount}, rejectCount=${rejectCount}`;
        await page.screenshot({ path: 'tc3204-004-error.png' });
        result.screenshot = 'tc3204-004-error.png';
      }
    }
  } catch (err) {
    result.error = err.toString();
    await page.screenshot({ path: 'tc3204-004-error.png' });
    result.screenshot = 'tc3204-004-error.png';
  } finally {
    await browser.close();
    console.log(JSON.stringify(result));
  }
})();
