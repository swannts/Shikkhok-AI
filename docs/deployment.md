# Production Deployment Guide

## 1. Container Build Verification
- Docker Compose configuration validation: `docker compose config`
- Local development stack: `docker compose up -d` with mock AI providers explicitly enabled when no provider key is configured.
- CI/CD Matrix: GitHub Actions in `.github/workflows/ci.yml` validates application builds and the Helm chart after a pull request is merged into `main`.

## 2. Production Database Migrations
- Apply service-specific data migrations safely from `services/api/scripts/database/` before or during release rollout.
- Run the relevant API test suite after schema or backfill changes.

## 3. Kubernetes / Helm Deployment
- Chart: `infra/kubernetes/helm/shikkhok-ai`.
- Validate: `helm lint infra/kubernetes/helm/shikkhok-ai` and `helm template shikkhok-ai infra/kubernetes/helm/shikkhok-ai`.
- Create the externally managed runtime Secret from `infra/kubernetes/helm/shikkhok-ai/examples/secret.env.example`, replacing every placeholder and keeping the resulting Secret outside Git.
- Install: `helm upgrade --install shikkhok-ai infra/kubernetes/helm/shikkhok-ai --namespace shikkhok-production --create-namespace`.
- Managed database strategy: `infra/MANAGED_DATABASES.md`. MongoDB and Redis are intentionally not deployed inside the production cluster.
