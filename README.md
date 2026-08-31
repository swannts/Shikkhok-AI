# 🎓 Shikkhok AI (শিক্ষক এআই) — AI-Powered Learning Platform for Bangladesh

> **Shikkhok AI** is an AI-powered personalized learning platform tailored specifically for Bangladeshi National Curriculum (NCTB) students (Class 1 to HSC). It delivers Socratic AI tutoring, adaptive practice sessions, deterministic study plans, and grade-isolated curriculum RAG grounding.

---

## 🏗️ Technical Architecture & Monorepo Structure

```
shikkhok-ai/
├── apps/
│   ├── mobile/              # Flutter student mobile application
│   ├── admin/               # Next.js + MUI admin console
│   └── teacher-portal/      # Reserved teacher portal surface
├── services/
│   ├── api/                 # NestJS main API (Auth, Curriculum, Practice, Progress, Exams)
│   ├── ai/                  # FastAPI AI service (Tutor, RAG, embeddings, safety)
│   ├── worker/              # Asynchronous worker (BullMQ + Redis job processing)
│   └── realtime/            # Realtime service / future streaming integrations
├── packages/
│   └── types/               # Shared TypeScript DTOs & API Contracts
├── docs/                    # Architectural Specifications & System Documentation
├── .github/workflows/       # GitHub Actions CI/CD Pipeline (`ci.yml`)
├── docker-compose.yml       # Local Development Orchestration Stack
└── .env.example             # Environment Variable Template
```

---

## 🛠️ Technology Stack

- **Mobile Client**: Flutter, Riverpod, GoRouter, Drift/SQLite offline sync, Bangla/English localization
- **Student/Admin Web**: Next.js, React 19, MUI, TypeScript
- **Backend API**: NestJS, MongoDB/Mongoose, Redis, BullMQ
- **AI Service**: FastAPI, curriculum RAG, embeddings, SSE tutor streaming, moderation and grounding
- **Worker & Async**: Redis + BullMQ queue processing
- **DevOps & Testing**: Docker Compose, GitHub Actions CI/CD, Jest, Flutter test, `uv`/pytest, ESLint, Ruff

---

## 🚀 Local Development Quickstart

```bash
# 1. Clone repository & set up environment
cp .env.example .env

# 2. Launch local infrastructure stack
docker compose up -d

# 3. Run the NestJS API
cd services/api
npm install
npm run dev

# 4. Run the AI service
cd ../ai
uv sync
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 5. Start the Flutter mobile app
cd ../../apps/mobile
flutter pub get
flutter run

# 6. Start the admin console
cd ../admin
npm install
npm run dev
```

---

## 🧪 Testing & Verification

```bash
# API service tests
cd services/api
npm test

# AI service tests
cd ../ai
uv run pytest -q

# Flutter mobile tests
cd ../../apps/mobile
flutter test

# Admin web tests
cd ../admin
npm test
```

---

## 📚 Technical Specifications & Documentation Index

- [Architecture Overview](docs/architecture.md)
- [AI Service Specifications](services/ai/README.md)
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
- [x] Flutter offline storage queue & low-end Android accessibility
- [x] Role-based access control, IDOR guards, and class-scoped teacher scoping
- [x] Telemetry observability, AI safety controls, and automated evaluation benchmarks
- [ ] Teacher portal & class analytics dashboard integration
- [ ] Parent progress digest & exam results sync
- [ ] SSC & HSC board exam preparation modules
