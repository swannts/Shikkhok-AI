# Database & Data Model Specifications

PostgreSQL is the single durable source of truth across the Shikkhok AI ecosystem.

## Key Schema & Performance Patterns
- **Prisma ORM**: Models defined in `services/api/prisma/schema.prisma`.
- **Native PostgreSQL Json**: Extensible fields (`options`, `answerConfig`, `responsePayload`, `blocks`) use native `Json` types.
- **pgvector Integration**: Stores 768-dimensional embeddings via `Unsupported("vector(768)")?`.
- **High-Performance Indexing**: Compound indexes on high-frequency query patterns (`[studentId, createdAt]`, `[studentId, lessonId]`, `[conversationId, createdAt]`).
- **Managed Production Databases**: Production connects to GCP Cloud SQL / AWS RDS rather than in-cluster database StatefulSets.
