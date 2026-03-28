# Phase 3: Interview Preparation Agent - Implementation Guide

## Vision

When a user marks an application as "Interview Scheduled", an AI agent autonomously generates a comprehensive interview preparation package including company research, likely interview questions with STAR-method answer frameworks, counter-questions, and salary negotiation scripts.

## Architecture Overview

```
User marks application as "Interview Scheduled"
                    ↓
        Application status updated in DB
                    ↓
      Trigger interview-prep generation
                    ↓
    API calls POST /api/agent/interview-prep
                    ↓
   Claude generates interview prep package
   - Company overview
   - Technical questions
   - Behavioral questions
   - Answer frameworks
   - Counter-questions
   - Salary negotiation
                    ↓
      Save to GeneratedContent table
                    ↓
   Frontend loads InterviewPrep page
                    ↓
      Display tabbed interface
   - Company Research
   - Practice Questions
   - Mock Interview
   - Negotiation Guide
```

## Implementation Phases

### Phase 3A: Backend Service & Endpoint

#### 1. Create Interview Prep Service
**File:** `Api/src/services/ai/interviewPrep.service.js`

```javascript
// Core function: generateInterviewPrep(userProfile, jobData)
// Returns: {
//   companyOverview: { name, industry, size, recentNews, keyFacts },
//   technicalQuestions: [{ question, difficulty, category, answerFramework }],
//   behavioralQuestions: [{ question, category, starFramework }],
//   counterQuestions: [{ question, category, why }],
//   negotiationGuide: { salaryData, strategies, scripts }
// }

const generateInterviewPrep = async (userProfile, jobData) => {
  // 1. Generate company research using Claude
  const companyOverview = await generateCompanyOverview(jobData.employer_name, jobData.job_description);

  // 2. Generate interview questions tailored to role
  const questions = await generateInterviewQuestions(jobData, userProfile);

  // 3. Generate STAR-method answer frameworks
  const answers = await generateAnswerFrameworks(questions, userProfile);

  // 4. Generate counter-questions for interviewer
  const counterQuestions = await generateCounterQuestions(jobData);

  // 5. Generate salary negotiation guide
  const negotiationGuide = await generateNegotiationGuide(jobData, userProfile);

  return {
    companyOverview,
    technicalQuestions: questions.technical,
    behavioralQuestions: questions.behavioral,
    counterQuestions,
    negotiationGuide
  };
};
```

**Key Functions:**
- `generateCompanyOverview()` - Company research, recent news, key facts
- `generateInterviewQuestions()` - 10 questions (5 technical, 5 behavioral)
- `generateAnswerFrameworks()` - STAR-method frameworks for each question
- `generateCounterQuestions()` - Smart questions to ask interviewer
- `generateNegotiationGuide()` - Salary ranges, negotiation strategies

#### 2. Create Interview Prep Prompt Templates
**File:** `Api/src/services/ai/prompts/interviewPrep.prompt.js`

```javascript
// Separate prompt templates for each component:
// - companyResearchPrompt
// - technicalQuestionsPrompt
// - behavioralQuestionsPrompt
// - answerFrameworkPrompt
// - counterQuestionsPrompt
// - negotiationGuidePrompt
```

#### 3. Add Interview Prep Endpoint
**File:** `Api/src/controllers/agent.controller.js`

```javascript
const generateInterviewPrepHandler = async (req, res) => {
  const { jobId, jobTitle, companyName, jobDescription, jobHighlights } = req.body;
  const userId = req.user?.email;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  if (!jobTitle || !companyName) {
    return res.status(400).json({ error: 'jobTitle and companyName required' });
  }

  try {
    // Get user profile
    const user = await prisma.user.findUnique({
      where: { email: userId },
      select: { firstName: true, lastName: true, email: true },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Generate interview prep
    const result = await generateInterviewPrep(user, {
      jobId,
      jobTitle,
      companyName,
      jobDescription,
      jobHighlights,
    });

    // Save to database
    const generatedContent = await prisma.generatedContent.create({
      data: {
        userId,
        contentType: 'interview_prep',
        jobId,
        jobTitle,
        companyName,
        content: JSON.stringify(result), // Store as JSON
        metadata: {
          components: ['company', 'questions', 'answers', 'counter', 'negotiation'],
          tokenCount: result.tokenCount,
        },
      },
    });

    // Log the action
    await logAgentAction(
      userId,
      'interview_prep',
      'generation',
      { jobId, jobTitle, companyName },
      { contentId: generatedContent.id, tokenCount: result.tokenCount },
      'success'
    );

    res.json({
      success: true,
      contentId: generatedContent.id,
      data: result,
    });
  } catch (error) {
    console.error('Interview prep generation error:', error);
    await logAgentAction(userId, 'interview_prep', 'generation',
      { jobId, jobTitle, companyName }, null, 'failed', error.message);

    res.status(500).json({
      error: 'Failed to generate interview prep',
      message: error.message,
    });
  }
};
```

#### 4. Register Endpoint
**File:** `Api/src/routes/agent.routes.js`

```javascript
router.post('/interview-prep', requireAuth, agentController.generateInterviewPrepHandler);
```

#### 5. Add Auto-Generation Trigger
**File:** `Api/src/controllers/tracker.controller.js` (updateRecord handler)

When application status is updated to "Interview Scheduled":
```javascript
if (newStatus === 'Interview Scheduled') {
  // Auto-generate interview prep asynchronously
  generateInterviewPrep(userId, jobData).catch(err =>
    console.error('Auto-generate interview prep failed:', err)
  );
}
```

### Phase 3B: Frontend API Client

**File:** `client/src/services/interviewPrep.service.js`

```javascript
export const generateInterviewPrepApi = (jobData) => {
  return baseFetch(ENDPOINTS.AGENT_INTERVIEW_PREP, {
    method: 'POST',
    body: JSON.stringify(jobData),
  });
};

export const getInterviewPrepApi = (jobId) => {
  return baseFetch(`${ENDPOINTS.AGENT_INTERVIEW_PREP}/${jobId}`);
};
```

Update `client/src/config/api.js`:
```javascript
AGENT_INTERVIEW_PREP: `${API_BASE_URL}/agent/interview-prep`,
```

### Phase 3C: Frontend Pages & Components

#### 1. Create Interview Prep Page
**File:** `client/src/pages/InterviewPrep/InterviewPrep.js`

```javascript
const InterviewPrep = () => {
  const { jobId } = useParams();
  const [prepData, setPrepData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('company');

  useEffect(() => {
    fetchInterviewPrep();
  }, [jobId]);

  const fetchInterviewPrep = async () => {
    try {
      const response = await getInterviewPrepApi(jobId);
      const data = await response.json();
      setPrepData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ip-container">
      <h1>Interview Preparation</h1>

      <div className="ip-tabs">
        <button
          className={`ip-tab ${activeTab === 'company' ? 'active' : ''}`}
          onClick={() => setActiveTab('company')}
        >
          Company Research
        </button>
        <button
          className={`ip-tab ${activeTab === 'questions' ? 'active' : ''}`}
          onClick={() => setActiveTab('questions')}
        >
          Practice Questions
        </button>
        <button
          className={`ip-tab ${activeTab === 'mock' ? 'active' : ''}`}
          onClick={() => setActiveTab('mock')}
        >
          Mock Interview
        </button>
        <button
          className={`ip-tab ${activeTab === 'negotiation' ? 'active' : ''}`}
          onClick={() => setActiveTab('negotiation')}
        >
          Negotiation Guide
        </button>
      </div>

      <div className="ip-content">
        {loading && <div>Loading interview prep...</div>}
        {error && <div className="ip-error">Error: {error}</div>}
        {prepData && (
          <>
            {activeTab === 'company' && <CompanyResearch data={prepData.companyOverview} />}
            {activeTab === 'questions' && <PracticeQuestions data={prepData} />}
            {activeTab === 'mock' && <MockInterview jobId={jobId} />}
            {activeTab === 'negotiation' && <NegotiationGuide data={prepData.negotiationGuide} />}
          </>
        )}
      </div>
    </div>
  );
};
```

#### 2. Create Tab Components

**CompanyResearch.js** - Display company info, recent news, key facts

**PracticeQuestions.js** - Display questions with expandable answer frameworks
```javascript
// Shows:
// - Technical Questions (5)
// - Behavioral Questions (5)
// - Counter-Questions to ask interviewer
// Each expandable to show full answer framework
```

**MockInterview.js** - Chat-based practice (future: can be enhanced with conversational AI)

**NegotiationGuide.js** - Salary data, negotiation strategies, scripts

#### 3. Create CSS
**File:** `client/src/pages/InterviewPrep/InterviewPrep.css`

Styling for:
- Tab navigation
- Question cards with expandable content
- Mock interview chat interface
- Negotiation guide sections
- Print-friendly styling

### Phase 3D: Integration Points

#### 1. Update JobSearch/Job Detail View
When user views a job and the status is "Interview Scheduled", show button:
```javascript
{status === 'Interview Scheduled' && (
  <Link to={`/joblist/interview-prep/${jobId}`}>
    View Interview Prep
  </Link>
)}
```

#### 2. Add Route to Router
```javascript
<Route path="/joblist/interview-prep/:jobId" element={<InterviewPrep />} />
```

#### 3. Notification/Redirect
When status updates to "Interview Scheduled":
- Show toast notification: "Interview prep generated! View it here."
- Or auto-redirect to interview prep page

### Phase 3E: Database Schema

No schema changes needed - use existing `GeneratedContent` model with:
- `contentType: 'interview_prep'`
- `content: JSON string` containing all prep components
- `metadata` containing tokenCount and component list

## File Structure Summary

### New Files:
```
Api/src/services/ai/
├── interviewPrep.service.js        (Core interview prep generation)
└── prompts/
    └── interviewPrep.prompt.js     (Prompt templates)

client/src/pages/InterviewPrep/
├── InterviewPrep.js                (Main page component)
├── InterviewPrep.css               (Styling)
└── components/
    ├── CompanyResearch.js
    ├── PracticeQuestions.js
    ├── MockInterview.js
    └── NegotiationGuide.js

client/src/services/
└── interviewPrep.service.js        (Frontend API client)
```

### Modified Files:
```
Api/src/controllers/
├── agent.controller.js             (Add generateInterviewPrepHandler)
└── tracker.controller.js           (Add auto-trigger on status change)

Api/src/routes/
└── agent.routes.js                 (Register /interview-prep endpoint)

client/src/config/
└── api.js                          (Add AGENT_INTERVIEW_PREP endpoint)

client/src/pages/JobSearch/
├── JobSearch.js                    (Add "View Interview Prep" button)
└── JobSearch.css                   (Style button)

client/src/App.js                   (Add InterviewPrep route)
```

## Implementation Order

1. ✅ Create interviewPrep.service.js with core functions
2. ✅ Create prompt templates
3. ✅ Add handler and endpoint
4. ✅ Create frontend API client
5. ✅ Create InterviewPrep page and tab components
6. ✅ Add CSS styling
7. ✅ Wire up auto-generation trigger in tracker controller
8. ✅ Add route and navigation
9. ✅ Test end-to-end
10. ✅ Document and commit

## Success Criteria

- Interview prep generates in < 3 seconds
- All components (company, questions, answers, negotiation) are high-quality
- UI is intuitive and responsive
- Auto-trigger works when status changes
- Data is properly saved and retrieved
- Error handling is graceful
- Token usage is tracked

## Future Enhancements

- Mock interview with real-time feedback from Claude
- Video interview practice with facial expression analysis
- Performance tracking across multiple practice sessions
- Customized prep based on company culture and role level
- Integration with calendar for interview scheduling
- Auto-generated follow-up email templates after interview
