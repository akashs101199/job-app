const { Router } = require('express');
const agentController = require('../controllers/agent.controller');
const requireAuth = require('../middleware/requireAuth');

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

module.exports = router;
