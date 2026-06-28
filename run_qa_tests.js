const { chromium } = require('playwright');
const fs = require('fs');

async function runTC001() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  let passed = false;
  let error = null;

  try {
    // Mock login and balances
    await page.route('**/api/auth/login', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ access: 'fake-token', refresh: 'fake-refresh', user: { id: 1, first_name: 'Test', last_name: 'User', email: 'test@example.com', role: 'EMPLOYEE' } })
      });
    });
    
    // First balance fetch (Initial State)
    await page.route('**/api/leaves/balances*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 1,
          leave_type: { name: 'Annual' },
          year: 2026,
          allocated_days: '20.0',
          used_days: '5.0',
          pending_days: '0.0',
          remaining_days: '15.0'
        }])
      });
    });

    await page.goto('http://localhost:5173/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForURL('**/dashboard/employee', { timeout: 10000 });
    
    // Verify initial balance
    await page.waitForSelector('text=15 days left', { timeout: 10000 });
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
    
    // Negative balance fetch
    await page.route('**/api/leaves/balances*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 1,
          leave_type: { name: 'Annual' },
          year: 2026,
          allocated_days: '20.0',
          used_days: '22.0',
          pending_days: '0.0',
          remaining_days: '-2.0'
        }])
      });
    });

    await page.goto('http://localhost:5173/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard/employee', { timeout: 10000 });
    
    const dashboard = page.locator('body');
    await dashboard.waitFor();
    
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
