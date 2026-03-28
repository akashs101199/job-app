const jobsService = require('../services/jobs.service');

const searchJobs = async (req, res) => {
  const { query = 'jobs', page = 1 } = req.query;

  try {
    const data = await jobsService.searchJobs(query, page);
    res.json(data);
  } catch (error) {
    console.error('Job search proxy error:', error);
    res.status(502).json({ error: 'Failed to fetch jobs from external API.' });
  }
};

module.exports = { searchJobs };
