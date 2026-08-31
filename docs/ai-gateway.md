# AI Service & Prompt Pipeline Specifications

The FastAPI AI service (`services/ai`) acts as the single point of entry for all generative AI LLM interaction across the platform.

```
Incoming AI Request (POST /api/v1/tutor/stream)
       │
       ▼
 ┌────────────────────────────────────────────────────────┐
 │ 1. Authenticate Student Context & Resolve Identity     │
 └─────────────────────────┬──────────────────────────────┘
                           │
                           ▼
 ┌────────────────────────────────────────────────────────┐
 │ 2. Student AI Safety Guard                             │
 │    - Prompt Injection Resistance                       │
 │    - Harmful Content Moderation                        │
 │    - PII Protection (Redact Bangladeshi Phone / Email)  │
 └─────────────────────────┬──────────────────────────────┘
                           │
                           ▼
 ┌────────────────────────────────────────────────────────┐
 │ 3. Grade Metadata Filtered RAG Vector Retrieval        │
 │    - Pre-retrieval Metadata Filter (Class/Subject/Year)│
 │    - Memory/Persistent Vector Store Search             │
 │    - Wrap Context in Untrusted Security Delimiters     │
 └─────────────────────────┬──────────────────────────────┘
                           │
                           ▼
 ┌────────────────────────────────────────────────────────┐
 │ 4. Pedagogical System Prompt Assembly (12 Rules)       │
 └─────────────────────────┬──────────────────────────────┘
                           │
                           ▼
 ┌────────────────────────────────────────────────────────┐
 │ 5. Cost-Optimized Model Routing & Telemetry            │
 │    - CLASSIFICATION -> gemini-1.5-flash-8b             │
 │    - SIMPLE_EXPLANATION -> gemini-1.5-flash            │
 │    - COMPLEX_TUTORING -> gemini-1.5-pro                │
 └─────────────────────────┬──────────────────────────────┘
                           │
                           ▼
 ┌────────────────────────────────────────────────────────┐
 │ 6. Standardized Server-Sent Events (SSE) Stream        │
 │    - Events: delta, metadata (citations), error, done  │
 └────────────────────────────────────────────────────────┘
```
