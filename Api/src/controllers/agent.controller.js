const prisma = require('../config/prisma');
const { generateCoverLetter } = require('../services/ai/coverLetter.service');
const { logAgentAction } = require('../services/ai/agentLog.service');
const { calculateMatchScore } = require('../services/ai/matching.service');
const { generateInterviewPrep } = require('../services/ai/interviewPrep.service');
const { generateUserInsights, generateMarketTrends } = require('../services/ai/analytics.service');
const {
  getStaleApplications,
  generateAllFollowUps,
  getPendingFollowUps,
  getAllFollowUps,
  approveFollowUp,
  dismissFollowUp,
  updateFollowUpEmail,
  markFollowUpAsSent,
} = require('../services/ai/followUp.service');
const {
  initializePreferences,
  getPreferences,
  updatePreferences,
} = require('../services/preferences.service');
const {
  generateAlertsForUser,
  getUnreadAlerts,
  getAlerts,
  dismissAlert,
  applyFromAlert,
} = require('../services/ai/jobAlerts.service');

const generateCoverLetterHandler = async (req, res) => {
  const { jobId, jobTitle, companyName, jobDescription, jobHighlights } = req.body;
  const userId = req.user?.email;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Validate required fields
  if (!jobTitle || !companyName) {
    return res.status(400).json({ error: 'jobTitle and companyName are required' });
  }

  try {
    // Get user profile for context
    const user = await prisma.user.findUnique({
      where: { email: userId },
      select: { firstName: true, lastName: true, email: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate cover letter using Claude API
    const result = await generateCoverLetter(user, {
      jobId,
      jobTitle,
      companyName,
      jobDescription,
      jobHighlights,
    });

    // Save generated content to database
    const generatedContent = await prisma.generatedContent.create({
      data: {
        userId,
        contentType: 'cover_letter',
        jobId,
        jobTitle,
        companyName,
        content: result.content,
        metadata: result.metadata,
      },
    });

    // Log the action
    await logAgentAction(
      userId,
      'cover_letter',
      'generation',
      {
        jobId,
        jobTitle,
        companyName,
      },
      {
        contentId: generatedContent.id,
        tokenCount: result.metadata.tokenCount,
      },
      'success'
    );

    res.json({
      success: true,
      contentId: generatedContent.id,
      content: result.content,
    });
  } catch (error) {
    console.error('Cover letter generation error:', error);

    // Log the failed action
    await logAgentAction(
      userId,
      'cover_letter',
      'generation',
      { jobId, jobTitle, companyName },
      null,
      'failed',
      error.message
    ).catch(err => console.error('Error logging failed action:', err));

    res.status(500).json({
      error: 'Failed to generate cover letter',
      message: error.message,
    });
  }
};

const getCoverLettersHandler = async (req, res) => {
  const { jobId } = req.params;
  const userId = req.user?.email;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const coverLetters = await prisma.generatedContent.findMany({
      where: {
        userId,
        contentType: 'cover_letter',
        jobId,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: coverLetters,
    });
  } catch (error) {
    console.error('Error retrieving cover letters:', error);
    res.status(500).json({ error: 'Failed to retrieve cover letters' });
  }
};

const getAllCoverLettersHandler = async (req, res) => {
  const userId = req.user?.email;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const coverLetters = await prisma.generatedContent.findMany({
      where: {
        userId,
        contentType: 'cover_letter',
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: coverLetters,
    });
  } catch (error) {
    console.error('Error retrieving cover letters:', error);
    res.status(500).json({ error: 'Failed to retrieve cover letters' });
  }
};

const generateColdEmailHandler = async (req, res) => {
  const { jobId, jobTitle, companyName, jobDescription, jobHighlights } = req.body;
  const userId = req.user?.email;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!jobTitle || !companyName) {
    return res.status(400).json({ error: 'jobTitle and companyName are required' });
  }

  try {
    // For now, reuse cover letter generation (future: implement cold email specific prompt)
    const user = await prisma.user.findUnique({
      where: { email: userId },
      select: { firstName: true, lastName: true, email: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate cold email using Claude API (same as cover letter for now)
    const result = await generateCoverLetter(user, {
      jobId,
      jobTitle,
      companyName,
      jobDescription,
      jobHighlights,
    });

    // Save generated content to database
    const generatedContent = await prisma.generatedContent.create({
      data: {
        userId,
        contentType: 'cold_email',
        jobId,
        jobTitle,
        companyName,
        content: result.content,
        metadata: result.metadata,
      },
    });

    // Log the action
    await logAgentAction(
      userId,
      'cold_email',
      'generation',
      {
        jobId,
        jobTitle,
        companyName,
      },
      {
        contentId: generatedContent.id,
        tokenCount: result.metadata.tokenCount,
      },
      'success'
    );

    res.json({
      success: true,
      contentId: generatedContent.id,
      content: result.content,
    });
  } catch (error) {
    console.error('Cold email generation error:', error);

    // Log the failed action
    await logAgentAction(
      userId,
      'cold_email',
      'generation',
      { jobId, jobTitle, companyName },
      null,
      'failed',
      error.message
    ).catch(err => console.error('Error logging failed action:', err));

    res.status(500).json({
      error: 'Failed to generate cold email',
      message: error.message,
    });
  }
};

const calculateMatchScoresHandler = async (req, res) => {
  const { jobs } = req.body;
  const userId = req.user?.email;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!jobs || !Array.isArray(jobs)) {
    return res.status(400).json({ error: 'jobs array is required' });
  }

  try {
    // Get user profile
    const user = await prisma.user.findUnique({
      where: { email: userId },
      select: { email: true, firstName: true, lastName: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate match scores for each job
    const jobsWithScores = await Promise.all(
      jobs.map(async (job) => {
        const { score, breakdown } = await calculateMatchScore(user, job);
        return {
          ...job,
          matchScore: score,
          matchBreakdown: breakdown,
        };
      })
    );

    res.json({
      success: true,
      jobs: jobsWithScores,
    });
  } catch (error) {
    console.error('Match score calculation error:', error);
    res.status(500).json({
      error: 'Failed to calculate match scores',
      message: error.message,
    });
  }
};

const generateInterviewPrepHandler = async (req, res) => {
  const { jobId, jobTitle, companyName, jobDescription, jobHighlights } = req.body;
  const userId = req.user?.email;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Validate required fields
  if (!jobTitle || !companyName) {
    return res.status(400).json({ error: 'jobTitle and companyName are required' });
  }

  try {
    // Get user profile for context
    const user = await prisma.user.findUnique({
      where: { email: userId },
      select: { firstName: true, lastName: true, email: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate interview prep using Claude API
    const result = await generateInterviewPrep(user, {
      jobId,
      jobTitle,
      companyName,
      jobDescription,
      jobHighlights,
    });

    // Save generated content to database
    const generatedContent = await prisma.generatedContent.create({
      data: {
        userId,
        contentType: 'interview_prep',
        jobId,
        jobTitle,
        companyName,
        content: JSON.stringify(result),
        metadata: {
          components: ['company', 'technical_questions', 'behavioral_questions', 'counter_questions', 'negotiation'],
          generationTimeMs: result.metadata.generationTimeMs,
        },
      },
    });

    // Log the action
    await logAgentAction(
      userId,
      'interview_prep',
      'generation',
      {
        jobId,
        jobTitle,
        companyName,
      },
      {
        contentId: generatedContent.id,
        generationTimeMs: result.metadata.generationTimeMs,
      },
      'success'
    );

    res.json({
      success: true,
      contentId: generatedContent.id,
      data: result,
    });
  } catch (error) {
    console.error('Interview prep generation error:', error);

    // Log the failed action
    await logAgentAction(
      userId,
      'interview_prep',
      'generation',
      { jobId, jobTitle, companyName },
      null,
      'failed',
      error.message
    ).catch(err => console.error('Error logging failed action:', err));

    res.status(500).json({
      error: 'Failed to generate interview prep',
      message: error.message,
    });
  }
};

const getInterviewPrepHandler = async (req, res) => {
  const { jobId } = req.params;
  const userId = req.user?.email;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const prepContent = await prisma.generatedContent.findFirst({
      where: {
        userId,
        contentType: 'interview_prep',
        jobId,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!prepContent) {
      return res.status(404).json({ error: 'Interview prep not found' });
    }

    // Parse the JSON content
    let data;
    try {
      data = JSON.parse(prepContent.content);
    } catch (e) {
      data = prepContent.content;
    }

    res.json({
      success: true,
      contentId: prepContent.id,
      data,
    });
  } catch (error) {
    console.error('Error retrieving interview prep:', error);
    res.status(500).json({ error: 'Failed to retrieve interview prep' });
  }
};

const getInsightsHandler = async (req, res) => {
  const userId = req.user?.email;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get user profile for context
    const user = await prisma.user.findUnique({
      where: { email: userId },
      select: { firstName: true, lastName: true, email: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate insights
    const result = await generateUserInsights(user);

    // Log the action
    await logAgentAction(
      userId,
      'analytics',
      'insights_generation',
      {},
      { generationTimeMs: result.metadata.generationTimeMs },
      'success'
    );

    res.json({
      success: true,
      data: {
        insights: result.insights,
        skillGaps: result.skillGaps,
        performanceAnalysis: result.performanceAnalysis,
        recommendations: result.recommendations,
        generatedAt: result.metadata.generatedAt,
      },
    });
  } catch (error) {
    console.error('Insights generation error:', error);

    // Log the failed action
    await logAgentAction(userId, 'analytics', 'insights_generation', {}, null, 'failed', error.message).catch(
      err => console.error('Error logging failed action:', err)
    );

    res.status(500).json({
      error: 'Failed to generate insights',
      message: error.message,
    });
  }
};

const getMarketTrendsHandler = async (req, res) => {
  const { jobListings = [] } = req.body || {};
  const userId = req.user?.email;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get user profile to determine target roles
    const user = await prisma.user.findUnique({
      where: { email: userId },
      select: { firstName: true, lastName: true, email: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's target roles from application history
    const applicationHistory = await prisma.application.findMany({
      where: { userId },
      select: { jobName: true },
      distinct: ['jobName'],
      take: 10,
    });

    const targetRoles = applicationHistory.map(app => app.jobName).filter(Boolean);

    // Generate market trends
    const result = await generateMarketTrends(jobListings, targetRoles);

    // Log the action
    await logAgentAction(
      userId,
      'analytics',
      'market_trends',
      { jobListingsCount: jobListings.length },
      { generationTimeMs: result.metadata.generationTimeMs },
      'success'
    );

    res.json({
      success: true,
      data: {
        trends: result.trends,
        generatedAt: result.metadata.generatedAt,
      },
    });
  } catch (error) {
    console.error('Market trends error:', error);

    // Log the failed action
    await logAgentAction(userId, 'analytics', 'market_trends', {}, null, 'failed', error.message).catch(
      err => console.error('Error logging failed action:', err)
    );

    res.status(500).json({
      error: 'Failed to generate market trends',
      message: error.message,
    });
  }
};

const getFollowUpsHandler = async (req, res) => {
  const userId = req.user?.email;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const followUps = await getPendingFollowUps(userId, 50);

    res.json({
      success: true,
      data: followUps,
    });
  } catch (error) {
    console.error('Error fetching follow-ups:', error);
    res.status(500).json({
      error: 'Failed to fetch follow-ups',
      message: error.message,
    });
  }
};

const getStaleApplicationsHandler = async (req, res) => {
  const userId = req.user?.email;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const applications = await getStaleApplications(userId);

    res.json({
      success: true,
      data: applications,
    });
  } catch (error) {
    console.error('Error fetching stale applications:', error);
    res.status(500).json({
      error: 'Failed to fetch stale applications',
      message: error.message,
    });
  }
};

const generateFollowUpSuggestionsHandler = async (req, res) => {
  const userId = req.user?.email;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const followUps = await generateAllFollowUps(userId);

    // Log the action
    await logAgentAction(
      userId,
      'follow_up',
      'generate_suggestions',
      {},
      { followUpCount: followUps.length },
      'success'
    ).catch(err => console.error('Error logging follow-up generation:', err));

    res.json({
      success: true,
      data: followUps,
      message: `Generated ${followUps.length} follow-up suggestion(s)`,
    });
  } catch (error) {
    console.error('Error generating follow-ups:', error);

    await logAgentAction(
      userId,
      'follow_up',
      'generate_suggestions',
      {},
      null,
      'failed',
      error.message
    ).catch(err => console.error('Error logging failed action:', err));

    res.status(500).json({
      error: 'Failed to generate follow-ups',
      message: error.message,
    });
  }
};

const approveFollowUpHandler = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.email;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!id) {
    return res.status(400).json({ error: 'Follow-up ID is required' });
  }

  try {
    const followUp = await approveFollowUp(parseInt(id), userId);

    // Log the action
    await logAgentAction(
      userId,
      'follow_up',
      'approve',
      { followUpId: id },
      { status: 'approved' },
      'success'
    ).catch(err => console.error('Error logging action:', err));

    res.json({
      success: true,
      data: followUp,
    });
  } catch (error) {
    console.error('Error approving follow-up:', error);
    res.status(500).json({
      error: 'Failed to approve follow-up',
      message: error.message,
    });
  }
};

const dismissFollowUpHandler = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.email;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!id) {
    return res.status(400).json({ error: 'Follow-up ID is required' });
  }

  try {
    const followUp = await dismissFollowUp(parseInt(id), userId);

    // Log the action
    await logAgentAction(
      userId,
      'follow_up',
      'dismiss',
      { followUpId: id },
      { status: 'dismissed' },
      'success'
    ).catch(err => console.error('Error logging action:', err));

    res.json({
      success: true,
      data: followUp,
    });
  } catch (error) {
    console.error('Error dismissing follow-up:', error);
    res.status(500).json({
      error: 'Failed to dismiss follow-up',
      message: error.message,
    });
  }
};

const editFollowUpHandler = async (req, res) => {
  const { id } = req.params;
  const { emailSubject, emailBody } = req.body;
  const userId = req.user?.email;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!id) {
    return res.status(400).json({ error: 'Follow-up ID is required' });
  }

  if (!emailSubject || !emailBody) {
    return res.status(400).json({ error: 'emailSubject and emailBody are required' });
  }

  try {
    const followUp = await updateFollowUpEmail(parseInt(id), userId, {
      emailSubject,
      emailBody,
    });

    // Log the action
    await logAgentAction(
      userId,
      'follow_up',
      'edit',
      { followUpId: id },
      { updated: true },
      'success'
    ).catch(err => console.error('Error logging action:', err));

    res.json({
      success: true,
      data: followUp,
    });
  } catch (error) {
    console.error('Error editing follow-up:', error);
    res.status(500).json({
      error: 'Failed to edit follow-up',
      message: error.message,
    });
  }
};

const sendFollowUpHandler = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.email;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!id) {
    return res.status(400).json({ error: 'Follow-up ID is required' });
  }

  try {
    // Mark as sent (in production, would actually send email via Nodemailer/SendGrid)
    const followUp = await markFollowUpAsSent(parseInt(id), userId);

    // Log the action
    await logAgentAction(
      userId,
      'follow_up',
      'send',
      { followUpId: id },
      { status: 'sent', sentAt: new Date() },
      'success'
    ).catch(err => console.error('Error logging action:', err));

    res.json({
      success: true,
      data: followUp,
      message: 'Follow-up marked as sent',
    });
  } catch (error) {
    console.error('Error sending follow-up:', error);
    res.status(500).json({
      error: 'Failed to send follow-up',
      message: error.message,
    });
  }
};

// Preference Handlers

const initializePreferencesHandler = async (req, res) => {
  const userId = req.user?.email;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const preferences = await initializePreferences(userId);

    await logAgentAction(
      userId,
      'job_alerts',
      'initialize_preferences',
      {},
      {
        preferencesCreated: true,
        roles: preferences.preferredRoles,
        locations: preferences.preferredLocations,
      },
      'success'
    ).catch(err => console.error('Error logging action:', err));

    res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('Error initializing preferences:', error);
    res.status(500).json({
      error: 'Failed to initialize preferences',
      message: error.message,
    });
  }
};

const getPreferencesHandler = async (req, res) => {
  const userId = req.user?.email;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const preferences = await getPreferences(userId);

    if (!preferences) {
      return res.status(404).json({
        error: 'Preferences not found',
        message: 'Please initialize preferences first',
      });
    }

    res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({
      error: 'Failed to fetch preferences',
      message: error.message,
    });
  }
};

const updatePreferencesHandler = async (req, res) => {
  const userId = req.user?.email;
  const updates = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const preferences = await updatePreferences(userId, updates);

    await logAgentAction(
      userId,
      'job_alerts',
      'update_preferences',
      updates,
      { preferencesUpdated: true },
      'success'
    ).catch(err => console.error('Error logging action:', err));

    res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      error: 'Failed to update preferences',
      message: error.message,
    });
  }
};

// Alert Handlers

const checkAlertsHandler = async (req, res) => {
  const userId = req.user?.email;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const alerts = await generateAlertsForUser(userId);

    res.json({
      success: true,
      data: alerts,
      message: `Generated ${alerts.length} new job alerts`,
    });
  } catch (error) {
    console.error('Error checking alerts:', error);
    res.status(500).json({
      error: 'Failed to check for alerts',
      message: error.message,
    });
  }
};

const getAlertsHandler = async (req, res) => {
  const userId = req.user?.email;
  const { status = 'all', sortBy = 'newest' } = req.query;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const alerts = await getAlerts(userId, { status, sortBy });

    res.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      error: 'Failed to fetch alerts',
      message: error.message,
    });
  }
};

const getUnreadAlertsHandler = async (req, res) => {
  const userId = req.user?.email;
  const limit = parseInt(req.query.limit || '3');

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const alerts = await getUnreadAlerts(userId, limit);

    res.json({
      success: true,
      data: alerts,
      unreadCount: alerts.length,
    });
  } catch (error) {
    console.error('Error fetching unread alerts:', error);
    res.status(500).json({
      error: 'Failed to fetch unread alerts',
      message: error.message,
    });
  }
};

const dismissAlertHandler = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.email;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!id) {
    return res.status(400).json({ error: 'Alert ID is required' });
  }

  try {
    const alert = await dismissAlert(parseInt(id), userId);

    res.json({
      success: true,
      data: alert,
    });
  } catch (error) {
    console.error('Error dismissing alert:', error);
    res.status(500).json({
      error: 'Failed to dismiss alert',
      message: error.message,
    });
  }
};

const applyFromAlertHandler = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.email;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!id) {
    return res.status(400).json({ error: 'Alert ID is required' });
  }

  try {
    const application = await applyFromAlert(parseInt(id), userId);

    res.json({
      success: true,
      data: application,
      message: 'Application created from alert',
    });
  } catch (error) {
    console.error('Error applying from alert:', error);
    res.status(500).json({
      error: 'Failed to create application',
      message: error.message,
    });
  }
};

module.exports = {
  generateCoverLetterHandler,
  getCoverLettersHandler,
  getAllCoverLettersHandler,
  generateColdEmailHandler,
  calculateMatchScoresHandler,
  generateInterviewPrepHandler,
  getInterviewPrepHandler,
  getInsightsHandler,
  getMarketTrendsHandler,
  getFollowUpsHandler,
  getStaleApplicationsHandler,
  generateFollowUpSuggestionsHandler,
  approveFollowUpHandler,
  dismissFollowUpHandler,
  editFollowUpHandler,
  sendFollowUpHandler,
  initializePreferencesHandler,
  getPreferencesHandler,
  updatePreferencesHandler,
  checkAlertsHandler,
  getAlertsHandler,
  getUnreadAlertsHandler,
  dismissAlertHandler,
  applyFromAlertHandler,
};
