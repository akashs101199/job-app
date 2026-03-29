const { Router } = require('express');
const agentController = require('../controllers/agent.controller');
const requireAuth = require('../middleware/requireAuth');
const { uploadMiddleware } = require('../middleware/uploadMiddleware');

const router = Router();

router.post('/cover-letter', requireAuth, agentController.generateCoverLetterHandler);
router.get('/cover-letters/:jobId', requireAuth, agentController.getCoverLettersHandler);
router.get('/cover-letters', requireAuth, agentController.getAllCoverLettersHandler);
router.post('/cold-email', requireAuth, agentController.generateColdEmailHandler);
router.post('/match-jobs', requireAuth, agentController.calculateMatchScoresHandler);
router.post('/interview-prep', requireAuth, agentController.generateInterviewPrepHandler);
router.get('/interview-prep/:jobId', requireAuth, agentController.getInterviewPrepHandler);
router.get('/insights', requireAuth, agentController.getInsightsHandler);
router.post('/market-trends', requireAuth, agentController.getMarketTrendsHandler);
router.get('/follow-ups', requireAuth, agentController.getFollowUpsHandler);
router.get('/stale-applications', requireAuth, agentController.getStaleApplicationsHandler);
router.post('/follow-ups/generate', requireAuth, agentController.generateFollowUpSuggestionsHandler);
router.post('/follow-ups/:id/approve', requireAuth, agentController.approveFollowUpHandler);
router.post('/follow-ups/:id/dismiss', requireAuth, agentController.dismissFollowUpHandler);
router.patch('/follow-ups/:id', requireAuth, agentController.editFollowUpHandler);
router.post('/follow-ups/:id/send', requireAuth, agentController.sendFollowUpHandler);

// Preferences routes
router.post('/preferences/initialize', requireAuth, agentController.initializePreferencesHandler);
router.get('/preferences', requireAuth, agentController.getPreferencesHandler);
router.put('/preferences', requireAuth, agentController.updatePreferencesHandler);

// Alerts routes
router.post('/alerts/check', requireAuth, agentController.checkAlertsHandler);
router.get('/alerts', requireAuth, agentController.getAlertsHandler);
router.get('/alerts/unread', requireAuth, agentController.getUnreadAlertsHandler);
router.post('/alerts/:id/dismiss', requireAuth, agentController.dismissAlertHandler);
router.post('/alerts/:id/apply', requireAuth, agentController.applyFromAlertHandler);

// Resume routes
router.post('/resume/upload', requireAuth, uploadMiddleware, agentController.uploadResumeHandler);
router.get('/resumes', requireAuth, agentController.listResumesHandler);
router.post('/resume/analyze', requireAuth, agentController.analyzeResumeHandler);
router.post('/resume/tailor', requireAuth, agentController.tailorResumeHandler);

// Auto-Apply routes
router.post('/auto-apply/config/initialize', requireAuth, agentController.initializeAutoApplyConfigHandler);
router.get('/auto-apply/config', requireAuth, agentController.getAutoApplyConfigHandler);
router.put('/auto-apply/config', requireAuth, agentController.updateAutoApplyConfigHandler);
router.post('/auto-apply/disable', requireAuth, agentController.disableAutoApplyHandler);
router.post('/auto-apply/check', requireAuth, agentController.checkAndQueueApplicationsHandler);
router.get('/auto-apply/queue', requireAuth, agentController.getQueueHandler);
router.post('/auto-apply/queue/:queueId/approve', requireAuth, agentController.approveQueueItemHandler);
router.post('/auto-apply/queue/:queueId/reject', requireAuth, agentController.rejectQueueItemHandler);
router.get('/auto-apply/stats', requireAuth, agentController.getAutoApplyStatsHandler);

// Scheduler routes (Phase 9)
router.get('/scheduler/config', requireAuth, agentController.getSchedulerConfigHandler);
router.put('/scheduler/config', requireAuth, agentController.updateSchedulerConfigHandler);
router.get('/scheduler/logs', requireAuth, agentController.getSchedulerLogsHandler);
router.post('/scheduler/job/:jobType/run', requireAuth, agentController.manuallyTriggerJobHandler);

module.exports = router;
