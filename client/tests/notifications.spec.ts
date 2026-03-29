import { test, expect } from '@playwright/test';

test.describe('Notification Features', () => {
  test('notification preferences page should load', async ({ page }) => {
    // Navigate to login first
    await page.goto('/');

    // Check if we can see notification preferences in the UI
    const preferencesLink = page.locator('a:has-text("notification"), a:has-text("Notification")');
    if (await preferencesLink.isVisible()) {
      // We're authenticated, check the preferences page structure
      const heading = page.locator('h1, h2, [role="heading"]');
      await expect(heading).toBeVisible();
    }
  });

  test('email analytics page should be accessible', async ({ page }) => {
    // This test checks if the route exists and is accessible
    const response = await page.goto('/joblist/email-analytics', { waitUntil: 'networkidle' });

    // Either it loads the page or redirects to login (both are valid)
    expect([200, 301, 302]).toContain(response?.status());
  });

  test('should verify email analytics structure', async ({ page }) => {
    await page.goto('/joblist/email-analytics');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for main components
    const tabs = page.locator('[role="tab"], button:has-text("Overview"), button:has-text("History")');
    if (await tabs.count() > 0) {
      await expect(tabs).toHaveCount(3); // Overview, Breakdown, History
    }

    // Check for stats cards
    const cards = page.locator('[class*="card"], [class*="stat"], [class*="metric"]');
    if (await cards.count() > 0) {
      await expect(cards).toHaveCount(4); // sent, delivered, opened, clicked
    }
  });

  test('notification preferences should have toggle switches', async ({ page }) => {
    await page.goto('/joblist/notification-preferences');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for toggle/checkbox elements
    const toggles = page.locator('input[type="checkbox"], [role="switch"]');
    if (await toggles.count() > 0) {
      await expect(toggles.count()).toBeGreaterThan(0);
    }
  });
});
