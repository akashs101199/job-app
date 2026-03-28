const { Router } = require('express');
const agentController = require('../controllers/agent.controller');
const requireAuth = require('../middleware/requireAuth');

const router = Router();

router.post('/cover-letter', requireAuth, agentController.generateCoverLetterHandler);
router.get('/cover-letters/:jobId', requireAuth, agentController.getCoverLettersHandler);
router.get('/cover-letters', requireAuth, agentController.getAllCoverLettersHandler);
router.post('/cold-email', requireAuth, agentController.generateColdEmailHandler);

module.exports = router;
