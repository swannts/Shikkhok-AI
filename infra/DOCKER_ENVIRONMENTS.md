# Docker environments

Local development uses bind mounts and hot reload:

```bash
cp .env.example .env
docker compose -f docker-compose.yml -f docker-compose.development.yml up --build
```

Production uses the compiled, non-root images and requires secrets instead of
the development fallbacks. Put production values in a protected `.env.prod`
file or inject them from the deployment secret store:

```bash
docker compose --env-file .env.prod \
  -f docker-compose.yml -f docker-compose.production.yml up -d --build
```

The production overlay does not publish MongoDB or Redis ports. `MONGODB_URI`
and `REDIS_URL` must point at the selected production database/broker; the
compose MongoDB/Redis services are suitable for a single-host deployment, not
managed-database replacement. Do not commit `.env.prod` or credentials.
