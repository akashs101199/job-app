const { Router } = require('express');
const trackerController = require('../controllers/tracker.controller');
const requireAuth = require('../middleware/requireAuth');

const router = Router();

router.post('/application', requireAuth, trackerController.createApplication);
router.get('/getRecords', requireAuth, trackerController.getRecords);
router.post('/updateRecord', requireAuth, trackerController.updateRecord);
router.get('/myJobIds', requireAuth, trackerController.myJobIds);
router.get('/myJobIdsByStatus', requireAuth, trackerController.myJobIdsByStatus);

module.exports = router;
