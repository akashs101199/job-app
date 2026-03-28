import baseFetch from './api';
import { ENDPOINTS } from '../config/api';

/**
 * Calculate match scores for an array of jobs
 * Sends jobs to backend API for scoring based on user profile and application history
 *
 * @param {Array} jobs - Array of job objects from JSearch API
 * @returns {Promise<Response>} Response with jobs augmented with matchScore and matchBreakdown
 */
export const calculateMatchScoresApi = (jobs) => {
  return baseFetch(ENDPOINTS.AGENT_MATCH_JOBS, {
    method: 'POST',
    body: JSON.stringify({ jobs }),
  });
};

/**
 * Helper to get match level label based on score
 * @param {number} score - Match score (0-100)
 * @returns {string} Level: 'great', 'good', 'fair', or 'low'
 */
export const getMatchLevel = (score) => {
  if (score >= 80) return 'great';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'low';
};

/**
 * Helper to get match level label for display
 * @param {number} score - Match score (0-100)
 * @returns {string} Display text
 */
export const getMatchLevelLabel = (score) => {
  const level = getMatchLevel(score);
  const labels = {
    great: 'Excellent Match',
    good: 'Good Match',
    fair: 'Fair Match',
    low: 'Low Match',
  };
  return labels[level];
};

/**
 * Sort jobs by specified criteria
 * @param {Array} jobs - Array of job objects
 * @param {string} sortBy - Sort criteria: 'match-score', 'date', 'relevance'
 * @returns {Array} Sorted jobs
 */
export const sortJobs = (jobs, sortBy) => {
  const sorted = [...jobs];

  switch (sortBy) {
    case 'match-score':
      return sorted.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    case 'date':
      return sorted.sort(
        (a, b) =>
          (b.job_posted_at_timestamp || 0) - (a.job_posted_at_timestamp || 0)
      );

    case 'relevance':
      // Relevance is a combination of match score and recency
      return sorted.sort((a, b) => {
        const scoreWeight = 0.7;
        const dateWeight = 0.3;

        const aScore = ((a.matchScore || 0) / 100) * scoreWeight;
        const bScore = ((b.matchScore || 0) / 100) * scoreWeight;

        const maxDate = Math.max(
          a.job_posted_at_timestamp || 0,
          b.job_posted_at_timestamp || 0
        );
        const aDate =
          maxDate > 0
            ? ((a.job_posted_at_timestamp || 0) / maxDate) * dateWeight
            : 0;
        const bDate =
          maxDate > 0
            ? ((b.job_posted_at_timestamp || 0) / maxDate) * dateWeight
            : 0;

        return bScore + bDate - (aScore + aDate);
      });

    default:
      return sorted;
  }
};
