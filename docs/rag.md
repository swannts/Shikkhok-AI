# Retrieval-Augmented Generation (RAG) & Citation Architecture

RAG grounding in Shikkhok AI retrieves NCTB curriculum textbook context without inventing or hallucinating facts.

## RAG Retrieval Pipeline Steps

1. **Textbook PDF Ingestion**: Worker microservice extracts NCTB PDF textbook content, generating ~300 character chunks with 10 mandatory metadata tags (`curriculumYear`, `class`, `medium`, `subject`, `chapter`, `lesson`, `pageNumber`, `sourceBook`, `language`, `chunkIndex`).
2. **Vector Database**: Chunks are stored in PostgreSQL using the `pgvector` extension (`vector(768)`).
3. **Pre-Retrieval Metadata Filter Guard**: Prevents cross-grade material leakage (e.g. Class 6 student receiving Class 10/12 calculus). Filters strictly match student `class` and `subject`.
4. **Verified Source Citations**: Extracts zero-hallucination source metadata returned via SSE `metadata` events:
   ```json
   {
     "source": "Class 8 Science",
     "chapter": "Chapter 4",
     "pageNumber": 63
   }
   ```
