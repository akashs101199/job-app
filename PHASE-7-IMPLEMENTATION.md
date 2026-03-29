# Phase 7: Resume Optimization Agent - Implementation Guide

## Overview
Phase 7 focuses on building a Resume Optimization Agent that analyzes user resumes against job descriptions and provides AI-powered suggestions for ATS (Applicant Tracking System) optimization and role-specific customization.

**Objective:** Enable users to improve their resumes with AI-driven insights and generate tailored versions for specific jobs.

---

## Implementation Steps

### Stage 1: Backend Setup & Dependencies (Est: 2-3 hours)

#### 1.1 Install Required Dependencies
```bash
cd Api
npm install pdf-parse mammoth multer dotenv-expand
```

**Packages:**
- `pdf-parse` — Extract text from PDF files
- `mammoth` — Extract text from DOCX files
- `multer` — Handle file uploads (middleware)
- `dotenv-expand` — Already installed, for env variable expansion

#### 1.2 Update Environment Variables
Add to `.env`:
```env
# File Upload Settings
MAX_FILE_SIZE=5242880  # 5MB in bytes
UPLOAD_DIR=./uploads/resumes
ALLOWED_MIME_TYPES=application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document

# Claude API (already configured, reuse for resume analysis)
CLAUDE_API_KEY=<existing>
```

#### 1.3 Create Upload Directory
```bash
mkdir -p Api/uploads/resumes
```

#### 1.4 Update .gitignore
```
# Add to existing .gitignore
Api/uploads/
*.pdf
*.docx
*.tmp
```

---

### Stage 2: Database Schema Updates (Est: 1-2 hours)

#### 2.1 Update Prisma Schema
Add new models to `Api/schema.prisma`:

```prisma
model Resume {
  id         Int      @id @default(autoincrement())
  userId     String
  user       User     @relation(fields: [userId], references: [email], onDelete: Cascade)

  // File info
  fileName   String
  fileType   String   // "pdf" | "docx"
  filePath   String   @db.LongText
  fileSize   Int      // in bytes

  // Extracted content
  rawText    String   @db.LongText

  // Metadata
  uploadedAt DateTime @default(now())
  updatedAt  DateTime @updatedAt

  // Relations
  analyses   ResumeAnalysis[]
  tailors    ResumeTailorLog[]

  @@index([userId])
  @@index([uploadedAt])
}

model ResumeAnalysis {
  id         Int      @id @default(autoincrement())
  userId     String
  user       User     @relation(fields: [userId], references: [email], onDelete: Cascade)
  resumeId   Int
  resume     Resume   @relation(fields: [resumeId], references: [id], onDelete: Cascade)

  // Analysis results
  atsScore   Int      // 0-100
  keywords   Json     // { missing: [], present: [] }
  sections   Json     // { education: { feedback, score }, experience: {...}, skills: {...} }
  suggestions Json    // [{ type, description, impact, priority }]

  // Target job (optional)
  jobDescription String? @db.LongText
  jobTitle   String?

  createdAt  DateTime @default(now())

  @@index([userId])
  @@index([resumeId])
}

model ResumeTailorLog {
  id         Int      @id @default(autoincrement())
  userId     String
  user       User     @relation(fields: [userId], references: [email], onDelete: Cascade)
  resumeId   Int
  resume     Resume   @relation(fields: [resumeId], references: [id], onDelete: Cascade)

  jobId      String   // JSearch job_id (optional, for quick-apply)
  jobTitle   String
  jobDescription String @db.LongText

  // Generated content
  tailoredContent String @db.LongText // Modified resume text
  changes    Json     // Track what was changed

  createdAt  DateTime @default(now())

  @@index([userId])
  @@index([resumeId])
  @@index([jobId])
}

// Update User model
model User {
  // ... existing fields ...
  resumes    Resume[]
  resumeAnalyses ResumeAnalysis[]
  resumeTailors ResumeTailorLog[]
}
```

#### 2.2 Create Prisma Migration
```bash
cd Api
npx prisma migrate dev --name add_resume_optimization
```

---

### Stage 3: Backend Services - Resume Parsing (Est: 3-4 hours)

#### 3.1 Create Resume Parser Service
File: `Api/src/services/ai/resumeParser.service.js`

**Functions to implement:**
```javascript
// Main function
async parseResumeFile(filePath, fileType) → { text, metadata }

// Helper functions
async extractPdfText(filePath) → string
async extractDocxText(filePath) → string
validateFileType(mimeType) → boolean
validateFileSize(fileSize) → boolean
cleanExtractedText(text) → string
```

**Key features:**
- Accept PDF and DOCX formats
- Extract raw text while preserving structure
- Remove unnecessary whitespace and formatting
- Validate file size (max 5MB)
- Return cleaned text for analysis

#### 3.2 Create Resume Storage Service
File: `Api/src/services/resumeStorage.service.js`

**Functions:**
```javascript
async storeResume(userId, file) → { id, filePath, metadata }
async getResumeById(resumeId, userId) → Resume object
async listUserResumes(userId) → Resume[]
async deleteResume(resumeId, userId) → boolean
async updateResume(resumeId, file, userId) → Resume object
```

**Features:**
- Generate unique file names: `resume_${userId}_${timestamp}.${ext}`
- Store in `Api/uploads/resumes/`
- Database record in Resume model
- Return file metadata

---

### Stage 4: Backend Services - Resume Analysis (Est: 4-5 hours)

#### 4.1 Create Resume Analysis Service
File: `Api/src/services/ai/resumeAnalysis.service.js`

**Main workflow:**
```javascript
async analyzeResume(userId, resumeId, jobDescription = null) → {
  atsScore: 0-100,
  keywords: { missing, present, suggested },
  sections: { education, experience, skills, projects, ... },
  suggestions: [ { type, description, impact, priority } ]
}
```

**Components to implement:**

1. **ATS Score Calculator**
   - Parse resume structure (sections, formatting)
   - Check for ATS-compatible formatting
   - Analyze keyword density
   - Score: 0-100 (higher = more ATS-friendly)

2. **Keyword Analyzer**
   - Extract keywords from job description (if provided)
   - Extract keywords from resume
   - Identify missing keywords
   - Suggest high-impact keywords
   - Group by: technical skills, soft skills, tools, frameworks

3. **Section Analyzer**
   - Analyze each resume section independently
   - Provide section-specific feedback
   - Score each section (0-100)
   - Education: degree verification, institution prestige
   - Experience: action verbs, quantified achievements, relevance
   - Skills: organization, specificity, relevance
   - Projects: detail level, impact clarity

4. **Suggestion Generator**
   - Generate 5-10 concrete suggestions
   - Prioritize by impact (high/medium/low)
   - Include specific examples
   - Reference which job it's optimized for

#### 4.2 Create Claude Prompt for Resume Analysis
File: `Api/src/services/ai/prompts/resumeAnalysis.prompt.js`

**Prompt design:**
- Analyze resume structure and content
- Compare against job description (if provided)
- Identify missing keywords and skills
- Provide specific, actionable suggestions
- Format output as structured JSON

**Input:**
```javascript
{
  resumeText: string,
  jobDescription?: string,
  userProfile?: { skills, experience, education }
}
```

**Output:**
```javascript
{
  atsScore: number,
  atsAnalysis: {
    formatting: { score, issues },
    keywords: { score, missing, present },
    structure: { score, improvements }
  },
  sections: {
    education: { score, feedback, suggestions },
    experience: { score, feedback, suggestions },
    skills: { score, feedback, suggestions },
    projects?: { score, feedback, suggestions }
  },
  suggestions: [
    {
      section: string,
      type: "keyword" | "formatting" | "content" | "action_verb",
      current: string,
      suggested: string,
      impact: "high" | "medium" | "low",
      description: string
    }
  ]
}
```

---

### Stage 5: Backend Services - Resume Tailoring (Est: 3-4 hours)

#### 5.1 Create Resume Tailor Service
File: `Api/src/services/ai/resumeTailor.service.js`

**Main function:**
```javascript
async tailorResumeForJob(userId, resumeId, jobDescription, jobTitle) → {
  tailoredContent: string,
  changes: { reorderedSections, modifiedBullets, addedSkills, ... }
}
```

**Tailoring strategies:**

1. **Skill Reordering**
   - Move most relevant skills to top
   - De-emphasize less relevant skills
   - Add missing but acquirable skills

2. **Bullet Point Enhancement**
   - Replace weak verbs with strong action verbs
   - Add quantifiable metrics where possible
   - Reorder bullets by relevance to job description
   - Expand relevant experience points

3. **Keyword Integration**
   - Naturally integrate job description keywords
   - Maintain authenticity (no fabrication)
   - Add industry-specific terminology

4. **Section Reordering**
   - Prioritize sections most relevant to role
   - Move side projects up if relevant
   - De-emphasize irrelevant sections

#### 5.2 Create Claude Prompt for Resume Tailoring
File: `Api/src/services/ai/prompts/resumeTailor.prompt.js`

**Key features:**
- Receive original resume and job description
- Identify most important job requirements
- Strategically modify resume content
- Preserve truthfulness and authenticity
- Track all changes made

**Output format:**
```javascript
{
  tailoredText: string,  // Full modified resume
  changes: [
    {
      section: string,
      original: string,
      modified: string,
      reason: string
    }
  ]
}
```

---

### Stage 6: Backend API Endpoints (Est: 2-3 hours)

#### 6.1 Add Handlers to `agent.controller.js`

**Resume Upload Handler:**
```javascript
POST /api/agent/resume/upload
- Validate file type and size
- Parse file with resumeParser.service
- Store in database
- Return: { id, fileName, uploadedAt }
```

**Resume List Handler:**
```javascript
GET /api/agent/resumes
- Fetch all resumes for authenticated user
- Return: [ { id, fileName, uploadedAt }, ... ]
```

**Resume Analyze Handler:**
```javascript
POST /api/agent/resume/analyze
Body: { resumeId, jobDescription? }
- Retrieve resume from storage
- Call resumeAnalysis.service
- Save analysis to database
- Return: { atsScore, keywords, sections, suggestions }
```

**Resume Tailor Handler:**
```javascript
POST /api/agent/resume/tailor/:jobId
Body: { resumeId, jobTitle, jobDescription }
- Retrieve resume
- Call resumeTailor.service
- Save tailoring log
- Return: { tailoredContent, changes }
```

**Download Tailored Resume Handler:**
```javascript
GET /api/agent/resume/tailor/:tailorLogId/download
- Retrieve tailored content
- Convert to PDF
- Return as file download
```

#### 6.2 Add Routes to `agent.routes.js`

```javascript
router.post('/resume/upload', requireAuth, uploadMiddleware, uploadResumeHandler);
router.get('/resumes', requireAuth, listResumesHandler);
router.post('/resume/analyze', requireAuth, analyzeResumeHandler);
router.post('/resume/tailor/:jobId', requireAuth, tailorResumeHandler);
router.get('/resume/tailor/:tailorLogId/download', requireAuth, downloadTailoredHandler);
```

#### 6.3 Create File Upload Middleware
File: `Api/src/middleware/uploadMiddleware.js`

**Features:**
- Validate file type (PDF, DOCX only)
- Validate file size (max 5MB)
- Store in `uploads/resumes/` directory
- Generate unique file names
- Error handling for upload failures

---

### Stage 7: Frontend - Resume Management Page (Est: 4-5 hours)

#### 7.1 Create Resume Page Structure
File: `client/src/pages/Resume/Resume.js`

**Page layout:**
```
┌─────────────────────────────────────────┐
│  Resume Optimization Agent              │
│  Upload • Analyze • Tailor • Download   │
├─────────────────────────────────────────┤
│                                         │
│  ┌─ Upload Section ───────────────────┐ │
│  │ Drag & drop upload                  │ │
│  │ Current resume: filename.pdf        │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  ┌─ Analysis Section ──────────────────┐ │
│  │ ATS Score: [████████░] 84%          │ │
│  │ Keywords: 15 present, 8 missing     │ │
│  │ [Analyze] [Compare with Job]        │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  ┌─ Tailor Section ────────────────────┐ │
│  │ Job Title: [________________]       │ │
│  │ Paste job description:              │ │
│  │ [Large text area]                   │ │
│  │ [Generate Tailored Resume]          │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  ┌─ Suggestions Panel ─────────────────┐ │
│  │ High Priority: Add 3 keywords       │ │
│  │ Medium: Reorder experience bullets  │ │
│  │ Low: Update formatting              │ │
│  └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

**Components:**
1. Upload Section
   - Drag-and-drop area
   - File input with validation
   - Current resume display
   - Replace resume option

2. Analysis Section
   - ATS score meter with color coding
   - Keyword breakdown (missing/present)
   - Analyze button
   - Results display

3. Tailor Section
   - Job title input
   - Job description textarea
   - Generate button
   - Preview/Download buttons

4. Suggestions Panel
   - Categorized suggestions (high/medium/low)
   - Expandable details
   - Apply suggestion buttons

#### 7.2 Create Resume Service (Frontend)
File: `client/src/services/resume.service.js`

**Functions:**
```javascript
uploadResumeApi(file) → Promise
analyzeResumeApi(resumeId, jobDescription) → Promise
tailorResumeApi(resumeId, jobTitle, jobDescription) → Promise
downloadTailoredResumeApi(tailorLogId) → Promise
listResumesApi() → Promise
```

#### 7.3 Create CSS Styling
File: `client/src/pages/Resume/Resume.css`

**Key styles:**
- Upload section with drag-and-drop hover state
- ATS score meter (gradient colors: red → yellow → green)
- Analysis results with expandable sections
- Suggestion cards with priority badges
- Loading states and error messages
- Responsive design for mobile

---

### Stage 8: Frontend - Resume Analysis Display (Est: 3-4 hours)

#### 8.1 Create Analysis Results Component
File: `client/src/pages/Resume/components/AnalysisResults.js`

**Display elements:**
1. **ATS Score Card**
   - Large circular progress indicator (0-100)
   - Color coding: 0-40 (red), 40-70 (yellow), 70-100 (green)
   - Breakdown of scoring factors

2. **Keywords Section**
   - Missing keywords (red badges)
   - Present keywords (green badges)
   - Suggested keywords (yellow badges)
   - Count summary

3. **Section Feedback**
   - Expandable cards for each resume section
   - Individual scores for education, experience, skills
   - Specific feedback and improvement suggestions
   - Examples of better wording

4. **Suggestions Panel**
   - High priority (actionable, high impact)
   - Medium priority
   - Low priority
   - Each suggestion shows: current → suggested, impact, reason

#### 8.2 Create Tailor Results Component
File: `client/src/pages/Resume/components/TailorResults.js`

**Display elements:**
1. **Before/After Comparison**
   - Original resume (left side)
   - Tailored resume (right side)
   - Side-by-side view

2. **Changes Summary**
   - Sections reordered
   - Keywords added
   - Bullets rephrased
   - Skills reordered
   - Change log with before/after for each modification

3. **Action Buttons**
   - Download as PDF
   - Copy to clipboard
   - Send to email
   - Save as new version

---

### Stage 9: Integration & Enhancements (Est: 2-3 hours)

#### 9.1 Add Resume to Dashboard Widget
File: `client/src/components/dashboard/ResumeWidget.js`

**Widget display:**
- Latest resume file name
- Last analysis ATS score
- Quick access to analysis/tailor
- Upload new resume button

#### 9.2 Update API Config
File: `client/src/config/api.js`

**Add endpoints:**
```javascript
AGENT_RESUME_UPLOAD: `${API_BASE_URL}/agent/resume/upload`,
AGENT_RESUMES: `${API_BASE_URL}/agent/resumes`,
AGENT_RESUME_ANALYZE: `${API_BASE_URL}/agent/resume/analyze`,
AGENT_RESUME_TAILOR: `${API_BASE_URL}/agent/resume/tailor`,
```

#### 9.3 Update Frontend Routing
File: `client/src/index.js`

**Add route:**
```javascript
<Route path="resume" element={<Resume />} />
```

#### 9.4 Add Navigation Links
- Update TopNav to include Resume link
- Update Dashboard with Resume widget
- Update Preferences to link to Resume page

---

### Stage 10: Testing & Validation (Est: 3-4 hours)

#### 10.1 Backend Testing
```bash
# Test file upload
curl -X POST http://localhost:5000/api/agent/resume/upload \
  -F "file=@resume.pdf" \
  -H "Authorization: Bearer <token>"

# Test analysis
curl -X POST http://localhost:5000/api/agent/resume/analyze \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"resumeId": 1, "jobDescription": "..."}'

# Test tailoring
curl -X POST http://localhost:5000/api/agent/resume/tailor/job123 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"resumeId": 1, "jobTitle": "...", "jobDescription": "..."}'
```

#### 10.2 Frontend Testing
- Upload multiple file formats (PDF, DOCX)
- Verify analysis with different job descriptions
- Test tailoring suggestions
- Verify PDF download works
- Test responsive design on mobile

#### 10.3 Database Verification
```sql
-- Check resumes
SELECT * FROM Resume WHERE userId = 'test@example.com';

-- Check analyses
SELECT * FROM ResumeAnalysis WHERE userId = 'test@example.com';

-- Check tailors
SELECT * FROM ResumeTailorLog WHERE userId = 'test@example.com';
```

---

## Technical Stack

### Backend Dependencies
```json
{
  "pdf-parse": "^1.1.1",
  "mammoth": "^1.6.0",
  "multer": "^1.4.5",
  "pdfkit": "^0.13.0"  // For generating PDF downloads
}
```

### Frontend Dependencies
```json
{
  "react-dropzone": "^14.2.3",  // Better file upload UX
  "pdfjs-dist": "^3.11.174"     // For PDF preview
}
```

---

## Implementation Timeline

| Stage | Task | Est. Time | Total |
|-------|------|-----------|-------|
| 1 | Backend Setup | 2-3h | 2-3h |
| 2 | Database Schema | 1-2h | 3-5h |
| 3 | Resume Parsing | 3-4h | 6-9h |
| 4 | Resume Analysis | 4-5h | 10-14h |
| 5 | Resume Tailoring | 3-4h | 13-18h |
| 6 | API Endpoints | 2-3h | 15-21h |
| 7 | Frontend Page | 4-5h | 19-26h |
| 8 | Analysis Display | 3-4h | 22-30h |
| 9 | Integration | 2-3h | 24-33h |
| 10 | Testing | 3-4h | 27-37h |

**Total Estimated Time:** 27-37 hours (3-5 days of focused development)

---

## Success Criteria

✅ Users can upload PDF and DOCX resumes
✅ ATS score accurately reflects resume optimization level (0-100)
✅ Keyword analysis identifies missing high-impact keywords
✅ Section feedback is specific and actionable
✅ Tailored resumes maintain authenticity while optimizing for jobs
✅ Users can download tailored resumes as PDF
✅ Full responsive design works on mobile/tablet/desktop
✅ All features tested with sample resumes and job descriptions

---

## Notes for Development

1. **Reuse existing services:** Resume analysis and tailoring can reuse Claude API infrastructure from Phase 1-2
2. **Prompt engineering:** Invest time in quality prompts for analysis and tailoring - this is critical for value
3. **Error handling:** File upload and parsing can fail in many ways - comprehensive error messages are important
4. **Performance:** PDF parsing can be slow - consider showing loading spinners
5. **Security:** Validate all file uploads, limit file size, store securely, clean up old files
6. **UX:** Resume analysis is new feature - provide clear instructions and examples

---

## Future Enhancements (Phase 8+)

- Compare resumes (side-by-side analysis)
- Save multiple resume versions
- Resume template suggestions
- Interview preparation based on resume
- Auto-tailor resumes when applying from alerts
- Email resume to self / recruiter
- Bulk tailor for multiple jobs
