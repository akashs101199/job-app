# Phase 5: Application Follow-Up Agent - Implementation Plan

## Overview

**Goal:** Autonomously monitor stale applications and draft follow-up communications.

**Timeline:** Phase 5A (Backend) → Phase 5B (Frontend) → Phase 5C (Integration)

**Target Completion:** This week

---

## Phase 5A: Backend Service (Task #8)

### 1. Follow-Up Detection Service

**File:** `Api/src/services/ai/followUp.service.js`

**Functions:**

```javascript
// Find stale applications needing follow-ups
getStaleApplications(userId)
  - Query applications where:
    - userId = userId
    - status = "Applied"
    - createdAt > 7 days ago
    - no updates in last 3 days
  - Return array of stale application records

// Generate follow-up email draft using Claude
generateFollowUpEmail(user, application, followUpCount)
  - Input: user profile, application details, which follow-up this is (1st, 2nd, 3rd)
  - Uses Claude API to generate personalized email
  - Escalates tone based on followUpCount
  - Returns: email draft with subject and body

// Create or update follow-up suggestion
createFollowUpSuggestion(userId, applicationId, emailDraft, followUpCount)
  - Creates FollowUp record in DB
  - Stores generated email draft
  - Default status: "pending"
  - Returns: suggestion object

// Get pending follow-ups for user
getPendingFollowUps(userId, limit = 10)
  - Query FollowUp records where:
    - userId = userId
    - status = "pending"
    - dismissed = false
  - Return sorted by createdAt DESC
  - Populate with application details

// Approve and send follow-up
approveFollowUp(followUpId)
  - Update FollowUp.status = "approved"
  - Log action to AgentLog
  - Return confirmation

// Dismiss follow-up
dismissFollowUp(followUpId)
  - Update FollowUp.dismissed = true
  - Log action to AgentLog
  - Return confirmation
```

### 2. Follow-Up Prompt Templates

**File:** `Api/src/services/ai/prompts/followUp.prompt.js`

**Prompts:**

```javascript
const followUpPrompts = {
  // First follow-up (3-5 days after application)
  firstFollowUp: (user, company, role) => `
    Write a professional, warm follow-up email...
  `,

  // Second follow-up (7-10 days after first)
  secondFollowUp: (user, company, role) => `
    Write a slightly more assertive follow-up email...
  `,

  // Third follow-up (final attempt)
  thirdFollowUp: (user, company, role) => `
    Write a final follow-up email with stronger call to action...
  `
};
```

### 3. Database Schema Update

**File:** `Api/prisma/schema.prisma`

Add FollowUp model:

```prisma
model FollowUp {
  id            Int       @id @default(autoincrement())
  userId        String
  user          User      @relation(fields: [userId], references: [email])
  applicationId Int
  application   Application @relation(fields: [applicationId], references: [id])

  emailSubject  String    @db.VarChar(500)
  emailBody     String    @db.LongText
  followUpCount Int       @default(1)  // 1st, 2nd, or 3rd follow-up

  status        String    @default("pending") // "pending" | "approved" | "sent"
  dismissed     Boolean   @default(false)
  sentAt        DateTime?

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

### 4. API Routes & Controllers

**File:** `Api/src/controllers/agent.controller.js`

Add handlers:

```javascript
// Get pending follow-ups for user
getFollowUpsHandler(userId) -> Array<FollowUp>

// Get stale applications that need follow-ups
getStaleApplicationsHandler(userId) -> Array<Application>

// Generate follow-up suggestions for all stale applications
generateFollowUpSuggestionsHandler(userId) -> Array<FollowUp>

// Approve a follow-up (would send email in production)
approveFollowUpHandler(followUpId) -> { success: true }

// Dismiss a follow-up
dismissFollowUpHandler(followUpId) -> { success: true }

// Edit follow-up before sending
editFollowUpHandler(followUpId, { emailSubject, emailBody }) -> FollowUp
```

**File:** `Api/src/routes/agent.routes.js`

Add routes:

```javascript
router.get('/follow-ups', requireAuth, getFollowUpsHandler);
router.get('/stale-applications', requireAuth, getStaleApplicationsHandler);
router.post('/follow-ups/generate', requireAuth, generateFollowUpSuggestionsHandler);
router.post('/follow-ups/:id/approve', requireAuth, approveFollowUpHandler);
router.post('/follow-ups/:id/dismiss', requireAuth, dismissFollowUpHandler);
router.patch('/follow-ups/:id', requireAuth, editFollowUpHandler);
```

---

## Phase 5B: Frontend Components (Task #9)

### 1. Follow-Up Queue Page

**File:** `client/src/pages/FollowUpQueue/FollowUpQueue.js`

Features:
- List all pending follow-ups
- Show application details (company, role, days since applied)
- Display generated email draft
- Edit email before approving
- Approve / Dismiss / Snooze actions
- Filter by status (pending, approved, dismissed)
- Sort by date (newest first)

### 2. Follow-Up Card Component

**File:** `client/src/pages/FollowUpQueue/components/FollowUpCard.js`

- Shows single follow-up suggestion
- Displays company name, role, days since application
- Shows email draft preview
- Action buttons: Edit / Approve / Dismiss
- Expandable email body
- Follow-up count indicator (1st, 2nd, 3rd)

### 3. Email Preview Modal

**File:** `client/src/components/shared/FollowUpEmailModal.js`

- Full email display
- Editable textarea for subject and body
- Save changes button
- Copy to clipboard button
- Send now button (if approved)

### 4. Dashboard Widget

**File:** `client/src/components/dashboard/FollowUpWidget.js`

- Shows count of pending follow-ups
- "New follow-up suggestions!" alert
- Quick link to follow-up queue
- Recent follow-up activity

### 5. Styling

**File:** `client/src/pages/FollowUpQueue/FollowUpQueue.css`

- Card-based layout matching existing design
- Responsive design (mobile, tablet, desktop)
- Color-coded status badges
- Hover effects and transitions
- Email preview styling

---

## Phase 5C: Integration & Features (Task #10)

### 1. API Integration

- Frontend service: `client/src/services/followUp.service.js`
- API endpoint config: update `client/src/config/api.js`
- Error handling and loading states

### 2. Routing

- Add route: `/joblist/follow-ups` for follow-up queue page
- Update `client/src/index.js`

### 3. Navigation Integration

- Add "Follow-Ups" link to TopNav
- Add notification badge showing pending count
- Link from Dashboard to follow-ups

### 4. Auto-Generation (Optional - Phase 5+)

- Background job using node-cron to auto-generate follow-ups
- Scheduled daily check for stale applications
- Notification system for new suggestions

---

## File Structure

```
Api/src/
├── services/ai/
│   ├── followUp.service.js (NEW - 300 lines)
│   └── prompts/
│       └── followUp.prompt.js (NEW - 200 lines)
├── controllers/agent.controller.js (UPDATED - +150 lines)
└── routes/agent.routes.js (UPDATED - +5 routes)

Api/prisma/
└── schema.prisma (UPDATED - +20 lines)

client/src/
├── pages/FollowUpQueue/ (NEW)
│   ├── FollowUpQueue.js (NEW - 200 lines)
│   ├── FollowUpQueue.css (NEW - 800 lines)
│   └── components/
│       └── FollowUpCard.js (NEW - 100 lines)
├── components/
│   ├── shared/
│   │   └── FollowUpEmailModal.js (NEW - 150 lines)
│   └── dashboard/
│       └── FollowUpWidget.js (NEW - 80 lines)
├── services/
│   └── followUp.service.js (NEW - 80 lines)
├── config/
│   └── api.js (UPDATED - +5 endpoints)
└── index.js (UPDATED - +1 route)
```

---

## Implementation Order

1. **Backend Phase (Task #8)**
   - Create followUp.service.js with core functions
   - Create followUp.prompt.js with email templates
   - Update Prisma schema with FollowUp model
   - Add controllers and routes
   - Test API endpoints

2. **Frontend Phase (Task #9)**
   - Create FollowUpQueue page
   - Create FollowUpCard component
   - Create FollowUpEmailModal component
   - Create FollowUpWidget for dashboard
   - Add styling

3. **Integration Phase (Task #10)**
   - Wire up API calls
   - Add routing
   - Update navigation
   - Integration testing
   - End-to-end testing

---

## Key Features

### User Experience
- ✅ View all stale applications needing follow-ups
- ✅ See AI-generated email drafts
- ✅ Edit emails before sending
- ✅ Approve, dismiss, or snooze follow-ups
- ✅ Track which follow-ups have been sent
- ✅ See application status updates in real-time

### Agent Behavior
- ✅ Auto-detect stale applications (7+ days without response)
- ✅ Generate personalized follow-ups
- ✅ Escalate tone with each follow-up attempt (max 3)
- ✅ Respect user preferences (editable before sending)
- ✅ Log all actions to AgentLog
- ✅ Track sent follow-ups in FollowUp table

### Safety & Control
- ✅ Human-in-the-loop: require user approval before sending
- ✅ Editable email drafts
- ✅ Dismiss suggestions without action
- ✅ Snooze to be reminded later
- ✅ Detailed action logging
- ✅ User can disable feature if desired

---

## Database Considerations

### New Model: FollowUp
- Tracks all follow-up suggestions and actions
- Linked to Application via applicationId
- Stores email drafts for editing
- Tracks status (pending/approved/sent/dismissed)
- Timestamps for activity logging

### Prisma Migration
```bash
npx prisma migrate dev --name add_followup_model
npx prisma generate
```

---

## Success Criteria

1. ✅ Backend service detects stale applications correctly
2. ✅ Claude API generates personalized email drafts
3. ✅ API endpoints work with proper error handling
4. ✅ Frontend displays follow-ups in organized queue
5. ✅ Users can edit, approve, dismiss suggestions
6. ✅ Responsive design works on all devices
7. ✅ All actions logged to AgentLog
8. ✅ No syntax errors (node -c validation)
9. ✅ Integration with existing features smooth
10. ✅ End-to-end flow works seamlessly

---

## Timeline Estimate

| Task | Component | Estimate | Status |
|------|-----------|----------|--------|
| #8 | Backend Service | 1-2 hours | ⏳ Next |
| #9 | Frontend Components | 2-3 hours | ⏹️ Pending |
| #10 | Integration & Testing | 1-2 hours | ⏹️ Pending |
| **Total** | **Phase 5** | **4-7 hours** | **⏳ In Progress** |

---

## Notes

- Uses same Claude API as other phases
- Follows existing architecture patterns
- Reuses existing UI components where possible
- Fully responsive design
- Error handling and edge cases covered
- Database persistence for all data
- Logging for audit trail
- Future: can be extended with actual email sending (Nodemailer/SendGrid)

---

**Ready to start Phase 5 implementation!** 🚀
