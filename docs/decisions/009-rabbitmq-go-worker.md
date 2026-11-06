# ADR 009: RabbitMQ queues and Go worker

## Status

Accepted

## Context

The background worker needs a Go runtime, while NestJS remains responsible for API-side persistence and homework feedback. Keeping BullMQ would require a third-party Go adapter whose documented Redis wire compatibility targets BullMQ 4.12.2 while this project uses BullMQ 5.81.4.

## Decision

- RabbitMQ carries durable JSON job envelopes `{ id, name, data }` for `notifications`, `curriculum`, `analytics`, and `homework`.
- The Go worker consumes notifications, curriculum ingestion, and analytics. NestJS consumes homework because it owns submission state and feedback persistence.
- Consumers acknowledge only after successful handling. Failures are published to per-queue retry queues, then acknowledged. Retry queues use 2/4 second TTLs, or 5/10 seconds for curriculum. The third failed attempt is placed on `<queue>-dlq`.
- The API uses Redis `SET NX` keys with a 24 hour expiration for stable job IDs; consumers clear them after successful processing. DLQ retries clear the key before republishing.
- Redis remains in use for application cache, rate limiting, and notification idempotency.
- Admin queue metrics report ready messages, consumers, and dead-lettered messages. RabbitMQ does not retain completed jobs, so the former BullMQ completed/delayed counters are removed from the operations view.

## Consequences

- Deployments must provide a reachable `RABBITMQ_URL` to both API and worker. Kubernetes network policies need to allow TCP 5672 to the configured broker.
- Existing BullMQ jobs stored in Redis are not consumed by the new worker. Drain or manually migrate those queues before deploying this change.
- RabbitMQ provides at-least-once delivery. External notification and curriculum handlers must remain idempotent across worker restarts.
- Textbook PDF jobs use a file path; API and worker containers must share the configured curriculum upload storage for PDF ingestion to work.
