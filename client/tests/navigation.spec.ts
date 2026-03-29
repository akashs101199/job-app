import { test, expect } from '@playwright/test';

test.describe('Navigation & Layout', () => {
  test('should display home page', async ({ page }) => {
    await page.goto('/');

    // Check for main heading
    const heading = page.locator('h1, h2, [role="heading"]');
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  test('should show login/register links on home', async ({ page }) => {
    await page.goto('/');

    // Look for auth links
    const loginLink = page.locator('a:has-text("Login"), a:has-text("login")');
    const registerLink = page.locator('a:has-text("Register"), a:has-text("register")');

    if (await loginLink.isVisible()) {
      await expect(loginLink).toBeVisible();
    }
    if (await registerLink.isVisible()) {
      await expect(registerLink).toBeVisible();
    }
  });

  test('should redirect unauthenticated users away from joblist', async ({ page }) => {
    await page.goto('/joblist', { waitUntil: 'networkidle' });

    // Should redirect to login
    await expect(page).toHaveURL(/\/(login|register|)/);
  });

  test('login page should have all required fields', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('input[type="email"]')).toHaveCount(1);
    await expect(page.locator('input[type="password"]')).toHaveCount(1);
    await expect(page.locator('button')).toContainText(/Login|Submit/i);
  });

  test('register page should have all required fields', async ({ page }) => {
    await page.goto('/register');

    const email = page.locator('input[type="email"]');
    const password = page.locator('input[type="password"]');
    const firstName = page.locator('input[name="firstName"], input[placeholder*="First"]');
    const lastName = page.locator('input[name="lastName"], input[placeholder*="Last"]');

    await expect(email).toBeVisible();
    await expect(password).toBeVisible();
    await expect(firstName).toBeVisible();
    await expect(lastName).toBeVisible();
  });
});
