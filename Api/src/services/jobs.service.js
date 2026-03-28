const { RAPIDAPI_KEY } = require('../config/env');

const searchJobs = async (query, page = 1) => {
  const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&page=${page}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`RapidAPI error (${response.status}): ${err.message || 'Unknown'}`);
  }

  return response.json();
};

module.exports = { searchJobs };
