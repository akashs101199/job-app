const Anthropic = require('@anthropic-ai/sdk');
const { generateResumeAnalysisPrompt } = require('./prompts/resumeAnalysis.prompt');
const { logAgentAction } = require('./agentLog.service');

const client = new Anthropic();

/**
 * Analyze resume for ATS compatibility and provide optimization suggestions
 *
 * @param {string} userId - User email
 * @param {string} resumeText - Extracted resume text
 * @param {string} jobDescription - Optional target job description for comparison
 * @param {string} jobTitle - Optional target job title
 * @returns {Promise<Object>} Analysis results with ATS score, keywords, sections, suggestions
 */
const analyzeResume = async (userId, resumeText, jobDescription = null, jobTitle = null) => {
  const startTime = Date.now();

  try {
    if (!resumeText || resumeText.trim().length === 0) {
      throw new Error('Resume text cannot be empty');
    }

    // Generate the analysis prompt
    const prompt = generateResumeAnalysisPrompt(resumeText, jobDescription);

    // Call Claude API for analysis
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2000,
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
    let analysisResult;
    try {
      analysisResult = JSON.parse(responseText);
    } catch (parseErr) {
      console.error('Failed to parse Claude response:', responseText);
      throw new Error('Failed to parse resume analysis response from Claude API');
    }

    // Validate the response has required fields
    if (!analysisResult.atsScore || analysisResult.atsScore === null) {
      throw new Error('Invalid analysis response: missing atsScore');
    }

    // Log the successful analysis
    const duration = Date.now() - startTime;
    await logAgentAction(
      userId,
      'resume_analysis',
      'analyze_resume',
      {
        resumeLength: resumeText.length,
        hasJobDescription: !!jobDescription,
      },
      {
        atsScore: analysisResult.atsScore,
        suggestionsCount: analysisResult.suggestions?.length || 0,
        duration,
      },
      'success'
    ).catch(err => console.error('Error logging action:', err));

    return analysisResult;
  } catch (err) {
    console.error('Error analyzing resume:', err);

    // Log the failed analysis
    await logAgentAction(
      userId,
      'resume_analysis',
      'analyze_resume',
      { resumeLength: resumeText?.length || 0 },
      null,
      'failed',
      err.message
    ).catch(logErr => console.error('Error logging failed action:', logErr));

    throw err;
  }
};

/**
 * Calculate an ATS score based on basic heuristics
 * Used as a fallback or quick check before full Claude analysis
 *
 * @param {string} resumeText - Resume text content
 * @returns {number} Quick ATS score (0-100)
 */
const calculateQuickAtsScore = (resumeText) => {
  let score = 50; // Start at baseline

  if (!resumeText) return 0;

  const text = resumeText.toLowerCase();

  // Check for action verbs (+ points)
  const actionVerbs = [
    'managed', 'led', 'developed', 'designed', 'implemented',
    'created', 'built', 'achieved', 'improved', 'optimized',
    'increased', 'reduced', 'delivered', 'launched', 'established',
  ];
  const verbCount = actionVerbs.filter(verb => text.includes(verb)).length;
  score += Math.min(15, verbCount * 2);

  // Check for numbers/metrics (+ points)
  const metricMatches = text.match(/(\d+%|\$\d+|(\d+)\s*(increase|decrease|reduction|growth|users|clients|revenue|sales))/gi);
  score += Math.min(15, (metricMatches?.length || 0) * 3);

  // Check for technical keywords (+ points)
  const techKeywords = [
    'python', 'javascript', 'java', 'sql', 'aws', 'gcp', 'azure',
    'react', 'nodejs', 'api', 'database', 'mongodb', 'postgresql',
    'git', 'docker', 'kubernetes', 'ci/cd', 'agile', 'scrum',
  ];
  const techCount = techKeywords.filter(kw => text.includes(kw)).length;
  score += Math.min(10, techCount * 1.5);

  // Check for proper sections (+ points)
  const sections = ['experience', 'education', 'skills'];
  const sectionCount = sections.filter(sec => text.includes(sec)).length;
  score += sectionCount * 5;

  // Check for bullet points (+ points)
  score += Math.min(10, (resumeText.split('\n').length / 5));

  // Penalize for very short content
  if (resumeText.length < 500) score -= 20;
  if (resumeText.length < 200) score -= 30;

  // Ensure score is within bounds
  return Math.min(100, Math.max(0, Math.round(score)));
};

/**
 * Extract keywords from resume text
 * Returns keywords found and their frequency
 *
 * @param {string} resumeText - Resume text content
 * @returns {Array} Array of keywords with counts
 */
const extractKeywords = (resumeText) => {
  if (!resumeText) return [];

  const keywords = [];
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'is', 'are', 'was', 'were', 'be', 'been', 'by', 'from', 'as', 'it', 'that', 'this',
  ]);

  const words = resumeText
    .toLowerCase()
    .split(/[\s\n\t,;:.()]/g)
    .filter(w => w.length > 4 && !stopWords.has(w));

  // Count word frequency
  const wordFreq = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });

  // Get top keywords
  const topWords = Object.entries(wordFreq)
    .filter(([word, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([word]) => word);

  return topWords;
};

/**
 * Format analysis results for storage in database
 *
 * @param {Object} analysisResult - Raw analysis from Claude
 * @returns {Object} Formatted results ready for database storage
 */
const formatAnalysisResults = (analysisResult) => {
  return {
    atsScore: analysisResult.atsScore || 0,
    keywords: {
      present: analysisResult.keywords?.present || [],
      missing: analysisResult.keywords?.missing || [],
      suggested: analysisResult.keywords?.suggested || [],
    },
    sections: {
      summary: analysisResult.sections?.summary || {},
      experience: analysisResult.sections?.experience || {},
      education: analysisResult.sections?.education || {},
      skills: analysisResult.sections?.skills || {},
    },
    suggestions: analysisResult.suggestions || [],
    targetJobFit: analysisResult.targetJobFit || null,
    overallFeedback: analysisResult.overallFeedback || '',
  };
};

module.exports = {
  analyzeResume,
  calculateQuickAtsScore,
  extractKeywords,
  formatAnalysisResults,
};
