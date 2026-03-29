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
const {
  parseResumeFile,
  validateFileType,
  validateFileSize,
  getFileExtension,
} = require('../services/ai/resumeParser.service');
const {
  analyzeResume,
  calculateQuickAtsScore,
  formatAnalysisResults,
} = require('../services/ai/resumeAnalysis.service');
const {
  tailorResumeForJob,
  formatTailoringResults,
  summarizeChanges,
} = require('../services/ai/resumeTailor.service');
const { deleteUploadedFile } = require('../middleware/uploadMiddleware');
const {
  initializeAutoApplyConfig,
  getAutoApplyConfig,
  updateAutoApplyConfig,
  disableAutoApply,
  checkAndQueueApplications,
  approveQueueItem,
  rejectQueueItem,
  getQueueForUser,
  getAutoApplyStats,
} = require('../services/ai/autoApply.service');
const { getScheduler } = require('../services/scheduler/scheduler.service');
const fs = require('fs');

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

// Resume Management Handlers

const uploadResumeHandler = async (req, res) => {
  const userId = req.user?.email;
  const uploadedFile = req.uploadedFile;

  if (!userId) {
    await deleteUploadedFile(uploadedFile?.path);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!uploadedFile) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const fileType = getFileExtension(uploadedFile.mimetype);

    // Parse the resume file
    const parseResult = await parseResumeFile(uploadedFile.path, fileType);

    // Store in database
    const resume = await prisma.userResume.create({
      data: {
        userId,
        fileName: uploadedFile.originalName,
        fileType,
        filePath: uploadedFile.path,
        fileSize: uploadedFile.size,
        rawText: parseResult.text,
      },
    });

    // Log the action
    await logAgentAction(
      userId,
      'resume_management',
      'upload_resume',
      { fileName: uploadedFile.originalName, fileSize: uploadedFile.size },
      { resumeId: resume.id, textLength: parseResult.text.length },
      'success'
    ).catch(err => console.error('Error logging action:', err));

    res.json({
      success: true,
      data: {
        id: resume.id,
        fileName: resume.fileName,
        fileType: resume.fileType,
        uploadedAt: resume.uploadedAt,
        characterCount: parseResult.metadata.characterCount,
        wordCount: parseResult.metadata.wordCount,
      },
    });
  } catch (error) {
    console.error('Error uploading resume:', error);

    // Clean up uploaded file
    await deleteUploadedFile(uploadedFile?.path);

    // Log the failure
    await logAgentAction(
      userId,
      'resume_management',
      'upload_resume',
      { fileName: uploadedFile?.originalName },
      null,
      'failed',
      error.message
    ).catch(err => console.error('Error logging action:', err));

    res.status(500).json({
      error: 'Failed to upload resume',
      message: error.message,
    });
  }
};

const listResumesHandler = async (req, res) => {
  const userId = req.user?.email;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const resumes = await prisma.userResume.findMany({
      where: { userId },
      select: {
        id: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        uploadedAt: true,
        _count: {
          select: { analyses: true, tailors: true },
        },
      },
      orderBy: { uploadedAt: 'desc' },
    });

    res.json({
      success: true,
      data: resumes,
    });
  } catch (error) {
    console.error('Error listing resumes:', error);
    res.status(500).json({
      error: 'Failed to fetch resumes',
      message: error.message,
    });
  }
};

const analyzeResumeHandler = async (req, res) => {
  const { resumeId, jobDescription, jobTitle } = req.body;
  const userId = req.user?.email;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!resumeId) {
    return res.status(400).json({ error: 'resumeId is required' });
  }

  try {
    // Get the resume
    const resume = await prisma.userResume.findUnique({
      where: { id: parseInt(resumeId) },
    });

    if (!resume || resume.userId !== userId) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Analyze the resume
    const analysisResult = await analyzeResume(
      userId,
      resume.rawText,
      jobDescription || null,
      jobTitle || null
    );

    // Format for storage
    const formattedResult = formatAnalysisResults(analysisResult);

    // Save analysis to database
    const analysis = await prisma.resumeAnalysis.create({
      data: {
        userId,
        resumeId: parseInt(resumeId),
        atsScore: formattedResult.atsScore,
        keywords: formattedResult.keywords,
        sections: formattedResult.sections,
        suggestions: formattedResult.suggestions,
        jobDescription: jobDescription || null,
        jobTitle: jobTitle || null,
      },
    });

    res.json({
      success: true,
      data: {
        id: analysis.id,
        atsScore: analysis.atsScore,
        keywords: analysis.keywords,
        sections: analysis.sections,
        suggestions: analysis.suggestions,
        targetJobFit: analysisResult.targetJobFit,
        createdAt: analysis.createdAt,
      },
    });
  } catch (error) {
    console.error('Error analyzing resume:', error);

    // Log the failure
    await logAgentAction(
      userId,
      'resume_analysis',
      'analyze_resume',
      { resumeId },
      null,
      'failed',
      error.message
    ).catch(err => console.error('Error logging action:', err));

    res.status(500).json({
      error: 'Failed to analyze resume',
      message: error.message,
    });
  }
};

const tailorResumeHandler = async (req, res) => {
  const { resumeId, jobTitle, jobDescription } = req.body;
  const userId = req.user?.email;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!resumeId || !jobTitle || !jobDescription) {
    return res.status(400).json({
      error: 'resumeId, jobTitle, and jobDescription are required',
    });
  }

  try {
    // Get the resume
    const resume = await prisma.userResume.findUnique({
      where: { id: parseInt(resumeId) },
    });

    if (!resume || resume.userId !== userId) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Tailor the resume
    const tailorResult = await tailorResumeForJob(
      userId,
      resume.rawText,
      jobDescription,
      jobTitle
    );

    // Format for storage
    const formattedResult = formatTailoringResults(tailorResult);

    // Save tailoring log
    const tailorLog = await prisma.resumeTailorLog.create({
      data: {
        userId,
        resumeId: parseInt(resumeId),
        jobTitle,
        jobDescription,
        tailoredContent: formattedResult.tailoredContent,
        changes: formattedResult.changes,
      },
    });

    res.json({
      success: true,
      data: {
        id: tailorLog.id,
        tailoredContent: tailorLog.tailoredContent,
        changes: tailorLog.changes,
        summary: summarizeChanges(tailorLog.changes),
        matchAnalysis: tailorResult.matchAnalysis,
        createdAt: tailorLog.createdAt,
      },
    });
  } catch (error) {
    console.error('Error tailoring resume:', error);

    // Log the failure
    await logAgentAction(
      userId,
      'resume_tailor',
      'tailor_resume',
      { resumeId },
      null,
      'failed',
      error.message
    ).catch(err => console.error('Error logging action:', err));

    res.status(500).json({
      error: 'Failed to tailor resume',
      message: error.message,
    });
  }
};

// ============================================================================
// AUTO-APPLY HANDLERS
// ============================================================================

const initializeAutoApplyConfigHandler = async (req, res) => {
  const userId = req.user?.email;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { preferredRoles, preferredLocations, minMatchScore, maxApplicationsPerDay, approvalMode } = req.body;

  try {
    const config = await initializeAutoApplyConfig(userId, {
      preferredRoles: preferredRoles || [],
      preferredLocations: preferredLocations || [],
      minMatchScore: minMatchScore || 70,
      maxApplicationsPerDay: maxApplicationsPerDay || 5,
      approvalMode: approvalMode || 'manual',
    });

    res.json({
      success: true,
      data: config,
      message: 'Auto-apply configuration initialized successfully',
    });
  } catch (error) {
    console.error('Error initializing auto-apply config:', error);
    res.status(500).json({
      error: 'Failed to initialize auto-apply configuration',
      message: error.message,
    });
  }
};

const getAutoApplyConfigHandler = async (req, res) => {
  const userId = req.user?.email;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const config = await getAutoApplyConfig(userId);

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Error fetching auto-apply config:', error);
    res.status(500).json({
      error: 'Failed to fetch auto-apply configuration',
      message: error.message,
    });
  }
};

const updateAutoApplyConfigHandler = async (req, res) => {
  const userId = req.user?.email;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const updates = req.body;

  try {
    const config = await updateAutoApplyConfig(userId, updates);

    res.json({
      success: true,
      data: config,
      message: 'Auto-apply configuration updated successfully',
    });
  } catch (error) {
    console.error('Error updating auto-apply config:', error);
    res.status(500).json({
      error: 'Failed to update auto-apply configuration',
      message: error.message,
    });
  }
};

const disableAutoApplyHandler = async (req, res) => {
  const userId = req.user?.email;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const config = await disableAutoApply(userId);

    res.json({
      success: true,
      data: config,
      message: 'Auto-apply disabled successfully',
    });
  } catch (error) {
    console.error('Error disabling auto-apply:', error);
    res.status(500).json({
      error: 'Failed to disable auto-apply',
      message: error.message,
    });
  }
};

const checkAndQueueApplicationsHandler = async (req, res) => {
  const userId = req.user?.email;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const summary = await checkAndQueueApplications(userId);

    res.json({
      success: true,
      data: summary,
      message: `Found ${summary.discovered} jobs, queued ${summary.queued}`,
    });
  } catch (error) {
    console.error('Error checking and queuing applications:', error);
    res.status(500).json({
      error: 'Failed to check and queue applications',
      message: error.message,
    });
  }
};

const getQueueHandler = async (req, res) => {
  const userId = req.user?.email;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { status = 'pending', limit = 50, offset = 0 } = req.query;

  try {
    const queue = await getQueueForUser(userId, status, parseInt(limit), parseInt(offset));

    res.json({
      success: true,
      data: queue,
    });
  } catch (error) {
    console.error('Error fetching queue:', error);
    res.status(500).json({
      error: 'Failed to fetch queue',
      message: error.message,
    });
  }
};

const approveQueueItemHandler = async (req, res) => {
  const userId = req.user?.email;
  const { queueId } = req.params;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!queueId) {
    return res.status(400).json({ error: 'Queue ID is required' });
  }

  try {
    const updated = await approveQueueItem(parseInt(queueId), userId);

    res.json({
      success: true,
      data: updated,
      message: 'Application approved and submitted successfully',
    });
  } catch (error) {
    console.error('Error approving queue item:', error);
    res.status(500).json({
      error: 'Failed to approve queue item',
      message: error.message,
    });
  }
};

const rejectQueueItemHandler = async (req, res) => {
  const userId = req.user?.email;
  const { queueId } = req.params;
  const { reason } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!queueId) {
    return res.status(400).json({ error: 'Queue ID is required' });
  }

  try {
    const updated = await rejectQueueItem(parseInt(queueId), userId, reason || '');

    res.json({
      success: true,
      data: updated,
      message: 'Application rejected successfully',
    });
  } catch (error) {
    console.error('Error rejecting queue item:', error);
    res.status(500).json({
      error: 'Failed to reject queue item',
      message: error.message,
    });
  }
};

const getAutoApplyStatsHandler = async (req, res) => {
  const userId = req.user?.email;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const stats = await getAutoApplyStats(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching auto-apply stats:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error.message,
    });
  }
};

// ============================================================================
// SCHEDULER HANDLERS (Phase 9)
// ============================================================================

const getSchedulerConfigHandler = async (req, res) => {
  const userId = req.user?.email;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const scheduler = getScheduler();
    const config = await scheduler.getSchedulerConfig(userId);

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Error fetching scheduler config:', error);
    res.status(500).json({
      error: 'Failed to fetch scheduler configuration',
      message: error.message,
    });
  }
};

const updateSchedulerConfigHandler = async (req, res) => {
  const userId = req.user?.email;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const updates = req.body;

  try {
    const scheduler = getScheduler();
    const config = await scheduler.updateSchedulerConfig(userId, updates);

    res.json({
      success: true,
      data: config,
      message: 'Scheduler configuration updated successfully',
    });
  } catch (error) {
    console.error('Error updating scheduler config:', error);
    res.status(500).json({
      error: 'Failed to update scheduler configuration',
      message: error.message,
    });
  }
};

const getSchedulerLogsHandler = async (req, res) => {
  const userId = req.user?.email;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { jobType, limit = 50, offset = 0 } = req.query;

  try {
    const scheduler = getScheduler();
    const logs = await scheduler.getCronLogs(userId, jobType || null, parseInt(limit), parseInt(offset));

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error('Error fetching scheduler logs:', error);
    res.status(500).json({
      error: 'Failed to fetch scheduler logs',
      message: error.message,
    });
  }
};

const manuallyTriggerJobHandler = async (req, res) => {
  const userId = req.user?.email;
  const { jobType } = req.params;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!jobType) {
    return res.status(400).json({ error: 'jobType parameter is required' });
  }

  try {
    const scheduler = getScheduler();
    const result = await scheduler.manuallyTriggerJob(userId, jobType);

    res.json({
      success: true,
      message: `${jobType} job executed successfully`,
      result,
    });
  } catch (error) {
    console.error(`Error manually triggering ${jobType}:`, error);
    res.status(500).json({
      error: `Failed to execute ${jobType} job`,
      message: error.message,
    });
  }
};

// Phase 10: Notification Handlers

import * as notificationService from '../services/notifications/notification.service.js';

const getNotificationPreferencesHandler = async (req, res) => {
  const userId = req.user?.email;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const prefs = await notificationService.getNotificationPreferences(userId);
    res.json({ success: true, data: prefs });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({
      error: 'Failed to fetch notification preferences',
      message: error.message,
    });
  }
};

const updateNotificationPreferencesHandler = async (req, res) => {
  const userId = req.user?.email;
  const updates = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const updated = await notificationService.updateNotificationPreferences(userId, updates);

    await logAgentAction(
      userId,
      'notifications',
      'update_preferences',
      updates,
      { preferencesUpdated: true },
      'success'
    ).catch(err => console.error('Error logging action:', err));

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({
      error: 'Failed to update notification preferences',
      message: error.message,
    });
  }
};

const getEmailLogsHandler = async (req, res) => {
  const userId = req.user?.email;
  const { type, limit = 50, offset = 0 } = req.query;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const result = await notificationService.getEmailLogs(userId, type, parseInt(limit), parseInt(offset));
    res.json({
      success: true,
      data: result.logs,
      total: result.total,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('Error fetching email logs:', error);
    res.status(500).json({
      error: 'Failed to fetch email logs',
      message: error.message,
    });
  }
};

const getNotificationMetricsHandler = async (req, res) => {
  const { type } = req.params;

  if (!type) {
    return res.status(400).json({ error: 'Notification type required' });
  }

  try {
    const metrics = await notificationService.getNotificationMetrics(type);
    res.json({ success: true, data: metrics });
  } catch (error) {
    console.error('Error fetching notification metrics:', error);
    res.status(500).json({
      error: 'Failed to fetch notification metrics',
      message: error.message,
    });
  }
};

const handleSendGridWebhookHandler = async (req, res) => {
  // This will be implemented with SendGrid signature verification
  // For now, just acknowledge receipt
  res.status(200).send('OK');
};

const handleUnsubscribeLinkHandler = async (req, res) => {
  const { token } = req.params;

  try {
    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    const { userId, notificationType } = notificationService.decodeUnsubscribeToken(token);
    await notificationService.unsubscribeFromType(userId, notificationType);

    res.json({
      success: true,
      message: `Unsubscribed from ${notificationType} notifications`,
    });
  } catch (error) {
    console.error('Error processing unsubscribe:', error);
    res.status(400).json({
      error: 'Invalid or expired unsubscribe link',
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
  uploadResumeHandler,
  listResumesHandler,
  analyzeResumeHandler,
  tailorResumeHandler,
  initializeAutoApplyConfigHandler,
  getAutoApplyConfigHandler,
  updateAutoApplyConfigHandler,
  disableAutoApplyHandler,
  checkAndQueueApplicationsHandler,
  getQueueHandler,
  approveQueueItemHandler,
  rejectQueueItemHandler,
  getAutoApplyStatsHandler,
  getSchedulerConfigHandler,
  updateSchedulerConfigHandler,
  getSchedulerLogsHandler,
  manuallyTriggerJobHandler,
  getNotificationPreferencesHandler,
  updateNotificationPreferencesHandler,
  getEmailLogsHandler,
  getNotificationMetricsHandler,
  handleSendGridWebhookHandler,
  handleUnsubscribeLinkHandler,
};
