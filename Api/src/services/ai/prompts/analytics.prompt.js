/**
 * Analytics & Insights Prompts
 * Used to generate strategic job search insights and market analysis
 */

const userInsightsPrompt = (applicationData, performanceMetrics, userProfile) => `
You are an expert career strategist and job market analyst. Analyze the following user's job search data.

User: ${userProfile.firstName} ${userProfile.lastName}
Application Data:
${JSON.stringify(applicationData, null, 2)}

Performance Metrics:
${JSON.stringify(performanceMetrics, null, 2)}

Generate strategic, actionable insights that will help improve their job search success. Focus on:

1. **Platform Strategy**: Which platforms have the highest success rates? Should they focus more on specific platforms?
2. **Timing Insights**: Are there patterns in when applications are most successful?
3. **Role & Company Preferences**: What types of roles and companies have the best outcomes?
4. **Application Patterns**: How frequently should they apply? Volume vs quality?
5. **Success Rate Analysis**: What's their current success rate and how does it compare to benchmarks?

Return insights as a JSON object with:
{
  "summary": "Brief overview of their job search health",
  "strengths": ["Strength 1", "Strength 2"],
  "opportunities": ["Opportunity 1", "Opportunity 2"],
  "insights": [
    {
      "title": "Insight title",
      "description": "Detailed explanation",
      "impact": "high/medium/low",
      "actionable": true
    }
  ]
}

Make insights specific, quantified where possible, and directly actionable.
`;

const marketTrendsPrompt = (jobListings, userTargetRoles) => `
You are a job market analyst. Analyze recent job market data to identify trends.

User Target Roles: ${userTargetRoles.join(', ')}
Job Listings Sample: ${JSON.stringify(jobListings.slice(0, 50), null, 2)}

Analyze:
1. **Demand Trends**: Which roles are in high demand? Which are declining?
2. **Trending Skills**: What are the top 10 most in-demand skills across the job market?
3. **Salary Trends**: What's the average salary? Range? Trends (up/down)?
4. **Location Trends**: Where are most opportunities? Remote prevalence?
5. **Company Hiring**: Which companies are actively hiring the most?

Return as JSON:
{
  "demandTrends": {
    "role_name": "+15%|flat|-5%" (change from last month)
  },
  "trendingSkills": [
    {
      "skill": "Skill name",
      "demand": "+35%",
      "frequency": "65%",
      "description": "Why it's trending"
    }
  ],
  "salaryInsights": {
    "average": 150000,
    "minimum": 100000,
    "maximum": 250000,
    "trend": "up 8%"
  },
  "remotePercentage": 45,
  "topHiringCompanies": [
    { "company": "Company Name", "openings": 234 }
  ]
}
`;

const skillGapPrompt = (jobApplications, marketTrends) => `
You are a skills analyst. Identify skill gaps between user's job targets and market demand.

User's Target Jobs (from applications):
${JSON.stringify(jobApplications.slice(0, 20), null, 2)}

Market Trends:
${JSON.stringify(marketTrends, null, 2)}

Identify:
1. **Critical Gaps**: High-demand skills the user doesn't have
2. **Nice-to-Have Skills**: Lower priority but valuable skills
3. **Learning Priority**: Which skills to learn first for maximum impact?
4. **Learning Time**: Estimated time to develop each skill
5. **ROI**: Impact on job prospects for each skill

Return as JSON:
{
  "skillGaps": [
    {
      "skill": "Skill name",
      "frequency": "65%",
      "demand": "+35%",
      "priority": "high|medium|low",
      "estimatedTime": "2-4 weeks",
      "roi": "Learn this to unlock 15% more opportunities"
    }
  ],
  "recommendedLearningPath": [
    { "skill": "Skill 1", "reason": "Foundation for other skills" },
    { "skill": "Skill 2", "reason": "Highest immediate ROI" }
  ],
  "summary": "Overall skill assessment"
}
`;

const performanceAnalysisPrompt = (applicationHistory, platformMetrics) => `
You are a performance analyst. Provide detailed performance analysis.

Application History:
${JSON.stringify(applicationHistory.slice(0, 30), null, 2)}

Platform Metrics:
${JSON.stringify(platformMetrics, null, 2)}

Analyze:
1. **Success Metrics**: Interview rate, offer rate, rejection rate
2. **Platform Performance**: Detailed comparison of success by platform
3. **Time-to-Response**: Average time from application to response/interview
4. **Trends**: Is performance improving or declining over time?
5. **Benchmarks**: How does their performance compare to typical benchmarks?

Return as JSON:
{
  "overallMetrics": {
    "totalApplications": 120,
    "interviews": 10,
    "offers": 2,
    "rejections": 45,
    "pending": 63,
    "successRate": "8.3%"
  },
  "platformComparison": [
    {
      "platform": "LinkedIn",
      "applications": 45,
      "interviews": 8,
      "interviewRate": "17.8%",
      "strength": "high"
    }
  ],
  "trends": {
    "successRateTrend": "up",
    "interviewRateTrend": "up",
    "applicationFrequencyTrend": "stable"
  },
  "recommendations": ["Focus on platforms with high success", "Increase application volume on high-performing platforms"]
}
`;

const recommendationsPrompt = (insights, skillGaps, platformData, marketTrends) => `
You are a career strategist. Generate specific, prioritized recommendations.

Current Insights:
${JSON.stringify(insights, null, 2)}

Skill Gaps:
${JSON.stringify(skillGaps, null, 2)}

Platform Performance:
${JSON.stringify(platformData, null, 2)}

Market Trends:
${JSON.stringify(marketTrends, null, 2)}

Generate 7-10 specific, actionable recommendations in priority order:

Each recommendation should:
1. Be specific and actionable
2. Have clear impact (high/medium)
3. Be achievable within 30 days
4. Include time estimate
5. Explain the expected outcome

Return as JSON:
{
  "recommendations": [
    {
      "rank": 1,
      "title": "Recommendation title",
      "description": "Detailed explanation",
      "action": "Specific action to take",
      "impact": "Expected outcome",
      "timeframe": "2 weeks",
      "priority": "high|medium"
    }
  ],
  "thirtyDayPlan": [
    { "week": 1, "actions": ["Action 1", "Action 2"] },
    { "week": 2, "actions": ["Action 1"] },
    { "week": 3, "actions": ["Action 1", "Action 2"] },
    { "week": 4, "actions": ["Action 1"] }
  ]
}
`;

module.exports = {
  userInsightsPrompt,
  marketTrendsPrompt,
  skillGapPrompt,
  performanceAnalysisPrompt,
  recommendationsPrompt,
};
