import baseFetch from './api';
import { ENDPOINTS } from '../config/api';

/**
 * Get all pending follow-ups for the user
 * @returns {Promise<Response>} Response with pending follow-ups
 */
export const getFollowUpsApi = () => {
  return baseFetch(ENDPOINTS.AGENT_FOLLOW_UPS, {
    method: 'GET',
  });
};

/**
 * Get stale applications that need follow-ups
 * @returns {Promise<Response>} Response with stale applications
 */
export const getStaleApplicationsApi = () => {
  return baseFetch(ENDPOINTS.AGENT_STALE_APPLICATIONS, {
    method: 'GET',
  });
};

/**
 * Generate follow-up suggestions for all stale applications
 * @returns {Promise<Response>} Response with generated follow-ups
 */
export const generateFollowUpSuggestionsApi = () => {
  return baseFetch(ENDPOINTS.AGENT_GENERATE_FOLLOW_UPS, {
    method: 'POST',
  });
};

/**
 * Approve a follow-up
 * @param {number} followUpId - ID of the follow-up to approve
 * @returns {Promise<Response>} Response with approval confirmation
 */
export const approveFollowUpApi = (followUpId) => {
  return baseFetch(`${ENDPOINTS.AGENT_FOLLOW_UPS}/${followUpId}/approve`, {
    method: 'POST',
  });
};

/**
 * Dismiss a follow-up
 * @param {number} followUpId - ID of the follow-up to dismiss
 * @returns {Promise<Response>} Response with dismissal confirmation
 */
export const dismissFollowUpApi = (followUpId) => {
  return baseFetch(`${ENDPOINTS.AGENT_FOLLOW_UPS}/${followUpId}/dismiss`, {
    method: 'POST',
  });
};

/**
 * Edit a follow-up email
 * @param {number} followUpId - ID of the follow-up to edit
 * @param {Object} updates - {emailSubject, emailBody}
 * @returns {Promise<Response>} Response with updated follow-up
 */
export const editFollowUpApi = (followUpId, updates) => {
  return baseFetch(`${ENDPOINTS.AGENT_FOLLOW_UPS}/${followUpId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
};

/**
 * Send a follow-up
 * @param {number} followUpId - ID of the follow-up to send
 * @returns {Promise<Response>} Response with send confirmation
 */
export const sendFollowUpApi = (followUpId) => {
  return baseFetch(`${ENDPOINTS.AGENT_FOLLOW_UPS}/${followUpId}/send`, {
    method: 'POST',
  });
};

/**
 * Helper: Format follow-up for display
 * @param {Object} followUp - Follow-up object
 * @returns {string} Formatted display string
 */
export const formatFollowUp = (followUp) => {
  if (!followUp) return '';
  return `${followUp.companyName} - ${followUp.jobTitle}`;
};

/**
 * Helper: Get days since application
 * @param {string} dateApplied - Application date
 * @returns {number} Days since application
 */
export const getDaysSinceApplication = (dateApplied) => {
  const applied = new Date(dateApplied);
  const now = new Date();
  const diffTime = Math.abs(now - applied);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Helper: Get follow-up count label
 * @param {number} count - Follow-up count (1, 2, or 3)
 * @returns {string} Label for the follow-up count
 */
export const getFollowUpCountLabel = (count) => {
  switch (count) {
    case 1:
      return '1st Follow-up';
    case 2:
      return '2nd Follow-up';
    case 3:
      return '3rd Follow-up (Final)';
    default:
      return 'Follow-up';
  }
};

/**
 * Helper: Get status badge color
 * @param {string} status - Status (pending, approved, sent)
 * @returns {string} CSS class name for status color
 */
export const getStatusBadgeColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return 'status-pending';
    case 'approved':
      return 'status-approved';
    case 'sent':
      return 'status-sent';
    default:
      return 'status-default';
  }
};

/**
 * Helper: Get status badge label
 * @param {string} status - Status (pending, approved, sent)
 * @returns {string} Formatted status label
 */
export const getStatusBadgeLabel = (status) => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return '⏳ Pending';
    case 'approved':
      return '✅ Approved';
    case 'sent':
      return '📤 Sent';
    default:
      return 'Unknown';
  }
};
