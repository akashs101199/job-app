# 🚀 Job App - AI-Powered Job Application Management Platform

<div align="center">

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18%2B-blue?logo=react)](https://react.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange?logo=mysql)](https://www.mysql.com/)
[![Terraform](https://img.shields.io/badge/Terraform-1.0%2B-purple?logo=terraform)](https://www.terraform.io/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Active-success)]()

A comprehensive full-stack platform that revolutionizes job searching and application management with AI-powered features and production-ready cloud infrastructure.

[Features](#-key-features) • [Architecture](#-architecture) • [Getting Started](#-getting-started) • [Deployment](#-deployment) • [Documentation](#-documentation)

</div>

---

## 📋 Overview

**Job App** is an intelligent job application management system that combines cutting-edge AI capabilities with a robust full-stack infrastructure. The platform helps job seekers efficiently manage their applications, generate personalized content, analyze market trends, and automate follow-ups.

### 🎯 Mission
Streamline the job application process by leveraging AI to generate better cover letters, match candidates with relevant opportunities, prepare for interviews, analyze market insights, and automate follow-up communications.

---

## ✨ Key Features

### Phase 1️⃣: AI Cover Letter & Cold Email Generator
- 🤖 **AI-Powered Content Generation**: Uses Claude AI to generate personalized cover letters and cold emails
- 📝 **Template-Based System**: Dynamic templates for different job types and companies
- ⚡ **One-Click Generation**: Quickly generate professional content with minimal input
- 📋 **Customization**: Edit and refine generated content before sending

**Key Endpoints:**
- `POST /api/agent/generate-cover-letter` - Generate personalized cover letters
- `POST /api/agent/generate-cold-email` - Create outreach emails

---

### Phase 2️⃣: Resume-Job Matching Agent
- 🎯 **Intelligent Job Matching**: Scores and ranks job listings based on candidate fit
- 📊 **Match Breakdown**: Detailed scoring across skills, experience, and preferences
- 🏆 **Smart Sorting**: Automatically prioritize best-fit opportunities
- 💡 **Keyword Analysis**: Identify relevant skills and qualifications

**Features:**
- Keyword-based matching algorithm
- Multi-criteria scoring system
- Color-coded match quality badges
- Application history analysis

---

### Phase 3️⃣: Interview Preparation Agent
- 📚 **Comprehensive Preparation**: AI-generated interview questions and model answers
- 💼 **Company-Specific Insights**: Tailored preparation based on company research
- 🎤 **Behavioral & Technical**: Both soft skills and technical interview prep
- 📝 **Question Bank**: Extensive library of common and role-specific questions

**Capabilities:**
- Role-specific question generation
- Company research and insights
- Answer suggestions with best practices
- Interview tips and strategies

---

### Phase 4️⃣: Market Analytics Agent
- 📈 **Salary Intelligence**: Real-time salary data analysis across roles and regions
- 🏢 **Job Market Trends**: Analyze demand for specific skills and roles
- 🔍 **Competitive Analysis**: Benchmark against market rates
- 📊 **Interactive Dashboards**: Visualize market data with charts and analytics

**Analytics Provided:**
- Average salary ranges by role, company, and location
- Job market demand trends
- Skills in high demand
- Geographic salary variations
- Company hiring patterns

---

### Phase 5️⃣: Application Follow-Up Agent
- 📧 **Automated Follow-ups**: Intelligently track stale applications and suggest follow-ups
- 📅 **Timeline Management**: Track application dates and follow-up intervals
- ✉️ **Email Generation**: AI-generated professional follow-up emails
- 📊 **Follow-up Queue**: Manage and approve follow-up communications
- 🎯 **Success Tracking**: Monitor application outcomes

**Smart Features:**
- Automatic detection of applications needing follow-up (7+ days)
- Escalating follow-up tones
- Email customization and preview
- Batch follow-up generation
- Application outcome tracking

---

## 🏗️ Architecture

### System Design

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Pages: Job Search | Cover Letters | Interviews |    │  │
│  │ Analytics | Follow-ups | Profile | Dashboard         │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────┬────────────────────────────────────────────┘
                 │ REST API / WebSocket
┌────────────────▼────────────────────────────────────────────┐
│                  Backend (Node.js/Express)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Auth Service | Agent Service | User Service         │  │
│  │ AI Integration | Database ORM | Cache Layer         │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────┬────────────────────────────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
┌───▼──┐   ┌─────▼──┐   ┌────▼────┐
│MySQL │   │ Redis  │   │ Claude  │
│  DB  │   │ Cache  │   │  API    │
└──────┘   └────────┘   └─────────┘
```

---

## 💻 Tech Stack

### Frontend
- **Framework**: React 18+ with Hooks
- **Styling**: CSS3 with modern layouts
- **HTTP Client**: Axios with interceptors
- **State Management**: React Context API
- **UI Components**: Custom components with responsive design
- **Authentication**: JWT token handling

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MySQL 8.0
- **ORM**: Prisma
- **Authentication**: JWT, OAuth 2.0 (Google)
- **AI Integration**: Claude API (Anthropic)
- **External APIs**: JSearch, RapidAPI, Sentry
- **Caching**: Redis support
- **Scheduling**: Task queues for background jobs

### DevOps & Infrastructure
- **Containerization**: Docker (multi-stage builds)
- **Orchestration**: AWS ECS Fargate
- **Infrastructure as Code**: Terraform (12 modules)
- **Database**: AWS RDS MySQL
- **Load Balancing**: AWS Application Load Balancer
- **Storage**: AWS S3 with versioning
- **CDN**: AWS CloudFront
- **Monitoring**: CloudWatch, Container Insights
- **CI/CD**: GitHub Actions
- **Notifications**: AWS SNS

---

## 📂 Project Structure

```
job-app/
├── 📁 Api/                           # Backend Application
│   ├── src/
│   │   ├── controllers/              # Route handlers
│   │   ├── services/
│   │   │   └── ai/                   # AI service modules
│   │   │       ├── coverLetter.service.js
│   │   │       ├── matching.service.js
│   │   │       ├── interview.service.js
│   │   │       ├── analytics.service.js
│   │   │       └── followUp.service.js
│   │   ├── routes/                   # API routes
│   │   ├── middleware/               # Authentication, validation
│   │   ├── models/                   # Database models
│   │   └── utils/                    # Helper functions
│   ├── prisma/
│   │   ├── schema.prisma             # Data schema
│   │   └── migrations/               # Database migrations
│   ├── Dockerfile                    # Production image
│   └── package.json
│
├── 📁 client/                        # Frontend Application
│   ├── public/                       # Static assets
│   ├── src/
│   │   ├── components/               # Reusable components
│   │   ├── pages/
│   │   │   ├── JobSearch/
│   │   │   ├── CoverLetters/
│   │   │   ├── InterviewPrep/
│   │   │   ├── Analytics/
│   │   │   └── FollowUpQueue/
│   │   ├── services/                 # API clients
│   │   ├── context/                  # State management
│   │   ├── utils/                    # Helpers
│   │   ├── App.js
│   │   └── index.js
│   ├── Dockerfile                    # Production image
│   └── package.json
│
├── 📁 devops/                        # Infrastructure & Deployment
│   ├── scripts/
│   │   ├── deploy.sh                 # Deployment automation
│   │   ├── rollback.sh               # Rollback mechanism
│   │   ├── health-check.sh           # Health verification
│   │   └── logs.sh                   # Log management
│   ├── terraform/
│   │   ├── main.tf                   # Root configuration
│   │   ├── variables.tf              # Variable definitions
│   │   ├── outputs.tf                # Output values
│   │   ├── environments/             # Environment configs
│   │   │   ├── dev.tfvars
│   │   │   ├── staging.tfvars
│   │   │   └── production.tfvars
│   │   └── modules/                  # Terraform modules
│   │       ├── vpc/
│   │       ├── security_groups/
│   │       ├── rds/
│   │       ├── ecs_cluster/
│   │       ├── ecs_tasks/
│   │       ├── ecr/
│   │       ├── alb/
│   │       ├── autoscaling/
│   │       ├── monitoring/
│   │       ├── notifications/
│   │       ├── s3/
│   │       └── cloudfront/
│   ├── docker-compose.yml            # Local development setup
│   ├── nginx.conf                    # Nginx configuration
│   ├── .env.example                  # Environment template
│   └── README.md                      # DevOps documentation
│
├── 📁 .github/
│   └── workflows/
│       └── deploy.yml                # CI/CD pipeline
│
├── 📄 DEVOPS_SUMMARY.md              # Infrastructure summary
├── 📄 README.md                      # This file
├── 📄 PLAN.md                        # Project roadmap
└── 📄 docker-compose.yml             # Local development

```

---

## 🚀 Getting Started

### Prerequisites

**Required:**
- Node.js 18+
- npm or yarn
- Docker & Docker Compose (for containerization)
- MySQL 8.0 (or use Docker Compose)

**Optional:**
- AWS Account (for production deployment)
- Terraform 1.0+ (for infrastructure management)

### Local Development Setup

#### 1. Clone Repository
```bash
git clone https://github.com/akashs101199/job-app.git
cd job-app
```

#### 2. Environment Configuration
```bash
# Copy environment template
cp devops/.env.example .env

# Edit with your credentials
nano .env
```

**Required Environment Variables:**
```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=mysql://user:password@localhost:3306/job_app_db

# JWT
JWT_SECRET=your-secret-key

# AI Services
ANTHROPIC_API_KEY=your-api-key
RAPIDAPI_KEY=your-rapidapi-key

# OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-secret
```

#### 3. Database Setup with Docker Compose
```bash
# Start all services (MySQL, Backend, Frontend)
docker-compose up -d

# Run migrations
docker-compose exec backend npm run migrate

# View logs
docker-compose logs -f
```

#### 4. Manual Setup (Without Docker)

**Backend Setup:**
```bash
cd Api

# Install dependencies
npm install

# Create .env file with database credentials
cp .env.example .env
nano .env

# Run migrations
npm run migrate

# Start server
npm start
# Server runs at http://localhost:5000
```

**Frontend Setup (New Terminal):**
```bash
cd client

# Install dependencies
npm install

# Start development server
npm start
# App opens at http://localhost:3000
```

---

## 📖 API Documentation

### Authentication
All endpoints (except `/auth/*`) require JWT authentication via the `Authorization` header:
```
Authorization: Bearer <token>
```

### Key API Endpoints

#### Cover Letter Generation
```
POST /api/agent/generate-cover-letter
Body: {
  jobTitle: string,
  company: string,
  jobDescription: string,
  userBackground: string
}
Response: {
  coverLetter: string,
  email: string
}
```

#### Job Matching
```
POST /api/agent/match-jobs
Body: { jobs: array }
Response: {
  jobs: array with matchScore property
}
```

#### Interview Preparation
```
GET /api/agent/interview-questions/:roleId
Response: {
  questions: array,
  tips: array,
  resources: array
}
```

#### Market Analytics
```
GET /api/analytics/salary?role=&location=&company=
GET /api/analytics/trends?skill=&region=
Response: {
  averageSalary: number,
  range: object,
  trends: array,
  demand: number
}
```

#### Follow-Up Management
```
GET /api/agent/follow-ups
POST /api/agent/follow-ups/generate
POST /api/agent/follow-ups/:id/approve
POST /api/agent/follow-ups/:id/send
```

---

## 🐳 Docker Deployment

### Build Images
```bash
# Backend
docker build -t job-app-backend:latest -f Api/Dockerfile .

# Frontend
docker build -t job-app-frontend:latest -f client/Dockerfile .
```

### Run Containers
```bash
docker run -d \
  -p 5000:5000 \
  -e DATABASE_URL=... \
  job-app-backend:latest

docker run -d \
  -p 3000:80 \
  job-app-frontend:latest
```

### Docker Compose (Recommended)
```bash
# Start all services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f [service-name]
```

---

## ☁️ Deployment

### AWS ECS Fargate Deployment

Complete AWS infrastructure is provided via Terraform with automated deployment scripts.

#### Prerequisites
```bash
# Install required tools
aws --version      # AWS CLI v2
terraform -v       # Terraform >= 1.0
docker --version   # Docker 20.10+
```

#### Quick Deploy
```bash
# Configure AWS credentials
aws configure

# Set environment variables
export AWS_REGION=us-east-1
export ENVIRONMENT=production

# Copy and configure environment file
cp devops/.env.example .env.production
nano .env.production

# Run deployment script
./devops/scripts/deploy.sh production
```

#### What Gets Deployed
- ✅ VPC with public/private subnets across multiple AZs
- ✅ RDS MySQL database with automated backups and encryption
- ✅ ECS Fargate cluster with auto-scaling
- ✅ Application Load Balancer with health checks
- ✅ CloudFront CDN for static content
- ✅ CloudWatch monitoring and alarms
- ✅ SNS notifications for alerts
- ✅ S3 bucket with versioning and lifecycle policies

#### Post-Deployment Verification
```bash
# Check system health
./devops/scripts/health-check.sh production

# View logs
./devops/scripts/logs.sh production all 100

# Rollback if needed
./devops/scripts/rollback.sh production
```

### Infrastructure Details

**Development Environment:**
- Database: t3.micro MySQL
- Compute: 1 backend task (256 CPU, 512 MB)
- Log retention: 7 days

**Production Environment:**
- Database: t3.small Multi-AZ MySQL
- Compute: 3 backend + 3 frontend tasks with auto-scaling
- Auto-scaling: 3-10 instances based on CPU/memory
- Log retention: 90 days
- Monitoring: CloudWatch Container Insights enabled

📚 For detailed infrastructure documentation, see [devops/README.md](devops/README.md)

---

## 🔐 Security

### Implemented Security Measures

✅ **Authentication & Authorization**
- JWT token-based authentication
- OAuth 2.0 with Google
- Secure password hashing with bcrypt
- Session management with automatic expiration

✅ **Data Security**
- RDS encryption at rest (KMS)
- HTTPS/TLS for all communications
- Sensitive data in environment variables
- SQL injection prevention via ORM
- CORS properly configured

✅ **Infrastructure Security**
- Private subnets for databases and application servers
- Security groups with least privilege
- Non-root container users
- ECR image scanning for vulnerabilities
- S3 bucket public access blocked
- WAF-ready ALB configuration

✅ **Code Security**
- Input validation and sanitization
- Rate limiting on API endpoints
- Security headers (CSP, X-Frame-Options, etc.)
- Regular dependency updates

---

## 📊 Monitoring & Observability

### CloudWatch Integration

**Dashboards:**
- System health overview
- Application performance metrics
- Database statistics
- Cost tracking

**Alarms:**
- High CPU/memory utilization
- Database connectivity issues
- HTTP error rates
- Service unavailability

**Logs:**
- Centralized application logs
- Database slow query logs
- Container logs with timestamps
- CloudWatch Insights for analysis

### Health Checks

```bash
# Check system health
./devops/scripts/health-check.sh production

# Manual health verification
curl https://your-alb-domain.com/api/health
```

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Code Standards
- Follow existing code style
- Add tests for new features
- Update documentation
- Ensure all tests pass

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙋 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/akashs101199/job-app/issues)
- **Documentation**: See [devops/README.md](devops/README.md) for infrastructure docs
- **Roadmap**: See [PLAN.md](PLAN.md) for upcoming features

---

## 🎉 Acknowledgments

Special thanks to all contributors who have helped make this project better:
- **Original Team**: @balaji2417, @afrah123456 (Afrah Fathima), @Swetha1802
- **Current Maintainer**: @akashs101199

---

<div align="center">

### Made with ❤️ by the Job App Team

⭐ If you find this project useful, please star it on GitHub!

[↑ Back to Top](#-job-app---ai-powered-job-application-management-platform)

</div>