const prisma = require('../config/prisma');
const { generateCoverLetter } = require('../services/ai/coverLetter.service');
const { logAgentAction } = require('../services/ai/agentLog.service');

const generateCoverLetterHandler = async (req, res) => {
  const { jobId, jobTitle, companyName, jobDescription, jobHighlights } = req.body;
  const userId = req.user?.email;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Validate required fields
  if (!jobTitle || !companyName) {
    return res.status(400).json({ error: 'jobTitle and companyName are required' });
  }

  try {
    // Get user profile for context
    const user = await prisma.user.findUnique({
      where: { email: userId },
      select: { firstName: true, lastName: true, email: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate cover letter using Claude API
    const result = await generateCoverLetter(user, {
      jobId,
      jobTitle,
      companyName,
      jobDescription,
      jobHighlights,
    });

    // Save generated content to database
    const generatedContent = await prisma.generatedContent.create({
      data: {
        userId,
        contentType: 'cover_letter',
        jobId,
        jobTitle,
        companyName,
        content: result.content,
        metadata: result.metadata,
      },
    });

    // Log the action
    await logAgentAction(
      userId,
      'cover_letter',
      'generation',
      {
        jobId,
        jobTitle,
        companyName,
      },
      {
        contentId: generatedContent.id,
        tokenCount: result.metadata.tokenCount,
      },
      'success'
    );

    res.json({
      success: true,
      contentId: generatedContent.id,
      content: result.content,
    });
  } catch (error) {
    console.error('Cover letter generation error:', error);

    // Log the failed action
    await logAgentAction(
      userId,
      'cover_letter',
      'generation',
      { jobId, jobTitle, companyName },
      null,
      'failed',
      error.message
    ).catch(err => console.error('Error logging failed action:', err));

    res.status(500).json({
      error: 'Failed to generate cover letter',
      message: error.message,
    });
  }
};

const getCoverLettersHandler = async (req, res) => {
  const { jobId } = req.params;
  const userId = req.user?.email;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const coverLetters = await prisma.generatedContent.findMany({
      where: {
        userId,
        contentType: 'cover_letter',
        jobId,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: coverLetters,
    });
  } catch (error) {
    console.error('Error retrieving cover letters:', error);
    res.status(500).json({ error: 'Failed to retrieve cover letters' });
  }
};

const getAllCoverLettersHandler = async (req, res) => {
  const userId = req.user?.email;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const coverLetters = await prisma.generatedContent.findMany({
      where: {
        userId,
        contentType: 'cover_letter',
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: coverLetters,
    });
  } catch (error) {
    console.error('Error retrieving cover letters:', error);
    res.status(500).json({ error: 'Failed to retrieve cover letters' });
  }
};

const generateColdEmailHandler = async (req, res) => {
  const { jobId, jobTitle, companyName, jobDescription, jobHighlights } = req.body;
  const userId = req.user?.email;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!jobTitle || !companyName) {
    return res.status(400).json({ error: 'jobTitle and companyName are required' });
  }

  try {
    // For now, reuse cover letter generation (future: implement cold email specific prompt)
    const user = await prisma.user.findUnique({
      where: { email: userId },
      select: { firstName: true, lastName: true, email: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate cold email using Claude API (same as cover letter for now)
    const result = await generateCoverLetter(user, {
      jobId,
      jobTitle,
      companyName,
      jobDescription,
      jobHighlights,
    });

    // Save generated content to database
    const generatedContent = await prisma.generatedContent.create({
      data: {
        userId,
        contentType: 'cold_email',
        jobId,
        jobTitle,
        companyName,
        content: result.content,
        metadata: result.metadata,
      },
    });

    // Log the action
    await logAgentAction(
      userId,
      'cold_email',
      'generation',
      {
        jobId,
        jobTitle,
        companyName,
      },
      {
        contentId: generatedContent.id,
        tokenCount: result.metadata.tokenCount,
      },
      'success'
    );

    res.json({
      success: true,
      contentId: generatedContent.id,
      content: result.content,
    });
  } catch (error) {
    console.error('Cold email generation error:', error);

    // Log the failed action
    await logAgentAction(
      userId,
      'cold_email',
      'generation',
      { jobId, jobTitle, companyName },
      null,
      'failed',
      error.message
    ).catch(err => console.error('Error logging failed action:', err));

    res.status(500).json({
      error: 'Failed to generate cold email',
      message: error.message,
    });
  }
};

module.exports = {
  generateCoverLetterHandler,
  getCoverLettersHandler,
  getAllCoverLettersHandler,
  generateColdEmailHandler,
};
