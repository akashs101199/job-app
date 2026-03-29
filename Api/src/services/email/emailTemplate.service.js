import prisma from '../../config/prisma.js';

/**
 * Email Template Service
 * Manages email templates and rendering with dynamic content
 */

const EMAIL_TEMPLATES = {
  daily_digest: {
    name: 'daily_digest',
    subject: '🔔 {{jobCount}} new jobs matching your preferences',
    category: 'digest',
    variables: ['jobCount', 'jobs', 'userName', 'unsubscribeUrl', 'checkAlertsUrl'],
    htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { border-bottom: 2px solid #667eea; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #667eea; margin: 0; }
    .header p { color: #999; margin: 5px 0 0 0; }
    .job-card { border: 1px solid #eee; border-radius: 8px; padding: 15px; margin: 15px 0; }
    .job-title { font-size: 18px; font-weight: 600; color: #2c3e50; margin: 0; }
    .company { color: #667eea; font-weight: 500; }
    .match-score { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; margin-left: 10px; }
    .match-score.high { background: #d4f4dd; color: #28a745; }
    .match-score.medium { background: #fff3cd; color: #ff9800; }
    .match-score.low { background: #f8d7da; color: #dc3545; }
    .job-details { font-size: 14px; color: #666; margin: 10px 0; }
    .cta { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 15px 0; }
    .footer { border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #999; }
    .footer a { color: #667eea; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Hi {{userName}},</h1>
      <p>{{jobCount}} new jobs matched your preferences today</p>
    </div>

    {{#jobs}}
    <div class="job-card">
      <div>
        <p class="job-title">{{this.jobTitle}}<span class="match-score {{this.scoreClass}}">{{this.matchScore}}%</span></p>
        <p class="company">{{this.companyName}}</p>
      </div>
      <div class="job-details">
        {{#if this.location}}<p>📍 {{this.location}}</p>{{/if}}
        {{#if this.salary}}<p>💰 {{this.salary}}</p>{{/if}}
      </div>
      <a href="{{this.jobLink}}" class="cta">View Job →</a>
    </div>
    {{/jobs}}

    <a href="{{checkAlertsUrl}}" class="cta">See All Alerts</a>

    <div class="footer">
      <p>
        <a href="{{unsubscribeUrl}}">Unsubscribe from daily digests</a> |
        Manage your <a href="{{preferencesUrl}}">notification preferences</a>
      </p>
    </div>
  </div>
</body>
</html>
    `,
    textTemplate: `
New Jobs Matching Your Preferences
====================================

Hi {{userName}},

{{jobCount}} new jobs matched your preferences today.

{{#jobs}}
- {{this.jobTitle}} at {{this.companyName}} (Match: {{this.matchScore}}%)
  {{#if this.location}}📍 {{this.location}}{{/if}}
  {{#if this.salary}}💰 {{this.salary}}{{/if}}
  {{this.jobLink}}

{{/jobs}}

See all alerts: {{checkAlertsUrl}}

Unsubscribe: {{unsubscribeUrl}}
    `,
  },

  auto_apply_confirmation: {
    name: 'auto_apply_confirmation',
    subject: '✅ You applied to {{jobTitle}} at {{companyName}}',
    category: 'transactional',
    variables: ['jobTitle', 'companyName', 'appliedAt', 'viewUrl'],
    htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .success-banner { background: #d4f4dd; border-left: 4px solid #28a745; padding: 20px; border-radius: 4px; }
    .success-banner h2 { color: #28a745; margin: 0 0 10px 0; }
    .details { background: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .detail-label { font-weight: 600; }
    .cta { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="success-banner">
      <h2>✅ Application Submitted!</h2>
      <p>Your application to {{jobTitle}} at {{companyName}} has been submitted successfully.</p>
    </div>

    <div class="details">
      <div class="detail-row">
        <span class="detail-label">Company:</span>
        <span>{{companyName}}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Position:</span>
        <span>{{jobTitle}}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Applied:</span>
        <span>{{appliedAt}}</span>
      </div>
    </div>

    <p>Next steps:</p>
    <ul>
      <li>Watch for updates in your <a href="{{viewUrl}}">application dashboard</a></li>
      <li>Set a follow-up reminder after 1-2 weeks</li>
      <li>Prepare for potential interview requests</li>
    </ul>

    <a href="{{viewUrl}}" class="cta">View Application</a>
  </div>
</body>
</html>
    `,
    textTemplate: `
Application Submitted!
=======================

Your application to {{jobTitle}} at {{companyName}} has been submitted successfully.

Company: {{companyName}}
Position: {{jobTitle}}
Applied: {{appliedAt}}

Next steps:
- Watch for updates in your application dashboard
- Set a follow-up reminder after 1-2 weeks
- Prepare for potential interview requests

View Application: {{viewUrl}}
    `,
  },

  interview_scheduled: {
    name: 'interview_scheduled',
    subject: '🎉 Interview scheduled with {{companyName}}!',
    category: 'transactional',
    variables: ['companyName', 'jobTitle', 'interviewDate', 'interviewTime', 'prepUrl'],
    htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .celebration { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; }
    .celebration h1 { margin: 0 0 10px 0; }
    .interview-details { background: #f9f9f9; padding: 20px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #667eea; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; }
    .detail-label { font-weight: 600; color: #666; }
    .detail-value { color: #333; }
    .prep-section { background: #f0f4ff; padding: 15px; border-radius: 4px; margin: 20px 0; }
    .cta { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="celebration">
      <h1>🎉 Great News!</h1>
      <p>You have an interview with {{companyName}}</p>
    </div>

    <div class="interview-details">
      <div class="detail-row">
        <span class="detail-label">Company:</span>
        <span class="detail-value">{{companyName}}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Position:</span>
        <span class="detail-value">{{jobTitle}}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Date:</span>
        <span class="detail-value">{{interviewDate}}</span>
      </div>
      {{#if interviewTime}}
      <div class="detail-row">
        <span class="detail-label">Time:</span>
        <span class="detail-value">{{interviewTime}}</span>
      </div>
      {{/if}}
    </div>

    <div class="prep-section">
      <h3 style="margin-top: 0;">Prepare for Success</h3>
      <p>Use our interview prep resources to get ready:</p>
      <a href="{{prepUrl}}" class="cta">Start Interview Prep →</a>
    </div>
  </div>
</body>
</html>
    `,
    textTemplate: `
Great News!
============

You have an interview with {{companyName}}

Company: {{companyName}}
Position: {{jobTitle}}
Date: {{interviewDate}}
{{#if interviewTime}}Time: {{interviewTime}}{{/if}}

Prepare for Success:
Use our interview prep resources to get ready:
{{prepUrl}}
    `,
  },

  weekly_stats: {
    name: 'weekly_stats',
    subject: '📊 Your Job Search Summary — Week of {{weekStart}}',
    category: 'digest',
    variables: ['weekStart', 'appliedCount', 'viewedCount', 'interviewCount', 'statsUrl'],
    htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { border-bottom: 2px solid #667eea; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #667eea; margin: 0; font-size: 24px; }
    .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
    .stat-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
    .stat-value { font-size: 32px; font-weight: 700; margin: 10px 0; }
    .stat-label { font-size: 14px; opacity: 0.9; }
    .cta { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Weekly Summary</h1>
      <p>Week of {{weekStart}}</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Applications</div>
        <div class="stat-value">{{appliedCount}}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Jobs Viewed</div>
        <div class="stat-value">{{viewedCount}}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Interviews</div>
        <div class="stat-value">{{interviewCount}}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg Match Score</div>
        <div class="stat-value">{{avgScore}}</div>
      </div>
    </div>

    <a href="{{statsUrl}}" class="cta">View Detailed Analytics</a>
  </div>
</body>
</html>
    `,
    textTemplate: `
Weekly Summary
==============

Week of {{weekStart}}

Applications: {{appliedCount}}
Jobs Viewed: {{viewedCount}}
Interviews: {{interviewCount}}
Avg Match Score: {{avgScore}}

View Detailed Analytics: {{statsUrl}}
    `,
  },

  milestone_achievement: {
    name: 'milestone_achievement',
    subject: '🏆 Congratulations! You\'ve reached {{milestone}}',
    category: 'marketing',
    variables: ['milestone', 'achievement', 'date', 'nextMilestone'],
    htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .trophy { text-align: center; font-size: 64px; margin: 20px 0; }
    .celebration { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; }
    .celebration h1 { margin: 0 0 10px 0; font-size: 28px; }
    .achievement-box { background: #f0f4ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .achievement-box p { margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="trophy">🏆</div>
    <div class="celebration">
      <h1>Congratulations!</h1>
      <p>You've reached {{milestone}}</p>
    </div>

    <div class="achievement-box">
      <p><strong>Achievement:</strong> {{achievement}}</p>
      <p><strong>Unlocked:</strong> {{date}}</p>
      {{#if nextMilestone}}
      <p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
        Next milestone: {{nextMilestone}}
      </p>
      {{/if}}
    </div>

    <p>Keep up the great work! Your persistence will pay off.</p>
  </div>
</body>
</html>
    `,
    textTemplate: `
Congratulations!
================

🏆 You've reached {{milestone}}

Achievement: {{achievement}}
Unlocked: {{date}}

{{#if nextMilestone}}Next milestone: {{nextMilestone}}{{/if}}

Keep up the great work! Your persistence will pay off.
    `,
  },
};

/**
 * Get all default templates
 * @returns {array} List of template metadata
 */
export async function getAvailableTemplates() {
  return Object.values(EMAIL_TEMPLATES).map(t => ({
    name: t.name,
    subject: t.subject,
    category: t.category,
    variables: t.variables,
  }));
}

/**
 * Get template by name
 * @param {string} templateName
 * @returns {Promise<object>} Template object
 */
export async function getTemplate(templateName) {
  // Check database first (allows overrides)
  const dbTemplate = await prisma.emailTemplate.findUnique({
    where: { name: templateName },
  });

  if (dbTemplate && dbTemplate.isActive) {
    return dbTemplate;
  }

  // Fall back to default template
  const defaultTemplate = EMAIL_TEMPLATES[templateName];
  if (!defaultTemplate) {
    throw new Error(`Template not found: ${templateName}`);
  }

  return defaultTemplate;
}

/**
 * Render template with Handlebars syntax
 * @param {string} templateName
 * @param {object} data - Template variables
 * @returns {Promise<{ html: string, text: string, subject: string }>}
 */
export async function renderTemplate(templateName, data) {
  const template = await getTemplate(templateName);

  // Simple template variable replacement
  // In production, use Handlebars library for complex templates
  let subject = template.subject;
  let htmlContent = template.htmlTemplate || '';
  let textContent = template.textTemplate || '';

  // Replace all {{variable}} with data values
  const variables = template.variables || [];
  for (const variable of variables) {
    const regex = new RegExp(`{{${variable}}}`, 'g');
    subject = subject.replace(regex, data[variable] || '');
    htmlContent = htmlContent.replace(regex, data[variable] || '');
    textContent = textContent.replace(regex, data[variable] || '');
  }

  return {
    subject,
    html: htmlContent,
    text: textContent,
  };
}

/**
 * Save or update email template
 * @param {object} templateData
 * @returns {Promise<EmailTemplate>}
 */
export async function saveTemplate(templateData) {
  const { name, subject, htmlContent, textContent, category, variables, isActive } = templateData;

  if (!name || !subject || !htmlContent) {
    throw new Error('Template requires: name, subject, htmlContent');
  }

  return prisma.emailTemplate.upsert({
    where: { name },
    update: {
      subject,
      htmlContent,
      textContent,
      category,
      variables,
      isActive,
    },
    create: {
      name,
      subject,
      htmlContent,
      textContent,
      category: category || 'transactional',
      variables: variables || [],
      isActive: isActive !== false,
    },
  });
}

/**
 * Get template variables for validation
 * @param {string} templateName
 * @returns {array} List of required variables
 */
export async function getTemplateVariables(templateName) {
  const template = await getTemplate(templateName);
  return template.variables || [];
}

/**
 * Validate that all required variables are provided
 * @param {string} templateName
 * @param {object} data
 * @returns {boolean} True if all variables present
 */
export async function validateTemplateData(templateName, data) {
  const requiredVariables = await getTemplateVariables(templateName);
  for (const variable of requiredVariables) {
    if (!(variable in data) || data[variable] === undefined) {
      throw new Error(`Missing required variable: ${variable}`);
    }
  }
  return true;
}

/**
 * Initialize default templates in database
 * (Call this once on app startup or migration)
 */
export async function initializeDefaultTemplates() {
  for (const [key, template] of Object.entries(EMAIL_TEMPLATES)) {
    await saveTemplate({
      ...template,
      variables: template.variables || [],
    });
  }
}
