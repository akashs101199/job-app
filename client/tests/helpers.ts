import { Page } from '@playwright/test';

/**
 * Helper functions for Playwright tests
 */

export class TestHelpers {
  /**
   * Wait for page to be fully loaded
   */
  static async waitForPageLoad(page: Page, timeout = 30000) {
    await page.waitForLoadState('networkidle', { timeout });
  }

  /**
   * Login with email and password
   */
  static async login(page: Page, email: string, password: string) {
    await page.goto('/login');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button:has-text("Login")');
    await page.waitForURL('/joblist', { timeout: 30000 });
  }

  /**
   * Register a new account
   */
  static async register(page: Page, email: string, firstName: string, lastName: string, password: string) {
    await page.goto('/register');
    await page.fill('input[type="email"]', email);
    await page.fill('input[name="firstName"], input[placeholder*="First"]', firstName);
    await page.fill('input[name="lastName"], input[placeholder*="Last"]', lastName);
    await page.fill('input[type="password"]', password);
    await page.click('button:has-text("Register"), button:has-text("Submit")');
  }

  /**
   * Logout from the application
   */
  static async logout(page: Page) {
    // Click on user dropdown
    const userDropdown = page.locator('[id*="dropdown"]');
    if (await userDropdown.isVisible()) {
      await userDropdown.click();
    }

    // Click logout
    await page.click('text=Logout');
    await page.waitForURL('/login', { timeout: 30000 });
  }

  /**
   * Navigate to a dashboard page
   */
  static async navigateTo(page: Page, path: string) {
    await page.goto(path);
    await this.waitForPageLoad(page);
  }

  /**
   * Check if element is visible on page
   */
  static async isVisible(page: Page, selector: string, timeout = 5000) {
    try {
      await page.locator(selector).isVisible({ timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Take screenshot for debugging
   */
  static async screenshot(page: Page, name: string) {
    await page.screenshot({ path: `tests/screenshots/${name}.png` });
  }

  /**
   * Wait for API response
   */
  static async waitForAPIResponse(page: Page, urlPattern: string | RegExp, timeout = 30000) {
    return page.waitForResponse(
      (response) => {
        if (typeof urlPattern === 'string') {
          return response.url().includes(urlPattern);
        }
        return urlPattern.test(response.url());
      },
      { timeout }
    );
  }

  /**
   * Check if in authenticated state
   */
  static async isAuthenticated(page: Page) {
    try {
      const token = await page.evaluate(() => localStorage.getItem('token'));
      return !!token;
    } catch {
      return false;
    }
  }

  /**
   * Get stored token from localStorage
   */
  static async getToken(page: Page) {
    return await page.evaluate(() => localStorage.getItem('token'));
  }

  /**
   * Set authentication token
   */
  static async setToken(page: Page, token: string) {
    await page.evaluate((t) => localStorage.setItem('token', t), token);
  }
}

export default TestHelpers;
