# Playwright Test Suite

Comprehensive E2E and API testing for the Job Portal application using Playwright.

## Overview

This test suite covers:
- **Authentication** — Login, Register, Navigation
- **Navigation** — Route accessibility, Layout verification
- **Job Search** — Page load, feature accessibility
- **Notifications** — Preferences, Email Analytics
- **API Endpoints** — Endpoint availability, Response codes

## Installation

Playwright is already installed. To use it:

```bash
cd client
npm install -D @playwright/test
```

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run tests in UI mode (recommended for development)
```bash
npm run test:ui
```

### Run tests in headed mode (see browser)
```bash
npm run test:headed
```

### Run specific test file
```bash
npx playwright test tests/auth.spec.ts
```

### Run tests matching pattern
```bash
npx playwright test -g "should display login"
```

### Debug tests
```bash
npx playwright test --debug
```

### Run tests for specific browser
```bash
npx playwright test --project=chromium
```

## Test Files

### `auth.spec.ts`
- Login page rendering
- Register page rendering
- Error handling
- Navigation between login/register

### `navigation.spec.ts`
- Home page accessibility
- Dashboard route protection
- Required form fields
- Authentication flow

### `jobsearch.spec.ts`
- Job search page features
- Dashboard accessibility
- All major pages (Analytics, Resume, Auto-Apply, Alerts, etc.)
- Route validation

### `notifications.spec.ts`
- Notification preferences page
- Email analytics dashboard
- UI component structure
- Toggle switches and controls

### `api.spec.ts`
- Auth endpoint availability
- Agent endpoints (cover-letter, matching, interview-prep, etc.)
- Notification endpoints
- Webhook endpoint
- Backend health check

## Helper Functions

`helpers.ts` provides utility functions:

```typescript
// Login
await TestHelpers.login(page, 'user@example.com', 'password');

// Register
await TestHelpers.register(page, 'user@example.com', 'John', 'Doe', 'password');

// Logout
await TestHelpers.logout(page);

// Navigate with auto-wait
await TestHelpers.navigateTo(page, '/joblist/analytics');

// Check visibility
const visible = await TestHelpers.isVisible(page, 'button:has-text("Login")');

// Screenshot
await TestHelpers.screenshot(page, 'debug-screenshot');

// Authentication checks
const isAuth = await TestHelpers.isAuthenticated(page);
const token = await TestHelpers.getToken(page);
```

## Configuration

### `playwright.config.ts`

Key settings:
- **baseURL**: `http://localhost:3000`
- **retries**: 2 in CI, 0 locally
- **projects**: Chromium, Firefox, WebKit
- **webServer**: Auto-start React dev server
- **timeout**: 30 seconds
- **expect timeout**: 5 seconds

## CI/CD Integration

To run in CI environment:

```bash
# Set CI environment variable
CI=true npm run test:e2e

# Or with GitHub Actions
npx playwright test --project=chromium
```

## Reports

After running tests:

```bash
# View HTML report
npx playwright show-report
```

Reports include:
- Test results
- Screenshots (on failure)
- Videos (on failure)
- Detailed execution logs

## Best Practices

1. **Use data-testid for selectors**: More reliable than class/id
2. **Wait for network**: Use `waitForLoadState('networkidle')`
3. **Avoid hardcoded waits**: Use Playwright's auto-waiting
4. **Test user flows**: Not just individual elements
5. **Keep tests independent**: No shared state between tests
6. **Clean up**: Reset state between test suites

## Debugging

### Run with debug mode
```bash
npx playwright test --debug
```

### View trace files
```bash
npx playwright show-trace trace.zip
```

### Generate trace for failed test
```bash
npx playwright test --trace on
```

### See browser actions
```bash
npx playwright test --headed
```

## Common Issues

### Tests fail to connect to app
- Ensure React dev server is running: `npm start`
- Check port 3000 is accessible
- Verify `baseURL` in playwright.config.ts

### Backend not found
- Ensure backend is running on port 5000
- Check `Api/.env` configuration
- Verify database connection

### Authentication fails in tests
- Use valid test credentials
- Check if backend auth is configured
- Verify JWT tokens are valid

## Future Enhancements

- [ ] Add test data fixtures
- [ ] Create mock authentication for faster tests
- [ ] Add visual regression testing
- [ ] Performance benchmarking
- [ ] Load testing with k6
- [ ] Mobile device testing
- [ ] Accessibility testing (axe)
- [ ] Component snapshot testing

## Resources

- [Playwright Docs](https://playwright.dev)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)
- [Locators Guide](https://playwright.dev/docs/locators)
- [Network Mocking](https://playwright.dev/docs/network)
