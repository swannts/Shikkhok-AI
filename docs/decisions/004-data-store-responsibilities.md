# ADR 004: MongoDB and Redis responsibilities

## Context

The platform needs durable product records and low-latency ephemeral coordination.

## Decision

MongoDB is the system of record for users, profiles, curriculum, conversations, progress, and other business entities. Redis is used for cache, distributed throttling, realtime coordination, and BullMQ state. A Redis result cache is not treated as durable business truth.

## Alternatives

- Store business state in Redis.
- Use MongoDB for rate-limit counters and transient coordination.

## Consequences

Redis loss must not erase durable user work. Operations requiring durable deduplication use database constraints or stable persisted identifiers where applicable.
