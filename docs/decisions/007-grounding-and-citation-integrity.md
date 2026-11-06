# ADR 007: Grounding and citation integrity

## Context

Children and teachers rely on textbook references as evidence. Generated titles, page numbers, or excerpts can falsely imply verification.

## Decision

No retrieved evidence means no citation. A citation must retain provenance from a retrieved curriculum chunk, including its source identifier and actual available metadata. When retrieval is unavailable, the response is explicitly degraded and ungrounded. Extracted textbook lessons remain unpublished drafts until a teacher reviews and approves them.

## Alternatives

- Let the model compose source references from memory.
- Generate default NCTB metadata when stored fields are missing.
- Publish extracted lesson structures immediately.

## Consequences

Some answers contain no textbook citation and some ingested lessons are not student-visible until review. This preserves source trust and makes review responsibility explicit.
