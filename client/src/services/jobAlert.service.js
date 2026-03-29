import baseFetch from './api';
import { ENDPOINTS } from '../config/api';

/**
 * Check for new job alerts
 * @returns {Promise<Response>} Response with generated alerts
 */
export const checkAlertsApi = () => {
  return baseFetch(ENDPOINTS.AGENT_ALERTS_CHECK, {
    method: 'POST',
  });
};

/**
 * Get all job alerts with optional filtering
 * @param {Object} filters - { status: 'all'|'unread'|'dismissed', sortBy: 'newest'|'score'|'company' }
 * @returns {Promise<Response>} Response with alerts
 */
export const getAlertsApi = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.sortBy) params.append('sortBy', filters.sortBy);

  const url = `${ENDPOINTS.AGENT_ALERTS}${params.toString() ? '?' + params.toString() : ''}`;
  return baseFetch(url, {
    method: 'GET',
  });
};

/**
 * Get unread alerts
 * @param {number} limit - Max alerts to return
 * @returns {Promise<Response>} Response with unread alerts
 */
export const getUnreadAlertsApi = (limit = 3) => {
  return baseFetch(`${ENDPOINTS.AGENT_ALERTS_UNREAD}?limit=${limit}`, {
    method: 'GET',
  });
};

/**
 * Dismiss an alert
 * @param {number} alertId - ID of alert to dismiss
 * @returns {Promise<Response>} Response with dismissal confirmation
 */
export const dismissAlertApi = (alertId) => {
  return baseFetch(`${ENDPOINTS.AGENT_ALERTS}/${alertId}/dismiss`, {
    method: 'POST',
  });
};

/**
 * Apply to a job from an alert
 * @param {number} alertId - ID of alert
 * @returns {Promise<Response>} Response with created application
 */
export const applyFromAlertApi = (alertId) => {
  return baseFetch(`${ENDPOINTS.AGENT_ALERTS}/${alertId}/apply`, {
    method: 'POST',
  });
};

/**
 * Format match score for display
 * @param {number} score - Match score 0-100
 * @returns {string} Formatted score with emoji
 */
export const formatMatchScore = (score) => {
  if (score >= 80) return `🟢 ${score}%`;
  if (score >= 60) return `🟡 ${score}%`;
  return `🔴 ${score}%`;
};

/**
 * Format job platform badge
 * @param {string} platform - Platform name
 * @returns {string} Formatted platform name
 */
export const formatPlatform = (platform) => {
  const platformEmojis = {
    'LinkedIn': '💼',
    'Indeed': '🔍',
    'Glassdoor': '💭',
    'AngelList': '🚀',
    'Built In': '🏗️',
  };

  const emoji = platformEmojis[platform] || '🌐';
  return `${emoji} ${platform}`;
};

/**
 * Get status badge text
 * @param {Object} alert - Alert object
 * @returns {string} Status badge text
 */
export const getAlertStatus = (alert) => {
  if (alert.applied) return 'Applied';
  if (alert.dismissed) return 'Dismissed';
  if (alert.seen) return 'Seen';
  return 'Unread';
};
