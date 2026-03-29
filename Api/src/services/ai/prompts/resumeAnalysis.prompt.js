/**
 * Claude prompt for comprehensive resume analysis
 * Analyzes ATS compatibility, keywords, sections, and provides actionable suggestions
 */

const generateResumeAnalysisPrompt = (resumeText, jobDescription = null) => {
  const jobDescriptionSection = jobDescription
    ? `\n\nTARGET JOB DESCRIPTION:\n${jobDescription}`
    : '';

  return `You are an expert ATS (Applicant Tracking System) specialist and resume optimization coach.
Analyze the provided resume and provide a comprehensive assessment with specific, actionable suggestions.

RESUME TO ANALYZE:
${resumeText}
${jobDescriptionSection}

Please provide your analysis in the following JSON format (and ONLY in this JSON format, with no additional text):

{
  "atsScore": <number 0-100>,
  "atsAnalysis": {
    "formatting": {
      "score": <number 0-100>,
      "strengths": [<list of formatting strengths>],
      "issues": [<list of ATS-unfriendly formatting issues>]
    },
    "structure": {
      "score": <number 0-100>,
      "strengths": [<list of structural strengths>],
      "issues": [<list of structural issues>]
    },
    "keywords": {
      "score": <number 0-100>,
      "strengths": [<list of strong keywords used>],
      "issues": [<list of missing important keywords>]
    }
  },
  "keywords": {
    "present": [<important keywords found in resume>],
    "missing": [<important keywords NOT found in resume>],
    "suggested": [<additional high-impact keywords to add>]
  },
  "sections": {
    "summary": {
      "score": <number 0-100>,
      "feedback": "<specific feedback about summary/objective section>",
      "suggestions": [<list of specific improvements>]
    },
    "experience": {
      "score": <number 0-100>,
      "feedback": "<specific feedback about work experience>",
      "suggestions": [<list of specific improvements>]
    },
    "education": {
      "score": <number 0-100>,
      "feedback": "<specific feedback about education section>",
      "suggestions": [<list of specific improvements>]
    },
    "skills": {
      "score": <number 0-100>,
      "feedback": "<specific feedback about skills section>",
      "suggestions": [<list of specific improvements>]
    }
  },
  "suggestions": [
    {
      "section": "<which section this applies to>",
      "type": "<keyword|formatting|content|action_verb|structure>",
      "priority": "<high|medium|low>",
      "current": "<current text or pattern>",
      "suggested": "<what to change it to>",
      "reasoning": "<why this change improves the resume>",
      "impact": "<high|medium|low - how much this impacts ATS/hiring>"
    }
  ],
  "overallFeedback": "<2-3 sentences summarizing the biggest improvements to make>",
  "targetJobFit": {
    "score": <number 0-100 if job description provided, otherwise null>,
    "matchedKeywords": [<keywords from job description that appear in resume>],
    "missingKeywords": [<important keywords from job description that are missing>],
    "recommendations": [<recommendations to tailor for this specific job>]
  }
}

IMPORTANT INSTRUCTIONS:
1. Base the ATS score on formatting compatibility, keyword density, structure, and clarity
2. Identify specific action verbs that could be stronger
3. Flag fonts, tables, graphics, or formatting that ATS systems struggle with
4. Look for quantified achievements (numbers, percentages, metrics)
5. Check for proper use of technical keywords and industry terminology
${jobDescription ? '6. When job description is provided, specifically identify which keywords and skills are needed for that role' : ''}
7. Provide at least 5-8 actionable suggestions prioritized by impact
8. Focus on changes that improve BOTH ATS readability AND human appeal
9. Only output valid JSON - no markdown formatting or additional text`;
};

module.exports = { generateResumeAnalysisPrompt };
