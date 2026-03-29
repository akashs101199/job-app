# Job Portal AI Enhancement 🤖

**AI-Powered Autonomous Job Hunting Platform**

[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)](#-project-status)
[![Phases](https://img.shields.io/badge/Phases-10%2F10%20Complete-brightgreen)](#-phase-breakdown)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen?logo=node.js)]()
[![React](https://img.shields.io/badge/React-18-blue?logo=react)]()
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange?logo=mysql)]()
[![Playwright](https://img.shields.io/badge/Tests-Playwright-green)]()
[![License](https://img.shields.io/badge/License-Private-red)](#license)

> Transform your job search with AI agents that discover, match, apply, and interview for you.

**[Quick Start](#-running-the-project)** • **[Features](#-key-features)** • **[Tech Stack](#-technology-stack)** • **[Documentation](#-documentation)** • **[Testing](#-testing)** • **[Phases](#-phase-breakdown)**

---

## ✨ Key Features

### 🔐 Authentication
- Email/password registration & login
- Google OAuth 2.0 integration
- Secure JWT authentication with refresh tokens
- 7-day session persistence

### 🎯 AI-Powered Features
- **🤖 Cover Letter Agent** — One-click tailored cover letters
- **📊 Resume Matching** — 0-100 intelligence score on every job
- **🎓 Interview Prep** — AI-generated interview packages
- **📈 Market Analytics** — Insights from your application data
- **✉️ Follow-Up Agent** — Automated follow-up email generation
- **🚀 Auto-Apply** — Autonomous job application orchestration

### 📧 Email & Notifications
- SendGrid email integration with tracking
- Click & open engagement tracking
- Email analytics dashboard
- Notification preferences UI
- Smart alert scheduling

### 🔔 Smart Alerts
- Proactive job discovery
- Real-time notifications with badges
- Preference-based filtering
- Quick apply actions

### 📄 Resume Tools
- PDF/DOCX parsing
- ATS compatibility scoring
- Keyword optimization
- Job-specific tailoring

### ⚙️ Automation
- Background job scheduling (node-cron)
- Email digest generation
- Real-time metrics & analytics
- 3 autonomous jobs: alert_check, auto_apply, email_digest

---

## 🛠️ Technology Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 18, React Router, Bootstrap 5 |
| **Backend** | Node.js, Express.js, Prisma ORM |
| **Database** | MySQL 8.0 |
| **AI** | Anthropic Claude API |
| **Email** | SendGrid |
| **Testing** | Playwright E2E, React Testing |
| **Auth** | JWT + OAuth 2.0 |
| **Scheduling** | node-cron |
| **File Upload** | multer |

---

## 📋 Prerequisites

Before installation, ensure you have:

```
✅ Node.js 18.x or higher
✅ npm or yarn
✅ MySQL 8.0 or higher
✅ Git
```

### API Keys Required

```
✅ Anthropic API Key (Claude)
✅ SendGrid API Key (for emails)
✅ RapidAPI Key (JSearch)
✅ Google OAuth credentials (optional)
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone Repository

```bash
git clone <repository-url>
cd job-app
```

### 2️⃣ Backend Setup

```bash
cd Api

# Install dependencies
npm install

# Create environment configuration
cat > .env << EOF
# Database
DATABASE_URL="mysql://root:root@localhost:3306/project"

# Authentication
JWT_SECRET="your-super-secret-key-here"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AI & External APIs
ANTHROPIC_API_KEY="sk-ant-your-key-here"
RAPIDAPI_KEY="your-rapidapi-key"

# Email Service
SENDGRID_API_KEY="SG.your-sendgrid-key"
EMAIL_FROM="noreply@jobapp.ai"

# App Configuration
CORS_ORIGIN="http://localhost:3000"
FRONTEND_URL="http://localhost:3000"
PORT=5000
NODE_ENV=development
EOF

# Setup database
npx prisma migrate deploy

# (Optional) View database
npx prisma studio
```

### 3️⃣ Frontend Setup

```bash
cd ../client

# Install dependencies
npm install

# Start development server
npm start
# Opens http://localhost:3000
```

### 4️⃣ Start Backend

```bash
cd ../Api

# Start server
npm start
# Runs on http://localhost:5000
```

---

## 🚀 Running the Project

### Option A: Development Environment (Recommended)

Open **3 terminals**:

**Terminal 1 — Backend**
```bash
cd Api
npm start
# Output: Server running on http://localhost:5000 ✓
```

**Terminal 2 — Frontend**
```bash
cd client
npm start
# Output: App running on http://localhost:3000 ✓
```

**Terminal 3 — Tests (Optional)**
```bash
cd client
npm run test:ui
# Opens interactive test dashboard
```

### Option B: Production Build

```bash
# Build frontend
cd client
npm run build

# Build backend (if needed)
cd Api
npm run build

# Production environment variables
export NODE_ENV=production
export DATABASE_URL="..."
export ANTHROPIC_API_KEY="..."

# Start backend
npm start
```

### Option C: Docker

```bash
# Build and run with Docker Compose
docker-compose up

# Or build image
docker build -t job-app .
docker run -p 3000:3000 -p 5000:5000 job-app
```

---

## 🧪 Testing

### Run All Tests

```bash
cd client

# Interactive mode (recommended for development)
npm run test:ui

# Headless mode (CI/CD)
npm run test:e2e

# Watch browser during test
npm run test:headed

# Debug mode with inspector
npm run test:debug

# View HTML report
npm run test:report
```

### Test Coverage

- ✅ Authentication (login, register, validation)
- ✅ Navigation & routing
- ✅ Job search features
- ✅ Notification system
- ✅ API endpoints
- ✅ Email analytics
- ✅ Multi-browser support (Chrome, Firefox, Safari)

---

## 📚 Documentation

### Complete Documentation Files

| File | Purpose |
|------|---------|
| **PROJECT_DOCUMENTATION.md** | 📘 Full technical documentation (1000+ lines) |
| **TESTING_GUIDE.md** | 🧪 Complete testing guide with examples |
| **PLAN.md** | 📋 Detailed project roadmap & architecture |
| **PHASE-10-IMPLEMENTATION.md** | 📧 Email system & webhook integration |

### Key Documentation Sections

Each documentation file contains:
- **Architecture** — System design and data flow
- **API Endpoints** — Complete REST API reference
- **Database Schema** — Full Prisma schema
- **Phase Breakdown** — What each phase delivers
- **Troubleshooting** — Common issues & solutions
- **Deployment** — Production setup guide

---

## 🔄 Phase Breakdown

All **10 phases** are **COMPLETE** ✅

| Phase | Feature | Status |
|-------|---------|--------|
| 0 | Foundation & Security | ✅ Complete |
| 1 | Cover Letter Agent | ✅ Complete |
| 2 | Resume-Job Matching | ✅ Complete |
| 3 | Interview Preparation | ✅ Complete |
| 4 | Market Analytics | ✅ Complete |
| 5 | Follow-Up Agent | ✅ Complete |
| 6 | Smart Job Alerts | ✅ Complete |
| 7 | Resume Optimization | ✅ Complete |
| 8 | Auto-Apply Agent | ✅ Complete |
| 9 | Background Scheduling | ✅ Complete |
| 10 | Email Notifications | ✅ Complete |

### What Each Phase Delivers

**Phase 0** — Secure, modular codebase with JWT auth, bcrypt, input validation
**Phase 1** — AI-powered cover letter generation
**Phase 2** — Intelligent job matching with 0-100 scores
**Phase 3** — Complete interview prep packages
**Phase 4** — Analytics dashboard with insights
**Phase 5** — Automated follow-up email generation
**Phase 6** — Smart job alerts with proactive discovery
**Phase 7** — Resume optimization with ATS scoring
**Phase 8** — Autonomous auto-apply orchestration
**Phase 9** — Background job scheduling with cron
**Phase 10** — Email sending, tracking, analytics, & notifications

---

## 📁 Project Structure

```
job-app/
├── Api/                              # Backend (Node.js + Express)
│   ├── src/
│   │   ├── controllers/              # Request handlers
│   │   ├── services/                 # Business logic
│   │   │   ├── ai/                   # AI agents
│   │   │   ├── email/                # Email services
│   │   │   └── notifications/        # Notification system
│   │   ├── routes/                   # API endpoints
│   │   ├── middleware/               # Auth, validation
│   │   └── config/                   # Database, auth setup
│   ├── schema.prisma                 # Database schema
│   └── package.json
│
├── client/                           # Frontend (React)
│   ├── src/
│   │   ├── pages/                    # Page components
│   │   ├── components/               # Reusable UI components
│   │   ├── services/                 # API client services
│   │   ├── context/                  # React Context (Auth)
│   │   └── index.js                  # Routes & entry point
│   ├── tests/                        # Playwright E2E tests
│   ├── package.json
│   └── public/
│
├── PROJECT_DOCUMENTATION.md          # Full technical docs
├── TESTING_GUIDE.md                  # Testing guide
├── PLAN.md                           # Project roadmap
└── README.md                         # This file
```

---

## 🔗 Key API Endpoints

### Authentication
```
POST   /api/auth/register           Register new account
POST   /api/auth/login              User login
POST   /api/auth/refresh            Refresh JWT token
POST   /api/auth/logout             Logout
```

### Job Management
```
GET    /api/jobs/search             Search jobs
POST   /api/tracker/save            Save job
POST   /api/tracker/apply           Mark as applied
```

### AI Agents
```
POST   /api/agent/cover-letter      Generate cover letter
POST   /api/agent/match-jobs        Match jobs with score
POST   /api/agent/interview-prep    Generate interview prep
GET    /api/agent/insights          Get insights
POST   /api/agent/resume/analyze    Analyze resume
POST   /api/agent/auto-apply/check  Trigger auto-apply
```

### Notifications
```
GET    /api/notifications/logs      Get email logs
GET    /api/notifications/metrics   Get metrics
GET    /api/notifications/preferences Get preferences
PUT    /api/notifications/preferences Update preferences
POST   /api/webhooks/sendgrid       SendGrid webhook
```

See **PROJECT_DOCUMENTATION.md** for complete API reference.

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is in use
lsof -i :5000

# Check database connection
npx prisma db push

# Check environment variables
cat Api/.env
```

### Frontend won't start
```bash
# Clear cache and reinstall
cd client
rm -rf node_modules package-lock.json
npm install
npm start
```

### Database connection error
```bash
# Verify MySQL is running
mysql -u root -p

# Check DATABASE_URL in .env
# Run migrations
cd Api
npx prisma migrate deploy
```

### Tests failing
```bash
# Ensure backend is running (port 5000)
# Ensure frontend can start (port 3000)
# Run with debug
npm run test:debug
```

---

## 💻 System Architecture

```
User
  ↓
React Frontend (port 3000)
  ↓
REST API (port 5000)
  ├→ Express Server
  ├→ Prisma ORM
  └→ External APIs (Claude, SendGrid, JSearch)
  ↓
MySQL Database
```

---

## 📊 Performance Metrics

| Component | Expected | Acceptable |
|-----------|----------|-----------|
| Page Load | < 2s | < 3s |
| API Response | < 500ms | < 1s |
| Search | < 2s | < 4s |
| AI Generation | < 5s | < 10s |

---

## 🔐 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT authentication with refresh tokens
- ✅ OAuth 2.0 Google integration
- ✅ Input validation & sanitization
- ✅ Rate limiting on auth endpoints
- ✅ CORS protection
- ✅ XSS protection
- ✅ SQL injection prevention (via Prisma)
- ✅ Helmet.js security headers

---

## 🌟 Key Commands

### Frontend Commands
```bash
npm start              # Start dev server (port 3000)
npm run build          # Build for production
npm test              # Run component tests
npm run test:e2e      # Run Playwright tests
npm run test:ui       # Interactive test dashboard
npm run test:headed   # Watch tests with browser
```

### Backend Commands
```bash
npm start              # Start server (port 5000)
npm run dev            # Dev mode with auto-reload
npx prisma studio    # Open database UI (port 5555)
npx prisma migrate   # Run database migrations
```

---

## 📞 Support & Resources

### Documentation
- **Full Docs** → `PROJECT_DOCUMENTATION.md` (1000+ lines)
- **Testing** → `TESTING_GUIDE.md` (400+ lines)
- **Roadmap** → `PLAN.md` (detailed phases)
- **Email System** → `PHASE-10-IMPLEMENTATION.md`

### Common Issues
| Issue | Solution |
|-------|----------|
| `ECONNREFUSED` | Backend not running |
| `DB connection error` | Check DATABASE_URL, ensure MySQL running |
| `Cannot find module` | Run `npm install` |
| `Port already in use` | Kill process or change PORT |
| `CORS error` | Check CORS_ORIGIN in .env |

---

## ✅ Project Status

| Component | Status | Details |
|-----------|--------|---------|
| Backend | ✅ Complete | All 10 phases implemented |
| Frontend | ✅ Complete | All pages and features |
| Testing | ✅ Complete | 50+ E2E tests |
| Documentation | ✅ Complete | Full technical docs |
| Production Ready | ✅ YES | Ready to deploy |

---

## 📄 License

Private Project — All Rights Reserved

---

## 🎓 Learning Path

1. **Setup** → Clone repo and follow installation
2. **Explore** → Run the app and test features
3. **Read** → Study PROJECT_DOCUMENTATION.md
4. **Test** → Run Playwright tests (`npm run test:ui`)
5. **Customize** → Modify for your needs
6. **Deploy** → Follow deployment guide

---

## 🎯 Next Steps

- [ ] Clone the repository
- [ ] Follow Installation & Setup section
- [ ] Run `npm start` in both terminals
- [ ] Open http://localhost:3000
- [ ] Create an account and test features
- [ ] Run tests with `npm run test:ui`
- [ ] Read PROJECT_DOCUMENTATION.md for deep dive

---

**Made with ❤️ by Akash Shanmuganatha**

**Last Updated**: March 29, 2025
**Status**: Production Ready ✅
**All 10 Phases Complete**: ✅
