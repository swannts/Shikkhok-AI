# Backward Compatibility & API Evolution Policy

This document outlines the mandatory protocol for making API changes across the **Shikkhok AI** platform to prevent breaking changes on mobile applications.

---

## 1. Golden Rule: No Silent Response Shape Modifications

When updating an existing API endpoint (`/api/v1/*` or `/ai/v1/*`):

1. **Update Shared Types First**: Update types in `packages/types/index.ts`.
2. **Update Service Repositories**: Update data fetching & mapping methods in service and mobile repositories (`CurriculumRepository`, `PracticeRepository`, `TutorRepository`).
3. **Update Unit & Integration Tests**: Update automated test suites in both `services/api` and `apps/mobile`.
4. **Verify React Native Screens**: Verify that all affected UI components compile cleanly.

---

## 2. API Versioning Strategy

- **Non-Breaking Additions**: Adding new optional fields to existing JSON payloads is allowed (e.g. adding `requestId` or `banglaMessage`).
- **Breaking Changes**: If a field must be renamed, removed, or have its data type modified:
  - Deprecate old fields gradually (provide fallback fields).
  - Or introduce a new endpoint version (e.g. `/api/v2/practice/submit`).

---

## 3. Standardized API Response Schema

All REST API endpoints MUST adhere to the standard envelope schema:

```json
{
  "statusCode": 200,
  "data": {},
  "message": "Operation successful",
  "banglaMessage": "সফলভাবে সম্পন্ন হয়েছে।",
  "errorCode": null,
  "details": null,
  "requestId": "req-uuid-12345"
}
```
