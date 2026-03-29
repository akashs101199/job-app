/**
 * Claude prompt for tailoring resume to specific job
 * Optimizes resume content while maintaining authenticity
 */

const generateResumeTailorPrompt = (resumeText, jobDescription, jobTitle) => {
  return `You are an expert resume strategist and career coach specializing in tailoring resumes for specific job opportunities.

Your task is to adapt the provided resume to better match the target job description while maintaining complete authenticity and truthfulness. Never fabricate experience, skills, or achievements.

ORIGINAL RESUME:
${resumeText}

TARGET JOB TITLE:
${jobTitle}

TARGET JOB DESCRIPTION:
${jobDescription}

Please provide your tailored resume and changes in the following JSON format (ONLY JSON, no additional text):

{
  "tailoredText": "<complete tailored resume text>",
  "changes": [
    {
      "section": "<section name: summary|experience|education|skills|projects>",
      "type": "<type of change: reorder|rephrase|emphasize|deemphasize>",
      "original": "<original text>",
      "modified": "<modified text>",
      "reason": "<why this change improves match for the job>"
    }
  ],
  "matchAnalysis": {
    "matchedSkills": [<skills from job description that user has>],
    "missingSkills": [<skills from job description that user doesn't have>],
    "keywordMatches": <number>,
    "relevanceScore": <0-100>
  },
  "tailoringStrategy": "<paragraph explaining the overall tailoring approach used>"
}

IMPORTANT INSTRUCTIONS:
1. NEVER fabricate experience, companies, dates, or skills that aren't in the original resume
2. Reorder bullet points to highlight most relevant experience first
3. Use stronger action verbs when describing achievements
4. Add quantifiable metrics where they exist in the original resume
5. Emphasize skills and experience that match the job description
6. De-emphasize or reframe irrelevant experience
7. Integrate job description keywords naturally without keyword stuffing
8. Keep the resume truthful and authentic - this is critical
9. Maintain proper formatting and structure
10. Focus on reframing what's already there, not inventing new qualifications
11. Track every significant change made for the user to review
12. Only output valid JSON with no markdown or extra text`;
};

module.exports = { generateResumeTailorPrompt };
