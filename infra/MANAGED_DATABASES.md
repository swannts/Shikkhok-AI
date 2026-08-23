# Production Managed Database Architecture Strategy

> **Core Infrastructure Policy**: Do NOT host stateful database workloads (PostgreSQL/Redis) inside Kubernetes StatefulSets for production. State belongs in managed cloud database services.

```
┌────────────────────────────────────────────────────────┐
│               Stateless Microservices                  │
│             (Kubernetes / GKE / EKS)                   │
│                                                        │
│   shikkhok-api    shikkhok-ai-gateway  shikkhok-worker │
└───────────┬────────────────────────────────┬───────────┘
            │ (TLS Database Connection)      │ (Redis Protocol)
            ▼                                ▼
┌────────────────────────┐      ┌────────────────────────┐
│   Managed PostgreSQL   │      │     Managed Redis      │
│  (GCP Cloud SQL / RDS) │      │  (Memorystore / Elasti)│
│                        │      │                        │
│  - pgvector enabled    │      │  - In-memory cache     │
│  - Automated backups   │      │  - BullMQ job broker   │
│  - Multi-AZ failover   │      │  - Rate limiting       │
└────────────────────────┘      └────────────────────────┘
```

## Recommended Production Cloud Providers

| Cloud Provider | Managed PostgreSQL Service (with `pgvector`) | Managed Redis Service |
| :--- | :--- | :--- |
| **Google Cloud (GCP)** | **Cloud SQL for PostgreSQL** (`pgvector` flag enabled) | **Memorystore for Redis** |
| **AWS** | **Amazon RDS for PostgreSQL** / **Aurora PostgreSQL** | **Amazon ElastiCache for Redis** / **MemoryDB** |
| **Azure** | **Azure Database for PostgreSQL Flexible Server** | **Azure Cache for Redis** |

## Production Advantages over In-Cluster Database Hosting

1. **High Availability & Automated Failover**: Managed services provide multi-AZ automatic failover without requiring complex PostgreSQL HA operators (Stolon/Patroni/CloudNativePG) inside Kubernetes.
2. **Automated Point-in-Time Recovery (PITR)**: Automated continuous backups and storage encryption at rest.
3. **Dedicated Compute & Storage Scaling**: Storage auto-expansion without risking Kubernetes node disk pressure evictions (`disk-pressure`).
4. **Maintenance & Security Patching**: Cloud provider handles OS and database engine security patching seamlessly.

## Environment Secret Injection Policy

Database connection strings for managed instances are injected via Kubernetes Secrets:

```bash
# GCP Cloud SQL / RDS Connection String Format
DATABASE_URL="postgresql://shikkhok_admin:<SECURE_PASSWORD>@10.x.x.x:5432/shikkhok_prod?schema=public&sslmode=require"

# Managed Redis Connection String Format
REDIS_URL="rediss://:<SECURE_PASSWORD>@10.x.x.x:6379"
```
