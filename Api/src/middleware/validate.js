const { body, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }
  next();
};

const validateRegister = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('dob').isISO8601().withMessage('Valid date of birth is required (YYYY-MM-DD)'),
  handleValidationErrors,
];

const validateLogin = [
  body('email').notEmpty().withMessage('Email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

const validateApplication = [
  body('jobId').notEmpty().withMessage('Job ID is required'),
  body('status')
    .isIn(['Applied', 'Interview Scheduled', 'Selected', 'Rejected'])
    .withMessage('Status must be one of: Applied, Interview Scheduled, Selected, Rejected'),
  body('publisher').notEmpty().withMessage('Publisher is required'),
  handleValidationErrors,
];

const validateUpdateRecord = [
  body('value')
    .isIn(['Applied', 'Interview Scheduled', 'Selected', 'Rejected'])
    .withMessage('Status must be one of: Applied, Interview Scheduled, Selected, Rejected'),
  body('id').notEmpty().withMessage('Job listing ID is required'),
  body('platformName').notEmpty().withMessage('Platform name is required'),
  handleValidationErrors,
];

const validateJobSearch = [
  query('query')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Search query must be 200 characters or less'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  handleValidationErrors,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateApplication,
  validateUpdateRecord,
  validateJobSearch,
};
