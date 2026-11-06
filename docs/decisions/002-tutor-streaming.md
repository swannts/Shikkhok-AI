# ADR 002: SSE for AI Tutor streaming

## Context

Tutor answers should appear progressively while retaining a small, inspectable event protocol.

## Decision

The public tutor stream uses Server-Sent Events with discriminated `metadata`, `delta`, `citation`, `error`, and `done` events. NestJS owns the public connection and persistence; FastAPI generates the internal stream. Clients reject malformed or unknown events rather than treating them as answer text.

## Alternatives

- Return one non-streaming response.
- Expose the AI service stream directly to clients.
- Use a bidirectional WebSocket for request/answer streaming.

## Consequences

SSE is simple to proxy and cancel for a one-way answer stream. Event contracts and disconnect propagation must remain compatible across services and clients.
