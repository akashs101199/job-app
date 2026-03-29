const prisma = require('../config/prisma');
const { inferUserPreferences } = require('./ai/preferenceInference.service');

/**
 * Initialize user preferences from inferred defaults
 * Creates new UserPreferences record if not exists
 *
 * @param {string} userId - User email
 * @returns {Object} Created or existing preferences
 */
const initializePreferences = async (userId) => {
  // Check if preferences already exist
  const existing = await prisma.userPreferences.findUnique({
    where: { userId },
  });

  if (existing) {
    return existing;
  }

  // Infer preferences from application history
  const inferredPrefs = await inferUserPreferences(userId);

  // Create new preferences record
  const preferences = await prisma.userPreferences.create({
    data: {
      userId,
      preferredRoles: JSON.stringify(inferredPrefs.preferredRoles || []),
      preferredLocations: JSON.stringify(inferredPrefs.preferredLocations || ['Remote']),
      platforms: JSON.stringify(inferredPrefs.platforms || []),
      remoteOnly: inferredPrefs.remoteOnly || false,
      salaryMin: inferredPrefs.salaryMin || null,
      salaryMax: inferredPrefs.salaryMax || null,
      alertFrequency: inferredPrefs.alertFrequency || 'manual',
      matchThreshold: inferredPrefs.matchThreshold || 60,
      maxAlertsPerCheck: inferredPrefs.maxAlertsPerCheck || 10,
      autoApplyEnabled: inferredPrefs.autoApplyEnabled || false,
    },
  });

  return parsePreferences(preferences);
};

/**
 * Get user preferences
 * Returns preferences with JSON fields parsed
 *
 * @param {string} userId - User email
 * @returns {Object|null} User preferences or null if not found
 */
const getPreferences = async (userId) => {
  const preferences = await prisma.userPreferences.findUnique({
    where: { userId },
  });

  if (!preferences) {
    return null;
  }

  return parsePreferences(preferences);
};

/**
 * Update user preferences
 *
 * @param {string} userId - User email
 * @param {Object} updates - Fields to update
 * @returns {Object} Updated preferences
 */
const updatePreferences = async (userId, updates) => {
  // Validate that user preferences exist
  const existing = await prisma.userPreferences.findUnique({
    where: { userId },
  });

  if (!existing) {
    throw new Error('User preferences not found. Initialize preferences first.');
  }

  // Prepare data for update (stringify JSON fields)
  const updateData = {};

  if (updates.preferredRoles) {
    updateData.preferredRoles = JSON.stringify(Array.isArray(updates.preferredRoles)
      ? updates.preferredRoles
      : [updates.preferredRoles]);
  }

  if (updates.preferredLocations) {
    updateData.preferredLocations = JSON.stringify(Array.isArray(updates.preferredLocations)
      ? updates.preferredLocations
      : [updates.preferredLocations]);
  }

  if (updates.platforms) {
    updateData.platforms = JSON.stringify(Array.isArray(updates.platforms)
      ? updates.platforms
      : [updates.platforms]);
  }

  if (typeof updates.remoteOnly === 'boolean') {
    updateData.remoteOnly = updates.remoteOnly;
  }

  if (updates.salaryMin !== undefined) {
    updateData.salaryMin = updates.salaryMin;
  }

  if (updates.salaryMax !== undefined) {
    updateData.salaryMax = updates.salaryMax;
  }

  if (updates.alertFrequency) {
    updateData.alertFrequency = updates.alertFrequency;
  }

  if (updates.matchThreshold !== undefined) {
    updateData.matchThreshold = parseInt(updates.matchThreshold);
  }

  if (updates.maxAlertsPerCheck !== undefined) {
    updateData.maxAlertsPerCheck = parseInt(updates.maxAlertsPerCheck);
  }

  if (typeof updates.autoApplyEnabled === 'boolean') {
    updateData.autoApplyEnabled = updates.autoApplyEnabled;
  }

  // Update preferences
  const updated = await prisma.userPreferences.update({
    where: { userId },
    data: updateData,
  });

  return parsePreferences(updated);
};

/**
 * Check if user has preferences configured
 *
 * @param {string} userId - User email
 * @returns {boolean} True if preferences exist
 */
const hasPreferences = async (userId) => {
  const preferences = await prisma.userPreferences.findUnique({
    where: { userId },
  });

  return !!preferences;
};

/**
 * Parse preferences: convert JSON strings back to objects
 *
 * @param {Object} prefs - Raw preferences from database
 * @returns {Object} Parsed preferences
 */
const parsePreferences = (prefs) => {
  if (!prefs) return null;

  return {
    userId: prefs.userId,
    preferredRoles: Array.isArray(prefs.preferredRoles)
      ? prefs.preferredRoles
      : JSON.parse(prefs.preferredRoles || '[]'),
    preferredLocations: Array.isArray(prefs.preferredLocations)
      ? prefs.preferredLocations
      : JSON.parse(prefs.preferredLocations || '[]'),
    platforms: Array.isArray(prefs.platforms)
      ? prefs.platforms
      : JSON.parse(prefs.platforms || '[]'),
    remoteOnly: prefs.remoteOnly,
    salaryMin: prefs.salaryMin,
    salaryMax: prefs.salaryMax,
    alertFrequency: prefs.alertFrequency,
    matchThreshold: prefs.matchThreshold,
    maxAlertsPerCheck: prefs.maxAlertsPerCheck,
    autoApplyEnabled: prefs.autoApplyEnabled,
    lastInitialized: prefs.lastInitialized,
    lastModified: prefs.lastModified,
  };
};

module.exports = {
  initializePreferences,
  getPreferences,
  updatePreferences,
  hasPreferences,
};
