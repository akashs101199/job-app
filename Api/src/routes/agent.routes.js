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

module.exports = router;
