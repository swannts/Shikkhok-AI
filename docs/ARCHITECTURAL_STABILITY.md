# Architectural Stability & Preservation Guidelines

This document outlines the core engineering philosophy for the **Shikkhok AI** platform codebase.

---

## 1. Core Rule: Do Not Rewrite Working Architecture Without Reason

Before modifying or replacing any established component, service, store, or pattern:

1. **Inspect First**: Read and understand the existing implementation and why it was built.
2. **Identify Verified Problems**: Do not refactor based on aesthetic preference or trendy design patterns. Only make changes justified by empirical bug reports, tracebacks, or missing functional requirements.
3. **Surgical & Incremental Edits**: Make the smallest safe improvement rather than full rewrites.

---

## 2. Preserved Platform Architecture Blueprint

| Component / Layer | Established Architecture | Rule for Future Iterations |
| :--- | :--- | :--- |
| **Database & ORM** | NestJS + MongoDB/Mongoose | Maintain schema and repository contracts in the API service. Do NOT swap persistence patterns without explicit directive. |
| **State Management** | Riverpod / local persistence | Preserve feature-scoped state and offline sync flow. Do NOT introduce unnecessary global state complexity. |
| **HTTP & SSE Networking** | Dio / HTTP client + SSE stream parser | Maintain custom SSE decoding and disconnect handlers. Do NOT replace with third-party wrappers. |
| **Mobile Navigation** | GoRouter (`apps/mobile`) | Maintain route groups and feature navigation structure. |
| **Repository Pattern** | Feature repositories and service facades | Keep repositories as the contract between UI and backend APIs. |
| **Modular Services** | NestJS `services/api`, FastAPI `services/ai`, BullMQ worker | Maintain modular domain separation (`auth`, `curriculum`, `progress`, `practice`, `tutor`). |

---

## 3. Workflow for Code Modifications

- **Preserve API Contracts**: Never break existing function signatures or API payloads consumed by client applications.
- **Run Verification Commands**: Always verify edits using the relevant service checks, such as `npm test`, `uv run pytest -q`, and `flutter test` after making modifications.
