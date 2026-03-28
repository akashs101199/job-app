import baseFetch from './api';
import { ENDPOINTS } from '../config/api';

export const generateCoverLetterApi = (jobData) => {
  return baseFetch(`${ENDPOINTS.AGENT_GENERATE_COVER_LETTER}`, {
    method: 'POST',
    body: JSON.stringify(jobData),
  });
};

export const getCoverLettersApi = (jobId) => {
  return baseFetch(`${ENDPOINTS.AGENT_GET_COVER_LETTERS}/${jobId}`);
};

export const getAllCoverLettersApi = () => {
  return baseFetch(`${ENDPOINTS.AGENT_GET_ALL_COVER_LETTERS}`);
};

export const generateColdEmailApi = (jobData) => {
  return baseFetch(`${ENDPOINTS.AGENT_GENERATE_COLD_EMAIL}`, {
    method: 'POST',
    body: JSON.stringify(jobData),
  });
};
