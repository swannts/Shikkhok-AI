# ADR 006: Offline-first mobile synchronization

## Context

Students may use the app with intermittent connectivity and should retain cached lessons and local progress.

## Decision

Flutter repositories use Drift/SQLite for applicable cached curriculum and queued mutations. Mutations have stable client operation IDs, visible sync states, retry/backoff, and explicit conflict handling. The server remains authoritative for identity, curriculum, subscription, and permissions; learning progress follows the documented merge policy. AI Tutor requires network access unless a real local model is installed.

## Alternatives

- Make all app features network-only.
- Treat the mobile database as authoritative for all data.

## Consequences

Offline screens distinguish cached/stale data from fresh data, and mutation queues must survive restarts. AI features must report unavailable connectivity honestly.
