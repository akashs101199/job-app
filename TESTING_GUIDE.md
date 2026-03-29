# Testing Guide — Job Portal Application

## Overview

This document provides comprehensive guidance for testing the Job Portal application using Playwright E2E tests and manual testing procedures.

## Testing Strategy

### Layers of Testing

```
┌─────────────────────────────────────────┐
│    Manual Testing (UAT)                 │  ← User acceptance testing
├─────────────────────────────────────────┤
│    E2E Testing (Playwright)             │  ← Critical user flows
├─────────────────────────────────────────┤
│    Component Testing (React Testing)    │  ← Individual components
├─────────────────────────────────────────┤
│    Unit Testing (Jest)                  │  ← Functions & services
├─────────────────────────────────────────┤
│    API Testing (Playwright API)         │  ← Backend endpoints
├─────────────────────────────────────────┤
│    Database Testing                     │  ← Prisma models & queries
└─────────────────────────────────────────┘
```

## Playwright E2E Testing

### Setup

```bash
cd client

# Install dependencies (already done)
npm install -D @playwright/test

# Run tests
npm run test:e2e        # Run all tests
npm run test:ui         # Interactive UI mode
npm run test:headed     # See browser
npm run test:debug      # Debug mode
npm run test:report     # View HTML report
```

### Test Structure

```
client/
├── tests/
│   ├── playwright.config.ts      # Playwright configuration
│   ├── auth.spec.ts              # Authentication tests
│   ├── navigation.spec.ts         # Navigation & routing
│   ├── jobsearch.spec.ts          # Job search features
│   ├── notifications.spec.ts      # Notification system
│   ├── api.spec.ts                # Backend API tests
│   ├── helpers.ts                 # Test utilities
│   └── README.md                  # Test documentation
```

### Test Files

#### 1. Authentication (`auth.spec.ts`)
Tests login/register flows:
- ✅ Login page loads
- ✅ Register page loads
- ✅ Email validation
- ✅ Navigation between pages

```bash
npm run test:e2e -- tests/auth.spec.ts
```

#### 2. Navigation (`navigation.spec.ts`)
Tests routing and layout:
- ✅ Home page accessible
- ✅ Protected routes require auth
- ✅ Form fields present
- ✅ Navigation links work

```bash
npm run test:e2e -- tests/navigation.spec.ts
```

#### 3. Job Search (`jobsearch.spec.ts`)
Tests job search features:
- ✅ Search page loads
- ✅ Dashboard accessible
- ✅ All pages accessible (Analytics, Resume, Auto-Apply, Alerts, etc.)
- ✅ Routes respond correctly

```bash
npm run test:e2e -- tests/jobsearch.spec.ts
```

#### 4. Notifications (`notifications.spec.ts`)
Tests notification system:
- ✅ Preferences page loads
- ✅ Email Analytics page accessible
- ✅ UI components render
- ✅ Toggle switches present

```bash
npm run test:e2e -- tests/notifications.spec.ts
```

#### 5. API (`api.spec.ts`)
Tests backend endpoints:
- ✅ Auth endpoints available
- ✅ Agent endpoints available
- ✅ Notification endpoints available
- ✅ Webhook endpoint available
- ✅ Backend health check

```bash
npm run test:e2e -- tests/api.spec.ts
```

## Running Tests

### Quick Start

```bash
# Terminal 1: Start backend
cd Api
npm start

# Terminal 2: Start frontend (optional, Playwright can start it)
cd client
npm start

# Terminal 3: Run tests
cd client
npm run test:e2e
```

### Common Commands

```bash
# Run all tests
npm run test:e2e

# Run with UI (recommended for debugging)
npm run test:ui

# Run in headed mode (see browser)
npm run test:headed

# Run specific test file
npx playwright test tests/auth.spec.ts

# Run tests matching pattern
npx playwright test -g "should display login"

# Debug a specific test
npx playwright test tests/auth.spec.ts --debug

# Run only on Chrome
npx playwright test --project=chromium

# Run with verbose output
npx playwright test --verbose

# Show report
npm run test:report
```

## Phase 10 Testing Checklist

### Email Analytics Feature

#### Backend Tests

```bash
# Test email sending
curl -X POST http://localhost:5000/api/notifications \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "userId": "user@example.com",
    "notificationType": "daily_digest"
  }'

# Test webhook processing
curl -X POST http://localhost:5000/api/webhooks/sendgrid \
  -H "Content-Type: application/json" \
  -d '[{
    "event": "delivered",
    "sg_message_id": "test_message_id",
    "email": "user@example.com"
  }]'

# Test metrics retrieval
curl http://localhost:5000/api/notifications/metrics/daily_digest \
  -H "Authorization: Bearer TOKEN"
```

#### Frontend Tests

```bash
# Navigate to Email Analytics
npm run test:headed -- tests/notifications.spec.ts

# Check Email Analytics page loads
npx playwright test -g "email analytics"

# Verify metrics display
npm run test:ui
```

### Notification Preferences Testing

1. Navigate to `/joblist/notification-preferences`
2. Verify all toggle switches are present
3. Toggle each notification type
4. Change time and day settings
5. Save and refresh to verify persistence

### Email Analytics Dashboard Testing

1. Navigate to `/joblist/email-analytics`
2. Check Overview tab loads
3. Verify stats cards display (sent, delivered, opened, clicked)
4. Check Breakdown tab with notification types
5. View History tab with email logs
6. Test filtering and sorting

## Manual Testing

### Authentication Flow

#### Login
1. Go to `/login`
2. Enter valid email
3. Enter valid password
4. Click "Login"
5. Should redirect to `/joblist`

#### Register
1. Go to `/register`
2. Enter email, first name, last name, password
3. Click "Register"
4. Should redirect to login or dashboard

#### Logout
1. Click user dropdown (top right)
2. Click "Logout"
3. Should redirect to `/login`

### Email Notifications Flow

#### Preferences
1. Go to `/joblist/notification-preferences`
2. Toggle notification types
3. Set preferred times
4. Click "Save"
5. Refresh page to verify changes persisted

#### Email Analytics
1. Go to `/joblist/email-analytics`
2. Click "Overview" tab
3. View stats: Sent, Delivered %, Opened %, Clicked %
4. Click "Breakdown" tab
5. View per-type metrics
6. Click "History" tab
7. View email log table
8. Filter by notification type
9. Sort by date, opens, clicks

### SendGrid Integration

#### Setup
1. Add SENDGRID_API_KEY to `Api/.env`
2. Configure webhook in SendGrid dashboard
3. Point webhook to: `https://yourdomain.com/api/webhooks/sendgrid`

#### Testing
1. Trigger a test email from notification preferences
2. Check email receives in inbox
3. Open email to trigger "open" event
4. Click link to trigger "click" event
5. Check Email Analytics updates in real-time

## Continuous Integration

### GitHub Actions (Optional Setup)

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: cd client && npm ci

      - name: Run Playwright tests
        run: cd client && npm run test:e2e

      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: client/playwright-report/
```

## Performance Benchmarks

### Expected Load Times

| Page | Expected | Acceptable |
|------|----------|-----------|
| Login | < 1s | < 2s |
| Dashboard | < 2s | < 3s |
| Job Search | < 2s | < 4s |
| Email Analytics | < 2s | < 3s |
| Preferences | < 1s | < 2s |

### API Response Times

| Endpoint | Expected | Acceptable |
|----------|----------|-----------|
| GET /notifications/logs | < 500ms | < 1s |
| GET /notifications/metrics | < 300ms | < 500ms |
| POST /webhooks/sendgrid | < 100ms | < 500ms |
| POST /notifications/preferences | < 300ms | < 500ms |

## Debugging Tips

### Enable Verbose Logging
```bash
npx playwright test --verbose
```

### Debug a Single Test
```bash
npx playwright test tests/auth.spec.ts --debug
```

### View Test Video
```bash
npm run test:report
# Videos available in HTML report
```

### Common Issues & Solutions

#### Tests fail with "page not responding"
- Increase timeout: `timeout: 60000`
- Check if backend is running
- Verify network connectivity

#### "Cannot find element"
- Use `--debug` mode to inspect
- Check CSS selectors are correct
- Verify element is within viewport

#### Tests pass locally but fail in CI
- Check environment variables
- Verify test data exists
- Check for race conditions
- Run with `--workers=1`

#### Flaky tests
- Use proper waits: `waitForLoadState('networkidle')`
- Avoid hardcoded delays
- Check for dynamic content
- Use explicit waits for elements

## Test Reports

### View HTML Report
```bash
npm run test:report
```

### Generate Trace for Debugging
```bash
npx playwright test --trace on
npx playwright show-trace trace.zip
```

### Screenshot on Failure
- Automatically captured in `playwright-report/`
- Check `test-results/` directory

## Next Steps

### Short Term
- [ ] Run full test suite daily
- [ ] Fix any flaky tests
- [ ] Add test coverage badge
- [ ] Document test data setup

### Medium Term
- [ ] Add visual regression testing
- [ ] Implement API mocking
- [ ] Add performance testing
- [ ] Create test fixtures

### Long Term
- [ ] Mobile device testing
- [ ] Accessibility testing (axe)
- [ ] Load testing with k6
- [ ] Integration tests with real data

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [Network Mocking](https://playwright.dev/docs/network)

---

**Last Updated**: March 29, 2025
**Test Suite Version**: 1.0
**Coverage**: Authentication, Navigation, Job Search, Notifications, API Endpoints
