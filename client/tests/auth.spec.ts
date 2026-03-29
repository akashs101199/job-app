import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Login")')).toBeVisible();
  });

  test('should display register page', async ({ page }) => {
    await page.goto('/register');

    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
  });

  test('should show error on invalid email', async ({ page }) => {
    await page.goto('/login');

    // Try submitting with invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Login")');

    // Wait for error message
    await expect(page.locator('text=Invalid email')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate from login to register', async ({ page }) => {
    await page.goto('/login');

    const registerLink = page.locator('a:has-text("Create an account")');
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL('/register');
    }
  });
});
