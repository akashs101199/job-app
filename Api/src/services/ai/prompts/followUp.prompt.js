/**
 * Follow-Up Email Prompt Templates
 * Generates personalized follow-up emails for stale applications
 */

const getFollowUpPrompts = () => ({
  /**
   * First follow-up (3-5 days after application)
   * Warm, professional tone with subtle urgency
   */
  firstFollowUp: (user, company, role) => `
Generate a professional and warm follow-up email for a job application.

Context:
- Candidate: ${user.firstName} ${user.lastName}
- Company: ${company}
- Position: ${role}
- Purpose: Check on the status of application submitted a week ago

Requirements:
- Warm, professional tone
- Show genuine interest in the company
- Briefly mention key qualifications
- Ask for status update
- Keep it concise (150-200 words)
- Avoid being too pushy

Return the email in JSON format with fields:
{
  "subject": "Email subject line",
  "body": "Full email body with salutation and closing"
}
`,

  /**
   * Second follow-up (7-10 days after first)
   * Slightly more assertive, reiterate value
   */
  secondFollowUp: (user, company, role) => `
Generate a professional follow-up email for a job application (second attempt).

Context:
- Candidate: ${user.firstName} ${user.lastName}
- Company: ${company}
- Position: ${role}
- Purpose: Second follow-up after previous attempt had no response

Requirements:
- Professional but slightly more assertive tone
- Emphasize specific value/skills relevant to the role
- Express enthusiasm for the company
- Ask if there's anything else needed from the candidate
- Keep it concise (150-200 words)
- Respectful but confident

Return the email in JSON format with fields:
{
  "subject": "Email subject line",
  "body": "Full email body with salutation and closing"
}
`,

  /**
   * Third follow-up (final attempt)
   * Professional, with clear call to action
   */
  thirdFollowUp: (user, company, role) => `
Generate a final professional follow-up email for a job application.

Context:
- Candidate: ${user.firstName} ${user.lastName}
- Company: ${company}
- Position: ${role}
- Purpose: Final follow-up to determine status of application

Requirements:
- Polite but clear that this is likely the last attempt
- Professional closing tone
- Offer multiple ways to stay in touch (LinkedIn, email, etc.)
- Ask for clear next steps
- Express understanding if position has been filled
- Keep it concise (150-200 words)
- Maintain dignity and professionalism

Return the email in JSON format with fields:
{
  "subject": "Email subject line",
  "body": "Full email body with salutation and closing"
}
`,
});

module.exports = {
  getFollowUpPrompts,
};
