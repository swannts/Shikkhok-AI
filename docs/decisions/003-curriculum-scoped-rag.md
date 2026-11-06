# ADR 003: Curriculum-scoped retrieval

## Context

Students study different classes, media, subjects, and curriculum editions. Mixing those sources can produce incorrect teaching and false citations.

## Decision

Retrieval filters use validated student class, medium, curriculum year/version, subject, chapter, and lesson context when available. Missing required scope yields ungrounded behavior; it is never filled with an invented class or edition. Citations are created only from chunks returned by retrieval.

## Alternatives

- Search a shared index without scope filters.
- Infer missing curriculum identity from a code default or model output.

## Consequences

Grounded answers may be unavailable when scope or source content is missing. The tutor can still provide a clearly marked general explanation without citations.
