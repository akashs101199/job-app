const generateCoverLetterPrompt = (userProfile, jobData) => {
  return `You are an expert cover letter writer. Generate a professional, personalized cover letter based on the following information.

USER PROFILE:
Name: ${userProfile.firstName} ${userProfile.lastName}
Email: ${userProfile.email}

JOB DETAILS:
Job Title: ${jobData.jobTitle}
Company: ${jobData.companyName}
Job Description: ${jobData.jobDescription || 'Not provided'}
Key Requirements: ${jobData.jobHighlights ? JSON.stringify(jobData.jobHighlights) : 'Not provided'}

INSTRUCTIONS:
1. Write a professional cover letter that is 3-4 paragraphs long
2. Address the hiring manager generically (e.g., "Dear Hiring Manager")
3. Start with an engaging opening that shows enthusiasm for the role
4. Highlight relevant skills and experience that match the job requirements
5. Include specific details from the job posting to show genuine interest
6. End with a professional closing
7. Keep the tone professional but personable
8. Do NOT include sender/recipient address blocks or date
9. Do NOT include signature lines or closing formalities beyond "Sincerely"
10. Focus on VALUE - explain why you're a great fit for THIS specific role

Generate ONLY the cover letter body, starting with "Dear Hiring Manager" and ending after your closing statement. No additional text before or after.`;
};

module.exports = { generateCoverLetterPrompt };
