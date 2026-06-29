# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: approval_workflow.spec.js >> Manager can approve a pending leave request
- Location: approval_workflow.spec.js:3:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/dashboard/manager" until "load"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - img [ref=e6]
    - heading "Welcome back" [level=2] [ref=e9]
    - paragraph [ref=e10]: Sign in to access your LeaveSync dashboard
  - generic [ref=e13]:
    - generic [ref=e14]:
      - img [ref=e15]
      - paragraph [ref=e17]: Invalid credentials
    - generic [ref=e18]:
      - generic [ref=e19]: Email address
      - generic [ref=e20]:
        - generic:
          - img
        - textbox "Email address" [ref=e21]:
          - /placeholder: you@example.com
          - text: manager@unichronic.com
    - generic [ref=e22]:
      - generic [ref=e23]: Password
      - generic [ref=e24]:
        - generic:
          - img
        - textbox "Password" [ref=e25]:
          - /placeholder: ••••••••
          - text: password123
    - generic [ref=e26]:
      - generic [ref=e27]:
        - checkbox "Remember me" [ref=e28]
        - generic [ref=e29]: Remember me
      - link "Forgot your password?" [ref=e31] [cursor=pointer]:
        - /url: "#"
    - button "Sign in" [ref=e33] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('Manager can approve a pending leave request', async ({ page }) => {
  4  |   await page.goto(process.env.BASE_URL || 'http://localhost:5173/login');
  5  |   await page.fill('input[type="email"]', process.env.QA_MANAGER_EMAIL || 'manager@unichronic.com');
  6  |   await page.fill('input[type="password"]', process.env.QA_MANAGER_PASSWORD || 'password123');
  7  |   await page.click('button[type="submit"]');
  8  |   
  9  |   // Navigate to manager dashboard
> 10 |   await page.waitForURL('**/dashboard/manager');
     |              ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
  11 | 
  12 |   // Wait for pending leaves to load
  13 |   await page.waitForSelector('text=Pending Leave Requests', { timeout: 10000 });
  14 |   
  15 |   // Check if there are any pending requests to approve
  16 |   const approveButton = page.locator('button:has-text("Approve")').first();
  17 |   if (await approveButton.isVisible()) {
  18 |     await approveButton.click();
  19 |     await page.fill('textarea[placeholder="Optional comments..."]', 'Approved via QA script');
  20 |     await page.click('button:has-text("Confirm Approval")');
  21 |     await expect(page.locator('text=Request approved successfully')).toBeVisible();
  22 |   } else {
  23 |     console.log('No pending requests to approve, skipping action.');
  24 |   }
  25 | });
  26 | 
```