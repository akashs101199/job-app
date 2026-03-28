const Anthropic = require('@anthropic-ai/sdk');
const {
  companyResearchPrompt,
  technicalQuestionsPrompt,
  behavioralQuestionsPrompt,
  answerFrameworksPrompt,
  counterQuestionsPrompt,
  negotiationGuidePrompt,
} = require('./prompts/interviewPrep.prompt');

const client = new Anthropic();

/**
 * Generate comprehensive interview preparation package
 * @param {Object} userProfile - User data { firstName, lastName, email }
 * @param {Object} jobData - Job information { job_title, employer_name, job_description, job_highlights }
 * @returns {Promise<Object>} Complete interview prep package
 */
const generateInterviewPrep = async (userProfile, jobData) => {
  try {
    const startTime = Date.now();

    // Generate all components in parallel
    const [companyOverview, technicalQuestions, behavioralQuestions, counterQuestions, negotiationGuide] =
      await Promise.all([
        generateCompanyOverview(jobData.employer_name, jobData.job_description, jobData.job_highlights),
        generateTechnicalQuestions(
          jobData.job_title,
          jobData.job_description,
          jobData.job_highlights,
          userProfile
        ),
        generateBehavioralQuestions(jobData.job_title, jobData.job_description, userProfile),
        generateCounterQuestions(jobData.job_title, jobData.employer_name, jobData.job_description),
        generateNegotiationGuide(
          jobData.job_title,
          jobData.employer_name,
          jobData.job_description,
          userProfile
        ),
      ]);

    // Generate answer frameworks for behavioral questions
    const answerFrameworks = await generateAnswerFrameworks(behavioralQuestions, userProfile);

    const elapsedTime = Date.now() - startTime;

    return {
      companyOverview,
      technicalQuestions,
      behavioralQuestions: addAnswerFrameworks(behavioralQuestions, answerFrameworks),
      counterQuestions,
      negotiationGuide,
      metadata: {
        generatedAt: new Date().toISOString(),
        generationTimeMs: elapsedTime,
      },
    };
  } catch (error) {
    console.error('Error generating interview prep:', error);
    throw error;
  }
};

/**
 * Generate company overview and research
 */
const generateCompanyOverview = async (companyName, jobDescription, jobHighlights) => {
  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: companyResearchPrompt(companyName, jobDescription, jobHighlights),
      },
    ],
  });

  const content = message.content[0].text;

  try {
    // Try to parse JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.warn('Failed to parse company overview JSON, returning as text');
  }

  // Fallback: return structured text response
  return {
    overview: content,
    size: 'N/A',
    recentNews: [],
    keyFacts: [],
    cultureIndicators: [],
  };
};

/**
 * Generate technical interview questions
 */
const generateTechnicalQuestions = async (jobTitle, jobDescription, jobHighlights, userProfile) => {
  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: technicalQuestionsPrompt(jobTitle, jobDescription, jobHighlights, userProfile),
      },
    ],
  });

  const content = message.content[0].text;

  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.warn('Failed to parse technical questions JSON');
  }

  // Fallback: return empty array
  return [];
};

/**
 * Generate behavioral interview questions
 */
const generateBehavioralQuestions = async (jobTitle, jobDescription, userProfile) => {
  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: behavioralQuestionsPrompt(jobTitle, jobDescription, userProfile),
      },
    ],
  });

  const content = message.content[0].text;

  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.warn('Failed to parse behavioral questions JSON');
  }

  return [];
};

/**
 * Generate answer frameworks for behavioral questions using STAR method
 */
const generateAnswerFrameworks = async (questions, userProfile) => {
  if (!questions || questions.length === 0) {
    return [];
  }

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: answerFrameworksPrompt(questions, userProfile),
      },
    ],
  });

  const content = message.content[0].text;

  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.warn('Failed to parse answer frameworks JSON');
  }

  return [];
};

/**
 * Merge answer frameworks into behavioral questions
 */
const addAnswerFrameworks = (questions, frameworks) => {
  return questions.map((question, index) => {
    const framework = frameworks.find((f) => f.questionIndex === index);
    return {
      ...question,
      answerFramework: framework ? framework.fullAnswer : question.starFramework,
      speakingTips: framework ? framework.speakingTips : [],
      commonMistakes: framework ? framework.commonMistakes : [],
    };
  });
};

/**
 * Generate counter-questions to ask the interviewer
 */
const generateCounterQuestions = async (jobTitle, companyName, jobDescription) => {
  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: counterQuestionsPrompt(jobTitle, companyName, jobDescription),
      },
    ],
  });

  const content = message.content[0].text;

  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.warn('Failed to parse counter questions JSON');
  }

  return [];
};

/**
 * Generate salary negotiation guide
 */
const generateNegotiationGuide = async (jobTitle, companyName, jobDescription, userProfile) => {
  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: negotiationGuidePrompt(jobTitle, companyName, jobDescription, userProfile),
      },
    ],
  });

  const content = message.content[0].text;

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.warn('Failed to parse negotiation guide JSON');
  }

  // Fallback: return structured default
  return {
    salaryInfo: {
      typicalRange: 'Varies by location and experience',
      factors: ['Experience level', 'Location', 'Company size'],
      notes: 'Research industry standards for your location',
    },
    negotiationStrategies: [
      'Research market rates before the interview',
      'Focus on value proposition',
      'Be prepared with multiple scenarios',
    ],
    scriptTemplates: [
      {
        scenario: 'Responding to initial offer',
        script: 'Thank you for the offer. I appreciate it. Can we discuss the compensation package?',
      },
    ],
    benefitsToNegotiate: [
      'Signing bonus',
      'Remote work flexibility',
      'Professional development budget',
      'Additional PTO',
      'Flexible hours',
    ],
  };
};

module.exports = { generateInterviewPrep };
