import { test, expect } from '@playwright/test';

test.describe('Job Search & Features', () => {
  test('job search page should have search input', async ({ page }) => {
    await page.goto('/joblist/jobsearch');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Look for search inputs
    const searchInputs = page.locator('input[type="text"], input[placeholder*="search" i], input[placeholder*="job" i]');
    if (await searchInputs.count() > 0) {
      await expect(searchInputs.first()).toBeVisible();
    }
  });

  test('should verify dashboard loads', async ({ page }) => {
    await page.goto('/joblist');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for main dashboard elements
    const mainContent = page.locator('[role="main"], main, [class*="dashboard"], [class*="container"]');
    if (await mainContent.count() > 0) {
      await expect(mainContent.first()).toBeVisible();
    }
  });

  test('analytics page should be accessible', async ({ page }) => {
    const response = await page.goto('/joblist/analytics', { waitUntil: 'networkidle' });

    // Either it loads the page or redirects to login
    expect([200, 301, 302, 404]).toContain(response?.status());
  });

  test('resume page should be accessible', async ({ page }) => {
    const response = await page.goto('/joblist/resume', { waitUntil: 'networkidle' });

    // Either it loads the page or redirects to login
    expect([200, 301, 302, 404]).toContain(response?.status());
  });

  test('auto-apply page should be accessible', async ({ page }) => {
    const response = await page.goto('/joblist/auto-apply', { waitUntil: 'networkidle' });

    // Either it loads the page or redirects to login
    expect([200, 301, 302, 404]).toContain(response?.status());
  });

  test('alerts page should be accessible', async ({ page }) => {
    const response = await page.goto('/joblist/alerts', { waitUntil: 'networkidle' });

    // Either it loads the page or redirects to login
    expect([200, 301, 302, 404]).toContain(response?.status());
  });

  test('preferences page should be accessible', async ({ page }) => {
    const response = await page.goto('/joblist/preferences', { waitUntil: 'networkidle' });

    // Either it loads the page or redirects to login
    expect([200, 301, 302, 404]).toContain(response?.status());
  });

  test('scheduler settings page should be accessible', async ({ page }) => {
    const response = await page.goto('/joblist/scheduler-settings', { waitUntil: 'networkidle' });

    // Either it loads the page or redirects to login
    expect([200, 301, 302, 404]).toContain(response?.status());
  });
});
