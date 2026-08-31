# Database & Data Model Specifications

MongoDB is the primary durable source of truth across the Shikkhok AI ecosystem.

## Key Schema & Performance Patterns
- **Mongoose Schemas**: Models are defined in NestJS schema files under `services/api/src/modules/**/schemas/`.
- **Flexible Document Fields**: Extensible fields such as `blocks`, `answerConfig`, `responsePayload`, and metadata arrays are stored directly in documents.
- **Indexing Strategy**: Compound indexes cover high-frequency query patterns such as `[studentId, createdAt]`, `[studentId, lessonId]`, and `[conversationId, createdAt]`.
- **Managed Production Databases**: Production uses managed MongoDB rather than in-cluster stateful sets.
- **Vector Retrieval Data**: Curriculum embeddings and retrieval metadata are managed separately in the AI service vector store layer.
