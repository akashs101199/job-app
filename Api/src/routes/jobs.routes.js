const { Router } = require('express');
const jobsController = require('../controllers/jobs.controller');
const requireAuth = require('../middleware/requireAuth');

const router = Router();

router.get('/search', requireAuth, jobsController.searchJobs);

module.exports = router;
