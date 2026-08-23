# 🎓 Shikkhok AI (শিক্ষক এআই) — AI-Powered Learning Platform for Bangladesh

> **Shikkhok AI** is an AI-powered personalized learning platform tailored specifically for Bangladeshi National Curriculum (NCTB) students (Class 1 to HSC). It delivers Socratic AI tutoring, adaptive practice sessions, deterministic study plans, and grade-isolated curriculum RAG grounding.

---

## 🏗️ Technical Architecture & Monorepo Structure

```
shikkhok-ai/
├── apps/
│   └── mobile/              # React Native / Expo Mobile Application
├── services/
│   ├── api/                 # Main REST API Monolith (Auth, Practice, Progress, Study Plan)
│   ├── ai-gateway/          # AI Gateway (LLM streaming, Prompt rules, RAG, Safety, Cost)
│   ├── worker/              # Asynchronous Worker (BullMQ + Redis job processing)
│   └── realtime/            # Realtime Service (WebSockets documentation)
├── packages/
│   └── types/               # Shared TypeScript DTOs & API Contracts
├── docs/                    # Architectural Specifications & System Documentation
├── .github/workflows/       # GitHub Actions CI/CD Pipeline (`ci.yml`)
├── docker-compose.yml       # Local Development Orchestration Stack
└── .env.example             # Environment Variable Template
```

---

## 🛠️ Technology Stack

- **Mobile Client**: React Native, TypeScript, i18n-js (Bangla/English), OfflineStorageManager
- **Backend API**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL (`pgvector`), Redis
- **AI Gateway**: Gemini Provider Abstraction, SSE Token Streaming, Student AI Safety Guard, RAG Metadata Filters
- **Worker & Async**: Redis + BullMQ Queue
- **DevOps & Testing**: Docker Compose, GitHub Actions CI/CD, Jest (32 passing backend tests, 12 passing mobile tests)

---

## 🚀 Local Development Quickstart

```bash
# 1. Clone repository & set up environment
cp .env.example .env

# 2. Launch local Docker infrastructure stack (Postgres + pgvector, Redis, API, Gateway, Worker)
docker compose up -d

# 3. Run API Database Seed (Development Only)
cd services/api
npm run prisma:generate
npm run prisma:seed

# 4. Start Mobile Application
cd ../../apps/mobile
npm start
```

---

## 🧪 Testing & Verification

```bash
# Run API Service Tests
cd services/api
npm test

# Run Mobile Application Tests
cd apps/mobile
npm test
```

---

## 📚 Technical Specifications & Documentation Index

- [Architecture Overview](docs/architecture.md)
- [AI Gateway Specifications](docs/ai-gateway.md)
- [RAG & Citation System](docs/rag.md)
- [Authentication & Authorization](docs/authentication.md)
- [Database Schema & Managed Policy](docs/database.md)
- [Local Development Guide](docs/local-development.md)
- [Production Deployment Guide](docs/deployment.md)
- [OpenAPI 3.0 API Specification](docs/openapi.yaml)
- [Bangladesh Context & EdTech UX](docs/BANGLADESH_CONTEXT.md)

---

## 🗺️ Product Roadmap

- [x] Socratic AI Tutor with 12 Pedagogical Rules & SSE Token Streaming
- [x] Deterministic Adaptive Mastery Engine & Study Plan Generator
- [x] Zero-Hallucination NCTB Source Citations & Grade-Isolated RAG
- [x] Mobile Offline Storage Queue & Low-End Android Accessibility
- [x] Role-Based Access Control (RBAC), IDOR Record Guards, & Class-Scoped Teacher Scoping
- [x] Telemetry Observability (`/metrics`), AI Cost Control, & Automated Evaluation Benchmarks
- [ ] Teacher Portal & Class Analytics Dashboard Integration
- [ ] Parent Progress Digest & Exam Results Sync
- [ ] SSC & HSC Board Exam Preparation Modules
