# ADR 008: Production hardening status

## Context

The platform spans mobile, NestJS, FastAPI, and BullMQ. Trust-sensitive behavior
must remain explicit while individual services evolve independently.

## Decision

- NestJS remains the boundary for identity, authorization, persistence, and jobs.
- FastAPI remains the boundary for moderation, retrieval, generation, grounding,
  and citation extraction.
- AI responses without retrieved evidence are explicitly ungrounded/degraded and
  contain no educational provenance.
- Mobile curriculum data is network-first with Drift fallback; cache age and
  offline state are visible to the learner.
- Queue jobs use stable identities where replay could create duplicate effects.

## Alternatives

Moving AI policy into clients or allowing unscoped fallback citations would reduce
short-term plumbing, but would weaken trust and make enforcement inconsistent.

## Consequences

Some requests fail explicitly when class or curriculum scope is missing. This is
intentional: unknown context is safer than silently selecting a grade or source.
