# Phase 10: Advanced Email Notifications & Templates

## Vision

Build a sophisticated email notification system with customizable templates, smart delivery scheduling, preference management, and rich HTML email designs that keep users engaged throughout their job search journey.

## Goals

1. **Template Engine** — Create reusable, customizable email templates for all notification types
2. **Notification Preferences** — Let users control what they receive, when, and how often
3. **Smart Delivery** — Respect user preferences and prevent email fatigue
4. **Template Management** — Admin/user interface for email template customization
5. **Analytics** — Track email opens, clicks, and conversions
6. **Unsubscribe Management** — Comply with CAN-SPAM and GDPR regulations

## Key Features

### Email Types & Templates

| Type | Trigger | Recipient | Purpose |
|------|---------|-----------|---------|
| **Daily Alert Digest** | Scheduled (6 PM) | User | Summary of new matching jobs |
| **Weekly Digest** | Scheduled (Sunday) | User | Weekly application stats + insights |
| **Auto-Apply Confirmation** | Post-application | User | Confirmation of successful application |
| **Interview Scheduled** | Status update | User | Notification when interview is scheduled |
| **Follow-Up Reminder** | Stale application | User | Reminder to follow-up with employer |
| **Weekly Stats** | Scheduled (Monday) | User | Performance metrics + recommendations |
| **Milestone Achievement** | Threshold met | User | Celebration of milestones (10 apps, 2 interviews, etc) |
| **Action Required** | Approval needed | User | Queue items awaiting approval |

### Notification Preferences

Users can customize:
- ✅ Which notifications they receive
- ✅ Frequency (always, daily, weekly, never)
- ✅ Preferred time of day
- ✅ Email grouping (send individually vs digest)
- ✅ Content preferences (detailed vs summary)
- ✅ Unsubscribe from specific types

### Email Template Structure

```html
<!-- Professional HTML email with:
  - Header with logo and user name
  - Main content section (dynamic)
  - Call-to-action buttons
  - Stats/metrics section (optional)
  - Footer with links and unsubscribe
-->
```

## Implementation Plan

### Phase 10.1: Database Models & Preferences

#### New Database Models

```prisma
model EmailTemplate {
  id           Int      @id @default(autoincrement())
  name         String   @unique // "daily_digest", "auto_apply_confirmation", etc
  subject      String   // Email subject line
  htmlContent  String   @db.LongText // HTML template with {{placeholders}}
  textContent  String   @db.LongText // Plain text fallback
  category     String   // "digest" | "transactional" | "marketing"
  isActive     Boolean  @default(true)
  variables    Json     // Required template variables
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([name])
}

model NotificationPreference {
  userId              String   @id
  user                User     @relation(fields: [userId], references: [email], onDelete: Cascade)

  // Notification types and frequencies
  dailyAlertDigest    Boolean  @default(true)
  dailyAlertTime      String   @default("18:00") // HH:mm format

  weeklyDigest        Boolean  @default(true)
  weeklyDigestDay     String   @default("sunday") // day of week
  weeklyDigestTime    String   @default("09:00")

  autoApplyConfirm    Boolean  @default(true)
  interviewNotif      Boolean  @default(true)
  followUpReminder    Boolean  @default(true)
  weeklyStats         Boolean  @default(true)
  milestoneNotif      Boolean  @default(true)
  actionRequired      Boolean  @default(true)

  // Delivery preferences
  emailGrouping       String   @default("digest") // "individual" | "digest"
  contentLevel        String   @default("detailed") // "summary" | "detailed"

  // Opt-out
  unsubscribedTypes   Json     @default("[]") // Array of notification type strings
  globalOptOut        Boolean  @default(false)

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([userId])
}

model EmailLog {
  id              Int      @id @default(autoincrement())
  userId          String
  user            User     @relation(fields: [userId], references: [email], onDelete: Cascade)

  templateId      Int
  notificationType String // "daily_digest", "auto_apply_confirmation", etc
  subject         String
  recipients      Json     // Array of email addresses

  sentAt          DateTime @default(now())
  deliveredAt     DateTime? // After SendGrid webhook
  failedAt        DateTime?
  failureReason   String?

  // Analytics
  opens           Int      @default(0)
  clicks          Int      @default(0)
  bounces         Int      @default(0)

  metadata        Json?    // { jobCount: 5, statsInluded: true, etc }

  @@index([userId])
  @@index([sentAt])
  @@index([notificationType])
}

model EmailMetrics {
  id              Int      @id @default(autoincrement())
  notificationType String   @unique // "daily_digest", etc

  sent            Int      @default(0)
  delivered       Int      @default(0)
  bounced         Int      @default(0)
  opened          Int      @default(0)
  clicked         Int      @default(0)

  openRate        Float    @default(0.0)
  clickRate       Float    @default(0.0)
  bounceRate      Float    @default(0.0)

  updatedAt       DateTime @updatedAt

  @@index([notificationType])
}
```

#### Database Migration

```bash
npx prisma migrate dev --name add_email_notifications
```

### Phase 10.2: Email Template Engine

#### Service: `emailTemplate.service.js` (400 lines)

```javascript
// Core functions

/**
 * Get template by name
 * @param {string} templateName - e.g., "daily_digest"
 * @returns {Promise<EmailTemplate>}
 */
async getTemplate(templateName) {
  // Fetch from DB with fallback to hardcoded defaults
}

/**
 * Render template with data
 * @param {string} templateName
 * @param {object} data - Template variables
 * @returns {Promise<{ html: string, text: string, subject: string }>}
 */
async renderTemplate(templateName, data) {
  // Load template
  // Replace {{placeholders}} with data
  // Return rendered HTML and text
}

/**
 * Create or update template
 * @param {object} templateData
 * @returns {Promise<EmailTemplate>}
 */
async saveTemplate(templateData) {
  // Create/update with validation
}

/**
 * Get template variables for validation
 * @param {string} templateName
 * @returns {array} List of required variables
 */
async getTemplateVariables(templateName) {
  // Return required placeholders
}
```

#### Hardcoded Default Templates

**1. Daily Alert Digest**
- Subject: `🔔 {{jobCount}} new jobs matching your preferences`
- Includes: Top 5 job cards with match scores, stats, CTA
- Variables: `jobCount`, `jobs`, `userName`, `unsubscribeUrl`

**2. Weekly Digest**
- Subject: `📊 Your Job Search Summary — Week of {{weekStart}}`
- Includes: Application stats, performance metrics, top recommendations
- Variables: `weekStart`, `appliedCount`, `stats`, `recommendations`

**3. Auto-Apply Confirmation**
- Subject: `✅ You applied to {{jobTitle}} at {{companyName}}`
- Includes: Job details, application date, next steps
- Variables: `jobTitle`, `companyName`, `appliedAt`

**4. Interview Scheduled Notification**
- Subject: `🎉 Interview scheduled with {{companyName}}!`
- Includes: Interview details, prep resources, calendar link
- Variables: `companyName`, `interviewDate`, `prepUrl`

**5. Follow-Up Reminder**
- Subject: `📬 Time to follow up with {{companyName}}`
- Includes: Application details, suggested email template, CTA
- Variables: `companyName`, `jobTitle`, `daysAgo`

**6. Weekly Stats**
- Subject: `📈 Your Job Search Stats`
- Includes: KPIs, charts, insights, recommendations
- Variables: `stats`, `insights`, `recommendations`

**7. Milestone Achievement**
- Subject: `🏆 Congratulations! You've reached {{milestone}}`
- Includes: Achievement details, encouraging message
- Variables: `milestone`, `date`, `nextMilestone`

**8. Action Required**
- Subject: `⚡ {{count}} jobs need your approval`
- Includes: Queue items with details, quick action buttons
- Variables: `count`, `queueItems`, `approvalUrl`

### Phase 10.3: Notification Service

#### Service: `notification.service.js` (500 lines)

```javascript
// Functions for managing notifications

/**
 * Get user's notification preferences
 * @param {string} userId
 * @returns {Promise<NotificationPreference>}
 */
async getNotificationPreferences(userId) {
  // Load preferences with defaults
}

/**
 * Update notification preferences
 * @param {string} userId
 * @param {object} updates
 * @returns {Promise<NotificationPreference>}
 */
async updateNotificationPreferences(userId, updates) {
  // Validate and update
}

/**
 * Check if user should receive notification type
 * @param {string} userId
 * @param {string} notificationType
 * @returns {Promise<boolean>}
 */
async shouldSendNotification(userId, notificationType) {
  // Check preferences, unsubscribe list, opt-out status
}

/**
 * Queue a notification for sending
 * @param {string} userId
 * @param {string} notificationType
 * @param {object} data
 * @returns {Promise<EmailLog>}
 */
async queueNotification(userId, notificationType, data) {
  // Check preferences
  // Render template
  // Send via emailService
  // Log to EmailLog
}

/**
 * Get email open/click rate for template type
 * @param {string} notificationType
 * @returns {Promise<EmailMetrics>}
 */
async getMetrics(notificationType) {
  // Fetch from EmailMetrics
}

/**
 * Update metrics from SendGrid webhooks
 * @param {string} emailLogId
 * @param {string} event - "open" | "click" | "bounce" | "delivered"
 */
async updateMetrics(emailLogId, event) {
  // Update EmailLog and EmailMetrics
}
```

### Phase 10.4: API Endpoints

#### New Routes in `agent.routes.js`

```javascript
// Notification Preferences
router.get('/notifications/preferences', requireAuth, getNotificationPreferencesHandler);
router.put('/notifications/preferences', requireAuth, updateNotificationPreferencesHandler);

// Email Templates (admin only, for future)
router.get('/admin/email-templates', requireAuth, requireAdmin, getEmailTemplatesHandler);
router.post('/admin/email-templates', requireAuth, requireAdmin, saveEmailTemplateHandler);

// Email Logs & Metrics
router.get('/notifications/logs', requireAuth, getEmailLogsHandler);
router.get('/notifications/metrics/:type', requireAuth, getNotificationMetricsHandler);

// Webhook for SendGrid events
router.post('/webhooks/sendgrid', verifySendGridSignature, handleSendGridWebhook);

// Unsubscribe link (public)
router.post('/notifications/unsubscribe/:token', handleUnsubscribeLink);
```

#### Handler Functions

```javascript
// api/src/controllers/agent.controller.js

const getNotificationPreferencesHandler = async (req, res) => {
  const userId = req.user.email;
  const prefs = await notificationService.getNotificationPreferences(userId);
  res.json(prefs);
};

const updateNotificationPreferencesHandler = async (req, res) => {
  const userId = req.user.email;
  const updated = await notificationService.updateNotificationPreferences(userId, req.body);
  res.json(updated);
};

const getEmailLogsHandler = async (req, res) => {
  const userId = req.user.email;
  const { type, limit = 50, offset = 0 } = req.query;
  const logs = await notificationService.getEmailLogs(userId, type, limit, offset);
  res.json(logs);
};

const handleSendGridWebhook = async (req, res) => {
  // Verify webhook signature
  // Parse events
  // Update metrics
  res.status(200).send('OK');
};

const handleUnsubscribeLink = async (req, res) => {
  const { token } = req.params;
  // Decode token (userId + notificationType)
  // Add to unsubscribeList
  res.json({ message: 'Unsubscribed successfully' });
};
```

### Phase 10.5: Frontend - Notification Preferences Page

#### Page: `NotificationPreferences.js` (500 lines)

```javascript
// client/src/pages/NotificationPreferences/NotificationPreferences.js

// Features:
// - Toggle switches for each notification type
// - Time/day pickers
// - Email grouping options
// - Content level (summary vs detailed)
// - Unsubscribe from specific types
// - Save/Preview buttons
// - Real-time preference updates
// - Error handling and loading states
```

#### Sections

1. **Daily Notifications**
   - ☑️ Daily Alert Digest (6 PM)
   - ☑️ Action Required Alerts (2 PM)

2. **Weekly Notifications**
   - ☑️ Weekly Summary (Sunday 9 AM)
   - ☑️ Weekly Stats (Monday 9 AM)

3. **Transactional Notifications**
   - ☑️ Auto-Apply Confirmations
   - ☑️ Interview Scheduled
   - ☑️ Follow-Up Reminders
   - ☑️ Milestone Achievements

4. **Delivery Preferences**
   - Group emails into digest or send individually
   - Content level: Summary or Detailed
   - Preferred time of day for all notifications

5. **Manage Unsubscriptions**
   - List of unsubscribed notification types
   - Restore any type with one click

#### Styling

```css
/* NotificationPreferences.css (~500 lines) */
- Clean toggle switches
- Section headers with descriptions
- Time/day pickers
- Responsive grid layout
- Confirm/Cancel buttons
- Success/error messages
- Loading states
```

### Phase 10.6: Frontend - Email Analytics Dashboard

#### Page: `EmailAnalytics.js` (400 lines)

```javascript
// client/src/pages/EmailAnalytics/EmailAnalytics.js

// Display:
// - Email performance metrics (send rate, open rate, click rate)
// - Timeline of sent emails
// - Breakdown by notification type
// - Recent email history with status
// - Charts showing trends
```

#### Components

- **MetricsCard** — Display metric with sparkline
- **EmailHistoryTable** — List of sent emails with status
- **NotificationType BreakDown** — Pie chart or bar chart
- **TrendChart** — Open/click rates over time

### Phase 10.7: Email Service Integration

#### Updates to `emailService.js`

```javascript
// Existing function enhanced with templates

async sendEmailWithTemplate(userId, notificationType, data) {
  // Load user preferences
  // Check if should send
  // Render template
  // Add unsubscribe link
  // Send via SendGrid
  // Log to EmailLog
  // Return result
}

async sendBulkNotifications(notificationType, filters) {
  // Find users matching criteria
  // Get their preferences
  // Batch send emails
  // Log all sends
  // Track delivery
}

// Unsubscribe link generation
generateUnsubscribeToken(userId, notificationType) {
  // Create JWT or encoded token
  // Include in email footer
}
```

### Phase 10.8: SendGrid Webhook Integration

#### Webhook Handler

```javascript
// Handle SendGrid events: delivered, bounce, open, click

app.post('/api/webhooks/sendgrid', verifySendGridSignature, async (req, res) => {
  const events = req.body;

  for (const event of events) {
    const { event: eventType, email, timestamp, sg_message_id } = event;

    switch (eventType) {
      case 'delivered':
        await EmailLog.update({ deliveredAt: new Date(timestamp * 1000) });
        break;
      case 'open':
        await EmailLog.update({ opens: { increment: 1 } });
        break;
      case 'click':
        await EmailLog.update({ clicks: { increment: 1 } });
        break;
      case 'bounce':
        await EmailLog.update({ failureReason: 'Bounced' });
        break;
    }
  }

  res.status(200).send('OK');
});

// Verify SendGrid signature
const verifySendGridSignature = (req, res, next) => {
  const signature = req.headers['x-twilio-email-event-webhook-signature'];
  const timestamp = req.headers['x-twilio-email-event-webhook-timestamp'];

  // Verify using SENDGRID_WEBHOOK_KEY
  // If valid, call next()
};
```

## Database Schema

See section Phase 10.1 for full schema with:
- `EmailTemplate` — Reusable templates
- `NotificationPreference` — User preferences
- `EmailLog` — Sent emails with analytics
- `EmailMetrics` — Aggregate performance stats

## API Specification

### GET /api/notifications/preferences
```json
{
  "userId": "user@example.com",
  "dailyAlertDigest": true,
  "dailyAlertTime": "18:00",
  "weeklyDigest": true,
  "weeklyDigestDay": "sunday",
  "autoApplyConfirm": true,
  "emailGrouping": "digest",
  "contentLevel": "detailed",
  "unsubscribedTypes": ["marketing"],
  "globalOptOut": false
}
```

### PUT /api/notifications/preferences
```json
{
  "dailyAlertDigest": false,
  "weeklyDigest": true,
  "emailGrouping": "individual"
}
```

### GET /api/notifications/logs?type=daily_digest&limit=50
```json
{
  "logs": [
    {
      "id": 123,
      "notificationType": "daily_digest",
      "subject": "🔔 5 new jobs matching your preferences",
      "sentAt": "2025-03-29T18:00:00Z",
      "deliveredAt": "2025-03-29T18:00:15Z",
      "opens": 1,
      "clicks": 0
    }
  ],
  "total": 45,
  "limit": 50,
  "offset": 0
}
```

### GET /api/notifications/metrics/daily_digest
```json
{
  "notificationType": "daily_digest",
  "sent": 450,
  "delivered": 445,
  "bounced": 5,
  "opened": 267,
  "clicked": 89,
  "openRate": 0.60,
  "clickRate": 0.20,
  "bounceRate": 0.01
}
```

## User Flow

### First Time

1. User creates account
2. Default preferences created (all on, 6 PM daily)
3. First alert digest sent automatically (Phase 9 scheduler)
4. User can customize in preferences page

### Customizing Preferences

1. Navigate to Settings → Notification Preferences
2. Toggle notification types on/off
3. Adjust frequency and timing
4. Save preferences
5. Confirmation message shows

### Unsubscribing

1. User clicks unsubscribe link in email
2. Unique token decoded
3. User preference updated (unsubscribed from type)
4. Confirmation page shown
5. User can re-subscribe anytime in preferences

## Implementation Timeline

- **Step 1:** Database models & migration (2-3 hours)
- **Step 2:** Email template engine (3-4 hours)
- **Step 3:** Notification service (3-4 hours)
- **Step 4:** API endpoints (2-3 hours)
- **Step 5:** Frontend preferences page (3-4 hours)
- **Step 6:** Email analytics dashboard (2-3 hours)
- **Step 7:** SendGrid webhook integration (2-3 hours)
- **Step 8:** Testing & refinement (2-3 hours)

**Total: ~20-27 hours of development**

## Testing Checklist

- [ ] Email templates render correctly with test data
- [ ] User preferences save and load correctly
- [ ] Notifications respect user preferences
- [ ] Unsubscribe link works and updates preferences
- [ ] SendGrid webhook events tracked correctly
- [ ] Email open/click rates calculated accurately
- [ ] Preference page UI responsive on all devices
- [ ] Analytics dashboard displays correct metrics
- [ ] Bulk notification sending works efficiently
- [ ] Fallback handling if SendGrid fails
- [ ] GDPR compliance (opt-in/out, data retention)

## Performance Targets

- Template rendering: < 100ms
- Email sending: < 500ms per email
- Preference update: < 300ms
- Analytics fetch: < 1s
- Webhook processing: < 100ms per event
- Bulk send (100 emails): < 10s

## Future Enhancements (Phase 11+)

- A/B testing for email subject lines and content
- ML-based optimal send time per user
- SMS notifications for critical alerts
- Slack/Teams integration for notifications
- Rich notification center in-app (vs just email)
- Email template builder UI for admins
- Advanced segmentation and targeting
- Notification frequency throttling (prevent fatigue)

## Dependencies

No new npm packages needed (SendGrid already integrated in Phase 9).

## Files to Create

**Backend:**
- `Api/src/services/email/emailTemplate.service.js` (400 lines)
- `Api/src/services/notifications/notification.service.js` (500 lines)
- `Api/src/middleware/sendgridWebhook.js` (100 lines)

**Frontend:**
- `client/src/pages/NotificationPreferences/NotificationPreferences.js` (500 lines)
- `client/src/pages/NotificationPreferences/NotificationPreferences.css` (500 lines)
- `client/src/pages/EmailAnalytics/EmailAnalytics.js` (400 lines)
- `client/src/pages/EmailAnalytics/EmailAnalytics.css` (400 lines)
- `client/src/pages/EmailAnalytics/components/MetricsCard.js` (100 lines)
- `client/src/pages/EmailAnalytics/components/EmailHistoryTable.js` (200 lines)
- `client/src/services/notifications.service.js` (200 lines)

**Database:**
- Migration file created by Prisma

## Files to Modify

**Backend:**
- `Api/schema.prisma` — Add 4 new models
- `Api/src/controllers/agent.controller.js` — Add 7 handlers
- `Api/src/routes/agent.routes.js` — Add 7 routes
- `Api/src/services/email/emailService.js` — Enhance existing functions
- `Api/src/index.js` — Register webhook route

**Frontend:**
- `client/src/config/api.js` — Add new endpoints
- `client/src/index.js` — Add 2 routes
- `client/src/components/layout/TopNav.js` — Add Settings link to preferences

## Success Criteria

✅ Users can fully customize when/what/how they receive emails
✅ Email templates are dynamic and data-driven
✅ SendGrid webhooks track email metrics
✅ Unsubscribe/preference links work flawlessly
✅ GDPR/CAN-SPAM compliance verified
✅ All email types have professional HTML templates
✅ Analytics dashboard shows clear performance metrics
✅ Zero broken email links or formatting issues
✅ All tests passing
✅ Code merged to master and deployed
