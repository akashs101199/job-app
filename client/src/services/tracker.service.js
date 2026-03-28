import baseFetch from './api';
import { ENDPOINTS } from '../config/api';

export const insertApplication = (
  jobId, status, dateApplied, dateUpdated,
  notes, jobTitle, employer_name, apply_link, publisher
) =>
  baseFetch(ENDPOINTS.APPLICATION, {
    method: 'POST',
    body: JSON.stringify({
      jobId, status, dateApplied, dateUpdated,
      notes, jobTitle, employer_name, apply_link, publisher,
    }),
  });

export const fetchRecords = () =>
  baseFetch(ENDPOINTS.GET_RECORDS);

export const updateRecord = (value, id, platformName) =>
  baseFetch(ENDPOINTS.UPDATE_RECORD, {
    method: 'POST',
    body: JSON.stringify({ value, id, platformName }),
  });
