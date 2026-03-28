const { Router } = require('express');
const authRoutes = require('./auth.routes');
const oauthRoutes = require('./oauth.routes');
const trackerRoutes = require('./tracker.routes');
const jobsRoutes = require('./jobs.routes');

const router = Router();

router.use('/', authRoutes);
router.use('/', oauthRoutes);
router.use('/', trackerRoutes);
router.use('/jobs', jobsRoutes);

module.exports = router;
