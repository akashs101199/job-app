import baseFetch from './api';
import { ENDPOINTS } from '../config/api';

/**
 * Upload resume file
 * @param {File} file - Resume file (PDF or DOCX)
 * @returns {Promise<Response>} Response with uploaded resume data
 */
export const uploadResumeApi = (file) => {
  const formData = new FormData();
  formData.append('file', file);

  return fetch(`${ENDPOINTS.AGENT_RESUME_UPLOAD}`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
    // Don't set Content-Type header - let browser set it with boundary
  });
};

/**
 * List all resumes for authenticated user
 * @returns {Promise<Response>} Response with list of resumes
 */
export const listResumesApi = () => {
  return baseFetch(`${ENDPOINTS.AGENT_RESUMES}`, {
    method: 'GET',
  });
};

/**
 * Analyze resume for ATS compatibility
 * @param {number} resumeId - Resume ID
 * @param {string} jobDescription - Optional job description for tailored analysis
 * @param {string} jobTitle - Optional job title
 * @returns {Promise<Response>} Response with analysis results
 */
export const analyzeResumeApi = (resumeId, jobDescription = null, jobTitle = null) => {
  return baseFetch(`${ENDPOINTS.AGENT_RESUME_ANALYZE}`, {
    method: 'POST',
    body: JSON.stringify({
      resumeId,
      jobDescription,
      jobTitle,
    }),
  });
};

/**
 * Tailor resume for a specific job
 * @param {number} resumeId - Resume ID
 * @param {string} jobTitle - Target job title
 * @param {string} jobDescription - Target job description
 * @returns {Promise<Response>} Response with tailored resume
 */
export const tailorResumeApi = (resumeId, jobTitle, jobDescription) => {
  return baseFetch(`${ENDPOINTS.AGENT_RESUME_TAILOR}`, {
    method: 'POST',
    body: JSON.stringify({
      resumeId,
      jobTitle,
      jobDescription,
    }),
  });
};

/**
 * Format ATS score for display with color
 * @param {number} score - ATS score 0-100
 * @returns {string} Formatted score with emoji/color indicator
 */
export const formatAtsScore = (score) => {
  if (score >= 80) return `🟢 ${score}%`;
  if (score >= 60) return `🟡 ${score}%`;
  if (score >= 40) return `🔴 ${score}%`;
  return `❌ ${score}%`;
};

/**
 * Get color class for ATS score
 * @param {number} score - ATS score 0-100
 * @returns {string} CSS class name
 */
export const getAtsScoreColor = (score) => {
  if (score >= 80) return 'score-excellent';
  if (score >= 60) return 'score-good';
  if (score >= 40) return 'score-fair';
  return 'score-poor';
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
