# System Architecture & Technical Specifications

> High-level architecture and system design decisions for the **Shikkhok AI (শিক্ষক এআই)** platform.

```
                           Client Layer
        ┌───────────────────────┬───────────────────────┬───────────────────────┐
        │                       │                       │                       │
        ▼                       ▼                       ▼                       ▼
   Flutter Mobile          Next.js Admin         Teacher Portal          Future Web UIs
   (students/parents)      (MUI control plane)   (reserved scaffold)     (reserved)
        │                       │
        └──────────────┬────────┘
                       │ REST / SSE / HMAC
                       ▼
                 NestJS Main API
       Auth, curriculum, progress, practice,
          exams, homework, notifications
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
     MongoDB         Redis        BullMQ Worker
  source of truth   cache/queue   background jobs
                       │
                       ▼
                FastAPI AI Service
      Tutor, RAG, embeddings, citations, safety
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
     Gemini / Mock           Vector store
                           memory / persistent
```

## Modular Service Architecture
- **Main API (`services/api`)**: Owns authentication, curriculum, progress tracking, practice, exams, homework, notifications, payments, and audit logs.
- **AI Service (`services/ai`)**: Owns prompt orchestration, moderation, curriculum retrieval, grounding, citation resolution, and SSE tutor streaming.
- **Worker (`services/worker`)**: Processes asynchronous jobs for ingestion, notifications, reports, and retryable background tasks.
- **Admin App (`apps/admin`)**: Next.js + MUI console for internal operations and oversight.
- **Mobile App (`apps/mobile`)**: Flutter client for student and parent journeys with offline sync support.
