import prisma from '../../config/prisma.js';
import * as emailService from '../email/emailService.js';
import * as emailTemplateService from '../email/emailTemplate.service.js';

/**
 * Notification Service
 * Manages user notification preferences and notification delivery
 */

const DEFAULT_PREFERENCES = {
  dailyAlertDigest: true,
  dailyAlertTime: '18:00',
  weeklyDigest: true,
  weeklyDigestDay: 'sunday',
  weeklyDigestTime: '09:00',
  autoApplyConfirm: true,
  interviewNotif: true,
  followUpReminder: true,
  weeklyStats: true,
  milestoneNotif: true,
  actionRequired: true,
  emailGrouping: 'digest',
  contentLevel: 'detailed',
  unsubscribedTypes: [],
  globalOptOut: false,
};

/**
 * Get user's notification preferences
 * @param {string} userId
 * @returns {Promise<NotificationPreference>}
 */
export async function getNotificationPreferences(userId) {
  let prefs = await prisma.notificationPreference.findUnique({
    where: { userId },
  });

  if (!prefs) {
    // Create with defaults
    prefs = await initializeNotificationPreferences(userId);
  }

  return prefs;
}

/**
 * Initialize notification preferences with defaults
 * @param {string} userId
 * @returns {Promise<NotificationPreference>}
 */
export async function initializeNotificationPreferences(userId) {
  return prisma.notificationPreference.create({
    data: {
      userId,
      ...DEFAULT_PREFERENCES,
    },
  });
}

/**
 * Update notification preferences
 * @param {string} userId
 * @param {object} updates
 * @returns {Promise<NotificationPreference>}
 */
export async function updateNotificationPreferences(userId, updates) {
  // Validate boolean fields
  const validBoolFields = [
    'dailyAlertDigest',
    'weeklyDigest',
    'autoApplyConfirm',
    'interviewNotif',
    'followUpReminder',
    'weeklyStats',
    'milestoneNotif',
    'actionRequired',
    'globalOptOut',
  ];

  const validStringFields = ['dailyAlertTime', 'weeklyDigestDay', 'weeklyDigestTime', 'emailGrouping', 'contentLevel'];

  const sanitized = {};
  for (const key in updates) {
    if (validBoolFields.includes(key)) {
      sanitized[key] = Boolean(updates[key]);
    } else if (validStringFields.includes(key)) {
      sanitized[key] = String(updates[key]);
    } else if (key === 'unsubscribedTypes') {
      // Handle array of unsubscribed types
      sanitized[key] = Array.isArray(updates[key]) ? updates[key] : [];
    }
  }

  return prisma.notificationPreference.upsert({
    where: { userId },
    update: sanitized,
    create: {
      userId,
      ...DEFAULT_PREFERENCES,
      ...sanitized,
    },
  });
}

/**
 * Check if user should receive a specific notification type
 * @param {string} userId
 * @param {string} notificationType - e.g., "daily_digest", "auto_apply_confirmation"
 * @returns {Promise<boolean>}
 */
export async function shouldSendNotification(userId, notificationType) {
  const prefs = await getNotificationPreferences(userId);

  // Check global opt-out
  if (prefs.globalOptOut) {
    return false;
  }

  // Check if unsubscribed from this type
  const unsubscribedTypes = Array.isArray(prefs.unsubscribedTypes) ? prefs.unsubscribedTypes : [];
  if (unsubscribedTypes.includes(notificationType)) {
    return false;
  }

  // Check type-specific preference
  const notificationMap = {
    daily_digest: 'dailyAlertDigest',
    weekly_digest: 'weeklyDigest',
    auto_apply_confirmation: 'autoApplyConfirm',
    interview_scheduled: 'interviewNotif',
    follow_up_reminder: 'followUpReminder',
    weekly_stats: 'weeklyStats',
    milestone_achievement: 'milestoneNotif',
    action_required: 'actionRequired',
  };

  const prefKey = notificationMap[notificationType];
  if (prefKey && prefs[prefKey] === false) {
    return false;
  }

  return true;
}

/**
 * Queue a notification for sending
 * @param {string} userId
 * @param {string} notificationType
 * @param {object} data - Template variables
 * @returns {Promise<{ success: boolean, logId: number, message: string }>}
 */
export async function queueNotification(userId, notificationType, data) {
  try {
    // Check if user should receive this notification
    if (!(await shouldSendNotification(userId, notificationType))) {
      return {
        success: false,
        message: `User has opted out of ${notificationType} notifications`,
      };
    }

    // Get user email
    const user = await prisma.user.findUnique({
      where: { email: userId },
      select: { email: true, firstName: true },
    });

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    // Prepare template data with defaults
    const templateData = {
      userName: user.firstName || 'there',
      unsubscribeUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/notifications/unsubscribe?type=${notificationType}`,
      preferencesUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings/notifications`,
      ...data,
    };

    // Validate and render template
    await emailTemplateService.validateTemplateData(notificationType, templateData);
    const rendered = await emailTemplateService.renderTemplate(notificationType, templateData);

    // Send email via emailService
    const sendResult = await emailService.sendEmailWithTemplate(
      userId,
      {
        to: user.email,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      },
      notificationType
    );

    // Log to database
    const emailLog = await prisma.emailLog.create({
      data: {
        userId,
        notificationType,
        subject: rendered.subject,
        recipients: [user.email],
        metadata: {
          ...data,
          messageId: sendResult.messageId,
        },
      },
    });

    // Update metrics
    await incrementEmailMetric(notificationType, 'sent');

    return {
      success: true,
      logId: emailLog.id,
      message: `${notificationType} notification queued for ${user.email}`,
    };
  } catch (error) {
    console.error(`Error queuing notification for ${userId}:`, error);
    return {
      success: false,
      message: error.message,
    };
  }
}

/**
 * Unsubscribe from a notification type
 * @param {string} userId
 * @param {string} notificationType
 * @returns {Promise<NotificationPreference>}
 */
export async function unsubscribeFromType(userId, notificationType) {
  const prefs = await getNotificationPreferences(userId);
  const unsubscribedTypes = Array.isArray(prefs.unsubscribedTypes) ? prefs.unsubscribedTypes : [];

  if (!unsubscribedTypes.includes(notificationType)) {
    unsubscribedTypes.push(notificationType);
  }

  return updateNotificationPreferences(userId, {
    unsubscribedTypes,
  });
}

/**
 * Re-subscribe to a notification type
 * @param {string} userId
 * @param {string} notificationType
 * @returns {Promise<NotificationPreference>}
 */
export async function resubscribeToType(userId, notificationType) {
  const prefs = await getNotificationPreferences(userId);
  let unsubscribedTypes = Array.isArray(prefs.unsubscribedTypes) ? prefs.unsubscribedTypes : [];

  unsubscribedTypes = unsubscribedTypes.filter(t => t !== notificationType);

  return updateNotificationPreferences(userId, {
    unsubscribedTypes,
  });
}

/**
 * Get email logs for user
 * @param {string} userId
 * @param {string} notificationType - optional filter
 * @param {number} limit
 * @param {number} offset
 * @returns {Promise<{ logs: array, total: number }>}
 */
export async function getEmailLogs(userId, notificationType, limit = 50, offset = 0) {
  const where = { userId };
  if (notificationType) {
    where.notificationType = notificationType;
  }

  const [logs, total] = await Promise.all([
    prisma.emailLog.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.emailLog.count({ where }),
  ]);

  return { logs, total };
}

/**
 * Get metrics for a notification type
 * @param {string} notificationType
 * @returns {Promise<EmailMetrics>}
 */
export async function getNotificationMetrics(notificationType) {
  let metrics = await prisma.emailMetrics.findUnique({
    where: { notificationType },
  });

  if (!metrics) {
    // Create empty metrics if not exists
    metrics = await prisma.emailMetrics.create({
      data: { notificationType },
    });
  }

  return metrics;
}

/**
 * Update metrics from SendGrid webhook
 * @param {number} emailLogId
 * @param {string} event - "delivered" | "open" | "click" | "bounce"
 * @returns {Promise<void>}
 */
export async function updateMetricsFromWebhook(emailLogId, event) {
  const emailLog = await prisma.emailLog.findUnique({
    where: { id: emailLogId },
  });

  if (!emailLog) {
    console.warn(`Email log not found: ${emailLogId}`);
    return;
  }

  const update = {};
  const metricUpdate = {};

  switch (event) {
    case 'delivered':
      update.deliveredAt = new Date();
      metricUpdate.delivered = { increment: 1 };
      break;
    case 'open':
      update.opens = { increment: 1 };
      metricUpdate.opened = { increment: 1 };
      break;
    case 'click':
      update.clicks = { increment: 1 };
      metricUpdate.clicked = { increment: 1 };
      break;
    case 'bounce':
      update.failedAt = new Date();
      update.failureReason = 'Bounced';
      metricUpdate.bounced = { increment: 1 };
      break;
    default:
      return;
  }

  // Update email log
  await prisma.emailLog.update({
    where: { id: emailLogId },
    data: update,
  });

  // Update metrics
  await updateEmailMetrics(emailLog.notificationType, metricUpdate);
}

/**
 * Increment email metric
 * @param {string} notificationType
 * @param {string} metric - "sent" | "delivered" | "opened" | "clicked" | "bounced"
 * @returns {Promise<EmailMetrics>}
 */
async function incrementEmailMetric(notificationType, metric) {
  const metricMap = {
    sent: { sent: { increment: 1 } },
    delivered: { delivered: { increment: 1 } },
    opened: { opened: { increment: 1 } },
    clicked: { clicked: { increment: 1 } },
    bounced: { bounced: { increment: 1 } },
  };

  return updateEmailMetrics(notificationType, metricMap[metric] || {});
}

/**
 * Update email metrics
 * @param {string} notificationType
 * @param {object} updates
 * @returns {Promise<EmailMetrics>}
 */
async function updateEmailMetrics(notificationType, updates) {
  const metrics = await getNotificationMetrics(notificationType);

  // Calculate rates
  const delivered = (metrics.delivered || 0) + (updates.delivered?.increment || 0);
  const opened = (metrics.opened || 0) + (updates.opened?.increment || 0);
  const clicked = (metrics.clicked || 0) + (updates.clicked?.increment || 0);
  const sent = (metrics.sent || 0) + (updates.sent?.increment || 0);

  const openRate = sent > 0 ? (opened / sent) * 100 : 0;
  const clickRate = sent > 0 ? (clicked / sent) * 100 : 0;
  const bounceRate = sent > 0 ? ((metrics.bounced || 0) / sent) * 100 : 0;

  return prisma.emailMetrics.upsert({
    where: { notificationType },
    update: {
      ...updates,
      openRate: parseFloat(openRate.toFixed(2)),
      clickRate: parseFloat(clickRate.toFixed(2)),
      bounceRate: parseFloat(bounceRate.toFixed(2)),
    },
    create: {
      notificationType,
      ...updates,
      openRate: parseFloat(openRate.toFixed(2)),
      clickRate: parseFloat(clickRate.toFixed(2)),
      bounceRate: parseFloat(bounceRate.toFixed(2)),
    },
  });
}

/**
 * Get all notification preferences for users
 * (For batch operations)
 * @returns {Promise<array>}
 */
export async function getAllNotificationPreferences() {
  return prisma.notificationPreference.findMany();
}

/**
 * Generate unsubscribe token
 * @param {string} userId
 * @param {string} notificationType
 * @returns {string} Encoded token
 */
export function generateUnsubscribeToken(userId, notificationType) {
  // Use base64 encoding for unsubscribe token
  const data = `${userId}::${notificationType}::${Date.now()}`;
  return Buffer.from(data).toString('base64');
}

/**
 * Decode unsubscribe token
 * @param {string} token
 * @returns {object} { userId, notificationType }
 */
export function decodeUnsubscribeToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [userId, notificationType] = decoded.split('::');
    return { userId, notificationType };
  } catch (error) {
    throw new Error('Invalid unsubscribe token');
  }
}
