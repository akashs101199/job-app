const prisma = require('../../config/prisma');
const { Anthropic } = require('@anthropic-ai/sdk');
const { getFollowUpPrompts } = require('./prompts/followUp.prompt');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Find applications that are stale and need follow-ups
 * Criteria: Applied status, 7+ days old, no recent updates
 * @param {string} userId - User email
 * @returns {Promise<Array>} Array of stale applications
 */
async function getStaleApplications(userId) {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const staleApplications = await prisma.application.findMany({
      where: {
        userId,
        status: 'Applied',
        dateApplied: {
          lte: sevenDaysAgo,
        },
        OR: [
          {
            dateUpdated: null,
          },
          {
            dateUpdated: {
              lte: sevenDaysAgo,
            },
          },
        ],
      },
      orderBy: {
        dateApplied: 'asc',
      },
    });

    return staleApplications;
  } catch (error) {
    console.error('Error fetching stale applications:', error);
    throw error;
  }
}

/**
 * Get existing follow-ups for an application to determine count
 * @param {string} userId - User email
 * @param {string} jobListingId - Job listing ID
 * @returns {Promise<number>} Number of existing follow-ups
 */
async function getFollowUpCount(userId, jobListingId) {
  try {
    const count = await prisma.followUp.countWhere({
      userId,
      jobListingId,
      status: { in: ['approved', 'sent'] },
    });

    return count + 1; // Next follow-up number
  } catch (error) {
    console.error('Error getting follow-up count:', error);
    return 1; // Default to first follow-up
  }
}

/**
 * Generate follow-up email draft using Claude
 * @param {Object} user - User profile {firstName, lastName, email}
 * @param {Object} application - Application {jobTitle, companyName, dateApplied}
 * @param {number} followUpCount - Which follow-up this is (1, 2, or 3)
 * @returns {Promise<Object>} {subject, body, metadata}
 */
async function generateFollowUpEmail(user, application, followUpCount = 1) {
  try {
    const prompts = getFollowUpPrompts();
    let prompt;

    if (followUpCount === 1) {
      prompt = prompts.firstFollowUp(user, application.companyName, application.jobTitle);
    } else if (followUpCount === 2) {
      prompt = prompts.secondFollowUp(user, application.companyName, application.jobTitle);
    } else {
      prompt = prompts.thirdFollowUp(user, application.companyName, application.jobTitle);
    }

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-6-20250805',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude API');
    }

    // Parse the response - expecting JSON format
    let emailData;
    try {
      emailData = JSON.parse(content.text);
    } catch (e) {
      // Fallback: extract from text format
      emailData = {
        subject: `Follow-up: ${application.jobTitle} position at ${application.companyName}`,
        body: content.text,
      };
    }

    return {
      subject: emailData.subject || `Follow-up: ${application.jobTitle} at ${application.companyName}`,
      body: emailData.body || content.text,
      metadata: {
        followUpCount,
        generationTimeMs: response.usage ? response.usage.input_tokens : 0,
        model: 'claude-opus-4-6-20250805',
      },
    };
  } catch (error) {
    console.error('Error generating follow-up email:', error);
    throw error;
  }
}

/**
 * Create follow-up suggestion in database
 * @param {string} userId - User email
 * @param {Object} application - Application details
 * @param {Object} emailDraft - {subject, body, metadata}
 * @param {number} followUpCount - Which follow-up this is
 * @returns {Promise<Object>} Created FollowUp record
 */
async function createFollowUpSuggestion(userId, application, emailDraft, followUpCount = 1) {
  try {
    const followUp = await prisma.followUp.create({
      data: {
        userId,
        jobListingId: application.jobListingId,
        jobTitle: application.jobName || application.jobTitle,
        companyName: application.companyName,
        emailSubject: emailDraft.subject,
        emailBody: emailDraft.body,
        followUpCount,
        status: 'pending',
        dismissed: false,
      },
    });

    return followUp;
  } catch (error) {
    console.error('Error creating follow-up suggestion:', error);
    throw error;
  }
}

/**
 * Get pending follow-ups for a user
 * @param {string} userId - User email
 * @param {number} limit - Maximum number to return
 * @returns {Promise<Array>} Array of pending follow-ups
 */
async function getPendingFollowUps(userId, limit = 10) {
  try {
    const followUps = await prisma.followUp.findMany({
      where: {
        userId,
        status: 'pending',
        dismissed: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return followUps;
  } catch (error) {
    console.error('Error fetching pending follow-ups:', error);
    throw error;
  }
}

/**
 * Get all follow-ups for a user (all statuses)
 * @param {string} userId - User email
 * @param {number} limit - Maximum number to return
 * @returns {Promise<Array>} Array of follow-ups
 */
async function getAllFollowUps(userId, limit = 50) {
  try {
    const followUps = await prisma.followUp.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return followUps;
  } catch (error) {
    console.error('Error fetching all follow-ups:', error);
    throw error;
  }
}

/**
 * Approve a follow-up (mark as ready to send)
 * @param {number} followUpId - Follow-up ID
 * @param {string} userId - User email (for verification)
 * @returns {Promise<Object>} Updated follow-up
 */
async function approveFollowUp(followUpId, userId) {
  try {
    const followUp = await prisma.followUp.update({
      where: { id: followUpId },
      data: {
        status: 'approved',
        updatedAt: new Date(),
      },
    });

    // Verify ownership
    if (followUp.userId !== userId) {
      throw new Error('Unauthorized: This follow-up does not belong to you');
    }

    return followUp;
  } catch (error) {
    console.error('Error approving follow-up:', error);
    throw error;
  }
}

/**
 * Mark follow-up as sent
 * @param {number} followUpId - Follow-up ID
 * @param {string} userId - User email (for verification)
 * @returns {Promise<Object>} Updated follow-up
 */
async function markFollowUpAsSent(followUpId, userId) {
  try {
    const followUp = await prisma.followUp.update({
      where: { id: followUpId },
      data: {
        status: 'sent',
        sentAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Verify ownership
    if (followUp.userId !== userId) {
      throw new Error('Unauthorized: This follow-up does not belong to you');
    }

    return followUp;
  } catch (error) {
    console.error('Error marking follow-up as sent:', error);
    throw error;
  }
}

/**
 * Dismiss a follow-up (user doesn't want it)
 * @param {number} followUpId - Follow-up ID
 * @param {string} userId - User email (for verification)
 * @returns {Promise<Object>} Updated follow-up
 */
async function dismissFollowUp(followUpId, userId) {
  try {
    const followUp = await prisma.followUp.update({
      where: { id: followUpId },
      data: {
        dismissed: true,
        updatedAt: new Date(),
      },
    });

    // Verify ownership
    if (followUp.userId !== userId) {
      throw new Error('Unauthorized: This follow-up does not belong to you');
    }

    return followUp;
  } catch (error) {
    console.error('Error dismissing follow-up:', error);
    throw error;
  }
}

/**
 * Update follow-up email before sending
 * @param {number} followUpId - Follow-up ID
 * @param {string} userId - User email (for verification)
 * @param {Object} updates - {emailSubject, emailBody}
 * @returns {Promise<Object>} Updated follow-up
 */
async function updateFollowUpEmail(followUpId, userId, updates) {
  try {
    const followUp = await prisma.followUp.update({
      where: { id: followUpId },
      data: {
        emailSubject: updates.emailSubject || undefined,
        emailBody: updates.emailBody || undefined,
        updatedAt: new Date(),
      },
    });

    // Verify ownership
    if (followUp.userId !== userId) {
      throw new Error('Unauthorized: This follow-up does not belong to you');
    }

    return followUp;
  } catch (error) {
    console.error('Error updating follow-up:', error);
    throw error;
  }
}

/**
 * Generate follow-ups for all stale applications
 * @param {string} userId - User email
 * @returns {Promise<Array>} Array of created follow-ups
 */
async function generateAllFollowUps(userId) {
  try {
    // Get user profile
    const user = await prisma.user.findUnique({
      where: { email: userId },
      select: { firstName: true, lastName: true, email: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get stale applications
    const staleApplications = await getStaleApplications(userId);

    if (staleApplications.length === 0) {
      return [];
    }

    // Generate follow-ups for each stale application
    const followUps = [];
    for (const application of staleApplications) {
      try {
        // Check if follow-up already exists
        const existingCount = await prisma.followUp.count({
          where: {
            userId,
            jobListingId: application.jobListingId,
            status: { in: ['approved', 'sent'] },
          },
        });

        const followUpCount = existingCount + 1;

        // Skip if already 3 follow-ups sent
        if (followUpCount > 3) {
          continue;
        }

        // Generate email
        const emailDraft = await generateFollowUpEmail(user, application, followUpCount);

        // Create suggestion
        const followUp = await createFollowUpSuggestion(userId, application, emailDraft, followUpCount);

        followUps.push(followUp);
      } catch (error) {
        console.error(`Error generating follow-up for job ${application.jobListingId}:`, error);
        // Continue with next application
      }
    }

    return followUps;
  } catch (error) {
    console.error('Error generating all follow-ups:', error);
    throw error;
  }
}

module.exports = {
  getStaleApplications,
  getFollowUpCount,
  generateFollowUpEmail,
  createFollowUpSuggestion,
  getPendingFollowUps,
  getAllFollowUps,
  approveFollowUp,
  markFollowUpAsSent,
  dismissFollowUp,
  updateFollowUpEmail,
  generateAllFollowUps,
};
