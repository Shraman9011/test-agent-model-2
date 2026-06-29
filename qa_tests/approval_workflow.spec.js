import { test, expect } from '@playwright/test';

test('Manager can approve a pending leave request', async ({ page }) => {
  await page.goto(process.env.BASE_URL || 'http://localhost:5173/login');
  await page.fill('input[type="email"]', process.env.QA_MANAGER_EMAIL || 'manager@unichronic.com');
  await page.fill('input[type="password"]', process.env.QA_MANAGER_PASSWORD || 'password123');
  await page.click('button[type="submit"]');
  
  // Navigate to manager dashboard
  await page.waitForURL('**/dashboard/manager');

  // Wait for pending leaves to load
  await page.waitForSelector('text=Pending Leave Requests', { timeout: 10000 });
  
  // Check if there are any pending requests to approve
  const approveButton = page.locator('button:has-text("Approve")').first();
  if (await approveButton.isVisible()) {
    await approveButton.click();
    await page.fill('textarea[placeholder="Optional comments..."]', 'Approved via QA script');
    await page.click('button:has-text("Confirm Approval")');
    await expect(page.locator('text=Request approved successfully')).toBeVisible();
  } else {
    console.log('No pending requests to approve, skipping action.');
  }
});
