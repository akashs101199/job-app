const Anthropic = require('@anthropic-ai/sdk');
const prisma = require('../../config/prisma');
const {
  userInsightsPrompt,
  marketTrendsPrompt,
  skillGapPrompt,
  performanceAnalysisPrompt,
  recommendationsPrompt,
} = require('./prompts/analytics.prompt');

const client = new Anthropic();

/**
 * Generate comprehensive user insights based on application history
 * @param {Object} userProfile - User data { email, firstName, lastName }
 * @returns {Promise<Object>} User insights with strategies and recommendations
 */
const generateUserInsights = async (userProfile) => {
  try {
    const startTime = Date.now();

    // Fetch user's application history and metrics
    const applicationData = await fetchApplicationHistory(userProfile.email);
    const performanceMetrics = await calculatePerformanceMetrics(userProfile.email);

    // Generate insights using Claude
    const insights = await callClaudeForInsights(userProfile, applicationData, performanceMetrics);
    const skillGaps = await callClaudeForSkillGaps(applicationData);
    const performanceAnalysis = await callClaudeForPerformanceAnalysis(
      applicationData,
      performanceMetrics
    );
    const recommendations = await callClaudeForRecommendations(
      insights,
      skillGaps,
      performanceMetrics,
      {}
    );

    const elapsedTime = Date.now() - startTime;

    return {
      insights,
      skillGaps,
      performanceAnalysis,
      recommendations,
      metadata: {
        generatedAt: new Date().toISOString(),
        generationTimeMs: elapsedTime,
      },
    };
  } catch (error) {
    console.error('Error generating user insights:', error);
    throw error;
  }
};

/**
 * Generate market trends and job market analysis
 * @param {Array} jobListings - Sample of recent job listings
 * @param {Array} userTargetRoles - Roles user is interested in
 * @returns {Promise<Object>} Market trends and analysis
 */
const generateMarketTrends = async (jobListings, userTargetRoles) => {
  try {
    const startTime = Date.now();

    // Generate market analysis using Claude
    const trends = await callClaudeForMarketTrends(jobListings, userTargetRoles);

    const elapsedTime = Date.now() - startTime;

    return {
      trends,
      metadata: {
        generatedAt: new Date().toISOString(),
        generationTimeMs: elapsedTime,
        jobListingsAnalyzed: jobListings.length,
      },
    };
  } catch (error) {
    console.error('Error generating market trends:', error);
    throw error;
  }
};

/**
 * Fetch user's application history from database
 */
const fetchApplicationHistory = async (userId) => {
  try {
    const applications = await prisma.application.findMany({
      where: { userId },
      orderBy: { dateApplied: 'desc' },
      take: 100,
      select: {
        jobListingId: true,
        jobName: true,
        companyName: true,
        status: true,
        dateApplied: true,
        platformName: true,
      },
    });

    return {
      total: applications.length,
      applications,
      byPlatform: groupBy(applications, 'platformName'),
      byStatus: groupBy(applications, 'status'),
      byCompany: groupBy(applications, 'companyName'),
    };
  } catch (error) {
    console.error('Error fetching application history:', error);
    return { total: 0, applications: [] };
  }
};

/**
 * Calculate performance metrics from database
 */
const calculatePerformanceMetrics = async (userId) => {
  try {
    const metrics = await prisma.performanceMetrics.findMany({
      where: { userId },
      select: {
        platformName: true,
        jobsApplied: true,
        interviews: true,
        rejections: true,
      },
    });

    // Calculate rates
    const platformMetrics = metrics.map((m) => ({
      platform: m.platformName,
      jobsApplied: m.jobsApplied,
      interviews: m.interviews,
      rejections: m.rejections,
      interviewRate: m.jobsApplied > 0 ? ((m.interviews / m.jobsApplied) * 100).toFixed(1) : 0,
      rejectionRate: m.jobsApplied > 0 ? ((m.rejections / m.jobsApplied) * 100).toFixed(1) : 0,
    }));

    return {
      byPlatform: platformMetrics,
      overall: calculateOverallMetrics(platformMetrics),
    };
  } catch (error) {
    console.error('Error calculating performance metrics:', error);
    return { byPlatform: [], overall: {} };
  }
};

/**
 * Call Claude API for user insights
 */
const callClaudeForInsights = async (userProfile, applicationData, performanceMetrics) => {
  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: userInsightsPrompt(applicationData, performanceMetrics, userProfile),
      },
    ],
  });

  const content = message.content[0].text;

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.warn('Failed to parse insights JSON');
  }

  return { summary: content, insights: [] };
};

/**
 * Call Claude API for skill gaps
 */
const callClaudeForSkillGaps = async (applicationData) => {
  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: skillGapPrompt(applicationData.applications || [], {}),
      },
    ],
  });

  const content = message.content[0].text;

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.warn('Failed to parse skill gaps JSON');
  }

  return { skillGaps: [], recommendedLearningPath: [] };
};

/**
 * Call Claude API for performance analysis
 */
const callClaudeForPerformanceAnalysis = async (applicationData, performanceMetrics) => {
  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: performanceAnalysisPrompt(applicationData.applications || [], performanceMetrics.byPlatform || []),
      },
    ],
  });

  const content = message.content[0].text;

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.warn('Failed to parse performance analysis JSON');
  }

  return { overallMetrics: {}, platformComparison: [] };
};

/**
 * Call Claude API for market trends
 */
const callClaudeForMarketTrends = async (jobListings, userTargetRoles) => {
  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: marketTrendsPrompt(jobListings, userTargetRoles),
      },
    ],
  });

  const content = message.content[0].text;

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.warn('Failed to parse market trends JSON');
  }

  return { demandTrends: {}, trendingSkills: [] };
};

/**
 * Call Claude API for recommendations
 */
const callClaudeForRecommendations = async (insights, skillGaps, platformData, marketTrends) => {
  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: recommendationsPrompt(insights, skillGaps, platformData, marketTrends),
      },
    ],
  });

  const content = message.content[0].text;

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.warn('Failed to parse recommendations JSON');
  }

  return { recommendations: [], thirtyDayPlan: [] };
};

/**
 * Helper: Group array by property
 */
const groupBy = (arr, key) => {
  return arr.reduce((acc, item) => {
    const group = item[key] || 'Other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});
};

/**
 * Helper: Calculate overall metrics
 */
const calculateOverallMetrics = (platformMetrics) => {
  let totalApplied = 0;
  let totalInterviews = 0;
  let totalRejections = 0;

  platformMetrics.forEach((m) => {
    totalApplied += m.jobsApplied;
    totalInterviews += m.interviews;
    totalRejections += m.rejections;
  });

  return {
    totalApplications: totalApplied,
    totalInterviews,
    totalRejections,
    overallInterviewRate: totalApplied > 0 ? ((totalInterviews / totalApplied) * 100).toFixed(1) : 0,
    overallRejectionRate: totalApplied > 0 ? ((totalRejections / totalApplied) * 100).toFixed(1) : 0,
  };
};

module.exports = {
  generateUserInsights,
  generateMarketTrends,
  fetchApplicationHistory,
  calculatePerformanceMetrics,
};
