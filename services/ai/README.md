# Shikkhok-AI Dedicated AI Service

Production-quality FastAPI service for AI-specific workloads (AI Tutor, RAG, Citations, Safety & Grounding) in Shikkhok-AI.

## Architecture

```text
Flutter Mobile / Next.js Admin
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
(Gemini / Mock)     (Memory / Persistent)
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

Replay protection rejects timestamps drifted by more than ±300 seconds (5 minutes) and caches seen `X-Request-Id`s within the valid window.

## Runtime Environments & Safety Policies

The service strictly validates runtime environment safety upon startup in `Settings.validate_runtime_safety()`:

| Environment | Mock LLM Allowed? | Mock Embeddings Allowed? | Secret Requirements | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `production` | **STRICTLY FORBIDDEN** | **STRICTLY FORBIDDEN** | Real keys required; secret >= 32 chars | Live students |
| `staging` | **STRICTLY FORBIDDEN** | **STRICTLY FORBIDDEN** | Real keys required; secret >= 32 chars | Pre-prod verification |
| `development`| Disabled by default (flag required) | Disabled by default (flag required) | Dev defaults allowed | Local dev & testing |
| `test` | Allowed | Allowed | Any secret allowed | CI / Automated unit tests |

### Production Rules
- **No Mock AI to Real Students**: Attempting to start the service in `production` or `staging` with `LLM_PROVIDER=mock` or `EMBEDDING_PROVIDER=mock` immediately raises `RuntimeError` during startup.
- **No Fake Metadata**: Never invent or fabricate student metadata (e.g. defaulting missing classes to Grade 8). Missing metadata is marked as `(শ্রেণি নির্ধারিত নয়)`.
- **No Fake Citations**: If curriculum context is missing or RAG fails, the service explicitly sets `grounded: false` and emits 0 citations.

## Lifecycle & Dependency Injection (`AiServiceContainer`)

The service uses a singleton `AiServiceContainer` instantiated in FastAPI's `lifespan`:
* Reuses a shared `httpx.AsyncClient` with connection pooling across all LLM and embedding requests.
* Provides deterministic vector store persistence and warm-up.
* Cleans up all network pools on application shutdown (`container.aclose()`).
* Injected into FastAPI routes via `Depends(get_tutor_service)`, `Depends(get_rag_service)`, etc.

## Streaming Output Safety & Sanitization

Incremental streaming output is validated using `StreamingOutputSafetyFilter`:
* **Sliding Window**: Chunks pass through a lookahead buffer (40 characters) to detect credentials and unsafe phrases split across chunk boundaries.
* **Redaction**: Google API keys (`AIzaSy...`), OpenAI keys (`sk-...`), and unsafe keywords are replaced with `[REDACTED_CREDENTIAL]` or `[REDACTED_CONTENT]` before reaching the client.
* **Finalization**: Safe remainder is flushed when the generation stream completes.

## Client Cancellation Semantics

True cancellation propagation is implemented across the stack:
1. Student cancels or closes Flutter app.
2. NestJS triggers `AbortController.abort()`, closing the downstream HTTP connection to FastAPI.
3. FastAPI endpoint detects client disconnect (`request.is_disconnected()`) in a concurrent task.
4. Cancellation event is set on `TutorService`, immediately terminating the LLM stream.
5. Upstream Gemini/OpenAI HTTP connection is aborted.
6. **No Fake Finish**: `done: stop` is suppressed on cancellation.

## Timeout Strategy

NestJS `AiGatewayService` manages multi-stage streaming timeouts:
* **Connection Timeout**: 5s (`aiService.connectionTimeoutMs`)
* **First-Token Timeout**: 15s (`aiService.firstTokenTimeoutMs`)
* **Idle Timeout**: 20s (`aiService.idleTimeoutMs`, resets upon each SSE event)
* **Max Generation Timeout**: 120s (`aiService.maxGenerationTimeoutMs`)

All timers are cleared in a `finally` block to prevent resource leaks.

## Hardened SSE Parser

The NestJS SSE parser handles:
* Both `\n\n` and `\r\n\r\n` (CRLF) delimiters.
* Multiline `data:` fields joined with `\n`.
* SSE comments (`: ping`, `: keepalive`) safely ignored.
* Events split across network frames or multiple events packed in a single frame.

## Setup & Local Development

### Prerequisites
* Python 3.12+
* `uv` package manager

### Installation & Run
```bash
cd services/ai
uv sync
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Testing, Linting & Typing
```bash
# Run pytest test suite
uv run pytest

# Lint and format checks
uv run ruff check .

# Strict static type analysis
uv run mypy app
```

## SSE Event Protocol (`/api/v1/tutor/stream`)

1. `metadata`: `{"provider":"...","model":"...","grounded":true,"curriculumGrounded":true}`
2. `delta`: `{"text":"..."}`
3. `citation`: `{"citationId":"source_1","sourceId":"...","pageStart":45,...}`
4. `done`: `{"finishReason":"stop","latencyMs":...}`
5. `error`: `{"code":"AI_STREAM_FAILED","message":"...","banglaMessage":"..."}`
