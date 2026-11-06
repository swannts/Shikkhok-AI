# ADR 001: NestJS and FastAPI service boundaries

## Context

The platform needs user-facing business APIs and specialized AI retrieval/generation. Duplicating those responsibilities makes authorization and citation guarantees difficult to enforce.

## Decision

NestJS owns identity, authorization, student context, curriculum records, conversation persistence, job scheduling, and public API contracts. FastAPI owns moderation, embeddings, curriculum retrieval, prompt construction, model routing, generation, safety, citations, and AI streaming. NestJS calls FastAPI through a private authenticated service boundary.

## Alternatives

- Put AI model and RAG code inside NestJS.
- Expose FastAPI directly to mobile and web clients.

## Consequences

Clients cannot bypass NestJS authorization or persistence. The internal contract needs explicit schemas, request authentication, timeouts, and degraded-mode handling.
