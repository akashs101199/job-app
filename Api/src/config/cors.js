const { CORS_ORIGIN } = require('./env');

const corsOptions = {
  origin: CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
};

module.exports = corsOptions;
