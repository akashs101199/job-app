# Phase 9: Background Scheduling & Automation - Implementation Plan

## Overview

Phase 9 transforms manual triggers into **fully automated background jobs**. Users configure schedules once, and the system autonomously:
1. Checks for new job alerts (daily/weekly)
2. Queues matching jobs via Auto-Apply Agent
3. Generates and sends email notifications
4. Logs all scheduled executions for audit

**Key Philosophy:** Zero user interaction required—fully autonomous after initial setup.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Node.js Process                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           node-cron Scheduler                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐   │ │
│  │  │ Alert Check  │  │ Auto-Apply   │  │ Email      │   │ │
│  │  │ Job (daily)  │  │ Job (hourly) │  │ Digest     │   │ │
│  │  │              │  │              │  │ (daily)    │   │ │
│  │  └──────────────┘  └──────────────┘  └────────────┘   │ │
│  └────────────────────────────────────────────────────────┘ │
│                            ↓                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Scheduler Service                              │ │
│  │  - Register jobs                                       │ │
│  │  - Execute workflows                                  │ │
│  │  - Log execution results                              │ │
│  └────────────────────────────────────────────────────────┘ │
│                            ↓                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │      Existing Services (Phase 1-8)                     │ │
│  │  - jobAlerts.generateAlertsForUser()                   │ │
│  │  - autoApply.checkAndQueueApplications()              │ │
│  │  - emailService.sendAlertDigest()                      │ │
│  └────────────────────────────────────────────────────────┘ │
│                            ↓                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │       Database (new CronLog table)                      │ │
│  │  - Track all job executions                            │ │
│  │  - Store errors and results                            │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Database Schema

Add to `Api/schema.prisma`:

```prisma
model SchedulerConfig {
  userId                String   @id
  user                  User     @relation(fields: [userId], references: [email], onDelete: Cascade)

  // Alert check schedule
  alertCheckEnabled     Boolean  @default(true)
  alertCheckFrequency   String   @default("daily") // "hourly" | "daily" | "weekly"
  alertCheckTime        String   @default("09:00") // HH:mm format

  // Auto-apply schedule
  autoApplyEnabled      Boolean  @default(false)
  autoApplyFrequency    String   @default("daily")
  autoApplyTime         String   @default("12:00")

  // Email digest
  emailDigestEnabled    Boolean  @default(true)
  emailDigestFrequency  String   @default("daily") // "daily" | "weekly"
  emailDigestTime       String   @default("18:00")

  // Timezone for scheduling
  timezone              String   @default("America/New_York") // IANA timezone

  // Track last execution
  lastAlertCheckAt      DateTime?
  lastAutoApplyAt       DateTime?
  lastEmailDigestAt     DateTime?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@index([userId])
}

model CronLog {
  id                    Int      @id @default(autoincrement())
  userId                String
  user                  User     @relation(fields: [userId], references: [email], onDelete: Cascade)

  jobType               String   // "alert_check" | "auto_apply" | "email_digest"
  scheduledFor          DateTime // When job was scheduled to run
  executedAt            DateTime // When job actually ran
  status                String   // "success" | "failure" | "skipped"
  message               String?  @db.LongText // Job output/error message
  result                Json?    // { jobsFound: 5, queued: 3, errors: [] }

  createdAt             DateTime @default(now())

  @@index([userId])
  @@index([userId, jobType])
  @@index([executedAt])
}
```

Update User model:

```prisma
model User {
  // ... existing fields ...
  schedulerConfig       SchedulerConfig?
  cronLogs              CronLog[]
}
```

---

## Implementation Stages

### Stage 1: Dependencies & Database (Day 1)
1. Add `node-cron` package: `npm install node-cron`
2. Add `nodemailer` + `sendgrid` for email: `npm install nodemailer @sendgrid/mail`
3. Update `schema.prisma` with SchedulerConfig and CronLog models
4. Run Prisma migration

### Stage 2: Core Scheduler Service (Day 1-2)
1. Create `Api/src/services/scheduler/scheduler.service.js` (~400 lines)
   - Register cron jobs for each user
   - Execute workflows
   - Log results
   - Error handling

2. Create `Api/src/services/scheduler/cronJobs.js` (~300 lines)
   - Alert check job implementation
   - Auto-apply job implementation
   - Email digest job implementation

3. Create `Api/src/services/email/emailService.js` (~250 lines)
   - SendGrid integration
   - Alert digest template
   - Application confirmation template

### Stage 3: Configuration Management (Day 2)
1. Create handlers in `agent.controller.js` (150 lines)
   - Get scheduler config
   - Update scheduler config
   - Get cron logs

2. Add routes to `agent.routes.js` (5 routes)
   - GET /scheduler/config
   - PUT /scheduler/config
   - GET /scheduler/logs
   - POST /scheduler/job/:type/run (manual trigger)
   - POST /scheduler/job/:type/pause

3. Update API config with new endpoints

### Stage 4: Frontend Configuration (Day 3)
1. Create `SchedulerSettings.js` page (~300 lines)
   - Toggle alert check on/off
   - Select frequency (hourly, daily, weekly)
   - Set time of day
   - Toggle auto-apply on/off
   - Select frequency and time
   - Email digest settings
   - Timezone selector (use timezone library)

2. Create `CronLogs.js` page (~250 lines)
   - View recent cron job executions
   - Filter by job type
   - View execution details
   - Timestamps and status
   - Manual trigger buttons

3. Create styles for both pages (600 lines)

4. Update Dashboard to show scheduler status widget

### Stage 5: Integration & Testing (Day 3-4)
1. Initialize scheduler on app startup
   - Load all users with scheduler enabled
   - Register their cron jobs
2. Test each job type
3. Verify email sending
4. Test error handling and retries

---

## Core Services

### 1. `Api/src/services/scheduler/scheduler.service.js`

Main orchestrator for all cron jobs:

```javascript
export class Scheduler {
  constructor() {
    this.jobs = new Map(); // userId -> { alertCheck, autoApply, emailDigest }
  }

  async initializeScheduler()
    // Load all users with scheduler enabled
    // Register their cron jobs

  async registerUserJobs(userId)
    // Create cron jobs based on user preferences
    // Store job references

  async unregisterUserJobs(userId)
    // Stop and remove user's cron jobs

  async executeAlertCheck(userId)
    // Call jobAlerts.generateAlertsForUser()
    // Log results

  async executeAutoApply(userId)
    // Call autoApply.checkAndQueueApplications()
    // Log results

  async executeEmailDigest(userId)
    // Compile recent alerts and applications
    // Send via email

  async getSchedulerConfig(userId)
    // Fetch SchedulerConfig

  async updateSchedulerConfig(userId, updates)
    // Update config and re-register jobs

  async logCronExecution(userId, jobType, result)
    // Save to CronLog table
}
```

### 2. `Api/src/services/scheduler/cronJobs.js`

Individual job implementations:

```javascript
// Alert Check Job (runs daily/weekly)
export async function alertCheckJob(userId) {
  try {
    const alerts = await generateAlertsForUser(userId);
    return { success: true, jobsFound: alerts.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Auto-Apply Job (runs hourly/daily)
export async function autoApplyJob(userId) {
  try {
    const config = await getAutoApplyConfig(userId);
    if (!config.enabled) return { success: false, reason: 'auto-apply disabled' };

    const summary = await checkAndQueueApplications(userId);
    return { success: true, ...summary };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Email Digest Job (runs daily/weekly)
export async function emailDigestJob(userId) {
  try {
    const alerts = await getUnreadAlerts(userId, 10);
    const queue = await getQueueForUser(userId, 'pending');

    if (alerts.length === 0 && queue.items.length === 0) {
      return { success: true, reason: 'no new items' };
    }

    await sendAlertDigest(userId, { alerts, queue });
    return { success: true, emailsSent: 1 };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### 3. `Api/src/services/email/emailService.js`

Email integration:

```javascript
export async function sendAlertDigest(userId, data) {
  const user = await getUser(userId);

  const template = buildAlertDigestTemplate(data);

  await sgMail.send({
    to: user.email,
    from: 'alerts@jobapp.ai',
    subject: `Your Daily Job Alerts (${data.alerts.length} new)`,
    html: template,
  });
}

export async function sendApplicationConfirmation(userId, applicationData) {
  const user = await getUser(userId);

  const template = buildApplicationTemplate(applicationData);

  await sgMail.send({
    to: user.email,
    from: 'updates@jobapp.ai',
    subject: `Application Submitted: ${applicationData.jobTitle}`,
    html: template,
  });
}

function buildAlertDigestTemplate(data) {
  // HTML email with:
  // - List of new job alerts with match scores
  // - Pending approvals in auto-apply queue
  // - Action links
  // - Unsubscribe link
}
```

---

## Cron Job Schedules

```
Alert Check:
┌─────────────────────────────────────────┐
│ Frequency  │ Cron Expression             │
├─────────────────────────────────────────┤
│ Hourly     │ 0 * * * *                   │
│ Daily      │ 0 9 * * * (9 AM)           │
│ Weekly     │ 0 9 * * 1 (Monday 9 AM)    │
└─────────────────────────────────────────┘

Auto-Apply:
┌─────────────────────────────────────────┐
│ Frequency  │ Cron Expression             │
├─────────────────────────────────────────┤
│ Hourly     │ 0 * * * *                   │
│ Daily      │ 0 12 * * * (12 PM)         │
│ Weekly     │ 0 12 * * 1 (Monday 12 PM)  │
└─────────────────────────────────────────┘

Email Digest:
┌─────────────────────────────────────────┐
│ Frequency  │ Cron Expression             │
├─────────────────────────────────────────┤
│ Daily      │ 0 18 * * * (6 PM)          │
│ Weekly     │ 0 18 * * 1 (Monday 6 PM)   │
└─────────────────────────────────────────┘
```

**Note:** Cron expressions are in UTC. Scheduler converts user timezone to UTC.

---

## API Endpoints

### GET `/api/agent/scheduler/config`
Fetch scheduler configuration for authenticated user

**Response:**
```json
{
  "success": true,
  "data": {
    "alertCheckEnabled": true,
    "alertCheckFrequency": "daily",
    "alertCheckTime": "09:00",
    "autoApplyEnabled": false,
    "autoApplyFrequency": "daily",
    "autoApplyTime": "12:00",
    "emailDigestEnabled": true,
    "emailDigestFrequency": "daily",
    "emailDigestTime": "18:00",
    "timezone": "America/New_York",
    "lastAlertCheckAt": "2026-03-29T09:00:00Z",
    "lastAutoApplyAt": null,
    "lastEmailDigestAt": "2026-03-28T22:00:00Z"
  }
}
```

### PUT `/api/agent/scheduler/config`
Update scheduler configuration

**Request:**
```json
{
  "alertCheckEnabled": true,
  "alertCheckFrequency": "daily",
  "alertCheckTime": "09:00",
  "autoApplyEnabled": true,
  "autoApplyFrequency": "daily",
  "autoApplyTime": "12:00",
  "emailDigestEnabled": true,
  "emailDigestFrequency": "daily",
  "emailDigestTime": "18:00",
  "timezone": "America/New_York"
}
```

### GET `/api/agent/scheduler/logs?jobType=alert_check&limit=50&offset=0`
Fetch cron execution logs with filtering

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "jobType": "alert_check",
        "scheduledFor": "2026-03-29T09:00:00Z",
        "executedAt": "2026-03-29T09:02:13Z",
        "status": "success",
        "message": "Found 5 jobs, queued 3",
        "result": { "jobsFound": 5, "queued": 3, "skipped": 2 },
        "createdAt": "2026-03-29T09:02:13Z"
      }
    ],
    "total": 145,
    "limit": 50,
    "offset": 0
  }
}
```

### POST `/api/agent/scheduler/job/:jobType/run`
Manually trigger a scheduled job

**Path Parameters:**
- `jobType`: "alert_check" | "auto_apply" | "email_digest"

**Response:**
```json
{
  "success": true,
  "message": "Alert check job executed successfully",
  "result": { "jobsFound": 3, "queued": 2, "errors": 0 }
}
```

### POST `/api/agent/scheduler/job/:jobType/pause`
Temporarily pause a scheduled job

**Response:**
```json
{
  "success": true,
  "message": "alert_check job paused"
}
```

---

## Frontend Pages

### SchedulerSettings.js (300 lines)

Configuration page with sections:

```
┌────────────────────────────────────────────┐
│    🕐 Scheduler Settings                   │
├────────────────────────────────────────────┤
│                                            │
│  ⏰ Alert Check Schedule                  │
│  ☑ Enabled                                │
│  Frequency: [Hourly ▼]                    │
│  Time: [09:00]                            │
│                                            │
│  🤖 Auto-Apply Schedule                   │
│  ☑ Enabled                                │
│  Frequency: [Daily ▼]                     │
│  Time: [12:00]                            │
│                                            │
│  📧 Email Digest                          │
│  ☑ Enabled                                │
│  Frequency: [Daily ▼]                     │
│  Time: [18:00]                            │
│                                            │
│  🌍 Timezone                              │
│  [America/New_York ▼]                     │
│                                            │
│  [💾 Save Settings] [← Back]              │
│                                            │
└────────────────────────────────────────────┘
```

Features:
- Toggle each job on/off
- Frequency dropdown (hourly, daily, weekly)
- Time picker (HH:mm)
- Timezone selector (200+ IANA timezones)
- Save button with loading state
- Test buttons for manual triggers

### CronLogs.js (250 lines)

Execution history page:

```
┌────────────────────────────────────────────┐
│    📊 Scheduler Execution History          │
├────────────────────────────────────────────┤
│                                            │
│  Filter by Type: [All ▼]                  │
│  [🔄 Refresh] [Run Now ▼]                 │
│                                            │
│  Recent Executions:                       │
│  ┌──────────────────────────────────────┐ │
│  │ ✅ alert_check                       │ │
│  │ Scheduled: 2026-03-29 09:00          │ │
│  │ Executed: 2026-03-29 09:02:13        │ │
│  │ Result: Found 5 jobs, queued 3       │ │
│  │ [View Details]                       │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │ ❌ auto_apply                        │ │
│  │ Scheduled: 2026-03-29 12:00          │ │
│  │ Executed: 2026-03-29 12:05:42        │ │
│  │ Error: Daily limit exceeded          │ │
│  │ [View Details]                       │ │
│  └──────────────────────────────────────┘ │
│                                            │
└────────────────────────────────────────────┘
```

Features:
- List all cron executions
- Filter by job type
- Sort by date (newest first)
- Show status badge (success/failure)
- Display result details
- Manual trigger buttons
- Auto-refresh every 30 seconds

---

## Email Templates

### Alert Digest Email

```
╔════════════════════════════════════════════╗
║         🎯 Your Daily Job Alerts           ║
╚════════════════════════════════════════════╝

Hi {firstName},

We found 5 new jobs matching your preferences!

📋 NEW ALERTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Senior Software Engineer @ TechCorp
   Match: 85% | Remote | $150k-200k
   [View Job] [Apply]

2. Full Stack Engineer @ Startup
   Match: 78% | San Francisco | $130k-180k
   [View Job] [Apply]

⏳ PENDING APPROVALS: 2 jobs in queue
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Review Queue]

📊 This Week
- Jobs Found: 23
- Applications Submitted: 5
- Interviews Scheduled: 1

[View Dashboard] | [Update Settings] | [Unsubscribe]
```

### Application Confirmation Email

```
╔════════════════════════════════════════════╗
║      ✅ Application Submitted!             ║
╚════════════════════════════════════════════╝

Hi {firstName},

Your application to {jobTitle} at {companyName}
has been successfully submitted!

📋 Job Details
- Company: {companyName}
- Title: {jobTitle}
- Match Score: {matchScore}%
- Applied At: {appliedAt}

📧 Cover Letter Included
Resume Tailored for this position

[View Application] [View Similar Jobs]

Good luck! We'll notify you when the company responds.
```

---

## Startup Sequence

When the API server starts:

```
1. Load scheduler.service.js
2. Call scheduler.initializeScheduler()
   ├─ Query database for all SchedulerConfig records
   ├─ Filter: enabled = true
   └─ For each user:
      ├─ Load preferences (alertCheckFrequency, etc)
      ├─ Convert timezone to UTC
      ├─ Register cron jobs
      └─ Log: "Scheduler initialized for user {userId}"
3. Server ready to accept requests
```

---

## Error Handling & Retries

**Strategies:**

1. **Job Execution Failure:**
   - Log error to CronLog
   - Send alert email to user
   - Automatically retry after 5 minutes
   - Max 3 retries before stopping

2. **Email Sending Failure:**
   - Store in queue table
   - Retry exponential backoff (1m, 5m, 15m)
   - Fall back to in-app notification

3. **Database Unavailable:**
   - Pause scheduler
   - Retry connection every 30 seconds
   - Log alert to console

---

## Testing Checklist

### Scheduler Initialization
- [ ] Load all users with scheduler enabled
- [ ] Register correct number of jobs per user
- [ ] Use correct timezone for cron expressions

### Alert Check Job
- [ ] Runs at configured time
- [ ] Calls generateAlertsForUser() correctly
- [ ] Logs results to CronLog
- [ ] Handles errors gracefully

### Auto-Apply Job
- [ ] Runs at configured time
- [ ] Calls checkAndQueueApplications() correctly
- [ ] Respects daily application limits
- [ ] Logs results to CronLog

### Email Digest
- [ ] Compiles recent alerts and queue items
- [ ] Sends via SendGrid
- [ ] Email contains correct data
- [ ] Handles delivery failures

### Manual Triggers
- [ ] POST `/scheduler/job/:type/run` executes immediately
- [ ] Result returned to user
- [ ] Logged to CronLog

### Configuration Updates
- [ ] PUT `/scheduler/config` updates database
- [ ] Existing cron jobs cancelled
- [ ] New jobs registered with new settings
- [ ] Timezone conversion works correctly

### Edge Cases
- [ ] Daylight saving time transitions
- [ ] User deletes account (jobs stop)
- [ ] Multiple updates to config in quick succession
- [ ] Email sending when SMTP down

---

## Performance Targets

- Scheduler initialization: < 2 seconds
- Job registration per user: < 100ms
- Alert check execution: 3-5 seconds (includes API calls)
- Auto-apply execution: 5-8 seconds (includes API calls)
- Email sending: < 1 second
- Cron log insertion: < 100ms

---

## Dependencies to Add

```bash
npm install node-cron
npm install nodemailer
npm install @sendgrid/mail
npm install timezone-support  # For timezone conversions
```

---

## Summary

Phase 9 completes the **autonomous job hunting platform**:
- Manual setup → Fully automated
- Users configure once, system handles the rest
- Zero human interaction required
- Transparent logging and audit trail
- Email notifications keep users informed
- Error handling ensures reliability

**Ready for implementation!**
