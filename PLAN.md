# Job Portal — Complete Application Plan

## Vision

Transform the existing job search and tracking app into an **AI-powered autonomous job hunting platform** where intelligent agents work alongside the user to find, match, apply, prepare, and optimize every stage of the job search lifecycle.

---

## Current State

### What Exists Today

| Layer | Tech | Status |
|-------|------|--------|
| Frontend | React 18, React Router, Bootstrap 5 | Functional |
| Backend | Node.js, Express.js | Functional |
| Database | MySQL + Prisma ORM | Functional |
| External API | RapidAPI JSearch (LinkedIn, Indeed, Glassdoor) | Integrated |
| Auth | JWT (HTTP-only cookies) | Functional |
| AI/ML | None | Not started |

### Existing Features

- User registration and login (JWT auth)
- Job search across LinkedIn, Indeed, Glassdoor via JSearch API
- Mark jobs as applied
- Track application statuses (Applied → Interview Scheduled → Selected/Rejected)
- Performance metrics per platform (jobs viewed, applied, interviews, rejections)
- User dashboard with navigation

### Known Issues to Fix First

- [ ] Passwords stored in plaintext — migrate to bcrypt hashing
- [ ] JWT secret hardcoded in source — move to `.env`
- [ ] RapidAPI key exposed in client-side code — proxy through backend
- [ ] No input sanitization — add validation middleware
- [ ] Monolithic `Api/index.js` (383 lines) — split into routes/controllers/services
- [ ] Console logs and `alert()` calls left in production code — clean up
- [ ] Gender field captured in registration but not stored in DB

---

## Phase 0: Foundation & Security Hardening

> **Goal:** Fix critical security issues and refactor for scalability before adding AI features.

### 0.1 Security Fixes

- [ ] Hash passwords with bcrypt on registration and login
- [ ] Move all secrets (JWT secret, DB credentials) to `.env`
- [ ] Proxy RapidAPI calls through the backend — remove API key from client
- [ ] Add input sanitization and validation middleware (express-validator)
- [ ] Add rate limiting on auth and API endpoints (express-rate-limit)
- [ ] Set `secure: true` and `sameSite: strict` on cookies for production

### 0.2 Backend Refactor

- [ ] Split `Api/index.js` into modular structure:
  ```
  Api/
  ├── routes/
  │   ├── auth.routes.js
  │   ├── application.routes.js
  │   ├── jobs.routes.js
  │   └── agent.routes.js        # New — AI agent endpoints
  ├── controllers/
  │   ├── auth.controller.js
  │   ├── application.controller.js
  │   ├── jobs.controller.js
  │   └── agent.controller.js
  ├── services/
  │   ├── auth.service.js
  │   ├── job.service.js
  │   └── ai/                    # New — AI service layer
  │       ├── coverLetter.service.js
  │       ├── matching.service.js
  │       ├── interviewPrep.service.js
  │       ├── analytics.service.js
  │       └── agents/
  │           ├── followUp.agent.js
  │           ├── jobAlert.agent.js
  │           └── autoApply.agent.js
  ├── middleware/
  │   ├── auth.middleware.js
  │   ├── validate.middleware.js
  │   └── rateLimit.middleware.js
  ├── prisma/
  │   └── schema.prisma
  ├── config/
  │   └── index.js
  └── index.js                   # Slim entry point
  ```

### 0.3 Database Schema Additions

- [ ] Add `Resume` model for storing user resumes
- [ ] Add `UserPreferences` model for AI agent configuration
- [ ] Add `AgentLog` model for tracking agent actions
- [ ] Add `GeneratedContent` model for storing AI outputs (cover letters, etc.)

```prisma
model Resume {
  id        Int      @id @default(autoincrement())
  userId    String
  user      User     @relation(fields: [userId], references: [email])
  content   String   @db.LongText    // parsed resume text
  fileName  String
  skills    Json?                     // extracted skills array
  experience Json?                    // parsed experience
  education  Json?                    // parsed education
  uploadedAt DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

model UserPreferences {
  userId           String   @id
  user             User     @relation(fields: [userId], references: [email])
  preferredRoles   Json?    // ["Software Engineer", "Full Stack Developer"]
  preferredLocations Json?  // ["Remote", "San Francisco, CA"]
  salaryMin        Int?
  salaryMax        Int?
  remoteOnly       Boolean  @default(false)
  platforms        Json?    // ["LinkedIn", "Indeed"]
  alertFrequency   String   @default("daily") // "realtime" | "daily" | "weekly"
  autoApplyEnabled Boolean  @default(false)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

model AgentLog {
  id         Int      @id @default(autoincrement())
  userId     String
  user       User     @relation(fields: [userId], references: [email])
  agentType  String   // "cover_letter" | "matching" | "follow_up" | "alert" | "auto_apply"
  action     String   // description of what the agent did
  input      Json?    // what was fed to the agent
  output     Json?    // what the agent produced
  status     String   // "success" | "failed" | "pending_approval"
  createdAt  DateTime @default(now())
}

model GeneratedContent {
  id          Int      @id @default(autoincrement())
  userId      String
  user        User     @relation(fields: [userId], references: [email])
  contentType String   // "cover_letter" | "follow_up_email" | "interview_prep"
  jobId       String?
  content     String   @db.LongText
  metadata    Json?
  createdAt   DateTime @default(now())
}
```

---

## Phase 1: Cover Letter & Cold Email Generator Agent

> **Goal:** Given a job listing, generate a tailored cover letter using the user's profile and resume.

### Why First

- Lowest complexity, highest immediate user value
- All required data already exists (job details from JSearch, user profile)
- Single LLM API call — no embeddings, no background jobs

### Implementation

#### Backend

- [ ] `POST /api/agent/cover-letter` endpoint
  - Input: `{ jobId, jobDescription, companyName, jobTitle }`
  - Loads user profile + resume from DB
  - Constructs prompt with job details + user background
  - Calls LLM API (Anthropic Claude)
  - Returns generated cover letter
  - Logs to `AgentLog` and saves to `GeneratedContent`

- [ ] `GET /api/agent/cover-letters/:jobId` — retrieve saved cover letters
- [ ] `POST /api/agent/cold-email` — similar flow but generates outreach email

#### Frontend

- [ ] Add "Generate Cover Letter" button in job detail view (`JobListings.js`)
- [ ] Cover letter modal with:
  - Generated text (editable)
  - "Regenerate" button with tone options (formal, conversational, concise)
  - "Copy to Clipboard" button
  - "Save" button
- [ ] Cover letter history accessible from profile page

#### LLM Prompt Strategy

```
System: You are an expert career coach and professional writer.

Context:
- Candidate: {firstName} {lastName}
- Skills: {extracted skills from resume}
- Experience: {parsed experience}
- Target Role: {jobTitle} at {companyName}
- Job Description: {jobDescription}
- Key Requirements: {jobHighlights}

Task: Write a compelling, personalized cover letter that:
1. Opens with a hook relevant to the company
2. Maps the candidate's experience to the job requirements
3. Demonstrates knowledge of the company
4. Closes with a clear call to action
5. Stays under 400 words
```

---

## Phase 2: Resume-Job Matching Agent

> **Goal:** Score and rank every job listing by how well it matches the user's resume and preferences.

### Implementation

#### Backend

- [ ] `POST /api/agent/match-score` endpoint
  - Input: `{ jobId, jobDescription, jobHighlights }`
  - Loads user resume + preferences
  - Computes match score (0-100) using:
    - **Keyword matching:** Extract skills from job description, compare to resume skills
    - **Semantic similarity:** Generate embeddings for resume and job description, compute cosine similarity
    - **Preference alignment:** Location, salary, remote, employment type
  - Returns: `{ score, breakdown: { skills: 85, experience: 70, preferences: 95 }, missingSkills: [...] }`

- [ ] `POST /api/agent/batch-match` — score multiple jobs in one call
- [ ] Store match scores in a cache (Redis or in-memory) to avoid recomputation

#### Frontend

- [ ] Add match score badge to each job card in `JobListings.js`
  - Green (80-100): "Great Match"
  - Yellow (50-79): "Good Match"
  - Red (0-49): "Low Match"
- [ ] "Sort by Match Score" option in job search
- [ ] Match breakdown tooltip showing skills gap
- [ ] "Missing Skills" section highlighting what to learn

#### Tech

- [ ] Embeddings: OpenAI `text-embedding-3-small` or Anthropic embeddings
- [ ] Vector similarity: Compute in-memory (no vector DB needed at this scale)
- [ ] Skill extraction: LLM-based parsing of resume and job descriptions

---

## Phase 3: Interview Preparation Agent

> **Goal:** When a user's application moves to "Interview Scheduled", an AI agent generates a complete interview prep package.

### Implementation

#### Backend

- [ ] Trigger on `POST /api/updateRecord` when `status = "Interview Scheduled"`
- [ ] `POST /api/agent/interview-prep` endpoint
  - Generates:
    - Company overview and recent news
    - 10 likely interview questions (technical + behavioral) based on job description
    - STAR-method answer frameworks using user's experience
    - Questions the candidate should ask the interviewer
    - Salary negotiation data points
  - Saves to `GeneratedContent`

- [ ] `POST /api/agent/mock-interview` (stretch goal)
  - Conversational endpoint for practice Q&A
  - Agent asks question → user responds → agent provides feedback
  - Tracks performance across sessions

#### Frontend

- [ ] New page: `/joblist/interview-prep/:jobId`
- [ ] Auto-redirect or notification when status changes to "Interview Scheduled"
- [ ] Tabbed interface:
  - **Company Research** — AI-generated company summary
  - **Practice Questions** — categorized questions with expandable answer guides
  - **Mock Interview** — chat-based practice mode
  - **Negotiation** — salary data and negotiation scripts

---

## Phase 4: Job Market Analytics Agent

> **Goal:** Analyze the user's application data and market trends to provide actionable strategic insights.

### Implementation

#### Backend

- [ ] `GET /api/agent/insights` endpoint
  - Analyzes `PerformanceMetrics` + `Application` data
  - Generates insights like:
    - "Your interview rate on LinkedIn (25%) is 3x higher than Indeed (8%) — prioritize LinkedIn"
    - "Applications submitted on Tuesdays have a 40% higher response rate"
    - "You're missing 3 commonly requested skills: Docker, Kubernetes, AWS"
    - "Your rejection rate dropped 15% after adding project links to applications"
  - Uses LLM to generate natural language insights from structured data

- [ ] `GET /api/agent/market-trends` endpoint
  - Analyzes recent JSearch results for user's target roles
  - Reports on: demand trends, salary ranges, top required skills, location hotspots

#### Frontend

- [ ] Redesign `dashboard.js` with AI insight cards
  - Insight of the day (rotating)
  - Performance trends chart
  - Skill gap analysis
  - Platform comparison
  - Recommended actions list
- [ ] Weekly summary email (optional, via agent)

---

## Phase 5: Application Follow-Up Agent

> **Goal:** Autonomously monitor stale applications and draft follow-up communications.

### Implementation

#### Backend

- [ ] Background agent running on a schedule (node-cron)
- [ ] Logic:
  ```
  For each application where:
    - status = "Applied"
    - dateApplied > 7 days ago
    - no dateUpdated
  Generate a follow-up email draft and notify the user
  ```
- [ ] `GET /api/agent/follow-ups` — list pending follow-up suggestions
- [ ] `POST /api/agent/follow-ups/:id/approve` — user approves a follow-up
- [ ] `POST /api/agent/follow-ups/:id/dismiss` — user dismisses

#### Frontend

- [ ] Notification badge on dashboard for pending follow-ups
- [ ] Follow-up queue in profile page:
  - Company name, days since applied, suggested email draft
  - "Edit & Send" / "Dismiss" / "Snooze" actions
- [ ] Follow-up timeline per application

#### Agent Behavior

- Generates polite, professional follow-up emails
- Escalates tone slightly with each successive follow-up (max 3)
- Learns from user edits to improve future drafts
- Respects user-set quiet periods (e.g., no follow-ups on weekends)

---

## Phase 6: Smart Job Alerts Agent

> **Goal:** Proactively discover and surface new job postings matching user preferences without manual search.

### Implementation

#### Backend

- [ ] Background agent on configurable schedule (realtime / daily / weekly)
- [ ] Workflow:
  1. Load `UserPreferences` for each active user
  2. Query JSearch API with saved search criteria
  3. Deduplicate against existing `Application` records (already applied)
  4. Score each new job using the Matching Agent (Phase 2)
  5. Filter by minimum match threshold (configurable, default 60%)
  6. Save alerts to new `JobAlert` model
  7. Send notification (in-app + optional email)

- [ ] `GET /api/agent/alerts` — fetch unread alerts
- [ ] `POST /api/agent/alerts/:id/apply` — quick-apply from alert
- [ ] `POST /api/agent/alerts/:id/dismiss` — dismiss alert

#### Database Addition

```prisma
model JobAlert {
  id          Int      @id @default(autoincrement())
  userId      String
  user        User     @relation(fields: [userId], references: [email])
  jobId       String
  jobTitle    String
  companyName String
  matchScore  Int
  jobLink     String   @db.LongText
  platform    String
  seen        Boolean  @default(false)
  dismissed   Boolean  @default(false)
  createdAt   DateTime @default(now())
}
```

#### Frontend

- [ ] Alert bell icon in `TopNav.js` with unread count
- [ ] Alert dropdown/page showing matched jobs with scores
- [ ] One-click apply from alert
- [ ] Preference configuration page linked from dashboard

---

## Phase 7: Resume Optimization Agent

> **Goal:** Analyze the user's resume against target job descriptions and suggest concrete improvements for ATS optimization.

### Implementation

#### Backend

- [ ] `POST /api/agent/resume/upload` — parse and store resume (PDF/DOCX → text)
- [ ] `POST /api/agent/resume/analyze` endpoint
  - Input: resume + target job description (or aggregate of recent job searches)
  - Output:
    - ATS compatibility score (0-100)
    - Missing keywords with context
    - Section-by-section feedback
    - Reformatted bullet points using action verbs + metrics
    - Tailored resume variant for a specific role

- [ ] `POST /api/agent/resume/tailor/:jobId` — generate a job-specific resume version
- [ ] Resume parsing via `pdf-parse` (PDF) or `mammoth` (DOCX)

#### Frontend

- [ ] New page: `/joblist/resume`
- [ ] Resume upload with drag-and-drop
- [ ] Side-by-side view: original resume | AI suggestions
- [ ] ATS score meter
- [ ] "Apply Suggestions" button to generate optimized version
- [ ] Download tailored resume as PDF

---

## Phase 8: Auto-Apply Agent (Advanced)

> **Goal:** Fully autonomous agent that discovers, evaluates, and applies to jobs on the user's behalf.

### Implementation

#### Backend

- [ ] Orchestrator agent that chains:
  1. **Discovery:** Smart Job Alerts Agent finds new postings
  2. **Evaluation:** Matching Agent scores them
  3. **Content Generation:** Cover Letter Agent creates tailored application
  4. **Resume Tailoring:** Resume Agent creates job-specific version
  5. **Application:** Creates application record, stores generated content
  6. **Reporting:** Logs all actions, notifies user

- [ ] `POST /api/agent/auto-apply/configure` — set criteria and enable
- [ ] `GET /api/agent/auto-apply/queue` — review pending auto-applications before submission
- [ ] `POST /api/agent/auto-apply/approve-all` — batch approve
- [ ] Safety: **Human-in-the-loop by default** — agent queues applications for user approval unless explicitly set to fully autonomous

#### Frontend

- [ ] Auto-apply configuration wizard:
  - Target roles, locations, salary range
  - Maximum applications per day
  - Approval mode: "Review each" | "Auto-approve above 80% match" | "Fully autonomous"
- [ ] Auto-apply activity feed showing agent actions
- [ ] Daily summary card on dashboard

#### Agent Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Orchestrator Agent                  │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐ │
│  │ Discovery │→│ Matching  │→│ Content Generation │ │
│  │  Agent    │  │  Agent   │  │  (Cover Letter +  │ │
│  │          │  │          │  │   Resume Tailor)   │ │
│  └──────────┘  └──────────┘  └───────────────────┘ │
│                                       │             │
│                                       ▼             │
│                              ┌──────────────────┐   │
│                              │  Human Approval   │   │
│                              │  Queue (default)  │   │
│                              └──────────────────┘   │
│                                       │             │
│                                       ▼             │
│                              ┌──────────────────┐   │
│                              │  Apply & Log      │   │
│                              └──────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## Tech Stack Additions

| Component | Technology | Purpose |
|-----------|-----------|---------|
| LLM API | Anthropic Claude API | Text generation (cover letters, prep, insights) |
| Embeddings | OpenAI text-embedding-3-small | Semantic matching for resume-job scoring |
| Resume Parsing | pdf-parse + mammoth | Extract text from PDF/DOCX uploads |
| Background Jobs | node-cron + Bull (Redis) | Scheduled agent execution |
| Cache | Redis | Match score caching, job dedup |
| Email | Nodemailer + SendGrid | Alert notifications, follow-up delivery |
| File Storage | Multer + local/S3 | Resume file uploads |
| Logging | Winston | Structured agent activity logging |

---

## API Key Management

All AI and external API keys managed via `.env`:

```env
# Existing
DATABASE_URL=mysql://...
JWT_SECRET=...
RAPIDAPI_KEY=...

# New — AI Services
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...          # For embeddings only

# New — Infrastructure
REDIS_URL=redis://localhost:6379
SENDGRID_API_KEY=SG...

# New — Agent Config
AUTO_APPLY_MAX_PER_DAY=10
ALERT_CHECK_INTERVAL_MINUTES=60
FOLLOW_UP_DAYS_THRESHOLD=7
```

---

## Milestone Timeline

| Phase | Name | Dependencies | Key Deliverable |
|-------|------|-------------|----------------|
| **0** | Foundation & Security | None | Secure, modular codebase |
| **1** | Cover Letter Agent | Phase 0 | One-click cover letter generation |
| **2** | Resume-Job Matching | Phase 0 | Match scores on every job listing |
| **3** | Interview Prep Agent | Phase 0, 1 | Auto-generated interview prep packages |
| **4** | Market Analytics Agent | Phase 0, 2 | AI-powered dashboard insights |
| **5** | Follow-Up Agent | Phase 0, 1 | Automated follow-up email drafts |
| **6** | Smart Job Alerts | Phase 0, 2 | Proactive job notifications |
| **7** | Resume Optimizer | Phase 0, 2 | ATS-optimized resume variants |
| **8** | Auto-Apply Agent | Phase 1-7 | Fully autonomous job application |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Applications per user per week | 3x increase |
| Interview conversion rate | 2x improvement |
| Time spent per application | 70% reduction |
| User-reported job search satisfaction | 4.5+ / 5.0 |
| Cover letters generated per job search | 80%+ of viewed jobs |
| Match score accuracy (user feedback) | 75%+ "agree" |
| Follow-up email send rate | 60%+ of stale applications |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                        React Frontend                        │
│  ┌──────┐ ┌──────────┐ ┌─────────┐ ┌────────┐ ┌──────────┐ │
│  │Search│ │Dashboard │ │Profile  │ │Resume  │ │Interview │ │
│  │+Match│ │+Insights │ │+Follow  │ │Optimize│ │  Prep    │ │
│  │Score │ │          │ │Up Queue │ │        │ │          │ │
│  └──┬───┘ └────┬─────┘ └────┬────┘ └───┬────┘ └────┬─────┘ │
└─────┼──────────┼────────────┼──────────┼───────────┼────────┘
      │          │            │          │           │
      ▼          ▼            ▼          ▼           ▼
┌──────────────────────────────────────────────────────────────┐
│                    Express.js API Layer                       │
│  ┌─────────┐ ┌───────────┐ ┌──────────┐ ┌─────────────────┐ │
│  │Auth     │ │Application│ │Jobs      │ │Agent Endpoints  │ │
│  │Routes   │ │Routes     │ │Routes    │ │(AI Features)    │ │
│  └─────────┘ └───────────┘ └──────────┘ └────────┬────────┘ │
└──────────────────────────────────────────────────┼──────────┘
                                                   │
      ┌────────────────────────────────────────────┤
      ▼                                            ▼
┌────────────────┐                    ┌──────────────────────┐
│  AI Service    │                    │  Background Agents   │
│  Layer         │                    │                      │
│ ┌────────────┐ │                    │ ┌──────────────────┐ │
│ │Cover Letter│ │                    │ │ Job Alert Agent   │ │
│ │Matching    │ │   ┌──────────┐    │ │ Follow-Up Agent   │ │
│ │Interview   │◄──►│Anthropic │    │ │ Auto-Apply Agent  │ │
│ │Analytics   │ │   │Claude API│    │ │ (node-cron + Bull)│ │
│ │Resume      │ │   └──────────┘    │ └──────────────────┘ │
│ └────────────┘ │                    └──────────────────────┘
└────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐ │
│  │  MySQL   │  │  Redis   │  │  File    │  │  External   │ │
│  │ (Prisma) │  │ (Cache + │  │ Storage  │  │  APIs       │ │
│  │          │  │  Queue)  │  │ (Resumes)│  │ (JSearch)   │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## Getting Started (For Contributors)

1. Complete **Phase 0** before starting any AI feature
2. Each phase is independently deployable
3. All AI features must have a **human-in-the-loop** option
4. Every agent action must be logged to `AgentLog`
5. Follow the existing Prisma + Express patterns
6. Write tests for all agent services
7. Keep LLM prompts in separate template files for easy iteration
