# System Architecture & Technical Specifications

> High-level architecture and system design decisions for the **Shikkhok AI (শিক্ষক এআই)** platform.

```
                                  Client Layer
                  ┌─────────────────────────────────────────┐
                  │      Mobile Application (React Native)  │
                  └────────────────────┬────────────────────┘
                                       │ (REST / SSE Stream)
                                       ▼
                              Gateway Router / LB
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
┌───────────────────────┐                             ┌───────────────────────┐
│     Main API Service  │                             │      AI Gateway       │
│  (Modular Monolith)   │                             │   (LLM Streaming)     │
└───────────┬───────────┘                             └───────────┬───────────┘
            │                                                     │
            ├──────────────────────────┬──────────────────────────┤
            ▼                          ▼                          ▼
┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────────┐
│  Managed PostgreSQL   │  │     Managed Redis     │  │   Cloud Object Store  │
│      + pgvector       │  │ (Cache & BullMQ Queue)│  │      (S3 / GCS)       │
└───────────────────────┘  └───────────┬───────────┘  └───────────────────────┘
                                       │
                                       ▼
                           ┌───────────────────────┐
                           │   Background Worker   │
                           │  (services/worker)    │
                           └───────────────────────┘
```

## Modular Monolith Domain Architecture
- **API Monolith (`services/api`)**: Core domain logic for Auth, Curriculum, Progress Tracking, Practice Engine, and Study Planning.
- **AI Gateway (`services/ai-gateway`)**: Entry point for all LLM stream processing, prompt rules, RAG, safety guards, and token cost accounting.
- **Asynchronous Worker (`services/worker`)**: BullMQ job processing for PDF extractions, chunking, and background notifications.
