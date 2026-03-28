/**
 * Interview Preparation Prompts
 * Used to generate comprehensive interview preparation packages
 */

const companyResearchPrompt = (companyName, jobDescription, jobHighlights) => `
You are an expert career coach and business analyst. Research and summarize the following company:

Company Name: ${companyName}
Job Description: ${jobDescription}
Job Highlights: ${JSON.stringify(jobHighlights || {})}

Generate a comprehensive company overview that includes:
1. Company Overview (2-3 sentences): What they do, industry, market position
2. Company Size & Structure: Approximate employee count, organizational structure
3. Recent Company News: Recent achievements, product launches, or company updates (if known)
4. Key Facts: Founded year, headquarters, any notable facts
5. Company Culture Indicators: Based on job description and typical industry norms

Format as a structured JSON object:
{
  "overview": "...",
  "size": "...",
  "recentNews": ["...", "..."],
  "keyFacts": ["...", "..."],
  "cultureIndicators": ["...", "..."]
}
`;

const technicalQuestionsPrompt = (jobTitle, jobDescription, jobHighlights, userProfile) => `
You are an expert technical interviewer. Generate 5 likely technical interview questions for this role:

Job Title: ${jobTitle}
Job Description: ${jobDescription}
Key Highlights: ${JSON.stringify(jobHighlights?.qualifications || [])}
Candidate Profile: ${userProfile.firstName} ${userProfile.lastName}

Generate 5 technical questions that:
1. Are specific to the job role and required skills
2. Vary in difficulty (mix of easy, medium, hard)
3. Test practical knowledge relevant to the position
4. Include at least one system design or architecture question if applicable

For each question, also provide:
- difficulty: "easy" | "medium" | "hard"
- category: The skill area being tested (e.g., "Data Structures", "System Design", "API Design")
- keyword: A single keyword summarizing the topic

Format as a JSON array:
[
  {
    "question": "...",
    "difficulty": "medium",
    "category": "...",
    "keyword": "..."
  },
  ...
]
`;

const behavioralQuestionsPrompt = (jobTitle, jobDescription, userProfile) => `
You are an expert in behavioral interviewing. Generate 5 behavioral questions for this role:

Job Title: ${jobTitle}
Job Description: ${jobDescription}
Candidate: ${userProfile.firstName} ${userProfile.lastName}

Generate 5 behavioral questions that:
1. Follow the STAR method (Situation, Task, Action, Result)
2. Test relevant soft skills for the role (leadership, collaboration, problem-solving, etc.)
3. Are commonly asked in interviews for this type of position
4. Help assess cultural fit and work style

For each question, provide:
- question: The behavioral question
- category: The skill being assessed (e.g., "Leadership", "Teamwork", "Problem Solving")
- starFramework: A template for answering using STAR method

Format as a JSON array:
[
  {
    "question": "...",
    "category": "...",
    "starFramework": {
      "situation": "Describe a situation where you...",
      "task": "What was your responsibility?",
      "action": "What specific actions did you take?",
      "result": "What were the results?"
    }
  },
  ...
]
`;

const answerFrameworksPrompt = (questions, userProfile) => `
You are a career coach helping ${userProfile.firstName} prepare answers using the STAR method.

Questions to answer: ${JSON.stringify(questions)}
Candidate Profile: ${userProfile.firstName} ${userProfile.lastName}

For each behavioral question, generate a detailed STAR-method answer framework that:
1. Is realistic and generalizable (candidate can adapt to their experience)
2. Includes specific actions and metrics where possible
3. Demonstrates relevant competencies for the role
4. Includes a strong concluding statement about the lesson learned

Format as a JSON array with detailed frameworks:
[
  {
    "questionIndex": 0,
    "fullAnswer": {
      "situation": "...",
      "task": "...",
      "action": "...",
      "result": "..."
    },
    "speakingTips": ["...", "..."],
    "commonMistakes": ["...", "..."]
  },
  ...
]
`;

const counterQuestionsPrompt = (jobTitle, companyName, jobDescription) => `
You are an expert interviewer coach. Generate smart questions that ${jobTitle} candidates should ask interviewers.

Company: ${companyName}
Role: ${jobTitle}
Job Description: ${jobDescription}

Generate 5 intelligent counter-questions that:
1. Demonstrate genuine interest in the company and role
2. Help assess cultural fit and work environment
3. Show strategic thinking and long-term planning
4. Are appropriate for an interview setting
5. Help identify potential red flags or opportunities

For each question, include:
- question: The question to ask
- category: Why this question matters (e.g., "Team Dynamics", "Growth Opportunities")
- why: Brief explanation of why this is a good question

Format as a JSON array:
[
  {
    "question": "...",
    "category": "...",
    "why": "..."
  },
  ...
]
`;

const negotiationGuidePrompt = (jobTitle, companyName, jobDescription, userProfile) => `
You are an expert in salary negotiation and job offer evaluation. Create a negotiation guide for this role.

Position: ${jobTitle}
Company: ${companyName}
Job Description: ${jobDescription}
Candidate: ${userProfile.firstName} ${userProfile.lastName}

Generate a comprehensive negotiation guide that includes:

1. Salary Information:
   - Typical salary range for this role
   - Geographic adjustments (if relevant)
   - Bonus/equity information if typical for the role

2. Negotiation Strategies:
   - 3-5 key negotiation tactics
   - How to research and benchmark salary
   - When to negotiate and what to prioritize

3. Script Templates:
   - 2-3 example scripts for negotiating salary
   - How to handle rejection or low offers
   - How to evaluate competing offers

4. Benefits to Negotiate:
   - List of 5-7 additional benefits beyond salary
   - Flexibility options to request
   - Professional development budgets

Format as a detailed JSON object:
{
  "salaryInfo": {
    "typicalRange": "...",
    "factors": ["...", "..."],
    "notes": "..."
  },
  "negotiationStrategies": ["...", "..."],
  "scriptTemplates": [
    {
      "scenario": "...",
      "script": "..."
    },
    ...
  ],
  "benefitsToNegotiate": ["...", "..."]
}
`;

module.exports = {
  companyResearchPrompt,
  technicalQuestionsPrompt,
  behavioralQuestionsPrompt,
  answerFrameworksPrompt,
  counterQuestionsPrompt,
  negotiationGuidePrompt,
};
