# Job Portal — Microservices & App Shell Architecture

## Vision

Transform the monolithic job portal into a **distributed microservices platform** with a **micro-frontend app shell**, where every service and every UI feature is an independent deployable unit that scales on its own.

---

## Current State (Monolith)

```
TODAY — Everything in 2 processes:

┌─────────────────────────┐     ┌──────────────────────────────────────┐
│  React SPA (client/)    │────▶│  Express Monolith (Api/index.js)     │
│                         │     │                                      │
│  Home                   │     │  /api/register     ─┐               │
│  Login                  │     │  /api/login         │ All in one    │
│  Register               │     │  /api/logout        │ 383-line file │
│  Dashboard              │     │  /api/me            │               │
│  JobListings            │     │  /api/application   │               │
│  Profile                │     │  /api/getRecords    │               │
│  TopNav                 │     │  /api/updateRecord  │               │
│  AuthContext (all API)  │     │  /api/myJobIds      │               │
│                         │     │  /api/myJobIdsByStatus ─┘           │
│  + RapidAPI key in      │     │                                      │
│    client-side code     │     │  Single MySQL DB (Prisma)            │
└─────────────────────────┘     └──────────────────────────────────────┘
```

**Problems:**
- Cannot scale job search independently from auth
- Single DB failure takes down everything
- Frontend is one bundle — changing dashboard redeploys job search
- API key in client code — security risk
- No service isolation — a bug in application tracking crashes the whole API
- AI agents will need their own scaling profile (long-running, bursty)

---

## Target State

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            APP SHELL (Host)                             │
│  ┌───────────┐  Loads micro-frontends at runtime via Module Federation │
│  │  Shell    │  Owns: TopNav, routing, auth token, shared design system│
│  │  Layout   │                                                         │
│  │  + Router │  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌─────────────┐  │
│  │           │  │  Auth    │ │  Jobs    │ │Tracker │ │  AI Studio  │  │
│  │           │  │  MFE     │ │  MFE    │ │  MFE   │ │  MFE        │  │
│  │           │  │ login    │ │ search  │ │profile │ │ cover letter│  │
│  │           │  │ register │ │ listing │ │metrics │ │ interview   │  │
│  │           │  │          │ │ detail  │ │        │ │ resume      │  │
│  │           │  │          │ │         │ │        │ │ dashboard   │  │
│  └───────────┘  └──────────┘ └──────────┘ └────────┘ └─────────────┘  │
└────────┬──────────────┬────────────┬───────────┬──────────────┬────────┘
         │              │            │           │              │
         ▼              ▼            ▼           ▼              ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                          API GATEWAY                                    │
│  Rate limiting · JWT validation · Request routing · CORS · Logging     │
└────┬──────────┬──────────────┬──────────────┬──────────────┬────────────┘
     │          │              │              │              │
     ▼          ▼              ▼              ▼              ▼
┌────────┐ ┌─────────┐ ┌────────────┐ ┌───────────┐ ┌──────────────────┐
│  Auth  │ │  Job    │ │Application │ │Notification│ │   AI Agent       │
│Service │ │ Search  │ │  Tracker   │ │  Service   │ │   Service        │
│        │ │ Service │ │  Service   │ │            │ │                  │
│register│ │ search  │ │ create app │ │ in-app     │ │ cover letter     │
│login   │ │ proxy   │ │ update     │ │ email      │ │ matching         │
│logout  │ │ cache   │ │ list       │ │ websocket  │ │ interview prep   │
│verify  │ │ match   │ │ metrics    │ │ push       │ │ analytics        │
│refresh │ │ alerts  │ │            │ │            │ │ follow-up        │
│        │ │         │ │            │ │            │ │ resume optimizer │
│        │ │         │ │            │ │            │ │ auto-apply       │
└───┬────┘ └────┬────┘ └─────┬──────┘ └─────┬─────┘ └────────┬─────────┘
    │           │            │              │                 │
    ▼           ▼            ▼              ▼                 ▼
┌────────┐ ┌────────┐  ┌────────┐    ┌──────────┐    ┌──────────────┐
│User DB │ │Job     │  │App DB  │    │  Redis   │    │ Vector Store │
│(MySQL) │ │Cache   │  │(MySQL) │    │ Pub/Sub  │    │ + LLM APIs   │
│        │ │(Redis) │  │        │    │ + Queue  │    │              │
└────────┘ └────────┘  └────────┘    └──────────┘    └──────────────┘
```

---

# Part A: Backend — Microservices

## Service Decomposition

Split the monolith into **5 independent services** based on domain boundaries from `Api/index.js` + new capabilities:

---

### Service 1: Auth Service (`services/auth/`)

**Owns:** User identity, registration, login, token management

| Current Endpoint | New Endpoint | Notes |
|-----------------|-------------|-------|
| `POST /api/register` | `POST /auth/register` | Add bcrypt hashing |
| `POST /api/login` | `POST /auth/login` | Return JWT access + refresh tokens |
| `POST /api/logout` | `POST /auth/logout` | Invalidate refresh token |
| `GET /api/me` | `GET /auth/me` | Decode token, return user |
| — | `POST /auth/refresh` | New — refresh token rotation |

**Database:** Dedicated `auth_db` (MySQL)
```prisma
model User {
  email       String   @id @unique
  password    String   // bcrypt hashed
  firstName   String
  lastName    String
  dateOfBirth DateTime
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Port:** `4001`
**Scaling:** Low traffic, fast responses. 1-2 instances.

---

### Service 2: Job Search Service (`services/job-search/`)

**Owns:** External job API proxy, search, caching, job alerts

| Current Source | New Endpoint | Notes |
|---------------|-------------|-------|
| Client-side RapidAPI call in `JobListings.js` | `GET /jobs/search?q=&location=&platform=&page=` | Moves API key to server side |
| — | `GET /jobs/:jobId` | Single job detail |
| — | `GET /jobs/alerts` | Smart alerts |
| — | `POST /jobs/alerts/configure` | Alert preferences |

**Database:** Redis only (cache, no persistent DB)
```
Cache keys:
  jobs:search:{query}:{location}:{platform}:{page} → TTL 30min
  jobs:detail:{jobId} → TTL 24hr
```

**Port:** `4002`
**Scaling:** High read traffic, bursty. 2-4 instances. Stateless + Redis = horizontally scalable.

---

### Service 3: Application Tracker Service (`services/tracker/`)

**Owns:** Job applications, status tracking, performance metrics

| Current Endpoint | New Endpoint | Notes |
|-----------------|-------------|-------|
| `POST /api/application` | `POST /tracker/applications` | Create application |
| `POST /api/getRecords` | `GET /tracker/applications?userId=` | List applications |
| `POST /api/updateRecord` | `PATCH /tracker/applications/:jobId` | Update status |
| `GET /api/myJobIds` | `GET /tracker/applications/ids` | Applied job IDs |
| `GET /api/myJobIdsByStatus` | `GET /tracker/applications/ids?status=selected,rejected` | Filter by status |
| — | `GET /tracker/metrics?userId=` | Performance metrics |

**Database:** Dedicated `tracker_db` (MySQL)
```prisma
model Application {
  userId        String
  jobListingId  String
  status        String
  dateApplied   DateTime
  dateUpdated   DateTime?
  notes         String?
  jobName       String
  jobLink       String?   @db.LongText
  companyName   String?
  platformName  String?
  @@id([userId, jobListingId])
}

model PerformanceMetrics {
  userId         String
  platformName   String
  totalJobsViewed Int    @default(0)
  jobsApplied    Int    @default(0)
  rejections     Int    @default(0)
  interviews     Int    @default(0)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  @@id([userId, platformName])
}

model PlatformName {
  platformName String   @id @unique
  createdDate  DateTime @default(now())
}
```

**Port:** `4003`
**Scaling:** Medium traffic. 1-2 instances.

---

### Service 4: Notification Service (`services/notification/`)

**Owns:** In-app notifications, email delivery, WebSocket push

| New Endpoint | Purpose |
|-------------|---------|
| `GET /notifications` | List user notifications |
| `PATCH /notifications/:id/read` | Mark as read |
| `WS /notifications/live` | WebSocket real-time push |
| Internal: consumes events from Redis pub/sub | |

**Database:** Redis (notification queue + pub/sub)
**Port:** `4004`
**Scaling:** Connection-bound. Scale based on connected users.

---

### Service 5: AI Agent Service (`services/ai-agent/`)

**Owns:** All LLM features — cover letters, matching, interview prep, analytics, follow-ups, resume optimization, auto-apply

| Endpoint | AI Feature |
|----------|-----------|
| `POST /ai/cover-letter` | Generate cover letter |
| `POST /ai/cold-email` | Generate outreach email |
| `POST /ai/match-score` | Score job-resume match |
| `POST /ai/batch-match` | Batch scoring |
| `POST /ai/interview-prep` | Generate prep package |
| `POST /ai/mock-interview` | Conversational practice |
| `GET /ai/insights` | Analytics insights |
| `GET /ai/market-trends` | Market analysis |
| `POST /ai/resume/upload` | Parse & store resume |
| `POST /ai/resume/analyze` | ATS analysis |
| `POST /ai/resume/tailor/:jobId` | Job-specific resume |
| `GET /ai/follow-ups` | Pending follow-ups |
| `POST /ai/follow-ups/:id/approve` | Approve follow-up |
| `POST /ai/auto-apply/configure` | Auto-apply settings |
| `GET /ai/auto-apply/queue` | Pending auto-applies |

**Database:** Dedicated `ai_db` (MySQL) + Vector store
```prisma
model Resume {
  id         Int      @id @default(autoincrement())
  userId     String   @unique
  content    String   @db.LongText
  fileName   String
  skills     Json?
  experience Json?
  education  Json?
  embedding  Json?
  uploadedAt DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

model UserPreferences {
  userId             String  @id
  preferredRoles     Json?
  preferredLocations Json?
  salaryMin          Int?
  salaryMax          Int?
  remoteOnly         Boolean @default(false)
  platforms          Json?
  alertFrequency     String  @default("daily")
  autoApplyEnabled   Boolean @default(false)
  matchThreshold     Int     @default(60)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}

model AgentLog {
  id        Int      @id @default(autoincrement())
  userId    String
  agentType String
  action    String
  input     Json?
  output    Json?
  status    String
  createdAt DateTime @default(now())
}

model GeneratedContent {
  id          Int      @id @default(autoincrement())
  userId      String
  contentType String
  jobId       String?
  content     String   @db.LongText
  metadata    Json?
  createdAt   DateTime @default(now())
}

model JobAlert {
  id          Int      @id @default(autoincrement())
  userId      String
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

**Port:** `4005`
**Scaling:** CPU/memory intensive, long-running LLM calls. 2-4 instances with separate worker pools.

---

## API Gateway

Single entry point. All micro-frontends talk to `https://api.jobportal.com/` only.

```
Routing rules:
  /auth/**          → Auth Service        (localhost:4001)
  /jobs/**          → Job Search Service  (localhost:4002)
  /tracker/**       → Tracker Service     (localhost:4003)
  /notifications/** → Notification Service (localhost:4004)
  /ai/**            → AI Agent Service    (localhost:4005)
```

**Responsibilities:**
- JWT validation on every request (except `/auth/login`, `/auth/register`)
- Inject `X-User-Id` and `X-User-Email` headers for downstream services
- Rate limiting per user per service
- Request/response logging
- CORS policy
- Circuit breaker (AI service down should not cascade to job search)

**Tech:** Start with lightweight custom Express proxy. Migrate to Kong/Traefik later.
**Port:** `4000`

---

## Inter-Service Communication

Services never call each other directly over HTTP. They communicate via **Redis Pub/Sub + Bull queues**.

### Event Bus (Redis Pub/Sub)

```
Events:

1. auth.user.registered
   Publisher:   Auth Service
   Subscribers: Notification Service (welcome email)

2. tracker.application.created
   Publisher:   Tracker Service
   Subscribers: AI Service (trigger match score)
                Notification Service (confirm saved)

3. tracker.application.statusChanged
   Publisher:   Tracker Service
   Payload:     { userId, jobId, oldStatus, newStatus }
   Subscribers: AI Service (if "Interview Scheduled" → generate prep)
                AI Service (if "Rejected"/"Selected" → update model)
                Notification Service (push alert)

4. ai.coverLetter.generated
   Publisher:   AI Service
   Subscribers: Notification Service (notify user)

5. ai.alert.newMatches
   Publisher:   AI Service (background cron)
   Subscribers: Notification Service (push job alerts)

6. ai.followUp.due
   Publisher:   AI Service (cron)
   Subscribers: Notification Service (remind user)
```

### Work Queues (Bull + Redis)

For long-running AI tasks:

```
Queues:

1. ai:cover-letter
   HTTP receives request → enqueues job → returns jobId
   Worker picks up → calls LLM → stores result → publishes event
   Client polls status or gets WebSocket push

2. ai:batch-match
   Enqueue N scoring jobs → workers process in parallel → aggregate

3. ai:background-agents
   Cron adds scheduled jobs → workers execute (follow-ups, alerts, auto-apply)
```

---

## Authentication Flow (Across Services)

```
1. User logs in → Auth Service issues:
   - Access token (JWT, 15min, in-memory on frontend)
   - Refresh token (JWT, 7d, HTTP-only secure cookie)

2. Every request → API Gateway validates access token signature

3. Gateway injects X-User-Id, X-User-Email headers for downstream services

4. Downstream services trust gateway headers (only accept traffic from gateway)

5. On access token expiry → frontend calls /auth/refresh → new access token
```

---

# Part B: Frontend — App Shell + Micro-Frontends

## Shell Responsibilities

The shell is the host application. It owns:

1. **Layout** — TopNav, sidebar, footer (persistent across all MFEs)
2. **Routing** — URL-to-MFE mapping
3. **Auth state** — Stores JWT, exposes `useAuth()` hook to all MFEs
4. **Shared design system** — Bootstrap theme, common components
5. **Error boundaries** — If an MFE fails to load, shell shows fallback
6. **Notifications** — WebSocket connection for real-time alerts

The shell owns NO business logic.

---

## Micro-Frontend Breakdown

### MFE 1: Auth (`mfe-auth`) — Port 3001

**Maps from:** `App.js` (login), `Login.js` (register), `Home.js` (landing)

| Route | Component | Current File |
|-------|-----------|-------------|
| `/` | Landing page | `Home.js` |
| `/login` | Login form | `App.js` |
| `/register` | Registration form | `Login.js` |

**Backend:** Auth Service (`/auth/*`)

---

### MFE 2: Jobs (`mfe-jobs`) — Port 3002

**Maps from:** `JobListings.js`

| Route | Component | Current File |
|-------|-----------|-------------|
| `/jobs` | Job search + results | `JobListings.js` (search + list) |
| `/jobs/:jobId` | Job detail view | `JobListings.js` (selectedJob) |

**Backend:** Job Search (`/jobs/*`), Tracker (`/tracker/*`), AI (`/ai/match-score`, `/ai/cover-letter`)

---

### MFE 3: Tracker (`mfe-tracker`) — Port 3003

**Maps from:** `profile.js`, `dashboard.js`

| Route | Component | Current File |
|-------|-----------|-------------|
| `/dashboard` | Dashboard home | `dashboard.js` |
| `/tracker` | Application list + status | `profile.js` |
| `/tracker/metrics` | Performance metrics | New |

**Backend:** Tracker Service (`/tracker/*`)

---

### MFE 4: AI Studio (`mfe-ai-studio`) — Port 3004

**Maps from:** Nothing (all new)

| Route | Component |
|-------|-----------|
| `/ai/dashboard` | AI insights + analytics |
| `/ai/cover-letters` | Cover letter generator + history |
| `/ai/interview-prep/:jobId` | Interview prep package |
| `/ai/resume` | Resume upload + optimization |
| `/ai/follow-ups` | Follow-up queue |
| `/ai/auto-apply` | Auto-apply config + feed |

**Backend:** AI Agent Service (`/ai/*`)

---

## Module Federation Configuration

### Shell (Host)

```javascript
// frontend/shell/webpack.config.js
new ModuleFederationPlugin({
  name: 'shell',
  remotes: {
    mfeAuth:     'mfeAuth@http://localhost:3001/remoteEntry.js',
    mfeJobs:     'mfeJobs@http://localhost:3002/remoteEntry.js',
    mfeTracker:  'mfeTracker@http://localhost:3003/remoteEntry.js',
    mfeAIStudio: 'mfeAIStudio@http://localhost:3004/remoteEntry.js',
  },
  shared: {
    react:              { singleton: true, requiredVersion: '^18.2.0' },
    'react-dom':        { singleton: true, requiredVersion: '^18.2.0' },
    'react-router-dom': { singleton: true, requiredVersion: '^7.5.1' },
    'react-bootstrap':  { singleton: true },
    bootstrap:          { singleton: true },
  },
});
```

### Each MFE (Remote)

```javascript
// frontend/mfe-jobs/webpack.config.js (example)
new ModuleFederationPlugin({
  name: 'mfeJobs',
  filename: 'remoteEntry.js',
  exposes: {
    './JobsApp': './src/App',
  },
  shared: {
    react:              { singleton: true, requiredVersion: '^18.2.0' },
    'react-dom':        { singleton: true, requiredVersion: '^18.2.0' },
    'react-router-dom': { singleton: true },
    'react-bootstrap':  { singleton: true },
    bootstrap:          { singleton: true },
  },
});
```

---

## Shell Routing

```jsx
// frontend/shell/src/App.tsx
const AuthApp     = lazy(() => import('mfeAuth/AuthApp'));
const JobsApp     = lazy(() => import('mfeJobs/JobsApp'));
const TrackerApp  = lazy(() => import('mfeTracker/TrackerApp'));
const AIStudioApp = lazy(() => import('mfeAIStudio/AIStudioApp'));

<AuthProvider>
  <BrowserRouter>
    <Routes>
      {/* Public — Auth MFE */}
      <Route path="/"         element={<Suspense><AuthApp /></Suspense>} />
      <Route path="/login"    element={<Suspense><AuthApp /></Suspense>} />
      <Route path="/register" element={<Suspense><AuthApp /></Suspense>} />

      {/* Protected — Shell layout wraps all */}
      <Route element={<ShellLayout />}>
        <Route path="/dashboard"  element={<Suspense><TrackerApp /></Suspense>} />
        <Route path="/jobs/*"     element={<Suspense><JobsApp /></Suspense>} />
        <Route path="/tracker/*"  element={<Suspense><TrackerApp /></Suspense>} />
        <Route path="/ai/*"       element={<Suspense><AIStudioApp /></Suspense>} />
      </Route>
    </Routes>
  </BrowserRouter>
</AuthProvider>
```

---

## Cross-MFE Communication

MFEs never import from each other. They communicate through the shell.

### 1. Shared Auth Context (Shell provides, MFEs consume)

```tsx
// packages/shared-shell-contracts/src/useAuth.ts
interface AuthContext {
  isAuthenticated: boolean;
  user: { email: string; firstName: string } | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}
```

### 2. Custom Events (MFE → MFE via browser)

```tsx
// Jobs MFE marks a job as applied:
window.dispatchEvent(new CustomEvent('job:applied', {
  detail: { jobId: 'abc123', jobTitle: 'Software Engineer' }
}));

// Tracker MFE listens:
window.addEventListener('job:applied', (e) => refetchApplications());
```

### 3. Typed Event Bus (for complex flows)

```tsx
// packages/shared-shell-contracts/src/eventBus.ts
type EventMap = {
  'job:applied':      { jobId: string; jobTitle: string };
  'status:changed':   { jobId: string; newStatus: string };
  'notification:new': { type: string; message: string };
  'ai:content:ready': { contentType: string; contentId: number };
};

class EventBus {
  private listeners = new Map<string, Set<Function>>();
  on<K extends keyof EventMap>(event: K, cb: (data: EventMap[K]) => void) { ... }
  emit<K extends keyof EventMap>(event: K, data: EventMap[K]) { ... }
}

export const eventBus = new EventBus(); // Singleton shared via shell
```

---

# Part C: Repository Structure (Monorepo)

```
job-portal/
├── gateway/                        # API Gateway
│   ├── src/
│   │   ├── index.ts
│   │   ├── proxy.ts
│   │   └── middleware/
│   │       ├── auth.ts
│   │       ├── rateLimit.ts
│   │       └── circuitBreaker.ts
│   ├── package.json
│   └── Dockerfile
│
├── services/
│   ├── auth/                       # Auth Service
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── routes/auth.routes.ts
│   │   │   ├── controllers/auth.controller.ts
│   │   │   └── services/auth.service.ts
│   │   ├── prisma/schema.prisma
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── job-search/                 # Job Search Service
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── routes/jobs.routes.ts
│   │   │   ├── controllers/jobs.controller.ts
│   │   │   └── services/
│   │   │       ├── jsearch.service.ts
│   │   │       └── cache.service.ts
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── tracker/                    # Application Tracker Service
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── routes/
│   │   │   │   ├── application.routes.ts
│   │   │   │   └── metrics.routes.ts
│   │   │   ├── controllers/
│   │   │   │   ├── application.controller.ts
│   │   │   │   └── metrics.controller.ts
│   │   │   └── services/
│   │   │       ├── application.service.ts
│   │   │       ├── metrics.service.ts
│   │   │       └── events.service.ts
│   │   ├── prisma/schema.prisma
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── notification/               # Notification Service
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── routes/notification.routes.ts
│   │   │   └── services/
│   │   │       ├── email.service.ts
│   │   │       ├── websocket.service.ts
│   │   │       └── subscriber.service.ts
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   └── ai-agent/                   # AI Agent Service
│       ├── src/
│       │   ├── index.ts
│       │   ├── routes/
│       │   │   ├── coverLetter.routes.ts
│       │   │   ├── matching.routes.ts
│       │   │   ├── interviewPrep.routes.ts
│       │   │   ├── analytics.routes.ts
│       │   │   ├── resume.routes.ts
│       │   │   ├── followUp.routes.ts
│       │   │   └── autoApply.routes.ts
│       │   ├── controllers/ ...
│       │   ├── services/
│       │   │   ├── llm.service.ts
│       │   │   ├── embedding.service.ts
│       │   │   ├── coverLetter.service.ts
│       │   │   ├── matching.service.ts
│       │   │   ├── interviewPrep.service.ts
│       │   │   ├── analytics.service.ts
│       │   │   ├── resume.service.ts
│       │   │   ├── followUp.service.ts
│       │   │   └── autoApply.service.ts
│       │   ├── workers/
│       │   │   ├── coverLetter.worker.ts
│       │   │   ├── matching.worker.ts
│       │   │   ├── followUp.worker.ts
│       │   │   ├── jobAlert.worker.ts
│       │   │   └── autoApply.worker.ts
│       │   ├── cron/
│       │   │   ├── followUpChecker.ts
│       │   │   ├── jobAlertScanner.ts
│       │   │   └── autoApplyRunner.ts
│       │   └── prompts/
│       │       ├── coverLetter.prompt.ts
│       │       ├── interviewPrep.prompt.ts
│       │       ├── resumeAnalysis.prompt.ts
│       │       └── insights.prompt.ts
│       ├── prisma/schema.prisma
│       ├── package.json
│       └── Dockerfile
│
├── frontend/
│   ├── shell/                      # App Shell (Host)
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── ShellLayout.tsx     # TopNav + Outlet
│   │   │   ├── AuthContext.tsx
│   │   │   ├── NotificationProvider.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── LoadingFallback.tsx
│   │   ├── webpack.config.js
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── mfe-auth/                   # Auth MFE
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   └── pages/
│   │   │       ├── Landing.tsx     # ← Home.js
│   │   │       ├── Login.tsx       # ← App.js
│   │   │       └── Register.tsx    # ← Login.js
│   │   ├── webpack.config.js
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── mfe-jobs/                   # Jobs MFE
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── pages/
│   │   │   │   ├── JobSearch.tsx   # ← JobListings.js (search + list)
│   │   │   │   └── JobDetail.tsx   # ← JobListings.js (selectedJob)
│   │   │   └── components/
│   │   │       ├── JobCard.tsx
│   │   │       ├── MatchScoreBadge.tsx
│   │   │       ├── SearchFilters.tsx
│   │   │       └── CoverLetterModal.tsx
│   │   ├── webpack.config.js
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── mfe-tracker/                # Tracker MFE
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   └── pages/
│   │   │       ├── Dashboard.tsx   # ← dashboard.js
│   │   │       ├── Applications.tsx # ← profile.js
│   │   │       └── Metrics.tsx     # New
│   │   ├── webpack.config.js
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   └── mfe-ai-studio/             # AI Studio MFE
│       ├── src/
│       │   ├── App.tsx
│       │   └── pages/
│       │       ├── AIDashboard.tsx
│       │       ├── CoverLetters.tsx
│       │       ├── InterviewPrep.tsx
│       │       ├── ResumeOptimizer.tsx
│       │       ├── FollowUps.tsx
│       │       └── AutoApply.tsx
│       ├── webpack.config.js
│       ├── package.json
│       └── Dockerfile
│
├── packages/                       # Shared monorepo packages
│   ├── shared-types/               # TS interfaces for events, models
│   ├── shared-middleware/          # Express middleware (error, logging, auth)
│   ├── shared-utils/              # Redis client, Bull queue, logger factories
│   └── shared-shell-contracts/    # useAuth, eventBus, types for MFEs
│
├── infrastructure/
│   ├── docker-compose.yml          # Local dev
│   ├── docker-compose.prod.yml
│   └── k8s/                        # Kubernetes manifests (future)
│
├── package.json                    # npm workspaces root
├── turbo.json                      # Turborepo pipeline
└── tsconfig.base.json
```

---

# Part D: Docker Compose (Local Dev)

```yaml
services:
  # --- Infrastructure ---
  mysql-auth:
    image: mysql:8
    environment: { MYSQL_DATABASE: auth_db, MYSQL_ROOT_PASSWORD: '${MYSQL_ROOT_PASSWORD}' }
    ports: ["3306:3306"]
    volumes: [mysql-auth-data:/var/lib/mysql]

  mysql-tracker:
    image: mysql:8
    environment: { MYSQL_DATABASE: tracker_db, MYSQL_ROOT_PASSWORD: '${MYSQL_ROOT_PASSWORD}' }
    ports: ["3307:3306"]
    volumes: [mysql-tracker-data:/var/lib/mysql]

  mysql-ai:
    image: mysql:8
    environment: { MYSQL_DATABASE: ai_db, MYSQL_ROOT_PASSWORD: '${MYSQL_ROOT_PASSWORD}' }
    ports: ["3308:3306"]
    volumes: [mysql-ai-data:/var/lib/mysql]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  # --- Backend Services ---
  gateway:
    build: ./gateway
    ports: ["4000:4000"]
    depends_on: [auth, job-search, tracker, notification, ai-agent]

  auth:
    build: ./services/auth
    ports: ["4001:4001"]
    depends_on: [mysql-auth]

  job-search:
    build: ./services/job-search
    ports: ["4002:4002"]
    depends_on: [redis]

  tracker:
    build: ./services/tracker
    ports: ["4003:4003"]
    depends_on: [mysql-tracker, redis]

  notification:
    build: ./services/notification
    ports: ["4004:4004"]
    depends_on: [redis]

  ai-agent:
    build: ./services/ai-agent
    ports: ["4005:4005"]
    depends_on: [mysql-ai, redis]

volumes:
  mysql-auth-data:
  mysql-tracker-data:
  mysql-ai-data:
```

---

# Part E: Scaling Strategy

## Per-Service Scaling

| Service | Traffic Pattern | Strategy | Min | Max |
|---------|----------------|----------|-----|-----|
| Gateway | All traffic passes through | Horizontal (stateless) | 2 | 10 |
| Auth | Low, spiky at login hours | Horizontal | 1 | 3 |
| Job Search | High read, bursty | Horizontal + Redis cache | 2 | 8 |
| Tracker | Medium, steady | Horizontal | 1 | 4 |
| Notification | Connection-bound (WebSocket) | Vertical + horizontal | 1 | 4 |
| AI Agent | CPU-heavy, bursty | Worker pool scaling | 2 | 10 |

## AI Agent — Split API from Workers

```yaml
# Production: separate the HTTP layer from the worker layer
ai-agent-api:
  build: ./services/ai-agent
  command: npm run start:api       # Serves HTTP requests (fast)
  replicas: 2

ai-agent-worker:
  build: ./services/ai-agent
  command: npm run start:worker    # Processes Bull queue jobs (slow, LLM calls)
  replicas: 4                      # Scale based on queue depth
```

## Database Scaling

```
Auth DB:    Small, rarely changes → single instance + read replica
Tracker DB: Grows with users → partition by userId, read replicas
AI DB:      Write-heavy (logs) → partition by date, archive old logs
Redis:      Cache + queues → Redis Cluster when needed
```

---

# Part F: Migration Plan (Phase by Phase)

## Phase 0: Monorepo + Security

- [ ] Init monorepo (npm workspaces + Turborepo)
- [ ] Create shared packages (`shared-types`, `shared-middleware`, `shared-utils`)
- [ ] Fix plaintext passwords → bcrypt
- [ ] Move all secrets to `.env`
- [ ] Move RapidAPI call from client to backend
- [ ] Set up Docker Compose with MySQL instances + Redis
- [ ] Set up TypeScript

## Phase 1: Extract Auth Service

- [ ] Create `services/auth/` with routes, controller, service
- [ ] Migrate User model to `auth_db`
- [ ] Implement access + refresh token pair
- [ ] Create `gateway/` with auth proxy route
- [ ] Update frontend to call `/auth/*` via gateway
- [ ] Verify login, register, logout, refresh

## Phase 2: Extract Job Search Service

- [ ] Create `services/job-search/` with JSearch proxy + Redis cache
- [ ] Add gateway route for `/jobs/*`
- [ ] Update `JobListings.js` to call `/jobs/search` instead of RapidAPI directly
- [ ] Verify search, pagination, caching

## Phase 3: Extract Tracker Service

- [ ] Create `services/tracker/` with application CRUD + metrics
- [ ] Migrate Application, PerformanceMetrics, PlatformName to `tracker_db`
- [ ] Set up Redis event publishing
- [ ] Add gateway route for `/tracker/*`
- [ ] Update frontend to call `/tracker/*`
- [ ] Verify create, update, list, metrics

## Phase 4: App Shell + MFE Split

- [ ] Create `frontend/shell/` with Module Federation host
- [ ] Extract `mfe-auth/` (Landing, Login, Register)
- [ ] Extract `mfe-jobs/` (JobSearch, JobDetail)
- [ ] Extract `mfe-tracker/` (Dashboard, Applications, Metrics)
- [ ] Move AuthContext to shell, expose via shared contracts
- [ ] Set up cross-MFE event bus
- [ ] Verify all existing features work through shell

## Phase 5: Notification Service

- [ ] Create `services/notification/` with Redis subscriber + WebSocket
- [ ] Connect to shell NotificationProvider
- [ ] Verify real-time events reach frontend

## Phase 6: AI Agent Service + AI Studio MFE

- [ ] Create `services/ai-agent/` with all AI endpoints
- [ ] Set up Bull queues for long-running LLM calls
- [ ] Set up cron for background agents
- [ ] Create `mfe-ai-studio/` with all AI pages
- [ ] Add gateway route for `/ai/*`
- [ ] Build AI features incrementally:
  - 6a: Cover letter generation
  - 6b: Resume-job matching
  - 6c: Interview prep
  - 6d: Analytics insights
  - 6e: Follow-up agent
  - 6f: Job alerts
  - 6g: Resume optimizer
  - 6h: Auto-apply orchestrator

---

# Part G: File Mapping (Current → New)

| Current File | New Location | Owned By |
|-------------|-------------|----------|
| `Api/index.js` (register, login, logout, me) | `services/auth/src/` | Auth Service |
| `Api/index.js` (application, getRecords, updateRecord, myJobIds) | `services/tracker/src/` | Tracker Service |
| `client/src/JobListings.js` (RapidAPI fetch logic) | `services/job-search/src/` | Job Search Service |
| `client/src/Home.js` | `frontend/mfe-auth/src/pages/Landing.tsx` | Auth MFE |
| `client/src/App.js` (login page) | `frontend/mfe-auth/src/pages/Login.tsx` | Auth MFE |
| `client/src/Login.js` (register page) | `frontend/mfe-auth/src/pages/Register.tsx` | Auth MFE |
| `client/src/JobListings.js` (UI) | `frontend/mfe-jobs/src/pages/` | Jobs MFE |
| `client/src/dashboard.js` | `frontend/mfe-tracker/src/pages/Dashboard.tsx` | Tracker MFE |
| `client/src/profile.js` | `frontend/mfe-tracker/src/pages/Applications.tsx` | Tracker MFE |
| `client/src/TopNav.js` | `frontend/shell/src/ShellLayout.tsx` | Shell |
| `client/src/AuthContext.js` | `frontend/shell/src/AuthContext.tsx` | Shell |
| `client/src/RequireAuth.js` | Built into shell routing | Shell |
| `Api/schema.prisma` | Split across `services/*/prisma/schema.prisma` | Per service |
| — (new) | `frontend/mfe-ai-studio/src/` | AI Studio MFE |
| — (new) | `services/ai-agent/src/` | AI Agent Service |
| — (new) | `services/notification/src/` | Notification Service |
| — (new) | `gateway/src/` | API Gateway |

---

# Part H: Environment Variables

```env
# Security
JWT_SECRET=<generate-strong-secret>
INTERNAL_API_KEY=<service-to-service-key>

# Databases
MYSQL_ROOT_PASSWORD=<strong-password>
AUTH_DB_URL=mysql://root:${MYSQL_ROOT_PASSWORD}@localhost:3306/auth_db
TRACKER_DB_URL=mysql://root:${MYSQL_ROOT_PASSWORD}@localhost:3307/tracker_db
AI_DB_URL=mysql://root:${MYSQL_ROOT_PASSWORD}@localhost:3308/ai_db

# Redis
REDIS_URL=redis://localhost:6379

# External APIs
RAPIDAPI_KEY=<your-key>
ANTHROPIC_API_KEY=<your-key>
OPENAI_API_KEY=<your-key>

# Email
SENDGRID_API_KEY=<your-key>

# Service Ports
GATEWAY_PORT=4000
AUTH_SERVICE_PORT=4001
JOB_SERVICE_PORT=4002
TRACKER_SERVICE_PORT=4003
NOTIFICATION_SERVICE_PORT=4004
AI_SERVICE_PORT=4005

# Frontend Ports
SHELL_PORT=3000
MFE_AUTH_PORT=3001
MFE_JOBS_PORT=3002
MFE_TRACKER_PORT=3003
MFE_AI_STUDIO_PORT=3004

# Agent Config
AUTO_APPLY_MAX_PER_DAY=10
ALERT_CHECK_INTERVAL_MINUTES=60
FOLLOW_UP_DAYS_THRESHOLD=7
```

---

# Success Criteria

| Criteria | How to Verify |
|----------|--------------|
| Any service deploys independently | Deploy tracker without touching auth or jobs |
| Any MFE deploys independently | Deploy mfe-jobs without rebuilding shell |
| AI service scales separately | 4 AI workers running while auth has 1 instance |
| Single service failure is isolated | Kill AI service — job search still works |
| Frontend loads incrementally | Shell renders in <1s, MFEs lazy-load on navigation |
| No secrets in client code | All API keys live server-side only |
| Inter-service events work | Creating application triggers AI match + notification |
| Local dev is one command | `docker compose up` starts everything |
