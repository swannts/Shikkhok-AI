# Shikkhok-AI Dedicated AI Service

Production-quality FastAPI service for AI-specific workloads (AI Tutor, RAG, Citations, Safety & Grounding) in Shikkhok-AI.

## Architecture

```text
Flutter Mobile / Admin Panel
              │
              ▼
       NestJS API Service (Port 4000)
    (Auth, Users, Curriculum, DB, Rules)
              │
   (HMAC Signed SSE Streaming)
              │
              ▼
      FastAPI AI Service (Port 8000)
    (Prompt Engineering, Safety, RAG, LLM)
              │
    ┌─────────┴─────────┐
    ▼                   ▼
LLM Providers       Vector Store / Embeddings
(Gemini / OpenAI)   (Qdrant / In-Memory Mock)
```

### Architectural Separation of Responsibilities

* **NestJS**: Owns authentication, users, roles, authorization, curriculum ownership, conversation creation, message persistence, exams, practice, payments, subscriptions, and audit logs.
* **FastAPI AI Service**: Owns prompt orchestration, input moderation, RAG retrieval with curriculum metadata filtering, output safety sanitization, grounded citation resolution, and SSE token streaming.

## Internal Service Authentication (HMAC-SHA256)

All internal API calls from NestJS to FastAPI are signed with an HMAC SHA-256 signature and timestamp:
* `X-Service-Name`: `nestjs-backend` (authorized service identity)
* `X-Service-Timestamp`: Current UTC Unix timestamp (seconds)
* `X-Request-Id`: Request tracing ID
* `X-Service-Signature`: `HMAC_SHA256(canonical_string, INTERNAL_SERVICE_SECRET)`

Canonical string:
```text
timestamp\nHTTP_METHOD\n/path\nSHA256(body_bytes)
```

Replay protection rejects timestamps drifted by more than ±300 seconds (5 minutes).

## Directory Structure

```text
services/ai/
├── app/
│   ├── main.py                     # FastAPI application bootstrap & lifespan
│   ├── api/v1/                     # Health, Tutor, Retrieval endpoints
│   ├── core/                       # Config, Logging, Security, Exceptions
│   ├── prompts/tutor/              # Bangla/English prompts & grounding rules
│   ├── providers/                  # LLM, Embeddings, Vector Store protocols
│   ├── schemas/                    # Pydantic v2 domain schemas
│   └── services/                   # Moderation, RAG, Citations, TutorService
├── tests/
│   ├── conftest.py                 # Pytest fixtures & HMAC client helper
│   ├── unit/                       # Security, moderation, citations, router
│   └── integration/                # Health, ready, tutor stream
├── Dockerfile                      # Production multi-stage slim image
├── pyproject.toml                  # Python 3.12+ project configuration
└── README.md
```

## Setup & Local Development

### Prerequisites
* Python 3.12+
* `uv` (recommended)

### Installation
```bash
cd services/ai
uv sync
```

### Run Locally
```bash
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Testing, Linting & Typing
```bash
# Run test suite
uv run pytest

# Check code formatting & linting
uv run ruff check .

# Static type analysis
uv run mypy app
```

## Docker

Build and run container:
```bash
docker build -t shikkhok-ai-service ./services/ai
docker run -p 8000:8000 -e INTERNAL_SERVICE_SECRET=dev-secret shikkhok-ai-service
```

## SSE Event Protocol (`/api/v1/tutor/stream`)

1. `metadata`: `{"provider":"...","model":"...","fallbackUsed":false,...}`
2. `delta`: `{"text":"..."}`
3. `citation`: `{"citationId":"source_1","sourceId":"...","pageStart":45,...}`
4. `done`: `{"finishReason":"stop","latencyMs":...}`
5. `error`: `{"code":"...","message":"...","banglaMessage":"..."}`

## Current Limitations & Next Phases

* **Phase 1 (Current)**: FastAPI foundation, HMAC security, Tutor execution path, In-Memory NCTB curriculum search, and streaming.
* **Phase 2 (Upcoming)**: NCTB document ingestion pipeline, chunking, embeddings, and vector database indexing.
* **Phase 3 (Future)**: Homework OCR & assessment, multi-modal exam assistance.
