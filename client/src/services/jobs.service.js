import baseFetch from './api';
import { ENDPOINTS } from '../config/api';

export const getJobIds = () =>
  baseFetch(ENDPOINTS.MY_JOB_IDS);

export const getJobIdsByStatus = () =>
  baseFetch(ENDPOINTS.MY_JOB_IDS_BY_STATUS);

export const searchJobs = (query, page = 1) =>
  baseFetch(`${ENDPOINTS.JOBS_SEARCH}?query=${encodeURIComponent(query)}&page=${page}`);
