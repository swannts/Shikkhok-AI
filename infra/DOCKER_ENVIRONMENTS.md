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

The production overlay does not publish MongoDB, Redis, or RabbitMQ ports.
`MONGODB_URI`, `REDIS_URL`, and `RABBITMQ_URL` must point at the selected
production database/cache/broker; the compose MongoDB, Redis, and RabbitMQ
services are suitable for a single-host deployment, not managed-service
replacement. Do not commit `.env.prod` or credentials.
