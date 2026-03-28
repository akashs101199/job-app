const Anthropic = require('@anthropic-ai/sdk');
const { generateCoverLetterPrompt } = require('./prompts/coverLetter.prompt');
const { ANTHROPIC_API_KEY } = require('../../config/env');

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

const generateCoverLetter = async (userProfile, jobData, options = {}) => {
  try {
    const prompt = generateCoverLetterPrompt(userProfile, jobData);

    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    if (!message.content || message.content.length === 0) {
      throw new Error('No response from Claude API');
    }

    const coverLetter = message.content[0].type === 'text' ? message.content[0].text : '';

    return {
      success: true,
      content: coverLetter,
      metadata: {
        model: 'claude-3-5-sonnet-20241022',
        tokenCount: message.usage.output_tokens,
      },
    };
  } catch (error) {
    console.error('Cover letter generation error:', error);
    throw error;
  }
};

module.exports = { generateCoverLetter };
