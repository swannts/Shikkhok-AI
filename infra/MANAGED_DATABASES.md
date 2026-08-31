# Production Managed Database Architecture Strategy

> **Core Infrastructure Policy**: Do NOT host stateful database workloads (MongoDB/Redis) inside Kubernetes StatefulSets for production. State belongs in managed cloud database services.

```
┌────────────────────────────────────────────────────────┐
│               Stateless Microservices                  │
│             (Kubernetes / GKE / EKS)                   │
│                                                        │
│   shikkhok-api    shikkhok-ai-gateway  shikkhok-worker │
└───────────┬────────────────────────────────┬───────────┘
            │ (TLS MongoDB Connection)       │ (Redis Protocol)
            ▼                                ▼
┌────────────────────────┐      ┌────────────────────────┐
│     Managed MongoDB    │      │     Managed Redis      │
│ (MongoDB Atlas/DocDB)  │      │  (Memorystore / Elasti)│
│                        │      │                        │
│  - NoSQL Document DB   │      │  - In-memory cache     │
│  - Automated backups   │      │  - BullMQ job broker   │
│  - Multi-AZ sharding   │      │  - Rate limiting       │
└────────────────────────┘      └────────────────────────┘
```

## Recommended Production Cloud Providers

| Cloud Provider         | Managed MongoDB NoSQL Service           | Managed Redis Service                           |
| :--------------------- | :-------------------------------------- | :---------------------------------------------- |
| **Google Cloud (GCP)** | **MongoDB Atlas on GCP**                | **Memorystore for Redis**                       |
| **AWS**                | **Amazon DocumentDB / MongoDB Atlas**   | **Amazon ElastiCache for Redis** / **MemoryDB** |
| **Azure**              | **Azure Cosmos DB for MongoDB / Atlas** | **Azure Cache for Redis**                       |

## Production Advantages over In-Cluster Database Hosting

1. **High Availability & Automated Failover**: Managed services provide multi-region automatic replica set failover.
2. **Automated Point-in-Time Recovery (PITR)**: Automated continuous backups and storage encryption at rest.
3. **Dedicated Compute & Storage Scaling**: Horizontal sharding and auto-scaling.
4. **Maintenance & Security Patching**: Cloud provider handles OS and database engine security patching seamlessly.

## Environment Secret Injection Policy

Database connection strings for managed instances are injected via Kubernetes Secrets:

```bash
# MongoDB Atlas / Managed Connection String Format
DATABASE_URL="mongodb+srv://shikkhok_admin:<SECURE_PASSWORD>@cluster.mongodb.net/shikkhok_prod?retryWrites=true&w=majority"

# Managed Redis Connection String Format
REDIS_URL="rediss://:<SECURE_PASSWORD>@10.x.x.x:6379"
```
