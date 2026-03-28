const prisma = require('../../config/prisma');

/**
 * Calculate match score between user profile and job listing
 * Uses keyword matching against application history and inferred preferences
 *
 * @param {Object} userProfile - User data from database
 * @param {Object} jobData - Job listing from JSearch API
 * @returns {Object} { score: 0-100, breakdown: { category: points } }
 */
const calculateMatchScore = async (userProfile, jobData) => {
  if (!jobData || !jobData.job_title) {
    return { score: 0, breakdown: {} };
  }

  // Fetch user's application history
  const applicationHistory = await prisma.application.findMany({
    where: { userId: userProfile.email },
    select: {
      jobName: true,
      companyName: true,
      platformName: true,
      status: true,
    },
  });

  // Fetch user's performance metrics
  const performanceMetrics = await prisma.performanceMetrics.findMany({
    where: { userId: userProfile.email },
    select: {
      platformName: true,
      jobsApplied: true,
      interviews: true,
    },
  });

  let breakdown = {};

  // 1. Job Title Similarity (40 points max)
  breakdown.jobTitle = calculateJobTitleMatch(jobData.job_title, applicationHistory);

  // 2. Company Match (20 points max)
  breakdown.company = calculateCompanyMatch(jobData.employer_name, applicationHistory);

  // 3. Employment Type Match (15 points max)
  breakdown.employmentType = calculateEmploymentTypeMatch(
    jobData.job_employment_type,
    applicationHistory
  );

  // 4. Remote Preference (15 points max)
  breakdown.remotePreference = calculateRemotePreference(
    jobData.job_is_remote,
    applicationHistory
  );

  // 5. Platform Success (10 points max)
  breakdown.platformSuccess = calculatePlatformSuccess(
    jobData.apply_options,
    performanceMetrics
  );

  // Calculate total score
  const score = Math.min(100, Object.values(breakdown).reduce((sum, val) => sum + val, 0));

  return {
    score: Math.round(score),
    breakdown: {
      jobTitle: Math.round(breakdown.jobTitle),
      company: Math.round(breakdown.company),
      employmentType: Math.round(breakdown.employmentType),
      remotePreference: Math.round(breakdown.remotePreference),
      platformSuccess: Math.round(breakdown.platformSuccess),
    },
  };
};

/**
 * Calculate job title similarity score (0-40)
 * Higher score if job title matches user's past applications
 */
const calculateJobTitleMatch = (jobTitle, applicationHistory) => {
  if (!jobTitle || applicationHistory.length === 0) return 0;

  const jobTitleLower = jobTitle.toLowerCase();
  const keywords = extractKeywords(jobTitle);

  // Extract keywords from past applications
  const pastJobTitles = applicationHistory.map(app => app.jobName?.toLowerCase() || '');
  const pastKeywords = new Set();
  pastJobTitles.forEach(title => {
    extractKeywords(title).forEach(kw => pastKeywords.add(kw));
  });

  // Calculate keyword overlap
  let matchingKeywords = 0;
  keywords.forEach(kw => {
    if (pastKeywords.has(kw)) matchingKeywords++;
  });

  const keywordScore = keywords.length > 0 ? (matchingKeywords / keywords.length) * 30 : 0;

  // Exact role matches (engineer, developer, manager, etc)
  const roleBonus = matchExactRole(jobTitleLower, pastJobTitles) ? 10 : 0;

  return Math.min(40, keywordScore + roleBonus);
};

/**
 * Check if exact role matches between current and past jobs
 */
const matchExactRole = (currentJobTitle, pastJobTitles) => {
  const roles = [
    'engineer',
    'developer',
    'manager',
    'designer',
    'analyst',
    'scientist',
    'consultant',
    'architect',
  ];

  for (const role of roles) {
    if (currentJobTitle.includes(role)) {
      return pastJobTitles.some(title => title.includes(role));
    }
  }

  return false;
};

/**
 * Calculate company match score (0-20)
 * Higher score if user has applied to same company before
 */
const calculateCompanyMatch = (companyName, applicationHistory) => {
  if (!companyName || applicationHistory.length === 0) return 0;

  const companyLower = companyName.toLowerCase();
  const hasAppliedBefore = applicationHistory.some(
    app => app.companyName?.toLowerCase() === companyLower
  );

  // Also check for partial company name matches (e.g., "Google" in "Google Cloud")
  const partialMatch = applicationHistory.some(app => {
    const pastCompany = app.companyName?.toLowerCase() || '';
    return (
      pastCompany.includes(companyLower.split(' ')[0]) ||
      companyLower.includes(pastCompany.split(' ')[0])
    );
  });

  if (hasAppliedBefore) return 20;
  if (partialMatch) return 10;
  return 0;
};

/**
 * Calculate employment type match score (0-15)
 * Higher score if job type matches user's application patterns
 */
const calculateEmploymentTypeMatch = (jobEmploymentType, applicationHistory) => {
  if (!jobEmploymentType || applicationHistory.length === 0) return 0;

  // Count employment types from application history
  const employmentTypeCounts = {};
  applicationHistory.forEach(app => {
    // For now, we infer from job descriptions (would be better with explicit data)
    // This is a simplified heuristic
  });

  // If most recent applications are full-time, prefer full-time jobs
  const preferredType = jobEmploymentType.toLowerCase();
  const isFullTime = preferredType.includes('full-time') || preferredType.includes('full time');
  const isPartTime = preferredType.includes('part-time') || preferredType.includes('part time');
  const isContract = preferredType.includes('contract');

  // Default to rewarding full-time roles (most common)
  if (isFullTime) return 15;
  if (isPartTime) return 10;
  if (isContract) return 8;

  return 0;
};

/**
 * Calculate remote preference score (0-15)
 * Higher score if user has applied to remote jobs before
 */
const calculateRemotePreference = (isRemote, applicationHistory) => {
  if (applicationHistory.length === 0) return 0;

  // Count remote vs on-site applications (inferred from company patterns)
  // For now, use simple heuristic: if user applies to tech companies, they likely want remote
  const remoteKeywords = ['remote', 'hybrid', 'distributed', 'work from home'];

  // Check user's past job names for remote indicators
  const remoteApplications = applicationHistory.filter(app =>
    remoteKeywords.some(kw => app.jobName?.toLowerCase().includes(kw))
  ).length;

  const remoteRatio = remoteApplications / Math.max(applicationHistory.length, 1);

  if (isRemote) {
    // If user frequently applies to remote jobs, boost score
    return remoteRatio > 0.3 ? 15 : remoteRatio > 0 ? 10 : 8;
  } else {
    // If user mostly applies to remote jobs but this isn't remote, slightly penalize
    return remoteRatio > 0.5 ? 5 : 12;
  }
};

/**
 * Calculate platform success score (0-10)
 * Higher score for jobs on platforms where user has had success
 */
const calculatePlatformSuccess = (applyOptions, performanceMetrics) => {
  if (!applyOptions || applyOptions.length === 0 || performanceMetrics.length === 0) {
    return 5; // Default bonus if platforms available
  }

  // Extract platforms from apply_options
  const jobPlatforms = applyOptions.map(opt => opt.publisher?.toLowerCase()).filter(Boolean);

  // Calculate success rate for each platform
  let maxSuccessRate = 0;
  jobPlatforms.forEach(platform => {
    const metrics = performanceMetrics.find(
      m => m.platformName?.toLowerCase() === platform
    );

    if (metrics && metrics.jobsApplied > 0) {
      const successRate = metrics.interviews / metrics.jobsApplied;
      maxSuccessRate = Math.max(maxSuccessRate, successRate);
    }
  });

  // Convert success rate to points (0-10)
  return Math.min(10, maxSuccessRate * 10 + 3); // Add 3 points baseline
};

/**
 * Extract keywords from text
 * Returns array of meaningful words (excluding common stop words)
 */
const extractKeywords = (text) => {
  if (!text) return [];

  const stopWords = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'is',
    'are',
    'was',
    'were',
    'be',
    'been',
    'being',
  ]);

  return text
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.replace(/[^\w]/g, ''))
    .filter(word => word.length > 3 && !stopWords.has(word));
};

module.exports = { calculateMatchScore };
