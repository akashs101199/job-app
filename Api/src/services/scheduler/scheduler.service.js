import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { logAgentAction } from '../ai/agentLog.service.js';
import { generateAlertsForUser } from '../ai/jobAlerts.service.js';
import { checkAndQueueApplications } from '../ai/autoApply.service.js';
import { sendAlertDigest } from '../email/emailService.js';

const prisma = new PrismaClient();

class Scheduler {
  constructor() {
    this.jobs = new Map(); // userId -> { alertCheck, autoApply, emailDigest }
    this.isInitialized = false;
  }

  /**
   * Initialize scheduler on application startup
   * Loads all users with scheduler enabled and registers their jobs
   */
  async initializeScheduler() {
    try {
      if (this.isInitialized) {
        console.log('Scheduler already initialized');
        return;
      }

      console.log('🕐 Initializing background scheduler...');

      // Load all users with scheduler configuration
      const configs = await prisma.schedulerConfig.findMany({
        include: { user: true },
      });

      console.log(`Found ${configs.length} users with scheduler enabled`);

      let registeredCount = 0;

      // Register jobs for each user
      for (const config of configs) {
        try {
          await this.registerUserJobs(config.userId, config);
          registeredCount++;
        } catch (error) {
          console.error(`Error registering jobs for user ${config.userId}:`, error);
        }
      }

      console.log(`✅ Scheduler initialized: ${registeredCount}/${configs.length} users registered`);
      this.isInitialized = true;

      await logAgentAction(
        'system',
        'scheduler',
        'initialization',
        { usersCount: configs.length },
        { registered: registeredCount },
        'success'
      );
    } catch (error) {
      console.error('Error initializing scheduler:', error);
      await logAgentAction('system', 'scheduler', 'initialization_failed', {}, null, 'error', error.message);
    }
  }

  /**
   * Register cron jobs for a specific user
   */
  async registerUserJobs(userId, config) {
    // Cancel existing jobs if any
    if (this.jobs.has(userId)) {
      this.unregisterUserJobs(userId);
    }

    const userJobs = {};

    // Alert Check Job
    if (config.alertCheckEnabled) {
      const cronExpression = this.getCronExpression(
        config.alertCheckTime,
        config.alertCheckFrequency,
        config.timezone
      );

      const job = cron.schedule(cronExpression, async () => {
        await this.executeAlertCheckJob(userId, config);
      });

      userJobs.alertCheck = job;
      console.log(`📨 Alert check scheduled for user ${userId}: ${cronExpression}`);
    }

    // Auto-Apply Job
    if (config.autoApplyEnabled) {
      const cronExpression = this.getCronExpression(
        config.autoApplyTime,
        config.autoApplyFrequency,
        config.timezone
      );

      const job = cron.schedule(cronExpression, async () => {
        await this.executeAutoApplyJob(userId, config);
      });

      userJobs.autoApply = job;
      console.log(`🤖 Auto-apply scheduled for user ${userId}: ${cronExpression}`);
    }

    // Email Digest Job
    if (config.emailDigestEnabled) {
      const cronExpression = this.getCronExpression(
        config.emailDigestTime,
        config.emailDigestFrequency,
        config.timezone
      );

      const job = cron.schedule(cronExpression, async () => {
        await this.executeEmailDigestJob(userId, config);
      });

      userJobs.emailDigest = job;
      console.log(`📧 Email digest scheduled for user ${userId}: ${cronExpression}`);
    }

    this.jobs.set(userId, userJobs);
  }

  /**
   * Unregister (stop) all jobs for a user
   */
  unregisterUserJobs(userId) {
    const userJobs = this.jobs.get(userId);

    if (!userJobs) return;

    if (userJobs.alertCheck) userJobs.alertCheck.stop();
    if (userJobs.autoApply) userJobs.autoApply.stop();
    if (userJobs.emailDigest) userJobs.emailDigest.stop();

    this.jobs.delete(userId);
    console.log(`Unregistered jobs for user ${userId}`);
  }

  /**
   * Execute alert check job
   */
  async executeAlertCheckJob(userId, config) {
    const scheduledFor = new Date();

    try {
      console.log(`⏳ Executing alert check for user ${userId}...`);

      const alerts = await generateAlertsForUser(userId);

      const result = {
        success: true,
        jobsFound: alerts ? alerts.length : 0,
      };

      await this.logCronExecution(userId, 'alert_check', scheduledFor, result);
      await this.updateLastExecution(userId, 'alert_check');

      console.log(`✅ Alert check completed for user ${userId}: ${result.jobsFound} alerts`);
    } catch (error) {
      console.error(`Error executing alert check for user ${userId}:`, error);

      const result = {
        success: false,
        error: error.message,
      };

      await this.logCronExecution(userId, 'alert_check', scheduledFor, result);
    }
  }

  /**
   * Execute auto-apply job
   */
  async executeAutoApplyJob(userId, config) {
    const scheduledFor = new Date();

    try {
      console.log(`⏳ Executing auto-apply for user ${userId}...`);

      const summary = await checkAndQueueApplications(userId);

      const result = {
        success: true,
        discovered: summary.discovered,
        queued: summary.queued,
        autoApplied: summary.autoApplied,
        errors: summary.errors,
      };

      await this.logCronExecution(userId, 'auto_apply', scheduledFor, result);
      await this.updateLastExecution(userId, 'auto_apply');

      console.log(
        `✅ Auto-apply completed for user ${userId}: discovered ${result.discovered}, queued ${result.queued}`
      );
    } catch (error) {
      console.error(`Error executing auto-apply for user ${userId}:`, error);

      const result = {
        success: false,
        error: error.message,
      };

      await this.logCronExecution(userId, 'auto_apply', scheduledFor, result);
    }
  }

  /**
   * Execute email digest job
   */
  async executeEmailDigestJob(userId, config) {
    const scheduledFor = new Date();

    try {
      console.log(`⏳ Executing email digest for user ${userId}...`);

      await sendAlertDigest(userId);

      const result = {
        success: true,
        emailsSent: 1,
      };

      await this.logCronExecution(userId, 'email_digest', scheduledFor, result);
      await this.updateLastExecution(userId, 'email_digest');

      console.log(`✅ Email digest sent for user ${userId}`);
    } catch (error) {
      console.error(`Error executing email digest for user ${userId}:`, error);

      const result = {
        success: false,
        error: error.message,
      };

      await this.logCronExecution(userId, 'email_digest', scheduledFor, result);
    }
  }

  /**
   * Log cron execution to database
   */
  async logCronExecution(userId, jobType, scheduledFor, result) {
    try {
      await prisma.cronLog.create({
        data: {
          userId,
          jobType,
          scheduledFor,
          executedAt: new Date(),
          status: result.success ? 'success' : 'failure',
          message: result.error || null,
          result: result,
        },
      });
    } catch (error) {
      console.error('Error logging cron execution:', error);
    }
  }

  /**
   * Update last execution timestamp
   */
  async updateLastExecution(userId, jobType) {
    try {
      const updateData = {};

      if (jobType === 'alert_check') updateData.lastAlertCheckAt = new Date();
      else if (jobType === 'auto_apply') updateData.lastAutoApplyAt = new Date();
      else if (jobType === 'email_digest') updateData.lastEmailDigestAt = new Date();

      await prisma.schedulerConfig.update({
        where: { userId },
        data: updateData,
      });
    } catch (error) {
      console.error('Error updating last execution:', error);
    }
  }

  /**
   * Get cron expression from frequency and time
   * Converts user timezone to UTC
   */
  getCronExpression(time, frequency, timezone) {
    const [hours, minutes] = time.split(':').map(Number);

    // Convert timezone to UTC offset (simplified - use library in production)
    const utcHours = this.convertToUTC(hours, timezone);

    switch (frequency) {
      case 'hourly':
        return `${minutes} * * * *`; // Every hour at :MM
      case 'daily':
        return `${minutes} ${utcHours} * * *`; // Daily at HH:MM UTC
      case 'weekly':
        return `${minutes} ${utcHours} * * 1`; // Monday at HH:MM UTC
      default:
        return `${minutes} ${utcHours} * * *`;
    }
  }

  /**
   * Simple timezone to UTC conversion
   * In production, use timezone-support library
   */
  convertToUTC(hours, timezone) {
    // Simplified mapping - use full library in production
    const offsets = {
      'America/New_York': -5, // EST
      'America/Chicago': -6, // CST
      'America/Denver': -7, // MST
      'America/Los_Angeles': -8, // PST
      'Europe/London': 0, // GMT
      'Europe/Paris': 1, // CET
      'Asia/Tokyo': 9, // JST
    };

    const offset = offsets[timezone] || 0;
    return (hours - offset + 24) % 24;
  }

  /**
   * Get scheduler configuration for a user
   */
  async getSchedulerConfig(userId) {
    try {
      let config = await prisma.schedulerConfig.findUnique({
        where: { userId },
      });

      // Create with defaults if doesn't exist
      if (!config) {
        config = await prisma.schedulerConfig.create({
          data: { userId },
        });
      }

      return config;
    } catch (error) {
      console.error('Error getting scheduler config:', error);
      throw new Error('Failed to fetch scheduler configuration');
    }
  }

  /**
   * Update scheduler configuration and re-register jobs
   */
  async updateSchedulerConfig(userId, updates) {
    try {
      const updated = await prisma.schedulerConfig.update({
        where: { userId },
        data: updates,
      });

      // Re-register jobs with new config
      await this.registerUserJobs(userId, updated);

      return updated;
    } catch (error) {
      console.error('Error updating scheduler config:', error);
      throw new Error('Failed to update scheduler configuration');
    }
  }

  /**
   * Get cron execution logs for a user
   */
  async getCronLogs(userId, jobType = null, limit = 50, offset = 0) {
    try {
      const where = { userId };
      if (jobType) where.jobType = jobType;

      const logs = await prisma.cronLog.findMany({
        where,
        orderBy: { executedAt: 'desc' },
        take: limit,
        skip: offset,
      });

      const total = await prisma.cronLog.count({ where });

      return {
        items: logs,
        total,
        limit,
        offset,
      };
    } catch (error) {
      console.error('Error fetching cron logs:', error);
      throw new Error('Failed to fetch cron logs');
    }
  }

  /**
   * Manually trigger a scheduled job
   */
  async manuallyTriggerJob(userId, jobType) {
    try {
      const config = await this.getSchedulerConfig(userId);

      if (jobType === 'alert_check') {
        return await this.executeAlertCheckJob(userId, config);
      } else if (jobType === 'auto_apply') {
        return await this.executeAutoApplyJob(userId, config);
      } else if (jobType === 'email_digest') {
        return await this.executeEmailDigestJob(userId, config);
      } else {
        throw new Error(`Unknown job type: ${jobType}`);
      }
    } catch (error) {
      console.error(`Error manually triggering ${jobType}:`, error);
      throw error;
    }
  }

  /**
   * Pause a scheduled job for a user
   */
  async pauseJob(userId, jobType) {
    try {
      const userJobs = this.jobs.get(userId);

      if (!userJobs) {
        throw new Error(`No jobs registered for user ${userId}`);
      }

      const jobKey = jobType.replace('_', '').replace(/([A-Z])/g, (match) => match.toLowerCase());

      if (jobType === 'alert_check' && userJobs.alertCheck) {
        userJobs.alertCheck.stop();
      } else if (jobType === 'auto_apply' && userJobs.autoApply) {
        userJobs.autoApply.stop();
      } else if (jobType === 'email_digest' && userJobs.emailDigest) {
        userJobs.emailDigest.stop();
      } else {
        throw new Error(`Job ${jobType} not found or not running`);
      }

      console.log(`⏸️  Job ${jobType} paused for user ${userId}`);
    } catch (error) {
      console.error(`Error pausing job ${jobType}:`, error);
      throw error;
    }
  }
}

// Singleton instance
let schedulerInstance = null;

export function getScheduler() {
  if (!schedulerInstance) {
    schedulerInstance = new Scheduler();
  }
  return schedulerInstance;
}

export default {
  getScheduler,
  Scheduler,
};
