const prisma = require('../../config/prisma');
const { searchJobs } = require('../jobs.service');
const { calculateMatchScore } = require('./matching.service');
const { logAgentAction } = require('./agentLog.service');
const { getPreferences } = require('../preferences.service');

/**
 * Generate job alerts for user based on saved preferences
 * Core workflow: Load prefs → Query JSearch → Deduplicate → Score → Filter → Save
 *
 * @param {string} userId - User email
 * @returns {Array} Created JobAlert records
 */
const generateAlertsForUser = async (userId) => {
  const startTime = Date.now();
  let generatedAlerts = [];
  let error = null;

  try {
    // Step 1: Get user preferences
    const preferences = await getPreferences(userId);
    if (!preferences) {
      throw new Error('User preferences not found. Please initialize preferences first.');
    }

    // Step 2: Get user profile for matching
    const user = await prisma.user.findUnique({
      where: { email: userId },
      select: {
        email: true,
        firstName: true,
        lastName: true,
        profilePic: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Step 3: Build search query from preferences
    const searchQuery = buildSearchQuery(preferences);

    // Step 4: Query JSearch API
    const jobsResponse = await searchJobs(searchQuery, 1);
    const jobs = jobsResponse.data || [];

    if (jobs.length === 0) {
      await logAgentAction(
        userId,
        'job_alerts',
        'check_alerts',
        { preferences },
        { alertsGenerated: 0, message: 'No matching jobs found' },
        'success'
      );
      return [];
    }

    // Step 5: Get already-applied jobs to deduplicate
    const appliedJobs = await prisma.application.findMany({
      where: { userId },
      select: { jobListingId: true },
    });
    const appliedJobIds = new Set(appliedJobs.map(app => app.jobListingId));

    // Step 6: Get existing alerts to avoid duplicates
    const existingAlerts = await prisma.jobAlert.findMany({
      where: { userId },
      select: { jobId: true },
    });
    const existingJobIds = new Set(existingAlerts.map(alert => alert.jobId));

    // Step 7: Process jobs: score, filter, deduplicate
    const candidateJobs = [];

    for (const job of jobs) {
      // Skip if already applied
      if (appliedJobIds.has(job.job_id)) {
        continue;
      }

      // Skip if alert already exists
      if (existingJobIds.has(job.job_id)) {
        continue;
      }

      // Calculate match score
      const matchResult = await calculateMatchScore(user, job);
      const matchScore = matchResult.score;

      // Filter by threshold
      if (matchScore >= preferences.matchThreshold) {
        candidateJobs.push({
          job,
          matchScore,
          breakdown: matchResult.breakdown,
        });
      }
    }

    // Step 8: Sort by match score and limit to maxAlertsPerCheck
    candidateJobs.sort((a, b) => b.matchScore - a.matchScore);
    const topJobs = candidateJobs.slice(0, preferences.maxAlertsPerCheck);

    // Step 9: Create JobAlert records
    for (const candidate of topJobs) {
      const job = candidate.job;

      try {
        const alert = await prisma.jobAlert.create({
          data: {
            userId,
            jobId: job.job_id,
            jobTitle: job.job_title || 'Untitled Position',
            companyName: job.employer_name || 'Unknown Company',
            matchScore: candidate.matchScore,
            jobLink: extractJobLink(job),
            location: extractLocation(job),
            salary: extractSalary(job),
            platform: extractPlatform(job),
          },
        });

        generatedAlerts.push(alert);
      } catch (err) {
        // Handle unique constraint violations silently (duplicate alerts)
        if (err.code === 'P2002') {
          console.log(`Alert already exists for job ${job.job_id}`);
        } else {
          console.error(`Error creating alert for job ${job.job_id}:`, err);
        }
      }
    }

    // Step 10: Log success
    await logAgentAction(
      userId,
      'job_alerts',
      'check_alerts',
      {
        preferences,
        jobsFound: jobs.length,
        jobsDeduped: jobs.length - appliedJobIds.size,
        matchThreshold: preferences.matchThreshold,
      },
      {
        alertsGenerated: generatedAlerts.length,
        topScores: generatedAlerts.slice(0, 5).map(a => ({
          jobTitle: a.jobTitle,
          matchScore: a.matchScore,
        })),
      },
      'success'
    );

  } catch (err) {
    error = err.message;
    console.error('Error generating alerts:', err);

    // Log failure
    await logAgentAction(
      userId,
      'job_alerts',
      'check_alerts',
      { preferences },
      null,
      'failed',
      error
    );

    throw err;
  }

  return generatedAlerts;
};

/**
 * Get unread alerts for user
 *
 * @param {string} userId - User email
 * @param {number} limit - Max alerts to return
 * @returns {Array} Unread JobAlert records
 */
const getUnreadAlerts = async (userId, limit = 3) => {
  return prisma.jobAlert.findMany({
    where: {
      userId,
      seen: false,
      dismissed: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });
};

/**
 * Get all alerts for user with filtering
 *
 * @param {string} userId - User email
 * @param {Object} filters - { status: 'unread'|'dismissed'|'all', sortBy: 'newest'|'score'|'company' }
 * @returns {Array} JobAlert records
 */
const getAlerts = async (userId, filters = {}) => {
  const { status = 'all', sortBy = 'newest' } = filters;

  const where = { userId };

  if (status === 'unread') {
    where.seen = false;
    where.dismissed = false;
  } else if (status === 'dismissed') {
    where.dismissed = true;
  }

  let orderBy = { createdAt: 'desc' };
  if (sortBy === 'score') {
    orderBy = { matchScore: 'desc' };
  } else if (sortBy === 'company') {
    orderBy = { companyName: 'asc' };
  }

  return prisma.jobAlert.findMany({
    where,
    orderBy,
  });
};

/**
 * Mark alert as seen
 *
 * @param {number} alertId - Alert ID
 * @param {string} userId - User email (for authorization)
 * @returns {Object} Updated JobAlert
 */
const markAlertSeen = async (alertId, userId) => {
  const alert = await prisma.jobAlert.findUnique({
    where: { id: alertId },
  });

  if (!alert || alert.userId !== userId) {
    throw new Error('Alert not found or unauthorized');
  }

  return prisma.jobAlert.update({
    where: { id: alertId },
    data: { seen: true },
  });
};

/**
 * Dismiss an alert
 *
 * @param {number} alertId - Alert ID
 * @param {string} userId - User email (for authorization)
 * @returns {Object} Updated JobAlert
 */
const dismissAlert = async (alertId, userId) => {
  const alert = await prisma.jobAlert.findUnique({
    where: { id: alertId },
  });

  if (!alert || alert.userId !== userId) {
    throw new Error('Alert not found or unauthorized');
  }

  const updated = await prisma.jobAlert.update({
    where: { id: alertId },
    data: { dismissed: true },
  });

  await logAgentAction(
    userId,
    'job_alerts',
    'dismiss_alert',
    { alertId, jobTitle: alert.jobTitle },
    { status: 'dismissed' },
    'success'
  );

  return updated;
};

/**
 * Create application from alert and mark as applied
 *
 * @param {number} alertId - Alert ID
 * @param {string} userId - User email
 * @returns {Object} Created Application
 */
const applyFromAlert = async (alertId, userId) => {
  const alert = await prisma.jobAlert.findUnique({
    where: { id: alertId },
  });

  if (!alert || alert.userId !== userId) {
    throw new Error('Alert not found or unauthorized');
  }

  // Create Application record
  const application = await prisma.application.create({
    data: {
      userId,
      jobListingId: alert.jobId,
      jobName: alert.jobTitle,
      companyName: alert.companyName,
      jobLink: alert.jobLink,
      platformName: alert.platform || null,
      status: 'applied',
      dateApplied: new Date(),
      dateUpdated: new Date(),
      notes: `Applied via job alert (${alert.matchScore}% match)`,
    },
  });

  // Mark alert as applied
  await prisma.jobAlert.update({
    where: { id: alertId },
    data: { applied: true },
  });

  await logAgentAction(
    userId,
    'job_alerts',
    'apply_from_alert',
    { alertId, jobTitle: alert.jobTitle },
    { applicationCreated: true, applicationId: alert.jobId },
    'success'
  );

  return application;
};

/**
 * Build JSearch query from user preferences
 *
 * @param {Object} preferences - UserPreferences
 * @returns {string} Search query for JSearch API
 */
const buildSearchQuery = (preferences) => {
  const parts = [];

  // Add preferred roles
  if (preferences.preferredRoles && preferences.preferredRoles.length > 0) {
    parts.push(preferences.preferredRoles.join(' OR '));
  } else {
    parts.push('software engineer');
  }

  // Add location filter if not remote only
  if (!preferences.remoteOnly && preferences.preferredLocations && preferences.preferredLocations.length > 0) {
    const locations = preferences.preferredLocations
      .filter(loc => loc.toLowerCase() !== 'remote')
      .slice(0, 2); // Limit to 2 locations
    if (locations.length > 0) {
      parts.push(`(${locations.join(' OR ')})`);
    }
  }

  // Add remote filter if preferred
  if (preferences.remoteOnly || (preferences.preferredLocations && preferences.preferredLocations.includes('Remote'))) {
    parts.push('remote');
  }

  // Add salary constraint if specified
  if (preferences.salaryMin) {
    parts.push(`salary:>${preferences.salaryMin}`);
  }

  return parts.join(' ');
};

/**
 * Extract job link from JSearch response
 *
 * @param {Object} job - Job object from JSearch API
 * @returns {string} Job link URL
 */
const extractJobLink = (job) => {
  if (job.job_apply_link) return job.job_apply_link;
  if (job.apply_options && job.apply_options[0]?.apply_link) {
    return job.apply_options[0].apply_link;
  }
  return job.job_apply_link || '';
};

/**
 * Extract location from job
 *
 * @param {Object} job - Job object from JSearch API
 * @returns {string|null} Location string
 */
const extractLocation = (job) => {
  if (job.job_city && job.job_state) {
    return `${job.job_city}, ${job.job_state}`;
  }
  if (job.job_city) return job.job_city;
  if (job.job_country) return job.job_country;
  return null;
};

/**
 * Extract salary info from job
 *
 * @param {Object} job - Job object from JSearch API
 * @returns {string|null} Salary string
 */
const extractSalary = (job) => {
  if (job.job_salary_min && job.job_salary_max) {
    return `$${job.job_salary_min.toLocaleString()}-$${job.job_salary_max.toLocaleString()}`;
  }
  if (job.job_salary_min) {
    return `$${job.job_salary_min.toLocaleString()}+`;
  }
  return null;
};

/**
 * Extract platform from job
 *
 * @param {Object} job - Job object from JSearch API
 * @returns {string} Platform name
 */
const extractPlatform = (job) => {
  if (job.apply_options && job.apply_options[0]?.publisher) {
    return job.apply_options[0].publisher;
  }
  return 'JSearch';
};

module.exports = {
  generateAlertsForUser,
  getUnreadAlerts,
  getAlerts,
  markAlertSeen,
  dismissAlert,
  applyFromAlert,
};
