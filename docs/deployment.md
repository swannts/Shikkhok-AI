# Production Deployment Guide

## 1. Container Build Verification
- Docker Compose configuration validation: `docker compose config`
- CI/CD Matrix: GitHub Actions in `.github/workflows/ci.yml` runs typechecks, lint, tests, and build verifications for all microservices on every push.

## 2. Production Database Migrations
- Apply migrations safely: `npm run prisma:migrate:deploy`

## 3. Kubernetes / Helm Deployment Strategy
- Manifest specifications in `infra/KUBERNETES.md`.
- Managed database strategy in `infra/MANAGED_DATABASES.md`.
