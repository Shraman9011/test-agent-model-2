/** TC-3204-003: Each request card displays employee name, leave type, dates, days, and reason */
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
      result.error = 'No pending requests list — empty state shown, cannot verify card details';
      await page.screenshot({ path: 'tc3204-003-error.png' });
      result.screenshot = 'tc3204-003-error.png';
    } else {
      const firstCard = listEl.locator('> div').first();
      const nameEl = firstCard.locator('h4');
      const leaveTypeBadge = firstCard.locator('span.bg-blue-100');
      const dateText = firstCard.locator('div.text-sm.text-gray-500');
      const reasonEl = firstCard.locator('p.italic');

      const nameCount = await nameEl.count();
      const badgeCount = await leaveTypeBadge.count();
      const dateCount = await dateText.count();
      const reasonCount = await reasonEl.count();

      if (nameCount > 0 && badgeCount > 0 && dateCount > 0 && reasonCount > 0) {
        result.passed = true;
      } else {
        result.error = `Card missing elements: name=${nameCount}, leaveTypeBadge=${badgeCount}, dateRow=${dateCount}, reason=${reasonCount}`;
        await page.screenshot({ path: 'tc3204-003-error.png' });
        result.screenshot = 'tc3204-003-error.png';
      }
    }
  } catch (err) {
    result.error = err.toString();
    await page.screenshot({ path: 'tc3204-003-error.png' });
    result.screenshot = 'tc3204-003-error.png';
  } finally {
    await browser.close();
    console.log(JSON.stringify(result));
  }
})();
