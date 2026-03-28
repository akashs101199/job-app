require('dotenv').config();

const required = ['DATABASE_URL', 'JWT_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = {
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  RAPIDAPI_KEY: process.env.RAPIDAPI_KEY || '',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  SESSION_SECRET: process.env.SESSION_SECRET || 'default-session-secret',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
};
