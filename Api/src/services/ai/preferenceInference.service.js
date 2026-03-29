const prisma = require('../../config/prisma');

/**
 * Analyze user's application history to infer job preferences
 * Generates smart defaults for UserPreferences model
 *
 * @param {string} userId - User email
 * @returns {Object} Inferred preferences object
 */
const inferUserPreferences = async (userId) => {
  // Fetch user's complete application history
  const applications = await prisma.application.findMany({
    where: { userId },
    select: {
      jobName: true,
      companyName: true,
      platformName: true,
      jobLink: true,
    },
  });

  // If no applications, return generic defaults
  if (applications.length === 0) {
    return getGenericDefaults();
  }

  // Extract preferences from application history
  const preferredRoles = extractPreferredRoles(applications);
  const preferredLocations = extractPreferredLocations(applications);
  const platforms = extractPreferredPlatforms(applications);
  const remotePreference = calculateRemotePreference(applications);

  return {
    preferredRoles,
    preferredLocations,
    platforms,
    remoteOnly: remotePreference === 'remote_only',
    salaryMin: null, // User to set manually
    salaryMax: null, // User to set manually
    alertFrequency: 'manual',
    matchThreshold: 60,
    maxAlertsPerCheck: 10,
    autoApplyEnabled: false,
  };
};

/**
 * Extract job roles from application history
 * Returns most common job titles/roles
 */
const extractPreferredRoles = (applications) => {
  const roleKeywords = {
    'software engineer': ['software engineer', 'software developer', 'dev', 'developer', 'backend', 'frontend', 'full stack'],
    'data scientist': ['data scientist', 'ml engineer', 'machine learning', 'data engineer'],
    'product manager': ['product manager', 'pm', 'product'],
    'ux designer': ['ux designer', 'ui designer', 'designer', 'design'],
    'devops engineer': ['devops', 'infrastructure', 'sre', 'site reliability'],
    'qa engineer': ['qa engineer', 'quality assurance', 'test automation'],
    'solutions architect': ['solutions architect', 'architect'],
  };

  const roleCounts = {};
  const seenRoles = new Set();

  applications.forEach(app => {
    const jobTitle = (app.jobName || '').toLowerCase();

    // Check for matching role keywords
    for (const [role, keywords] of Object.entries(roleKeywords)) {
      if (!seenRoles.has(role)) {
        const isMatch = keywords.some(kw => jobTitle.includes(kw));
        if (isMatch) {
          roleCounts[role] = (roleCounts[role] || 0) + 1;
          seenRoles.add(role);
          break; // Only count once per application
        }
      }
    }

    // If no keyword match, use raw job title (cleaned)
    if (!seenRoles.has(jobTitle)) {
      const cleanedTitle = cleanJobTitle(jobTitle);
      if (cleanedTitle) {
        roleCounts[cleanedTitle] = (roleCounts[cleanedTitle] || 0) + 1;
      }
    }
  });

  // Return top 3-5 roles
  return Object.entries(roleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([role]) => role)
    .filter(Boolean);
};

/**
 * Extract preferred locations from application history
 * Uses company locations and job descriptions
 */
const extractPreferredLocations = (applications) => {
  const locationCounts = {};

  applications.forEach(app => {
    const jobTitle = (app.jobName || '').toLowerCase();

    // Check for location mentions in job titles
    const locationKeywords = [
      'remote', 'san francisco', 'new york', 'seattle', 'austin',
      'los angeles', 'chicago', 'boston', 'denver', 'portland',
      'toronto', 'vancouver', 'london', 'berlin', 'singapore'
    ];

    locationKeywords.forEach(loc => {
      if (jobTitle.includes(loc)) {
        locationCounts[loc.charAt(0).toUpperCase() + loc.slice(1)] =
          (locationCounts[loc.charAt(0).toUpperCase() + loc.slice(1)] || 0) + 1;
      }
    });
  });

  // Return top locations or default to Remote
  const topLocations = Object.entries(locationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([loc]) => loc);

  return topLocations.length > 0 ? topLocations : ['Remote'];
};

/**
 * Extract preferred platforms from application history
 */
const extractPreferredPlatforms = (applications) => {
  const platformCounts = {};

  applications.forEach(app => {
    if (app.platformName) {
      platformCounts[app.platformName] = (platformCounts[app.platformName] || 0) + 1;
    }
  });

  // Return all platforms user has used
  return Object.keys(platformCounts);
};

/**
 * Calculate user's remote preference based on application patterns
 */
const calculateRemotePreference = (applications) => {
  const remoteKeywords = ['remote', 'work from home', 'wfh', 'distributed'];
  let remoteCount = 0;

  applications.forEach(app => {
    const jobTitle = (app.jobName || '').toLowerCase();
    if (remoteKeywords.some(kw => jobTitle.includes(kw))) {
      remoteCount++;
    }
  });

  const remoteRatio = remoteCount / Math.max(applications.length, 1);

  if (remoteRatio > 0.7) return 'remote_only';
  if (remoteRatio > 0.3) return 'remote_preferred';
  return 'any';
};

/**
 * Clean and normalize job titles
 */
const cleanJobTitle = (title) => {
  if (!title || title.length === 0) return null;

  // Remove common suffixes
  title = title
    .replace(/\s*\(.*?\)\s*/g, '') // Remove parentheses and content
    .replace(/\s*-\s*/g, ' ') // Replace dashes with spaces
    .trim();

  // Capitalize first letter of each word
  return title
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .substring(0, 100); // Limit length
};

/**
 * Return generic default preferences when no application history
 */
const getGenericDefaults = () => {
  return {
    preferredRoles: ['Software Engineer', 'Full Stack Developer', 'Backend Engineer'],
    preferredLocations: ['Remote'],
    platforms: [],
    remoteOnly: true,
    salaryMin: null,
    salaryMax: null,
    alertFrequency: 'manual',
    matchThreshold: 60,
    maxAlertsPerCheck: 10,
    autoApplyEnabled: false,
  };
};

module.exports = { inferUserPreferences };
