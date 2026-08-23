# Database Migration & Schema Management Policy

This document outlines mandatory database migration procedures for the **Shikkhok AI** platform using Prisma ORM and PostgreSQL.

---

## 1. Core Rule: Zero Uncontrolled `db push` in Production

- **Development (`prisma migrate dev`)**: All database schema changes during feature development MUST generate a version-controlled SQL migration file inside `services/api/prisma/migrations/`.
- **Production Deployment (`prisma migrate deploy`)**: Production deployments MUST apply tracked migration files using `prisma migrate deploy`. Uncontrolled `db push` commands are strictly forbidden in production.

---

## 2. Zero Data Loss Policy

- **Preserve User Records**: Never drop tables or delete user data simply to resolve a migration conflict.
- **Backwards-Compatible Schema Additions**:
  1. Add new columns as optional/nullable (`ColumnType?`) or provide explicit default values (`@default(...)`).
  2. Perform data backfills via migration scripts before enforcing `NOT NULL` constraints.
  3. Rename columns or tables using two-step migrations (add new column -> copy data -> drop old column) to ensure zero downtime.

---

## 3. Standard Migration Commands

```bash
# Local Development (Generate and apply new migration)
npm run prisma:migrate:dev -- --name add_feature_tables

# Production & Staging Deployment (Apply pending migrations safely)
npm run prisma:migrate:deploy

# Regenerate Prisma Client Types
npm run prisma:generate
```
