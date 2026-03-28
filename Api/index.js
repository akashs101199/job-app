const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const helmet = require('helmet');
const passport = require('./src/config/passport');
const { PORT, SESSION_SECRET } = require('./src/config/env');
const corsOptions = require('./src/config/cors');
const { apiLimiter } = require('./src/middleware/rateLimiter');
const routes = require('./src/routes');

const app = express();

// Security headers
app.use(helmet());

app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(apiLimiter);

// Session support (required by Passport for OAuth)
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/api', routes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
