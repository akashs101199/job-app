import { PrismaClient } from '@prisma/client';
import { logAgentAction } from './agentLog.service.js';
import { generateAlertsForUser } from './jobAlerts.service.js';
import { calculateMatchScore } from './matching.service.js';
import { generateCoverLetter } from './coverLetter.service.js';
import { tailorResumeContent } from './resumeTailor.service.js';

const prisma = new PrismaClient();

/**
 * Initialize auto-apply configuration for a user
 */
export async function initializeAutoApplyConfig(userId, initialSettings = {}) {
  try {
    const config = await prisma.autoApplyConfig.create({
      data: {
        userId,
        preferredRoles: initialSettings.preferredRoles || [],
        preferredLocations: initialSettings.preferredLocations || [],
        minMatchScore: initialSettings.minMatchScore || 70,
        maxApplicationsPerDay: initialSettings.maxApplicationsPerDay || 5,
        approvalMode: initialSettings.approvalMode || 'manual',
        autoApplyThreshold: initialSettings.autoApplyThreshold || 85,
        enabled: false,
        notifyOnQueue: initialSettings.notifyOnQueue !== false,
        notifyOnApply: initialSettings.notifyOnApply !== false,
      },
    });

    await logAgentAction(userId, 'auto_apply', 'config_initialized', { settings: initialSettings }, { configId: config.userId }, 'success');
    return config;
  } catch (error) {
    await logAgentAction(userId, 'auto_apply', 'config_initialize_failed', { settings: initialSettings }, null, 'error', error.message);
    throw error;
  }
}

/**
 * Get auto-apply configuration for a user
 */
export async function getAutoApplyConfig(userId) {
  try {
    let config = await prisma.autoApplyConfig.findUnique({
      where: { userId },
    });

    // If config doesn't exist, create with defaults
    if (!config) {
      config = await initializeAutoApplyConfig(userId);
    }

    return config;
  } catch (error) {
    console.error('Error fetching auto-apply config:', error);
    throw new Error('Failed to fetch auto-apply configuration');
  }
}

/**
 * Update auto-apply configuration
 */
export async function updateAutoApplyConfig(userId, updates) {
  try {
    // Ensure config exists
    let config = await prisma.autoApplyConfig.findUnique({
      where: { userId },
    });

    if (!config) {
      config = await initializeAutoApplyConfig(userId);
    }

    // Update config
    const updated = await prisma.autoApplyConfig.update({
      where: { userId },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    await logAgentAction(userId, 'auto_apply', 'config_updated', { updates }, { configId: userId }, 'success');
    return updated;
  } catch (error) {
    await logAgentAction(userId, 'auto_apply', 'config_update_failed', { updates }, null, 'error', error.message);
    throw error;
  }
}

/**
 * Disable auto-apply for a user
 */
export async function disableAutoApply(userId) {
  try {
    const updated = await prisma.autoApplyConfig.update({
      where: { userId },
      data: { enabled: false },
    });

    await logAgentAction(userId, 'auto_apply', 'disabled', {}, { configId: userId }, 'success');
    return updated;
  } catch (error) {
    await logAgentAction(userId, 'auto_apply', 'disable_failed', {}, null, 'error', error.message);
    throw error;
  }
}

/**
 * Main orchestration function: Check for new jobs and queue them
 * Steps:
 * 1. Load user config and preferences
 * 2. Generate alerts (discover jobs)
 * 3. Filter by minMatchScore
 * 4. Generate cover letters and tailor resumes
 * 5. Create queue entries
 * 6. Handle auto-apply threshold mode
 */
export async function checkAndQueueApplications(userId) {
  const summary = {
    discovered: 0,
    queued: 0,
    skipped: 0,
    autoApplied: 0,
    errors: 0,
    details: [],
  };

  try {
    // Step 1: Load config
    const config = await getAutoApplyConfig(userId);

    if (!config.enabled) {
      await logAgentAction(userId, 'auto_apply', 'check_skipped', {}, null, 'skipped', 'Auto-apply disabled');
      throw new Error('Auto-apply is not enabled');
    }

    // Step 2: Generate alerts (discover jobs)
    await logAgentAction(userId, 'auto_apply', 'discovery_started', {}, null, 'success');
    const alerts = await generateAlertsForUser(userId);

    if (!alerts || alerts.length === 0) {
      await logAgentAction(userId, 'auto_apply', 'discovery_completed', { jobsFound: 0 }, null, 'success');
      return summary;
    }

    summary.discovered = alerts.length;

    // Step 3: Get user data for content generation
    const user = await prisma.user.findUnique({
      where: { email: userId },
      include: {
        userResumes: { orderBy: { uploadedAt: 'desc' }, take: 1 },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const latestResume = user.userResumes[0];

    // Step 4: Check daily limit
    const dailyAppliedCount = await getDailyAppliedCount(userId);
    let remainingQuota = config.maxApplicationsPerDay - dailyAppliedCount;

    // Step 5: Process each job
    for (const alert of alerts) {
      try {
        if (remainingQuota <= 0) {
          summary.skipped++;
          summary.details.push({
            jobId: alert.jobId,
            jobTitle: alert.jobTitle,
            reason: 'Daily limit exceeded',
          });
          continue;
        }

        // Check if job already has a queue entry or application
        const existingQueue = await prisma.autoApplyQueue.findUnique({
          where: { userId_jobId: { userId, jobId: alert.jobId } },
        });

        if (existingQueue) {
          summary.skipped++;
          summary.details.push({
            jobId: alert.jobId,
            jobTitle: alert.jobTitle,
            reason: 'Already in queue',
          });
          continue;
        }

        // Check if already applied
        const existingApplication = await prisma.application.findUnique({
          where: { userId_jobListingId: { userId, jobListingId: alert.jobId } },
        });

        if (existingApplication) {
          summary.skipped++;
          summary.details.push({
            jobId: alert.jobId,
            jobTitle: alert.jobTitle,
            reason: 'Already applied',
          });
          continue;
        }

        // Generate cover letter and tailored resume
        const queueEntry = await generateQueueEntry(userId, alert, latestResume, user);

        if (queueEntry) {
          summary.queued++;

          // Check if should auto-apply based on threshold mode
          if (config.approvalMode === 'threshold' && alert.matchScore >= config.autoApplyThreshold) {
            await approveQueueItem(queueEntry.id, userId);
            summary.autoApplied++;
          } else if (config.approvalMode === 'automatic') {
            await approveQueueItem(queueEntry.id, userId);
            summary.autoApplied++;
          }

          remainingQuota--;

          summary.details.push({
            jobId: alert.jobId,
            jobTitle: alert.jobTitle,
            matchScore: alert.matchScore,
            queued: true,
          });
        }
      } catch (error) {
        summary.errors++;
        summary.details.push({
          jobId: alert.jobId,
          jobTitle: alert.jobTitle,
          error: error.message,
        });
        console.error(`Error processing job ${alert.jobId}:`, error);
      }
    }

    await logAgentAction(
      userId,
      'auto_apply',
      'check_and_queue_completed',
      { discovered: summary.discovered, queued: summary.queued },
      summary,
      'success'
    );

    return summary;
  } catch (error) {
    console.error('Error in checkAndQueueApplications:', error);
    await logAgentAction(userId, 'auto_apply', 'check_and_queue_failed', {}, null, 'error', error.message);
    throw error;
  }
}

/**
 * Generate queue entry with cover letter and tailored resume
 */
async function generateQueueEntry(userId, jobAlert, latestResume, user) {
  try {
    let coverLetter = '';
    let tailorSummary = '';
    let resumeContent = '';

    // Generate cover letter
    try {
      const coverLetterResult = await generateCoverLetter(
        {
          firstName: user.firstName,
          lastName: user.lastName,
          email: userId,
        },
        {
          jobTitle: jobAlert.jobTitle,
          companyName: jobAlert.companyName,
          description: jobAlert.jobLink,
        }
      );
      coverLetter = coverLetterResult.content || '';
    } catch (error) {
      console.error('Error generating cover letter:', error);
      await logAgentAction(
        userId,
        'auto_apply',
        'cover_letter_generation_failed',
        { jobId: jobAlert.jobId },
        null,
        'error',
        error.message
      );
      coverLetter = `Dear Hiring Manager,\n\nI am interested in the ${jobAlert.jobTitle} position at ${jobAlert.companyName}.\n\nBest regards`;
    }

    // Tailor resume if available
    if (latestResume) {
      try {
        const tailorResult = await tailorResumeContent(
          latestResume.rawText,
          `${jobAlert.jobTitle} at ${jobAlert.companyName}`,
          jobAlert.jobLink
        );
        resumeContent = tailorResult.tailoredContent || latestResume.rawText;
        tailorSummary = tailorResult.summary || '';
      } catch (error) {
        console.error('Error tailoring resume:', error);
        await logAgentAction(
          userId,
          'auto_apply',
          'resume_tailor_failed',
          { jobId: jobAlert.jobId },
          null,
          'error',
          error.message
        );
        resumeContent = latestResume.rawText;
      }
    } else {
      resumeContent = '';
    }

    // Create queue entry
    const queueEntry = await prisma.autoApplyQueue.create({
      data: {
        userId,
        jobId: jobAlert.jobId,
        jobTitle: jobAlert.jobTitle,
        companyName: jobAlert.companyName,
        jobLink: jobAlert.jobLink,
        matchScore: jobAlert.matchScore,
        coverLetter,
        resumeContent,
        tailorSummary,
        status: 'pending',
      },
    });

    await logAgentAction(
      userId,
      'auto_apply',
      'queue_entry_created',
      { jobId: jobAlert.jobId },
      { queueId: queueEntry.id },
      'success'
    );

    return queueEntry;
  } catch (error) {
    console.error('Error generating queue entry:', error);
    await logAgentAction(
      userId,
      'auto_apply',
      'queue_entry_creation_failed',
      { jobId: jobAlert.jobId },
      null,
      'error',
      error.message
    );
    throw error;
  }
}

/**
 * Approve a queue item and apply to the job
 */
export async function approveQueueItem(queueId, userId) {
  try {
    // Update queue status
    const updated = await prisma.autoApplyQueue.update({
      where: { id: queueId },
      data: {
        status: 'approved',
        approvedAt: new Date(),
      },
    });

    // Apply to job (create Application record)
    await applyToJob(queueId, userId);

    return updated;
  } catch (error) {
    console.error('Error approving queue item:', error);
    await logAgentAction(userId, 'auto_apply', 'approval_failed', { queueId }, null, 'error', error.message);
    throw error;
  }
}

/**
 * Reject a queue item
 */
export async function rejectQueueItem(queueId, userId, reason = '') {
  try {
    const updated = await prisma.autoApplyQueue.update({
      where: { id: queueId },
      data: {
        status: 'rejected',
        rejectionReason: reason,
      },
    });

    await logAgentAction(userId, 'auto_apply', 'queue_rejected', { queueId, reason }, { queueId }, 'success');
    return updated;
  } catch (error) {
    await logAgentAction(userId, 'auto_apply', 'rejection_failed', { queueId }, null, 'error', error.message);
    throw error;
  }
}

/**
 * Apply to job: create Application record with generated content
 */
async function applyToJob(queueId, userId) {
  try {
    const queueItem = await prisma.autoApplyQueue.findUnique({
      where: { id: queueId },
    });

    if (!queueItem) {
      throw new Error('Queue item not found');
    }

    // Create Application record
    await prisma.application.create({
      data: {
        userId,
        jobListingId: queueItem.jobId,
        jobName: queueItem.jobTitle,
        companyName: queueItem.companyName,
        jobLink: queueItem.jobLink,
        status: 'Applied',
        dateApplied: new Date(),
      },
    });

    // Update queue item status
    await prisma.autoApplyQueue.update({
      where: { id: queueId },
      data: {
        status: 'applied',
        appliedAt: new Date(),
      },
    });

    await logAgentAction(
      userId,
      'auto_apply',
      'application_created',
      { queueId },
      { jobId: queueItem.jobId, jobTitle: queueItem.jobTitle },
      'success'
    );
  } catch (error) {
    console.error('Error creating application:', error);
    await logAgentAction(userId, 'auto_apply', 'application_creation_failed', { queueId }, null, 'error', error.message);
    throw error;
  }
}

/**
 * Get queue for user with filtering
 */
export async function getQueueForUser(userId, filter = 'pending', limit = 50, offset = 0) {
  try {
    const where = { userId };

    if (filter && filter !== 'all') {
      where.status = filter;
    }

    const queue = await prisma.autoApplyQueue.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.autoApplyQueue.count({ where });

    return {
      items: queue,
      total,
      limit,
      offset,
    };
  } catch (error) {
    console.error('Error fetching queue:', error);
    throw new Error('Failed to fetch queue');
  }
}

/**
 * Get auto-apply statistics for user
 */
export async function getAutoApplyStats(userId) {
  try {
    const [totalQueued, totalApproved, totalApplied, totalRejected, dailyAppliedCount] = await Promise.all([
      prisma.autoApplyQueue.count({
        where: { userId, status: { in: ['pending', 'approved'] } },
      }),
      prisma.autoApplyQueue.count({
        where: { userId, status: 'approved' },
      }),
      prisma.autoApplyQueue.count({
        where: { userId, status: 'applied' },
      }),
      prisma.autoApplyQueue.count({
        where: { userId, status: 'rejected' },
      }),
      getDailyAppliedCount(userId),
    ]);

    return {
      totalQueued,
      totalApproved,
      totalApplied,
      totalRejected,
      dailyAppliedCount,
    };
  } catch (error) {
    console.error('Error getting auto-apply stats:', error);
    throw new Error('Failed to get statistics');
  }
}

/**
 * Get count of applications created today
 */
export async function getDailyAppliedCount(userId) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const count = await prisma.application.count({
      where: {
        userId,
        dateApplied: {
          gte: today,
        },
      },
    });

    return count;
  } catch (error) {
    console.error('Error getting daily applied count:', error);
    return 0;
  }
}

export default {
  initializeAutoApplyConfig,
  getAutoApplyConfig,
  updateAutoApplyConfig,
  disableAutoApply,
  checkAndQueueApplications,
  approveQueueItem,
  rejectQueueItem,
  getQueueForUser,
  getAutoApplyStats,
  getDailyAppliedCount,
};
