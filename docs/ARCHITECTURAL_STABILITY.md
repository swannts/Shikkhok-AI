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
| **Database & ORM** | PostgreSQL + Prisma ORM + `pgvector` | Maintain Prisma models in `schema.prisma`. Do NOT swap Prisma for another ORM without explicit directive. |
| **State Management** | Zustand (`apps/mobile/src/store`) | Preserve Zustand stores. Do NOT introduce Redux or unnecessary global state complexity. |
| **HTTP & SSE Networking** | Axios/Fetch (`httpClient.ts`) & SSE Stream Handler | Maintain custom SSE decoding and disconnect handlers. Do NOT replace with third-party wrappers. |
| **Mobile Navigation** | React Navigation (`app/`) | Maintain tab and stack navigator structures. |
| **Repository Pattern** | `CurriculumRepository`, `PracticeRepository`, `TutorRepository` | Keep repositories as single source of truth between UI and backend APIs. |
| **Modular Monolith** | Express services (`api`, `ai-gateway`, `worker`) | Maintain modular domain separation (`auth`, `curriculum`, `progress`, `practice`, `tutor`). |

---

## 3. Workflow for Code Modifications

- **Preserve API Contracts**: Never break existing function signatures or API payloads consumed by client applications.
- **Run Verification Commands**: Always verify edits using `npm run typecheck`, `npm test`, and `npm run build` after making modifications.
