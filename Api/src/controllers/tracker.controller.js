const trackerService = require('../services/tracker.service');

const getRecords = async (req, res) => {
  try {
    const records = await trackerService.getRecordsByUser(req.user.email);
    res.json({ records });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching user data' });
  }
};

const updateRecord = async (req, res) => {
  const { value, id, platformName } = req.body;

  try {
    await trackerService.updateRecordStatus(req.user.email, id, value, platformName);
    res.json({ message: 'Record updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error updating user record' });
  }
};

const createApplication = async (req, res) => {
  const {
    jobId, status, dateApplied, dateUpdated,
    notes, jobTitle, employer_name, apply_link, publisher,
  } = req.body;

  try {
    const newApp = await trackerService.insertApplication({
      email: req.user.email,
      jobId,
      status,
      dateApplied,
      dateUpdated,
      notes,
      jobTitle,
      employer_name,
      apply_link,
      publisher,
    });
    return res.status(201).json(newApp);
  } catch (error) {
    console.error('Error inserting/updating application:', error);
    return res.status(500).json({ error: 'Failed to insert or update application.' });
  }
};

const myJobIds = async (req, res) => {
  try {
    const jobIds = await trackerService.getJobIdsByUser(req.user.email);
    res.json({ jobIds });
  } catch (error) {
    console.error('Error fetching job IDs:', error);
    res.status(500).json({ error: 'Failed to fetch job IDs.' });
  }
};

const myJobIdsByStatus = async (req, res) => {
  try {
    const jobIds = await trackerService.getJobIdsByStatus(req.user.email);
    res.json({ jobIds });
  } catch (error) {
    console.error('Error fetching job IDs:', error);
    res.status(500).json({ error: 'Failed to fetch job IDs.' });
  }
};

module.exports = { getRecords, updateRecord, createApplication, myJobIds, myJobIdsByStatus };
