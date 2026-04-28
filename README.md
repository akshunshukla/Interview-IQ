# InterviewIQ 🎙️

An AI-powered interview platform that replaces traditional online assessments with intelligent, voice-based interviews. Built with the PERN stack, Gemini AI, and Deepgram.

## Features

### For Candidates
- **AI Voice Interviews** — Real-time voice-based interviews with an AI interviewer powered by Gemini 2.5 Flash
- **Mock Interviews** — Practice sessions with AI feedback and scoring
- **Instant Reports** — Get detailed AI evaluation with scores across 4 dimensions

### For Recruiters
- **Job Posting** — Create job listings with tech stack, work mode, and experience level
- **Invite-Only Jobs** — Generate shareable invite links for unlisted positions
- **AI-Ranked Applicants** — Candidates are automatically scored and ranked by AI
- **Shortlist/Reject** — Make hiring decisions with the AI's recommendation as a guide

### Platform
- **Secure Auth** — HTTP-only cookie-based JWT authentication
- **Anti-Manipulation** — AI interviewer cannot be tricked into breaking character
- **State Recovery** — Failed AI responses don't corrupt interview history
- **Context Optimization** — Rolling window summarization keeps long interviews performant

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, Tailwind CSS 4, React Router, Lucide Icons |
| **Backend** | Node.js, Express 5, Prisma ORM |
| **Database** | PostgreSQL (Neon) |
| **AI** | Google Gemini 2.5 Flash (Chat + Evaluation) |
| **Speech** | Deepgram Nova-3 (STT), Deepgram Aura (TTS) |
| **Storage** | AWS S3 (Audio files, Resumes) |
| **Auth** | JWT with HTTP-only cookies, bcrypt |

## Architecture

```mermaid
graph TB
    subgraph Frontend
        A[React + Vite] --> B[Auth Context]
        A --> C[Protected Routes]
    end

    subgraph Backend
        D[Express API] --> E[Auth Middleware]
        D --> F[Jobs Module]
        D --> G[Applications Module]
        D --> H[Interviews Module]
    end

    subgraph External Services
        I[Gemini 2.5 Flash]
        J[Deepgram STT/TTS]
        K[AWS S3]
        L[Neon PostgreSQL]
    end

    A -->|HTTP + Cookies| D
    H -->|Chat + Eval| I
    H -->|Transcribe + Speak| J
    H -->|Store Audio| K
    D -->|Prisma ORM| L
```

## Database Schema

```mermaid
erDiagram
    User ||--o{ Application : applies
    User ||--o{ Interview : takes
    User ||--o{ OrganizationMembership : belongs_to
    Organization ||--o{ OrganizationMembership : has
    Organization ||--o{ Job : posts
    Job ||--o{ Application : receives
    Application ||--o{ Interview : triggers
    Interview ||--o{ InterviewTurn : contains
    Interview ||--o| Report : generates

    User {
        string id PK
        string email UK
        string name
        enum role
    }
    Job {
        string id PK
        string title
        text job_description
        boolean isUnlisted
        string accessCode UK
        enum status
    }
    Interview {
        string id PK
        enum interviewType
        enum status
        int maxQuestions
    }
    Report {
        string id PK
        int tech_score
        int comm_score
        int problemSolvingScore
        int clarityScore
        string final_verdict
    }
```

## Project Structure

```
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── config/
│       │   └── db.js
│       ├── middleware/
│       │   ├── authMiddleware.js
│       │   └── errorMiddleware.js
│       ├── modules/
│       │   ├── auth/
│       │   ├── jobs/
│       │   ├── applications/
│       │   └── interviews/
│       ├── utils/
│       │   ├── gemini.js
│       │   ├── deepgram.js
│       │   ├── tts.js
│       │   ├── s3.js
│       │   ├── AppError.js
│       │   ├── ApiResponse.js
│       │   └── asyncHandler.js
│       ├── app.js
│       └── server.js
│
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── ProtectedRoute.jsx
│       │   └── InterviewReport.jsx
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── CandidateDashboard.jsx
│       │   ├── RecruiterDashboard.jsx
│       │   ├── InterviewRoom.jsx
│       │   ├── InterviewResults.jsx
│       │   ├── MockInterviewSetup.jsx
│       │   ├── JobApplicants.jsx
│       │   ├── ApplicantDetail.jsx
│       │   └── InviteJobView.jsx
│       ├── services/
│       │   └── api.js
│       └── App.jsx
```

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs` | Public job feed (excludes unlisted) |
| GET | `/api/jobs/my` | Recruiter's own jobs (includes unlisted) |
| GET | `/api/jobs/invite/:code` | Get job by invite code |
| POST | `/api/jobs` | Create job posting |

### Applications
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/applications/:jobId/apply` | Apply for a job |
| GET | `/api/applications/job/:jobId` | Get applicants for a job |
| GET | `/api/applications/:id/details` | Get application details |
| PATCH | `/api/applications/:id/verdict` | Shortlist/Reject applicant |

### Interviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/interview/start` | Start interview (JOB or MOCK) |
| POST | `/api/interview/turn` | Submit audio answer, get AI response |
| POST | `/api/interview/:id/finish` | End interview early |
| GET | `/api/interview/my` | Get user's interviews |
| GET | `/api/interview/:id` | Get interview details |

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (or [Neon](https://neon.tech) free tier)
- [Google AI Studio](https://aistudio.google.com) API key
- [Deepgram](https://deepgram.com) API key
- [AWS S3](https://aws.amazon.com/s3/) bucket

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/akshunshukla/Interview-IQ.git
   cd Interview-IQ
   ```

2. **Backend setup**
   ```bash
   cd backend
   cp .env.example .env
   # Fill in your environment variables in .env
   npm install
   npx prisma generate
   npx prisma db push
   ```

3. **Frontend setup**
   ```bash
   cd frontend
   cp .env.example .env
   # Update VITE_API_BASE_URL if needed
   npm install
   ```

4. **Run locally**
   ```bash
   # Terminal 1 — Backend
   cd backend && npm run dev

   # Terminal 2 — Frontend
   cd frontend && npm run dev
   ```

5. Open `http://localhost:5173`

## Environment Variables

### Backend (`backend/.env`)
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | Server port (default: 8000) |
| `NODE_ENV` | `development` or `production` |
| `JWT_SECRET` | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | Token expiry (e.g., `30d`) |
| `GEMINI_API_KEY` | Google Gemini API key |
| `DEEPGRAM_API_KEY` | Deepgram API key |
| `AWS_REGION` | AWS region |
| `AWS_ACCESS_KEY_ID` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `AWS_S3_BUCKET_NAME` | S3 bucket name |
| `CLIENT_URL` | Frontend URL (for CORS) |

### Frontend (`frontend/.env`)
| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend API URL |
