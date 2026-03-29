import baseFetch from './api';
import { ENDPOINTS } from '../config/api';

/**
 * Initialize user preferences from application history
 * @returns {Promise<Response>} Response with initialized preferences
 */
export const initializePreferencesApi = () => {
  return baseFetch(ENDPOINTS.PREFERENCES_INITIALIZE, {
    method: 'POST',
  });
};

/**
 * Get user preferences
 * @returns {Promise<Response>} Response with user preferences
 */
export const getPreferencesApi = () => {
  return baseFetch(ENDPOINTS.PREFERENCES, {
    method: 'GET',
  });
};

/**
 * Update user preferences
 * @param {Object} preferences - Preferences to update
 * @returns {Promise<Response>} Response with updated preferences
 */
export const updatePreferencesApi = (preferences) => {
  return baseFetch(ENDPOINTS.PREFERENCES, {
    method: 'PUT',
    body: JSON.stringify(preferences),
  });
};

/**
 * Format preferences for display
 * @param {Object} prefs - Raw preferences from API
 * @returns {Object} Formatted preferences
 */
export const formatPreferences = (prefs) => {
  if (!prefs) return null;

  return {
    ...prefs,
    preferredRoles: Array.isArray(prefs.preferredRoles) ? prefs.preferredRoles : [],
    preferredLocations: Array.isArray(prefs.preferredLocations) ? prefs.preferredLocations : [],
    platforms: Array.isArray(prefs.platforms) ? prefs.platforms : [],
  };
};
