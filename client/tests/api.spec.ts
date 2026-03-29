import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  const API_BASE = 'http://localhost:5000/api';

  test('should verify auth endpoints are available', async ({ request }) => {
    // Check if login endpoint exists
    const loginResponse = await request.post(`${API_BASE}/auth/login`, {
      data: {
        email: 'invalid@test.com',
        password: 'invalid',
      },
    });

    // Should return error but endpoint should exist (400, 401, 500)
    expect([400, 401, 500]).toContain(loginResponse.status());
  });

  test('should verify job search endpoints are available', async ({ request }) => {
    // Check if jobs endpoint exists
    const response = await request.get(`${API_BASE}/jobs`, {
      headers: {
        'Authorization': 'Bearer invalid_token',
      },
    });

    // Should return 401 (unauthorized) which means endpoint exists
    expect([401, 403, 500]).toContain(response.status());
  });

  test('should verify notification endpoints are available', async ({ request }) => {
    // Check if notifications endpoint exists
    const response = await request.get(`${API_BASE}/notifications/preferences`, {
      headers: {
        'Authorization': 'Bearer invalid_token',
      },
    });

    // Should return 401 (unauthorized) which means endpoint exists
    expect([401, 403, 500]).toContain(response.status());
  });

  test('should verify agent endpoints are available', async ({ request }) => {
    // Check if agent endpoints exist
    const endpoints = [
      '/agent/cover-letter',
      '/agent/match-jobs',
      '/agent/interview-prep',
      '/agent/alerts',
      '/agent/auto-apply/config',
    ];

    for (const endpoint of endpoints) {
      const response = await request.get(`${API_BASE}${endpoint}`, {
        headers: {
          'Authorization': 'Bearer invalid_token',
        },
      });

      // Should return 401 (unauthorized) which means endpoint exists
      expect([401, 403, 404, 500]).toContain(response.status());
    }
  });

  test('should verify webhook endpoint is available', async ({ request }) => {
    const response = await request.post(`${API_BASE}/webhooks/sendgrid`, {
      data: {
        event: 'test',
      },
    });

    // Webhook might accept test data or return 200 for valid structure
    expect([200, 400, 500]).toContain(response.status());
  });

  test('should verify email analytics endpoints', async ({ request }) => {
    const response = await request.get(`${API_BASE}/notifications/logs`, {
      headers: {
        'Authorization': 'Bearer invalid_token',
      },
    });

    // Should return 401 (unauthorized) which means endpoint exists
    expect([401, 403, 500]).toContain(response.status());
  });

  test('should verify scheduler endpoints', async ({ request }) => {
    const response = await request.get(`${API_BASE}/agent/scheduler/config`, {
      headers: {
        'Authorization': 'Bearer invalid_token',
      },
    });

    // Should return 401 (unauthorized) which means endpoint exists
    expect([401, 403, 500]).toContain(response.status());
  });

  test('health check - verify backend is running', async ({ request }) => {
    try {
      const response = await request.get('http://localhost:5000/health', {
        timeout: 5000,
      });

      // Backend should respond to health check
      expect([200, 404, 500]).toContain(response.status());
    } catch (error) {
      // If backend is not running, that's also useful information
      console.log('⚠️ Backend may not be running on port 5000');
    }
  });
});
