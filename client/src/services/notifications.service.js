import { ENDPOINTS } from '../config/api.js';

/**
 * Notification Service - Frontend API Client
 * Handles all notification preference and email log operations
 */

const API_NOTIFICATIONS_PREFERENCES = ENDPOINTS.AGENT_NOTIFICATIONS_PREFERENCES;
const API_NOTIFICATIONS_LOGS = ENDPOINTS.AGENT_NOTIFICATIONS_LOGS;
const API_NOTIFICATIONS_METRICS = ENDPOINTS.AGENT_NOTIFICATIONS_METRICS;

/**
 * Get user's notification preferences
 * @returns {Promise<NotificationPreference>}
 */
export async function getNotificationPreferences() {
  const response = await fetch(API_NOTIFICATIONS_PREFERENCES, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch notification preferences');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Update notification preferences
 * @param {object} updates - Preference updates
 * @returns {Promise<NotificationPreference>}
 */
export async function updateNotificationPreferences(updates) {
  const response = await fetch(API_NOTIFICATIONS_PREFERENCES, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error('Failed to update notification preferences');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get email logs for user
 * @param {string} type - Optional notification type filter
 * @param {number} limit - Results limit (default 50)
 * @param {number} offset - Pagination offset (default 0)
 * @returns {Promise<{ logs: array, total: number }>}
 */
export async function getEmailLogs(type = null, limit = 50, offset = 0) {
  let url = API_NOTIFICATIONS_LOGS + `?limit=${limit}&offset=${offset}`;
  if (type) {
    url += `&type=${type}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch email logs');
  }

  const result = await response.json();
  return {
    logs: result.data || [],
    total: result.total || 0,
    limit: result.limit || limit,
    offset: result.offset || offset,
  };
}

/**
 * Get metrics for a notification type
 * @param {string} notificationType - e.g., "daily_digest"
 * @returns {Promise<EmailMetrics>}
 */
export async function getNotificationMetrics(notificationType) {
  const response = await fetch(`${API_NOTIFICATIONS_METRICS}/${notificationType}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch notification metrics');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Unsubscribe from a notification type via link
 * @param {string} token - Unsubscribe token
 * @returns {Promise<object>}
 */
export async function handleUnsubscribe(token) {
  const response = await fetch(`/api/agent/notifications/unsubscribe/${token}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to process unsubscribe');
  }

  return await response.json();
}

/**
 * Format notification type for display
 * @param {string} notificationType
 * @returns {string}
 */
export function formatNotificationType(notificationType) {
  const formatMap = {
    daily_digest: '📨 Daily Alert Digest',
    weekly_digest: '📊 Weekly Digest',
    auto_apply_confirmation: '✅ Auto-Apply Confirmation',
    interview_scheduled: '🎉 Interview Scheduled',
    follow_up_reminder: '📬 Follow-Up Reminder',
    weekly_stats: '📈 Weekly Stats',
    milestone_achievement: '🏆 Milestone Achievement',
    action_required: '⚡ Action Required',
  };

  return formatMap[notificationType] || notificationType;
}

/**
 * Get email status icon
 * @param {object} emailLog
 * @returns {string}
 */
export function getEmailStatusIcon(emailLog) {
  if (emailLog.failedAt) {
    return '❌';
  }
  if (emailLog.deliveredAt) {
    if (emailLog.opens > 0) {
      return '👁️';
    }
    if (emailLog.clicks > 0) {
      return '🖱️';
    }
    return '✅';
  }
  return '📤';
}

/**
 * Get email status text
 * @param {object} emailLog
 * @returns {string}
 */
export function getEmailStatusText(emailLog) {
  if (emailLog.failedAt) {
    return 'Failed';
  }
  if (emailLog.deliveredAt) {
    if (emailLog.opens > 0) {
      return `Opened (${emailLog.opens}x)`;
    }
    if (emailLog.clicks > 0) {
      return `Clicked (${emailLog.clicks}x)`;
    }
    return 'Delivered';
  }
  return 'Pending';
}

/**
 * Format email sent time
 * @param {string} sentAt - ISO timestamp
 * @returns {string}
 */
export function formatSentTime(sentAt) {
  const date = new Date(sentAt);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get frequency label for time picker
 * @param {string} frequency - "daily" | "weekly" | "hourly"
 * @returns {string}
 */
export function getFrequencyLabel(frequency) {
  const labels = {
    hourly: 'Every Hour',
    daily: 'Daily',
    weekly: 'Weekly',
  };
  return labels[frequency] || frequency;
}

/**
 * Get day name from day string
 * @param {string} day - e.g., "monday", "sunday"
 * @returns {string}
 */
export function getDayName(day) {
  const days = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
  };
  return days[day?.toLowerCase()] || day;
}

/**
 * Format preference label
 * @param {string} key - Preference key
 * @returns {string}
 */
export function formatPreferenceLabel(key) {
  const labels = {
    dailyAlertDigest: 'Daily Alert Digest',
    weeklyDigest: 'Weekly Digest',
    autoApplyConfirm: 'Auto-Apply Confirmations',
    interviewNotif: 'Interview Scheduled',
    followUpReminder: 'Follow-Up Reminders',
    weeklyStats: 'Weekly Statistics',
    milestoneNotif: 'Milestone Achievements',
    actionRequired: 'Action Required',
  };
  return labels[key] || key;
}

/**
 * Calculate open rate percentage
 * @param {object} metrics - EmailMetrics
 * @returns {string}
 */
export function getOpenRatePercentage(metrics) {
  if (!metrics || !metrics.openRate) return '0%';
  return `${Math.round(metrics.openRate)}%`;
}

/**
 * Calculate click rate percentage
 * @param {object} metrics - EmailMetrics
 * @returns {string}
 */
export function getClickRatePercentage(metrics) {
  if (!metrics || !metrics.clickRate) return '0%';
  return `${Math.round(metrics.clickRate)}%`;
}

/**
 * Get metric color based on performance
 * @param {number} rate - Rate as decimal (e.g., 0.50 for 50%)
 * @returns {string} CSS color
 */
export function getMetricColor(rate) {
  if (rate >= 0.40) return '#28a745'; // Green (good)
  if (rate >= 0.20) return '#ff9800'; // Orange (fair)
  return '#dc3545'; // Red (poor)
}
