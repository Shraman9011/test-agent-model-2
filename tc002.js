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
    
    await page.click('button:has-text("Apply for Leave")');
    await page.waitForSelector('h2:has-text("Apply for Leave")');
    
    await page.waitForSelector('select#leaveType:not([disabled])');
    await page.waitForFunction(() => document.querySelector('select#leaveType').options.length > 1);
    await page.selectOption('select#leaveType', { index: 1 });
    
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 3);
    const start = nextMonth.toISOString().split('T')[0];
    nextMonth.setDate(nextMonth.getDate() + 100);
    const end = nextMonth.toISOString().split('T')[0];
    
    await page.fill('input#startDate', start);
    await page.fill('input#endDate', end);
    await page.fill('input#totalDays', '100');
    await page.fill('textarea#reason', 'Long vacation');
    
    await page.click('button[type="submit"]:has-text("Apply Leave")');
    
    await page.waitForSelector('[role="alert"]', { timeout: 5000 });
    result.passed = true;
  } catch (err) {
    result.error = err.toString();
    await page.screenshot({ path: 'tc002-error.png' });
    result.screenshot = 'tc002-error.png';
  } finally {
    await browser.close();
    console.log(JSON.stringify(result));
  }
})();
