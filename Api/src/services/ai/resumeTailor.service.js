const Anthropic = require('@anthropic-ai/sdk');
const { generateResumeTailorPrompt } = require('./prompts/resumeTailor.prompt');
const { logAgentAction } = require('./agentLog.service');

const client = new Anthropic();

/**
 * Tailor resume for a specific job
 * Reorders sections, rephrases content, integrates keywords while maintaining authenticity
 *
 * @param {string} userId - User email
 * @param {string} resumeText - Original resume text
 * @param {string} jobDescription - Target job description
 * @param {string} jobTitle - Target job title
 * @returns {Promise<Object>} Tailored resume and change log
 */
const tailorResumeForJob = async (userId, resumeText, jobDescription, jobTitle) => {
  const startTime = Date.now();

  try {
    if (!resumeText || !jobDescription) {
      throw new Error('Resume text and job description are required');
    }

    // Generate the tailoring prompt
    const prompt = generateResumeTailorPrompt(resumeText, jobDescription, jobTitle);

    // Call Claude API for tailoring
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract the response text
    const responseText = message.content[0]?.text || '';

    // Parse the JSON response
    let tailorResult;
    try {
      tailorResult = JSON.parse(responseText);
    } catch (parseErr) {
      console.error('Failed to parse Claude response:', responseText);
      throw new Error('Failed to parse tailoring response from Claude API');
    }

    // Validate the response
    if (!tailorResult.tailoredText) {
      throw new Error('Invalid tailoring response: missing tailoredText');
    }

    // Log the successful tailoring
    const duration = Date.now() - startTime;
    await logAgentAction(
      userId,
      'resume_tailor',
      'tailor_resume',
      {
        originalLength: resumeText.length,
        jobTitleLength: jobTitle.length,
      },
      {
        tailoredLength: tailorResult.tailoredText.length,
        changesCount: tailorResult.changes?.length || 0,
        matchScore: tailorResult.matchAnalysis?.relevanceScore || 0,
        duration,
      },
      'success'
    ).catch(err => console.error('Error logging action:', err));

    return tailorResult;
  } catch (err) {
    console.error('Error tailoring resume:', err);

    // Log the failed tailoring
    await logAgentAction(
      userId,
      'resume_tailor',
      'tailor_resume',
      { originalLength: resumeText?.length || 0 },
      null,
      'failed',
      err.message
    ).catch(logErr => console.error('Error logging failed action:', logErr));

    throw err;
  }
};

/**
 * Extract key skills from job description
 *
 * @param {string} jobDescription - Job description text
 * @returns {Array} Array of extracted skills/keywords
 */
const extractJobRequirements = (jobDescription) => {
  if (!jobDescription) return [];

  const keywords = [];
  const skillPatterns = [
    /proficien[ct]y?\s+(?:in|with)\s+([a-zA-Z0-9\s+,]+)/gi,
    /experience\s+(?:with|in)\s+([a-zA-Z0-9\s+,]+)/gi,
    /knowledge\s+(?:of|in)\s+([a-zA-Z0-9\s+,]+)/gi,
    /skills?\s*:\s*([a-zA-Z0-9\s+,]+)/gi,
  ];

  skillPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(jobDescription)) !== null) {
      const skills = match[1]
        .split(/[,\s+]+/)
        .filter(s => s.length > 2)
        .map(s => s.trim());
      keywords.push(...skills);
    }
  });

  // Also extract common technical keywords
  const commonTechKeywords = [
    'python', 'javascript', 'java', 'c++', 'c#', 'ruby', 'php', 'go', 'rust',
    'react', 'angular', 'vue', 'node', 'django', 'flask', 'spring',
    'sql', 'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'git', 'jenkins',
    'agile', 'scrum', 'rest', 'graphql', 'microservices', 'ci/cd',
  ];

  const descriptionLower = jobDescription.toLowerCase();
  const foundKeywords = commonTechKeywords.filter(keyword =>
    descriptionLower.includes(keyword)
  );

  keywords.push(...foundKeywords);

  // Remove duplicates and return top keywords
  return [...new Set(keywords)].slice(0, 20);
};

/**
 * Compare resume skills with job requirements
 *
 * @param {string} resumeText - Resume text
 * @param {string} jobDescription - Job description
 * @returns {Object} Skill comparison analysis
 */
const compareSkills = (resumeText, jobDescription) => {
  const jobSkills = extractJobRequirements(jobDescription);
  const resumeLower = resumeText.toLowerCase();

  const matched = [];
  const missing = [];

  jobSkills.forEach(skill => {
    if (resumeLower.includes(skill.toLowerCase())) {
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  });

  return {
    matchedSkills: matched,
    missingSkills: missing,
    matchPercentage: matched.length > 0
      ? Math.round((matched.length / jobSkills.length) * 100)
      : 0,
  };
};

/**
 * Format tailoring results for storage
 *
 * @param {Object} tailorResult - Raw tailoring result from Claude
 * @returns {Object} Formatted for database storage
 */
const formatTailoringResults = (tailorResult) => {
  return {
    tailoredContent: tailorResult.tailoredText || '',
    changes: tailorResult.changes || [],
    matchAnalysis: tailorResult.matchAnalysis || {},
    strategy: tailorResult.tailoringStrategy || '',
  };
};

/**
 * Generate a summary of changes made during tailoring
 *
 * @param {Array} changes - Array of changes from tailoring result
 * @returns {string} Human-readable summary of changes
 */
const summarizeChanges = (changes) => {
  if (!changes || changes.length === 0) {
    return 'No changes were necessary.';
  }

  const summary = [];
  const typeGroups = {};

  changes.forEach(change => {
    if (!typeGroups[change.type]) {
      typeGroups[change.type] = [];
    }
    typeGroups[change.type].push(change.section);
  });

  for (const [type, sections] of Object.entries(typeGroups)) {
    const uniqueSections = [...new Set(sections)];
    summary.push(`${type}: ${uniqueSections.join(', ')}`);
  }

  return `Changes made: ${summary.join('; ')}`;
};

module.exports = {
  tailorResumeForJob,
  extractJobRequirements,
  compareSkills,
  formatTailoringResults,
  summarizeChanges,
};
