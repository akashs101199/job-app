import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import { PrismaClient } from '@prisma/client';
import { getUnreadAlerts } from '../ai/jobAlerts.service.js';
import { getQueueForUser } from '../ai/autoApply.service.js';

const prisma = new PrismaClient();

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

/**
 * Send alert digest email to user
 */
export async function sendAlertDigest(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: userId },
    });

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    // Fetch recent alerts and queue items
    const alerts = await getUnreadAlerts(userId, 10);
    const queueRes = await getQueueForUser(userId, 'pending', 10, 0);
    const queueItems = queueRes.items || [];

    // If nothing to send, skip
    if (alerts.length === 0 && queueItems.length === 0) {
      console.log(`No new items for digest email to ${userId}`);
      return;
    }

    // Build HTML email
    const htmlContent = buildAlertDigestTemplate({
      firstName: user.firstName,
      lastName: user.lastName,
      alerts,
      queueItems,
    });

    // Send via SendGrid
    if (process.env.SENDGRID_API_KEY) {
      await sgMail.send({
        to: user.email,
        from: process.env.EMAIL_FROM || 'alerts@jobapp.ai',
        subject: `🎯 Your Daily Job Alerts (${alerts.length} new)`,
        html: htmlContent,
      });
    } else {
      // Fallback to nodemailer (for development)
      await sendViaNodemailer(user.email, 'Your Daily Job Alerts', htmlContent);
    }

    console.log(`✅ Alert digest sent to ${user.email}`);
  } catch (error) {
    console.error('Error sending alert digest:', error);
    throw error;
  }
}

/**
 * Send application confirmation email
 */
export async function sendApplicationConfirmation(userId, applicationData) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: userId },
    });

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const htmlContent = buildApplicationTemplate({
      firstName: user.firstName,
      ...applicationData,
    });

    if (process.env.SENDGRID_API_KEY) {
      await sgMail.send({
        to: user.email,
        from: process.env.EMAIL_FROM || 'updates@jobapp.ai',
        subject: `✅ Application Submitted: ${applicationData.jobTitle}`,
        html: htmlContent,
      });
    } else {
      await sendViaNodemailer(
        user.email,
        `Application Submitted: ${applicationData.jobTitle}`,
        htmlContent
      );
    }

    console.log(`✅ Confirmation email sent to ${user.email}`);
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    throw error;
  }
}

/**
 * Build alert digest HTML template
 */
function buildAlertDigestTemplate({ firstName, lastName, alerts, queueItems }) {
  const alertsHTML = alerts
    .slice(0, 10)
    .map(
      (alert, idx) => `
    <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 8px;">
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <div>
          <h3 style="margin: 0 0 5px 0; color: #2c3e50;">${idx + 1}. ${alert.jobTitle}</h3>
          <p style="margin: 0 0 10px 0; color: #7f8c8d;">@ ${alert.companyName}</p>
        </div>
        <div style="background: ${getMatchScoreColor(alert.matchScore)}; color: white; padding: 8px 12px; border-radius: 6px; font-weight: bold;">
          ${alert.matchScore}%
        </div>
      </div>
      <p style="margin: 10px 0; color: #555;">
        📍 ${alert.location || 'Not specified'} | ${alert.salary || 'Salary not listed'}
      </p>
      <a href="${alert.jobLink}" style="color: #667eea; text-decoration: none; font-weight: 500;">
        View Job →
      </a>
    </div>
  `
    )
    .join('');

  const queueHTML = queueItems
    .slice(0, 5)
    .map(
      (item) => `
    <div style="border-left: 3px solid #667eea; padding: 10px 0 10px 12px; margin-bottom: 8px;">
      <p style="margin: 0; color: #2c3e50; font-weight: 500;">${item.jobTitle}</p>
      <p style="margin: 0; color: #7f8c8d; font-size: 0.9em;">Pending approval • Match: ${item.matchScore}%</p>
    </div>
  `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; line-height: 1.6;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #667eea; padding-bottom: 20px;">
          <h1 style="margin: 0 0 5px 0; color: #2c3e50;">🎯 Your Daily Job Alerts</h1>
          <p style="margin: 0; color: #7f8c8d;">We found ${alerts.length} new jobs matching your preferences</p>
        </div>

        <!-- New Alerts Section -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #2c3e50; font-size: 1.2em; margin-bottom: 15px;">📋 New Alerts (${alerts.length})</h2>
          ${alertsHTML || '<p style="color: #999;">No new alerts today</p>'}
        </div>

        <!-- Pending Approvals Section -->
        ${
          queueItems.length > 0
            ? `
        <div style="margin-bottom: 30px; background: #f9f9f9; padding: 15px; border-radius: 8px;">
          <h2 style="color: #2c3e50; font-size: 1.2em; margin-bottom: 15px;">⏳ Pending Approvals (${queueItems.length})</h2>
          ${queueHTML}
          <a href="${process.env.APP_URL || 'https://jobapp.ai'}/joblist/auto-apply" style="color: #667eea; text-decoration: none; font-weight: 500;">
            Review Queue →
          </a>
        </div>
        `
            : ''
        }

        <!-- Stats Section -->
        <div style="background: #f0f4ff; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h3 style="margin: 0 0 15px 0; color: #2c3e50;">📊 This Week</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <p style="margin: 0; color: #7f8c8d; font-size: 0.9em;">Jobs Found</p>
              <p style="margin: 5px 0 0 0; font-size: 1.5em; font-weight: bold; color: #667eea;">—</p>
            </div>
            <div>
              <p style="margin: 0; color: #7f8c8d; font-size: 0.9em;">Applications Submitted</p>
              <p style="margin: 5px 0 0 0; font-size: 1.5em; font-weight: bold; color: #667eea;">—</p>
            </div>
          </div>
        </div>

        <!-- CTA Buttons -->
        <div style="text-align: center; margin-bottom: 30px;">
          <a href="${process.env.APP_URL || 'https://jobapp.ai'}/joblist/alerts" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; margin-right: 10px;">
            View All Alerts
          </a>
          <a href="${process.env.APP_URL || 'https://jobapp.ai'}/joblist/auto-apply" style="display: inline-block; background: #f0f4ff; color: #667eea; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
            Review Queue
          </a>
        </div>

        <!-- Footer -->
        <div style="text-align: center; border-top: 1px solid #eee; padding-top: 20px; color: #999; font-size: 0.9em;">
          <p>This email was sent because you have job alerts enabled. <a href="#" style="color: #667eea; text-decoration: none;">Manage preferences</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Build application confirmation HTML template
 */
function buildApplicationTemplate({ firstName, jobTitle, companyName, matchScore, appliedAt }) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; line-height: 1.6;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0 0 10px 0; color: #4ade80; font-size: 2em;">✅ Application Submitted!</h1>
          <p style="margin: 0; color: #7f8c8d;">Your application has been successfully sent</p>
        </div>

        <!-- Job Details -->
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin: 0 0 15px 0; color: #2c3e50;">${jobTitle}</h2>
          <p style="margin: 0 0 15px 0; color: #7f8c8d; font-size: 1.1em;">${companyName}</p>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <p style="margin: 0 0 5px 0; color: #7f8c8d; font-size: 0.9em;">Match Score</p>
              <p style="margin: 0; font-size: 1.5em; font-weight: bold; color: #667eea;">${matchScore}%</p>
            </div>
            <div>
              <p style="margin: 0 0 5px 0; color: #7f8c8d; font-size: 0.9em;">Applied</p>
              <p style="margin: 0; font-size: 1em; color: #2c3e50;">${new Date(appliedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <!-- What's Next -->
        <div style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 15px 0; color: #2c3e50;">📋 What's Included</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 8px;">✅ Tailored Cover Letter</li>
            <li style="margin-bottom: 8px;">✅ Job-Optimized Resume</li>
            <li>✅ Full Application Details Saved</li>
          </ul>
        </div>

        <!-- CTA Button -->
        <div style="text-align: center; margin-bottom: 30px;">
          <a href="${process.env.APP_URL || 'https://jobapp.ai'}/joblist" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
            View Application
          </a>
        </div>

        <!-- Footer -->
        <div style="text-align: center; border-top: 1px solid #eee; padding-top: 20px; color: #999; font-size: 0.9em;">
          <p>Good luck! We'll let you know if the company responds.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Get color for match score
 */
function getMatchScoreColor(score) {
  if (score >= 80) return '#4ade80'; // green
  if (score >= 60) return '#facc15'; // yellow
  return '#f97316'; // orange
}

/**
 * Fallback email sending via nodemailer (for development)
 */
async function sendViaNodemailer(to, subject, html) {
  // Only use if no SendGrid configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[DEV] Email would be sent to ${to}: ${subject}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'noreply@jobapp.ai',
    to,
    subject,
    html,
  });
}

export default {
  sendAlertDigest,
  sendApplicationConfirmation,
};
