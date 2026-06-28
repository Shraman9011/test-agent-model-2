import { chromium } from 'playwright';
import fs from 'fs';

const BASE_URL = 'http://localhost:5173';

async function runTests() {
    let browser = await chromium.launch({ headless: true });
    let context = await browser.newContext();
    
    console.log("=== Running Playwright Password Reset Tests ===\n");
    const results = [];
    
    // TC-001: User Enumeration Prevention
    try {
        let page = await context.newPage();
        
        // Test with registered email
        await page.goto(`${BASE_URL}/forgot-password`);
        await page.fill('input[type="email"]', 'hradmin@example.com');
        await page.click('button[type="submit"]');
        await page.waitForSelector('text="Check your email"');
        const text1 = await page.innerText('body');
        
        // Test with unregistered email
        await page.goto(`${BASE_URL}/forgot-password`);
        await page.fill('input[type="email"]', 'fake.user.doesnotexist@example.com');
        await page.click('button[type="submit"]');
        await page.waitForSelector('text="Check your email"');
        const text2 = await page.innerText('body');
        
        if (!text1.includes('Check your email') || !text2.includes('Check your email')) {
            throw new Error('Success message not displayed');
        }
        
        results.push({ id: 'TC-001', passed: true, error: null, screenshot: null });
        console.log("✅ TC-001 Passed: User Enumeration Prevention");
        await page.close();
    } catch (err) {
        results.push({ id: 'TC-001', passed: false, error: err.message, screenshot: null });
        console.log("❌ TC-001 Failed: " + err.message);
    }
    
    // TC-002: Password Complexity Validation
    try {
        let page = await context.newPage();
        await page.goto(`${BASE_URL}/reset-password?token=invalid-token`);
        
        // Wait for inputs
        await page.waitForSelector('input#password');
        
        // Enter weak password
        await page.fill('input#password', 'weak');
        await page.fill('input#confirmPassword', 'weak');
        
        // Submit should be disabled due to complexity constraints on frontend
        const isDisabled = await page.isDisabled('button[type="submit"]');
        if (!isDisabled) {
             throw new Error('Submit button should be disabled for weak passwords');
        }
        
        // Enter strong password but mismatched
        await page.fill('input#password', 'StrongP@ss123');
        await page.fill('input#confirmPassword', 'StrongP@ss1234');
        const isMismatchDisabled = await page.isDisabled('button[type="submit"]');
        if (!isMismatchDisabled) {
             throw new Error('Submit button should be disabled for mismatched passwords');
        }

        results.push({ id: 'TC-002', passed: true, error: null, screenshot: null });
        console.log("✅ TC-002 Passed: Password Complexity Validation");
        await page.close();
    } catch (err) {
        results.push({ id: 'TC-002', passed: false, error: err.message, screenshot: null });
        console.log("❌ TC-002 Failed: " + err.message);
    }
    
    // TC-003: Token Expiration/Reuse (Invalid Token)
    try {
        let page = await context.newPage();
        await page.goto(`${BASE_URL}/reset-password?token=invalid-expired-token`);
        
        // Enter valid complex password
        await page.fill('input#password', 'ValidP@ss123!');
        await page.fill('input#confirmPassword', 'ValidP@ss123!');
        
        // Submit should be enabled now
        await page.click('button[type="submit"]');
        
        // Wait for backend rejection
        await page.waitForSelector('text="Failed to reset password"');
        const errText = await page.innerText('body');
        if (!errText.includes('Failed to reset password')) {
            throw new Error('Did not show invalid token error from backend');
        }

        results.push({ id: 'TC-003', passed: true, error: null, screenshot: null });
        console.log("✅ TC-003 Passed: Token Expiration/Invalidation");
        await page.close();
    } catch (err) {
        results.push({ id: 'TC-003', passed: false, error: err.message, screenshot: null });
        console.log("❌ TC-003 Failed: " + err.message);
    }

    fs.writeFileSync('pw_reset_results.json', JSON.stringify(results, null, 2));
    await browser.close();
    console.log("Tests completed.");
}

runTests().catch(console.error);
