# ADR 005: BullMQ for asynchronous work

## Context

Textbook indexing, notifications, and other operations can be slow or require retries beyond an HTTP request lifetime.

## Decision

BullMQ backed by Redis carries asynchronous jobs. NestJS schedules jobs and keeps business persistence; domain processors perform work in the worker service where ownership is unambiguous. Stable job IDs, bounded retries, failure classification, and DLQ handling protect retryable operations. Homework stays on the NestJS processor because that processor owns the submission record and feedback transaction boundary.

## Alternatives

- Perform all work inline in HTTP handlers.
- Introduce a separate message broker.

## Consequences

Processors must be idempotent and queue ownership must be unique. External side effects still need provider-aware idempotency because a process can fail after delivery but before acknowledging a job.
