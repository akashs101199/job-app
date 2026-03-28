const API_BASE_URL = 'http://localhost:5000/api';

const ENDPOINTS = {
  ME: `${API_BASE_URL}/me`,
  LOGIN: `${API_BASE_URL}/login`,
  REGISTER: `${API_BASE_URL}/register`,
  LOGOUT: `${API_BASE_URL}/logout`,
  REFRESH: `${API_BASE_URL}/refresh`,
  APPLICATION: `${API_BASE_URL}/application`,
  GET_RECORDS: `${API_BASE_URL}/getRecords`,
  UPDATE_RECORD: `${API_BASE_URL}/updateRecord`,
  MY_JOB_IDS: `${API_BASE_URL}/myJobIds`,
  MY_JOB_IDS_BY_STATUS: `${API_BASE_URL}/myJobIdsByStatus`,
  JOBS_SEARCH: `${API_BASE_URL}/jobs/search`,
  AGENT_GENERATE_COVER_LETTER: `${API_BASE_URL}/agent/cover-letter`,
  AGENT_GET_COVER_LETTERS: `${API_BASE_URL}/agent/cover-letters`,
  AGENT_GET_ALL_COVER_LETTERS: `${API_BASE_URL}/agent/cover-letters`,
  AGENT_GENERATE_COLD_EMAIL: `${API_BASE_URL}/agent/cold-email`,
  AGENT_MATCH_JOBS: `${API_BASE_URL}/agent/match-jobs`,
};

export { API_BASE_URL, ENDPOINTS };
