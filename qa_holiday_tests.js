const { chromium } = require('playwright');
const fs = require('fs');

async function runTC001() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  let passed = false;
  let error = null;

  try {
    // Mock login
    await page.route('**/api/auth/login', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ access: 'fake-token', refresh: 'fake-refresh', user: { id: 1, email: 'test@example.com', role: 'EMPLOYEE' } })
      });
    });
    
    // Mock holidays - OUT OF ORDER
    await page.route('**/api/holidays*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, name: 'Christmas', date: '2026-12-25', description: 'Winter' },
          { id: 2, name: 'New Year', date: '2026-01-01', description: 'Start' },
          { id: 3, name: 'Independence Day', date: '2026-07-04', description: 'Summer' }
        ])
      });
    });
    
    // Mock balances to prevent 401 redirect
    await page.route('**/api/leaves/balances*', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto('http://localhost:5173/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard/employee', { timeout: 10000 });
    
    // Wait for holiday component
    await page.waitForSelector('text=Upcoming Holidays', { timeout: 10000 });
    // Wait for the skeleton to disappear (the holidays list items to appear)
    await page.waitForSelector('h4:has-text("New Year")', { timeout: 10000 });

    const holidayNames = await page.$$eval('li h4', nodes => nodes.map(n => n.textContent));
    
    // Validate chronological order
    if (holidayNames.length < 3) {
      throw new Error(`Expected 3 holidays, got ${holidayNames.length}`);
    }
    
    if (holidayNames[0] !== 'New Year' || holidayNames[1] !== 'Independence Day' || holidayNames[2] !== 'Christmas') {
      throw new Error(`Holidays not sorted correctly. Expected [New Year, Independence Day, Christmas], got [${holidayNames.join(', ')}]`);
    }

    passed = true;
  } catch (err) {
    error = err.message;
    await page.screenshot({ path: 'TC-001-fail.png' });
  } finally {
    await browser.close();
    return {
      execution_result: {
        passed,
        error,
        screenshot: passed ? null : 'TC-001-fail.png',
        executedAt: new Date().toISOString()
      }
    };
  }
}

async function runTC002() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  let passed = false;
  let error = null;

  try {
    await page.route('**/api/auth/login', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ access: 'fake-token', refresh: 'fake-refresh', user: { id: 1, email: 'test@example.com', role: 'EMPLOYEE' } })
      });
    });
    
    // Empty holidays
    await page.route('**/api/holidays*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });
    
    // Mock balances to prevent 401 redirect
    await page.route('**/api/leaves/balances*', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto('http://localhost:5173/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard/employee', { timeout: 10000 });
    
    await page.waitForSelector('text=No upcoming company holidays remaining for this year.', { timeout: 10000 });
    
    passed = true;
  } catch (err) {
    error = err.message;
    await page.screenshot({ path: 'TC-002-fail.png' });
  } finally {
    await browser.close();
    return {
      execution_result: {
        passed,
        error,
        screenshot: passed ? null : 'TC-002-fail.png',
        executedAt: new Date().toISOString()
      }
    };
  }
}

async function main() {
  console.log("Running TC-001...");
  const tc1 = await runTC001();
  console.log("TC-001 Result:", JSON.stringify(tc1, null, 2));

  console.log("Running TC-002...");
  const tc2 = await runTC002();
  console.log("TC-002 Result:", JSON.stringify(tc2, null, 2));
}

main().catch(console.error);
