# 🎯 Target Vertical Slice & Platform Roadmap Verification

> **Core Product Principle**: Shikkhok-AI is not just an AI chatbot. It is a personalized learning system where AI, curriculum, assessment, and student learning history work together to deliver safe, grounded, and adaptive learning.

```
Student opens Shikkhok-AI
        ↓
[Milestone 1] Logs in with real account & backend verifies credentials
        ↓
Selects subject & opens real NCTB curriculum chapter / lesson
        ↓
[Milestone 2] StudentLessonProgress & StudentChapterProgress tracked
        ↓
[Milestone 3] Starts practice & submits answers evaluated server-side
        ↓
TopicMastery & weak topics updated in the primary API datastore
        ↓
[Milestone 4 & 5] Student asks AI Tutor & RAG retrieves verified NCTB context
        ↓
[Milestone 6] AI Tutor adapts with student mastery, grade level, & weak topics
        ↓
[Milestone 7 & 8] SSE stream emissions, BullMQ background jobs, & observability metrics
```

---

## 🗺️ Milestone Implementation Audit (Milestones 1 - 8)

### Milestone 1: Real Authentication — **COMPLETED & VERIFIED**
- NestJS-backed `User` and `StudentProfile` models.
- `bcryptjs` password hashing, login, signup, OTP verification, and resend.
- Ephemeral Redis OTP storage with 5-minute TTL.
- JWT Access and Refresh token rotation with secure storage (`tokenStorage.ts`).
- Server context identity resolution (`req.user`) in `auth.middleware.ts`.

### Milestone 2: Student Progress — **COMPLETED & VERIFIED**
- Backend-evaluated `StudentLessonProgress`, `StudentChapterProgress`, `QuestionAttempt`, `PracticeSession`, and `TopicMastery`.
- Mobile progress screens and `CurriculumRepository` connected to real API endpoints.

### Milestone 3: Practice Engine — **COMPLETED & VERIFIED**
- Question retrieval supporting 6 question types (`MCQ`, `TRUE_FALSE`, `SHORT_ANSWER`, `NUMERIC`, `MATCHING`, `MULTI_SELECT`).
- Server-side answer evaluation in `practice.service.ts` and `mastery.engine.ts`.
- Weak-topic detection, attempt persistence, and adaptive difficulty recommendations (`HARD_CHALLENGE`, `ADVANCE_RECOMMENDED`).

### Milestone 4: Real AI Tutor — **COMPLETED & VERIFIED**
- Single entry point `services/ai` with `LLMProvider` interface and `GeminiProvider` implementation.
- Standardized Server-Sent Events (SSE) streaming (`delta`, `metadata`, `error`, `done`) with multi-byte UTF-8 buffer decoding and client disconnect handling.
- Integrated rate limiting (15 req/min) and 15s timeout protection.

### Milestone 5: Curriculum RAG — **COMPLETED & VERIFIED**
- NCTB PDF text extraction, 300-character chunking, and 10 mandatory metadata tags (`curriculumYear`, `class`, `subject`, `chapter`, `pageNumber`, `sourceBook`, etc.).
- Memory and persistent vector stores with embedding identity metadata and 768-dimensional deterministic compatibility checks.
- Pre-retrieval grade metadata filter isolation preventing Class 6 to Class 10/12 material leakage.
- Zero-hallucination verified source citations returned via SSE `metadata` events.

### Milestone 6: Personalized Tutor — **COMPLETED & VERIFIED**
- Prompt pipeline in the FastAPI AI service feeds student `classLevel`, `subject`, `masteryScore`, weak topics, and `isHomework` context into 12 pedagogical prompt rules.

### Milestone 7: Worker Microservice — **COMPLETED & VERIFIED**
- Asynchronous BullMQ worker (`services/worker`) backed by Redis handling PDF jobs, embedding generation, notifications, analytics aggregation, and report generation.

### Milestone 8: Production Readiness — **COMPLETED & VERIFIED**
- Structured JSON logging (`logger.ts`) redacting passwords, OTPs, and tokens.
- Request correlation IDs (`X-Correlation-ID`) propagated across API, AI Gateway, and Worker.
- Telemetry metrics endpoint (`GET /metrics`) tracking API latency, error rate, token usage, AI cost, and job failures.
- Security headers, CORS allowlisting, and Docker container health checks.
- Comprehensive automated test suites: 12 API test suites (32 tests passing) and 5 mobile test suites (12 tests passing).

---

## 🚫 Avoided Premature Infrastructure (Item 71 Audit)
- **NO Kafka**: Replaced by lightweight Redis + BullMQ queues.
- **NO Service Mesh**: Replaced by clean HTTP correlation headers.
- **NO Multi-Region Kubernetes**: Running lean local Docker Compose stack (`docker-compose.yml`) until production cloud scaling justifies Kubernetes manifests (`infra/KUBERNETES.md`).
