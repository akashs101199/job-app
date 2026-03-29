import { ENDPOINTS } from '../config/api';

const getAuthToken = () => {
  return localStorage.getItem('accessToken');
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error || 'API Error');
  }
  return response.json();
};

/**
 * Initialize auto-apply configuration
 */
export const initializeAutoApplyConfig = async (config) => {
  const response = await fetch(`${ENDPOINTS.AGENT_AUTO_APPLY_CONFIG_INITIALIZE}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(config),
  });
  return handleResponse(response);
};

/**
 * Get auto-apply configuration
 */
export const getAutoApplyConfig = async () => {
  const response = await fetch(`${ENDPOINTS.AGENT_AUTO_APPLY_CONFIG}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });
  return handleResponse(response);
};

/**
 * Update auto-apply configuration
 */
export const updateAutoApplyConfig = async (updates) => {
  const response = await fetch(`${ENDPOINTS.AGENT_AUTO_APPLY_CONFIG}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(updates),
  });
  return handleResponse(response);
};

/**
 * Disable auto-apply
 */
export const disableAutoApply = async () => {
  const response = await fetch(`${ENDPOINTS.AGENT_AUTO_APPLY_CONFIG}/disable`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });
  return handleResponse(response);
};

/**
 * Check for jobs and queue them
 */
export const checkAndQueueApplications = async () => {
  const response = await fetch(`${ENDPOINTS.AGENT_AUTO_APPLY_CHECK}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });
  return handleResponse(response);
};

/**
 * Get queue with filtering
 */
export const getQueue = async (status = 'pending', limit = 50, offset = 0) => {
  const params = new URLSearchParams();
  if (status && status !== 'all') params.append('status', status);
  params.append('limit', limit);
  params.append('offset', offset);

  const response = await fetch(`${ENDPOINTS.AGENT_AUTO_APPLY_QUEUE}?${params}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });
  return handleResponse(response);
};

/**
 * Approve a queue item
 */
export const approveQueueItem = async (queueId) => {
  const response = await fetch(`${ENDPOINTS.AGENT_AUTO_APPLY_QUEUE}/${queueId}/approve`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });
  return handleResponse(response);
};

/**
 * Reject a queue item
 */
export const rejectQueueItem = async (queueId, reason = '') => {
  const response = await fetch(`${ENDPOINTS.AGENT_AUTO_APPLY_QUEUE}/${queueId}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify({ reason }),
  });
  return handleResponse(response);
};

/**
 * Get auto-apply statistics
 */
export const getAutoApplyStats = async () => {
  const response = await fetch(`${ENDPOINTS.AGENT_AUTO_APPLY_STATS}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });
  return handleResponse(response);
};

/**
 * Format match score with color coding
 */
export const getScoreColor = (score) => {
  if (score >= 80) return '#4ade80'; // green
  if (score >= 60) return '#facc15'; // yellow
  return '#f97316'; // orange
};

/**
 * Format match score display
 */
export const formatMatchScore = (score) => {
  if (score >= 80) return `${score}% (Excellent)`;
  if (score >= 60) return `${score}% (Good)`;
  return `${score}% (Fair)`;
};

/**
 * Get status badge color
 */
export const getStatusColor = (status) => {
  switch (status) {
    case 'pending':
      return '#667eea';
    case 'approved':
      return '#facc15';
    case 'applied':
      return '#4ade80';
    case 'rejected':
      return '#f97316';
    default:
      return '#999';
  }
};

/**
 * Get status badge text
 */
export const getStatusBadgeText = (status) => {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'approved':
      return 'Approved';
    case 'applied':
      return 'Applied';
    case 'rejected':
      return 'Rejected';
    default:
      return status;
  }
};

export default {
  initializeAutoApplyConfig,
  getAutoApplyConfig,
  updateAutoApplyConfig,
  disableAutoApply,
  checkAndQueueApplications,
  getQueue,
  approveQueueItem,
  rejectQueueItem,
  getAutoApplyStats,
  getScoreColor,
  formatMatchScore,
  getStatusColor,
  getStatusBadgeText,
};
