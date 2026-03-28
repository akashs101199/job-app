import baseFetch from './api';
import { ENDPOINTS } from '../config/api';

/**
 * Generate interview preparation package for a job
 * @param {Object} jobData - Job information including title, company, description
 * @returns {Promise<Response>} Response with interview prep data
 */
export const generateInterviewPrepApi = (jobData) => {
  return baseFetch(ENDPOINTS.AGENT_INTERVIEW_PREP, {
    method: 'POST',
    body: JSON.stringify(jobData),
  });
};

/**
 * Retrieve previously generated interview prep for a specific job
 * @param {string} jobId - The job ID
 * @returns {Promise<Response>} Response with interview prep data
 */
export const getInterviewPrepApi = (jobId) => {
  return baseFetch(`${ENDPOINTS.AGENT_INTERVIEW_PREP}/${jobId}`);
};

/**
 * Helper function to format interview questions for display
 * @param {Array} questions - Array of question objects
 * @returns {Array} Formatted questions with easier access to properties
 */
export const formatQuestions = (questions) => {
  return questions.map((q, index) => ({
    id: index,
    ...q,
    number: index + 1,
  }));
};

/**
 * Get difficulty color for technical questions
 * @param {string} difficulty - 'easy', 'medium', or 'hard'
 * @returns {string} CSS class name
 */
export const getDifficultyColor = (difficulty) => {
  switch (difficulty?.toLowerCase()) {
    case 'easy':
      return 'difficulty-easy';
    case 'medium':
      return 'difficulty-medium';
    case 'hard':
      return 'difficulty-hard';
    default:
      return 'difficulty-medium';
  }
};

/**
 * Extract salary range text from negotiation guide
 * @param {Object} negotiationGuide - Negotiation guide object
 * @returns {string} Human-readable salary range
 */
export const extractSalaryRange = (negotiationGuide) => {
  if (!negotiationGuide || !negotiationGuide.salaryInfo) {
    return 'Varies by experience and location';
  }
  return negotiationGuide.salaryInfo.typicalRange || 'Research needed';
};

/**
 * Format STAR framework for display
 * @param {Object} framework - STAR framework object
 * @returns {Array} Array of STAR components
 */
export const formatStarFramework = (framework) => {
  if (!framework) return [];
  return [
    { letter: 'S', title: 'Situation', content: framework.situation },
    { letter: 'T', title: 'Task', content: framework.task },
    { letter: 'A', title: 'Action', content: framework.action },
    { letter: 'R', title: 'Result', content: framework.result },
  ];
};
