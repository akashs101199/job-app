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
 * Get scheduler configuration
 */
export const getSchedulerConfig = async () => {
  const response = await fetch(`${ENDPOINTS.AGENT_SCHEDULER_CONFIG}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });
  return handleResponse(response);
};

/**
 * Update scheduler configuration
 */
export const updateSchedulerConfig = async (config) => {
  const response = await fetch(`${ENDPOINTS.AGENT_SCHEDULER_CONFIG}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(config),
  });
  return handleResponse(response);
};

/**
 * Get scheduler logs with filtering
 */
export const getSchedulerLogs = async (jobType = null, limit = 50, offset = 0) => {
  const params = new URLSearchParams();
  if (jobType) params.append('jobType', jobType);
  params.append('limit', limit);
  params.append('offset', offset);

  const response = await fetch(`${ENDPOINTS.AGENT_SCHEDULER_LOGS}?${params}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });
  return handleResponse(response);
};

/**
 * Manually trigger a scheduled job
 */
export const manuallyTriggerJob = async (jobType) => {
  const response = await fetch(`${ENDPOINTS.AGENT_SCHEDULER_CONFIG}/job/${jobType}/run`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });
  return handleResponse(response);
};

/**
 * Format job type for display
 */
export const formatJobType = (jobType) => {
  const types = {
    alert_check: '📨 Alert Check',
    auto_apply: '🤖 Auto-Apply',
    email_digest: '📧 Email Digest',
  };
  return types[jobType] || jobType;
};

/**
 * Get status color
 */
export const getStatusColor = (status) => {
  switch (status) {
    case 'success':
      return '#4ade80';
    case 'failure':
      return '#f97316';
    case 'skipped':
      return '#facc15';
    default:
      return '#999';
  }
};

/**
 * Get status text
 */
export const getStatusText = (status) => {
  switch (status) {
    case 'success':
      return '✅ Success';
    case 'failure':
      return '❌ Failed';
    case 'skipped':
      return '⏭️  Skipped';
    default:
      return status;
  }
};

/**
 * Get frequency label
 */
export const getFrequencyLabel = (frequency) => {
  const labels = {
    hourly: 'Every Hour',
    daily: 'Daily',
    weekly: 'Weekly',
  };
  return labels[frequency] || frequency;
};

/**
 * Format time (HH:mm)
 */
export const formatTime = (timeStr) => {
  if (!timeStr) return '—';
  const [hours, minutes] = timeStr.split(':');
  return `${hours}:${minutes}`;
};

/**
 * Format datetime for display
 */
export const formatDateTime = (dateTime) => {
  if (!dateTime) return 'Never';
  const date = new Date(dateTime);
  return date.toLocaleString();
};

/**
 * Get time until next execution
 */
export const getTimeUntilNext = (frequency, time) => {
  const now = new Date();
  const [hours, minutes] = time.split(':').map(Number);

  let nextRun = new Date();
  nextRun.setHours(hours, minutes, 0, 0);

  if (nextRun <= now) {
    if (frequency === 'daily' || frequency === 'weekly') {
      nextRun.setDate(nextRun.getDate() + 1);
    }
  }

  const diff = nextRun - now;
  const hours_diff = Math.floor(diff / (1000 * 60 * 60));
  const minutes_diff = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours_diff > 0) {
    return `${hours_diff}h ${minutes_diff}m`;
  } else {
    return `${minutes_diff}m`;
  }
};

export default {
  getSchedulerConfig,
  updateSchedulerConfig,
  getSchedulerLogs,
  manuallyTriggerJob,
  formatJobType,
  getStatusColor,
  getStatusText,
  getFrequencyLabel,
  formatTime,
  formatDateTime,
  getTimeUntilNext,
};
