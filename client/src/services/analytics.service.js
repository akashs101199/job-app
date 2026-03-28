import baseFetch from './api';
import { ENDPOINTS } from '../config/api';

/**
 * Fetch user insights and analytics
 * @returns {Promise<Response>} Response with insights, skill gaps, performance analysis, and recommendations
 */
export const getInsightsApi = () => {
  return baseFetch(ENDPOINTS.AGENT_INSIGHTS, {
    method: 'GET',
  });
};

/**
 * Fetch market trends analysis
 * @param {Array} jobListings - Optional array of job listings for analysis
 * @returns {Promise<Response>} Response with market trends
 */
export const getMarketTrendsApi = (jobListings = []) => {
  return baseFetch(ENDPOINTS.AGENT_MARKET_TRENDS, {
    method: 'POST',
    body: JSON.stringify({ jobListings }),
  });
};

/**
 * Helper: Format insights for display
 * @param {Object} insight - Insight object
 * @returns {string} Formatted insight string
 */
export const formatInsight = (insight) => {
  if (!insight) return '';
  if (typeof insight === 'string') return insight;
  if (insight.title && insight.description) {
    return `${insight.title}: ${insight.description}`;
  }
  return JSON.stringify(insight);
};

/**
 * Helper: Get priority color for recommendations
 * @param {string} priority - high, medium, or low
 * @returns {string} CSS class name
 */
export const getPriorityColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'high':
      return 'priority-high';
    case 'medium':
      return 'priority-medium';
    case 'low':
      return 'priority-low';
    default:
      return 'priority-medium';
  }
};

/**
 * Helper: Get impact indicator
 * @param {string} impact - Impact level
 * @returns {string} Display string with emoji
 */
export const getImpactIndicator = (impact) => {
  switch (impact?.toLowerCase()) {
    case 'high':
      return '🔥 High Impact';
    case 'medium':
      return '⭐ Medium Impact';
    case 'low':
      return '💡 Low Impact';
    default:
      return '➜ Some Impact';
  }
};

/**
 * Helper: Format percentage change
 * @param {string|number} value - Change value like "+15%" or "-5%"
 * @returns {string} Formatted with appropriate emoji
 */
export const formatTrendChange = (value) => {
  if (!value) return 'flat';
  const str = String(value);
  if (str.includes('+')) return `📈 ${value}`;
  if (str.includes('-')) return `📉 ${value}`;
  return `➡️ ${value}`;
};

/**
 * Helper: Sort recommendations by priority
 * @param {Array} recommendations - Array of recommendation objects
 * @returns {Array} Sorted recommendations
 */
export const sortRecommendationsByPriority = (recommendations = []) => {
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return [...recommendations].sort(
    (a, b) => (priorityOrder[a.priority?.toLowerCase()] || 3) - (priorityOrder[b.priority?.toLowerCase()] || 3)
  );
};

/**
 * Helper: Get actionability indicator
 * @param {boolean} actionable - Whether recommendation is actionable
 * @returns {string} Indicator text
 */
export const getActionabilityIndicator = (actionable) => {
  return actionable ? '✅ Actionable' : 'ℹ️ FYI';
};
