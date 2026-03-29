# Phase 8: Auto-Apply Agent - Implementation Plan

## Overview

Phase 8 implements an **Orchestrator Agent** that autonomously discovers, evaluates, and applies to jobs on the user's behalf. It chains together all previous agents (Smart Alerts, Matching, Cover Letter, Resume Tailoring) into one cohesive workflow.

**Key Philosophy:** Human-in-the-loop by default. All applications are queued for user approval before submission.

---

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    Auto-Apply Orchestrator                     │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. DISCOVERY                                                 │
│     └─→ Smart Alerts Agent (Phase 6)                         │
│         Fetch high-matching jobs from alerts                 │
│                                                                │
│  2. EVALUATION                                                │
│     └─→ Matching Agent (Phase 2)                             │
│         Score each job (0-100)                               │
│         Filter by user's minScore threshold                  │
│                                                                │
│  3. CONTENT GENERATION (if passes threshold)                 │
│     ├─→ Cover Letter Agent (Phase 1)                        │
│     │   Generate tailored cover letter                       │
│     └─→ Resume Tailor Agent (Phase 7)                        │
│         Generate job-specific resume version                 │
│                                                                │
│  4. QUEUE FOR APPROVAL                                       │
│     └─→ Create AutoApplyQueue record                         │
│         Store all generated content                          │
│         Wait for user approval/rejection                     │
│                                                                │
│  5. APPLY & LOG                                              │
│     ├─→ Create Application record                            │
│     ├─→ Store generated content                              │
│     ├─→ Log to AgentLog                                      │
│     └─→ Send notification to user                            │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

Add to `Api/schema.prisma`:

```prisma
model AutoApplyConfig {
  userId              String   @id
  user                User     @relation(fields: [userId], references: [email], onDelete: Cascade)

  // Targeting
  preferredRoles      Json     // ["Software Engineer", "Full Stack Developer"]
  preferredLocations  Json     // ["Remote", "San Francisco"]
  minMatchScore       Int      @default(70) // Only apply to jobs scoring 70+
  maxApplicationsPerDay Int    @default(5)

  // Approval modes
  approvalMode        String   @default("manual") // "manual" | "threshold" | "automatic"
  autoApplyThreshold  Int      @default(85) // Auto-apply jobs scoring 85+

  // Settings
  enabled             Boolean  @default(false)
  notifyOnQueue       Boolean  @default(true)
  notifyOnApply       Boolean  @default(true)

  // Timestamps
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([userId])
}

model AutoApplyQueue {
  id                  Int      @id @default(autoincrement())
  userId              String
  user                User     @relation(fields: [userId], references: [email], onDelete: Cascade)

  // Job details
  jobId               String   // JSearch job ID
  jobTitle            String
  companyName         String
  jobLink             String   @db.LongText
  matchScore          Int      // 0-100 from matching

  // Generated content
  coverLetter         String   @db.LongText
  resumeContent       String   @db.LongText
  tailorSummary       String?  // Summary of resume changes

  // Status
  status              String   @default("pending") // "pending" | "approved" | "rejected" | "applied" | "failed"
  approvedAt          DateTime?
  appliedAt           DateTime?
  rejectionReason     String?

  // For tracking
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([userId])
  @@index([userId, status])
  @@index([jobId])
  @@unique([userId, jobId]) // Prevent duplicate queue entries
}

model AutoApplyLog {
  id                  Int      @id @default(autoincrement())
  userId              String
  user                User     @relation(fields: [userId], references: [email], onDelete: Cascade)

  action              String   // "discovery" | "evaluation" | "content_gen" | "queue_created" | "approved" | "applied" | "failed"
  jobId               String?
  jobTitle            String?
  status              String   // "success" | "error" | "skipped"
  details             Json     // { reason: "...", matchScore: 75, etc }

  createdAt           DateTime @default(now())

  @@index([userId])
  @@index([userId, action])
}
```

Update User model:

```prisma
model User {
  // ... existing fields ...
  autoApplyConfig     AutoApplyConfig?
  autoApplyQueue      AutoApplyQueue[]
  autoApplyLogs       AutoApplyLog[]
}
```

---

## Backend Implementation

### 1. `Api/src/services/ai/autoApply.service.js` (~600 lines)

Core orchestrator service with these functions:

```javascript
// Configuration
async initializeAutoApplyConfig(userId, initialSettings)
async getAutoApplyConfig(userId)
async updateAutoApplyConfig(userId, updates)
async disableAutoApply(userId)

// Discovery & Processing
async checkAndQueueApplications(userId)
  // 1. Get user's AutoApplyConfig
  // 2. Generate alerts (call jobAlerts.generateAlertsForUser)
  // 3. Filter by minMatchScore threshold
  // 4. For each job: generateQueueEntry()
  // 5. Return summary

async generateQueueEntry(userId, jobAlert)
  // 1. Fetch job details from alert
  // 2. Generate cover letter (call coverLetter.generateCoverLetter)
  // 3. Tailor resume (call resumeTailor.tailorResume)
  // 4. Create AutoApplyQueue record with generated content
  // 5. Log to AutoApplyLog
  // 6. Return queue entry

// Queue Management
async getQueueForUser(userId, filter = "pending")
  // Return pending | approved | rejected | applied queue items

async approveQueueItem(queueId, userId)
  // 1. Get queue item
  // 2. Check daily limit hasn't been exceeded
  // 3. Update status to "approved"
  // 4. Call applyToJob()
  // 5. Return result

async rejectQueueItem(queueId, userId, reason)
  // Update status to "rejected" with reason

async applyToJob(queueId, userId)
  // 1. Get queue item
  // 2. Create Application record
  // 3. Store generated content in ApplicationContent table
  // 4. Update AutoApplyQueue.status = "applied"
  // 5. Log to AutoApplyLog
  // 6. Update Application status to "Applied"
  // 7. Return confirmation

// Approval Mode Handling
async autoApplyAboveThreshold(userId)
  // Called by checkAndQueueApplications if approvalMode = "threshold"
  // Auto-apply all jobs scoring >= autoApplyThreshold
  // Still log to AutoApplyLog for audit trail
  // Return count of auto-applied jobs

// Statistics & Reporting
async getAutoApplyStats(userId)
  // Return: { totalQueued, totalApproved, totalApplied, totalRejected, dailyAppliedCount }

async getDailyAppliedCount(userId)
  // Count applications created today by this user
  // Used to enforce maxApplicationsPerDay
```

### 2. `Api/src/middleware/autoApplyAuth.js` (~80 lines)

Middleware to verify auto-apply is enabled and user has config:

```javascript
async autoApplyRequireEnabled(req, res, next)
  // Verify req.user.email has AutoApplyConfig
  // Verify AutoApplyConfig.enabled === true
  // Pass through or return 403 if not enabled

async autoApplyRequireConfig(req, res, next)
  // Verify user has AutoApplyConfig created
  // Pass through or return 400 if missing
```

### 3. Update `Api/src/controllers/agent.controller.js`

Add 9 new handlers:

```javascript
// Configuration endpoints
async initializeAutoApplyConfigHandler(req, res)
  // POST /api/agent/auto-apply/config/initialize
  // Body: { preferredRoles, preferredLocations, minMatchScore, maxApplicationsPerDay, approvalMode }
  // Call autoApply.initializeAutoApplyConfig()

async getAutoApplyConfigHandler(req, res)
  // GET /api/agent/auto-apply/config
  // Call autoApply.getAutoApplyConfig()

async updateAutoApplyConfigHandler(req, res)
  // PUT /api/agent/auto-apply/config
  // Body: { ...updates }
  // Call autoApply.updateAutoApplyConfig()

async disableAutoApplyHandler(req, res)
  // POST /api/agent/auto-apply/disable
  // Call autoApply.disableAutoApply()

// Queue Management
async checkAndQueueApplicationsHandler(req, res)
  // POST /api/agent/auto-apply/check
  // Manually trigger job discovery and queuing
  // Call autoApply.checkAndQueueApplications()
  // Return: { discovered, queued, skipped, errors }

async getQueueHandler(req, res)
  // GET /api/agent/auto-apply/queue?status=pending
  // Query params: status (pending|approved|rejected|applied), limit, offset
  // Call autoApply.getQueueForUser()

async approveQueueItemHandler(req, res)
  // POST /api/agent/auto-apply/queue/:queueId/approve
  // Call autoApply.approveQueueItem()
  // Apply immediately or queue for later based on mode

async rejectQueueItemHandler(req, res)
  // POST /api/agent/auto-apply/queue/:queueId/reject
  // Body: { reason }
  // Call autoApply.rejectQueueItem()

async getAutoApplyStatsHandler(req, res)
  // GET /api/agent/auto-apply/stats
  // Call autoApply.getAutoApplyStats()
```

### 4. Update `Api/src/routes/agent.routes.js`

Add 9 new routes (all with `requireAuth`):

```javascript
// Configuration
POST /api/agent/auto-apply/config/initialize
GET /api/agent/auto-apply/config
PUT /api/agent/auto-apply/config
POST /api/agent/auto-apply/disable

// Queue Operations
POST /api/agent/auto-apply/check              // Manual trigger
GET /api/agent/auto-apply/queue               // List queue items
POST /api/agent/auto-apply/queue/:id/approve
POST /api/agent/auto-apply/queue/:id/reject

// Stats
GET /api/agent/auto-apply/stats
```

### 5. Update `Api/src/services/ai/prompts/autoApply.prompt.js` (NEW)

Prompt template for cover letter generation in auto-apply context:

```javascript
// Slightly different from regular cover letter prompt
// - More concise (2-3 paragraphs)
// - Includes resume context
// - Highlights matching keywords
// - Maintains professional tone
```

---

## Frontend Implementation

### 1. New Pages

#### `client/src/pages/AutoApply/AutoApplyDashboard.js` (~500 lines)

Main dashboard with 4 sections:

```
┌─────────────────────────────────────────────────────────┐
│                 Auto-Apply Configuration                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Enabled Toggle]  [Settings]  [Check Now Button]      │
│                                                         │
│  Status: 5 queued, 12 approved today, 3 pending        │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                     Pending Queue (5)                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─ QueueCard 1 ─────────────────────────────────────┐ │
│  │ Senior SWE @ TechCorp                             │ │
│  │ Match: 82% | Generated content ready             │ │
│  │ [Approve] [Reject] [View Details]                │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─ QueueCard 2 ─────────────────────────────────────┐ │
│  │ Full Stack Engineer @ Startup                     │ │
│  │ Match: 75% | Generated content ready             │ │
│  │ [Approve] [Reject] [View Details]                │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

Features:
- Toggle to enable/disable auto-apply
- Settings button → opens ConfigModal
- "Check Now" button → manually trigger job discovery
- Real-time queue stats
- Pending queue cards with approve/reject actions
- View details modal for each queue item

#### `client/src/pages/AutoApply/AutoApplySettings.js` (~400 lines)

Configuration wizard:

```
Form sections:
1. Target Jobs
   - Preferred roles (multi-select)
   - Preferred locations (multi-select)
   - Min match score slider (50-100)

2. Daily Limits
   - Max applications per day (1-20)

3. Approval Settings
   - Radio: "Manual" (review each) | "Threshold" (auto 85+) | "Automatic" (all)
   - Threshold slider (if threshold mode)

4. Notifications
   - Checkbox: "Notify when job queued"
   - Checkbox: "Notify when applied"

5. Danger Zone
   - "Disable Auto-Apply" button
   - Confirmation dialog
```

### 2. New Components

#### `client/src/pages/AutoApply/components/QueueCard.js` (~200 lines)

Card showing queued job with:
- Job title, company, location
- Match score badge (green/yellow/red)
- Generated cover letter preview (first 3 lines)
- Resume changes summary
- Action buttons: Approve, Reject, View Details
- Status badge: Pending, Approved, Applied, Rejected

#### `client/src/pages/AutoApply/components/QueueDetailsModal.js` (~350 lines)

Modal showing full job + generated content:

```
Tabs:
1. Job Details
   - Full job description
   - Match score breakdown
   - Application link

2. Cover Letter
   - Full generated cover letter
   - Copy to clipboard button

3. Resume
   - Resume tailoring summary
   - List of changes made
   - Full resume preview

4. Actions
   - [Approve & Apply Now]
   - [Schedule for Later]
   - [Reject] + reason field
```

#### `client/src/components/dashboard/AutoApplyWidget.js` (~180 lines)

Dashboard card showing:
- "Auto-Apply Status" heading
- Enabled/Disabled toggle
- Stats: X queued, Y applied today
- "Review Queue" button
- Recent activity (last 3 applications)
- Quick "Check Now" button

### 3. CSS Files

- `client/src/pages/AutoApply/AutoApplyDashboard.css` (~600 lines)
- `client/src/pages/AutoApply/AutoApplySettings.css` (~500 lines)
- `client/src/components/dashboard/AutoApplyWidget.css` (~150 lines)

### 4. Update Existing Pages

#### `client/src/pages/Dashboard/Dashboard.js`
- Add AutoApplyWidget card

#### `client/src/components/layout/TopNav.js`
- Add "Auto-Apply" link in nav menu (if enabled)

### 5. Services

#### `client/src/services/autoApply.service.js` (~200 lines)

API client functions:

```javascript
async initializeAutoApplyConfig(config)
async getAutoApplyConfig()
async updateAutoApplyConfig(updates)
async disableAutoApply()

async checkAndQueueApplications()
async getQueue(filter, limit, offset)
async approveQueueItem(queueId)
async rejectQueueItem(queueId, reason)
async getAutoApplyStats()
```

### 6. Config Updates

#### `client/src/config/api.js`

Add endpoints:
```javascript
AGENT_AUTO_APPLY_CONFIG_INITIALIZE: `${API_BASE_URL}/agent/auto-apply/config/initialize`
AGENT_AUTO_APPLY_CONFIG: `${API_BASE_URL}/agent/auto-apply/config`
AGENT_AUTO_APPLY_CHECK: `${API_BASE_URL}/agent/auto-apply/check`
AGENT_AUTO_APPLY_QUEUE: `${API_BASE_URL}/agent/auto-apply/queue`
AGENT_AUTO_APPLY_STATS: `${API_BASE_URL}/agent/auto-apply/stats`
```

#### `client/src/index.js`

Add route:
```javascript
<Route path="auto-apply" element={<AutoApplyDashboard />} />
```

---

## Implementation Stages

### Stage 1: Database & Backend Setup (Days 1-2)
1. Add database models to `schema.prisma`
2. Run Prisma migration
3. Create `autoApply.service.js` with orchestrator logic
4. Create middleware for auto-apply auth
5. Add handlers to `agent.controller.js`
6. Add routes to `agent.routes.js`

### Stage 2: Core API Testing (Day 2-3)
1. Test initialization endpoint
2. Test manual check/queue trigger
3. Test approval/rejection flow
4. Test daily limit enforcement
5. Test auto-apply threshold mode
6. Test statistics generation

### Stage 3: Frontend Configuration (Day 3-4)
1. Create AutoApplySettings.js and CSS
2. Create AutoApplyDashboard.js and CSS
3. Create QueueCard and QueueDetailsModal components
4. Integrate API client service
5. Add routing to index.js

### Stage 4: Frontend Queue Management (Day 4-5)
1. Display pending queue with real-time refresh
2. Implement approve/reject actions
3. Show generated content in modal
4. Add queue filtering and sorting
5. Show statistics and activity feed

### Stage 5: Dashboard Integration (Day 5)
1. Create AutoApplyWidget component
2. Add to Dashboard
3. Add TopNav links
4. Final responsive design testing
5. Error handling and edge cases

### Stage 6: Advanced Features (Day 5-6)
1. Implement all approval modes (manual/threshold/automatic)
2. Add notifications system
3. Add activity logging and audit trail
4. Performance optimization
5. Comprehensive error handling

---

## Reused Components

**From Phase 6 (Smart Alerts):**
- `jobAlerts.generateAlertsForUser(userId)` - Fetch high-matching jobs

**From Phase 2 (Matching):**
- `calculateMatchScore(userProfile, jobData)` - Score jobs

**From Phase 1 (Cover Letter):**
- `generateCoverLetter(userProfile, jobData)` - Create cover letter

**From Phase 7 (Resume):**
- `tailorResumeContent(resumeText, jobDescription)` - Tailor resume

**From All Phases:**
- `agentLog.logAgentAction()` - Log all actions
- `requireAuth` middleware - Protect endpoints

---

## User Flow

### First-Time Setup
1. User navigates to Dashboard
2. Sees "Enable Auto-Apply" in AutoApplyWidget
3. Clicks "Configure" → AutoApplySettings page
4. Fills out form:
   - Preferred roles: ["Software Engineer", "Full Stack Developer"]
   - Locations: ["Remote", "San Francisco"]
   - Min match: 70%
   - Max per day: 5
   - Approval mode: "Manual" (review each)
5. Clicks "Save & Enable"
6. System creates AutoApplyConfig record
7. Redirected to AutoApplyDashboard

### Regular Use
1. User clicks "Check Now" button on dashboard
2. System:
   - Generates alerts for high-matching jobs
   - Filters by minMatchScore
   - For each job: generates cover letter + tailored resume
   - Creates 5 AutoApplyQueue entries
3. User sees pending queue with 5 new jobs
4. User reviews each one:
   - Clicks "View Details" to see generated content
   - Clicks "Approve" to apply immediately OR
   - Clicks "Reject" to skip with reason
5. For each approval:
   - System creates Application record
   - Stores generated cover letter + resume
   - Marks as "applied"
6. User sees updated dashboard:
   - "5 applied today"
   - Queue now empty
   - Recent activity shows all 5 applications

### Threshold Mode (Auto-Apply 80+)
1. Same discovery process
2. System auto-applies jobs scoring 80+
3. User still sees all jobs in "Applied" tab
4. Can review what was auto-applied
5. Audit trail shows all auto-applied jobs

---

## Error Handling

| Error | User Feedback |
|-------|---|
| No AutoApplyConfig | "Configure auto-apply first" link |
| Auto-apply disabled | "Enable auto-apply in settings" |
| Daily limit exceeded | "Max 5 applications per day. Try tomorrow." |
| Job already applied | Skipped silently, log recorded |
| Cover letter gen failed | "Failed to generate cover letter. Try manual." |
| Resume tailor failed | Use original resume as fallback |
| Queue item already approved | "Already in progress" message |

---

## Testing Checklist

### Configuration
- [ ] Initialize config from fresh start
- [ ] Update config values
- [ ] Disable auto-apply clears config
- [ ] Re-enable recreates from defaults

### Discovery & Queuing
- [ ] Check jobs trigger generates queue
- [ ] Jobs filtered by minMatchScore
- [ ] Daily limit enforced (max 5 per day)
- [ ] No duplicate queue entries per job
- [ ] Generated content visible in details

### Approval Modes
- [ ] Manual mode: each job requires approval
- [ ] Threshold mode: auto-apply 80+, queue rest
- [ ] Automatic mode: all jobs applied immediately

### Queue Management
- [ ] Approve job creates Application record
- [ ] Reject job removes from queue
- [ ] Stats update correctly
- [ ] Approved jobs show in Applications page
- [ ] Queue persists across page reloads

### Dashboard
- [ ] Widget shows enabled/disabled state
- [ ] Stats display current counts
- [ ] Queue cards display all info
- [ ] Action buttons work correctly
- [ ] Recent activity shows last N jobs

### Error Cases
- [ ] Handle API failures gracefully
- [ ] Daily limit prevents over-applying
- [ ] Duplicate job handling
- [ ] Cover letter generation failures
- [ ] Resume tailoring failures

---

## Performance Targets

- Config initialization: < 1s
- Check & queue 10 jobs: < 10s (3x parallel API calls)
- Approval action: < 1s (create Application + logs)
- Queue fetch: < 500ms
- Dashboard load: < 2s

---

## Approval Mode Comparison

| Mode | Behavior | Use Case |
|------|----------|----------|
| **Manual** | Queue all, user approves each | Want full control |
| **Threshold** | Auto-apply 80+, queue 70-79 | Balanced automation |
| **Automatic** | Apply to all matching jobs | Maximum velocity |

---

## Summary

Phase 8 brings all previous agents together into one powerful orchestration system. By maintaining human-in-the-loop approval by default, users get the benefits of automation while keeping full control. The system is extensible for future enhancements like background scheduling and email notifications.

**Ready for implementation!**
