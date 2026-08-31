# Database Migration & Schema Management Policy

This document outlines mandatory database migration procedures for the **Shikkhok AI** platform using NestJS, MongoDB, and Mongoose-backed schemas.

---

## 1. Core Rule: Zero Uncontrolled Schema Drift in Production

- **Development**: All schema changes during feature development MUST be accompanied by a version-controlled migration or backfill script when data transformation is required.
- **Production Deployment**: Production deployments MUST apply tracked code and data migrations intentionally. Untracked manual data edits are strictly forbidden in production.

---

## 2. Zero Data Loss Policy

- **Preserve User Records**: Never delete user data simply to resolve a migration conflict.
- **Backwards-Compatible Schema Additions**:
  1. Add new schema fields as optional or provide explicit defaults.
  2. Perform data backfills via migration scripts before enforcing new required constraints.
  3. Use two-step migrations or staged backfills when renaming fields or reshaping document structures.

---

## 3. Standard Migration Commands

```bash
# Run a service-specific data migration script
cd services/api
npm run migrate:tutor-messages

# Verify API tests after schema changes
npm test
```
