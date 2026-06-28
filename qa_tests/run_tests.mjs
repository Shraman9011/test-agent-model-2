import { chromium } from 'playwright';
import fs from 'fs';

const BASE_URL = 'http://localhost:5173';
const QA_ADMIN_EMAIL = 'hradmin@example.com';
const QA_ADMIN_PASSWORD = 'HrAdmin@123!';
const QA_USER_EMAIL = 'employee@example.com';
const QA_USER_PASSWORD = 'Employee@123!';

async function runTests() {
    console.log("Starting Chrome browser...");
    let browser = await chromium.launch({ headless: true });
    let context = await browser.newContext();
    
    console.log("=== Running Playwright QA Tests ===\n");
    const results = [];
    
    try {
        console.log("TC-001: Successful Login and Token Creation...");
        let page = await context.newPage();
        await page.goto(`${BASE_URL}/login`);
        await page.fill('input[type="email"]', QA_USER_EMAIL);
        await page.fill('input[type="password"]', QA_USER_PASSWORD);
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard', { timeout: 10000 });
        
        const token = await page.evaluate(() => localStorage.getItem('auth_token'));
        if (!token) throw new Error('Token not found in localStorage');
        
        results.push({ id: 'TC-001', passed: true });
        console.log("✅ TC-001 Passed\n");
        await page.close();
    } catch (err) {
        results.push({ id: 'TC-001', passed: false, error: err.message });
        console.log(`❌ TC-001 Failed: ${err.message}\n`);
    }

    try {
        console.log("TC-002: Logout redirects to login and prevents back-button access...");
        let page = await context.newPage();
        await page.goto(`${BASE_URL}/login`);
        await page.fill('input[type="email"]', QA_USER_EMAIL);
        await page.fill('input[type="password"]', QA_USER_PASSWORD);
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard', { timeout: 10000 });
        
        await page.getByRole('button', { name: /log out/i }).click();
        await page.waitForURL('**/login', { timeout: 10000 });
        
        const token = await page.evaluate(() => localStorage.getItem('auth_token'));
        if (token) throw new Error('Token still in localStorage after logout');
        
        await page.goBack();
        await page.waitForTimeout(2000); 
        if (page.url().includes('dashboard')) {
             throw new Error('Able to access dashboard via back button');
        }
        
        results.push({ id: 'TC-002', passed: true });
        console.log("✅ TC-002 Passed\n");
        await page.close();
    } catch (err) {
        results.push({ id: 'TC-002', passed: false, error: err.message });
        console.log(`❌ TC-002 Failed: ${err.message}\n`);
    }

    try {
        console.log("TC-003: Login with Invalid Credentials...");
        let page = await context.newPage();
        await page.goto(`${BASE_URL}/login`);
        await page.fill('input[type="email"]', QA_USER_EMAIL);
        await page.fill('input[type="password"]', 'WrongPassword123!');
        await page.click('button[type="submit"]');
        
        const errorLocator = page.getByText(/invalid|incorrect|failed/i);
        await errorLocator.waitFor({ timeout: 5000 });
        
        results.push({ id: 'TC-003', passed: true });
        console.log("✅ TC-003 Passed\n");
        await page.close();
    } catch (err) {
        results.push({ id: 'TC-003', passed: false, error: err.message });
        console.log(`❌ TC-003 Failed: ${err.message}\n`);
    }

    fs.writeFileSync('results.json', JSON.stringify(results, null, 2));
    await browser.close();
    console.log("=== Tests Completed ===");
}

runTests();
