# Contributing Guidelines

Thank you for contributing to **Shikkhok AI (শিক্ষক এআই)**!

## 1. Implementation Workflow for Every Task

When implementing a feature or bug fix, follow this sequence:
1. **Inspect Repository**: Review existing architecture and existing files first.
2. **Find Code Paths**: Trace data flow across UI, services, and database.
3. **Write Concise Implementation Plan**: Define minimal safe changes.
4. **Implement Smallest Vertical Slice**: Build end-to-end functionality.
5. **Add / Update Tests**: Include unit, integration, or contract tests.
6. **Verify Build Matrix**:
   - `npm run typecheck`
   - `npm run lint`
   - `npm test`
   - `npm run build`
7. **Inspect Diff**: Ensure zero unrelated code changes or secret leaks.

## 2. Definition of Done Checklist

A pull request is considered complete when:
- [ ] Feature requirements implemented with production-safe error states.
- [ ] TypeScript types pass cleanly across all affected packages (`tsc --noEmit`).
- [ ] Automated tests pass (`npm test`).
- [ ] Production build succeeds (`npm run build`).
- [ ] Input validation (Zod) and authorization guards attached.
- [ ] No hardcoded secrets or credentials committed.
- [ ] Documentation updated where appropriate.
