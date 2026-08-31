# Retrieval-Augmented Generation (RAG) & Citation Architecture

RAG grounding in Shikkhok AI retrieves NCTB curriculum textbook context without inventing or hallucinating facts.

## RAG Retrieval Pipeline Steps

1. **Textbook PDF Ingestion**: The AI ingestion pipeline extracts NCTB PDF textbook content into content-hashed chunks with curriculum metadata such as `curriculumYear`, `classLevel`, `medium`, `subjectId`, `chapterId`, `lessonId`, and page bounds.
2. **Vector Store Indexing**: Chunks are embedded and stored in the AI service's memory or persistent vector stores with embedding identity metadata (`provider`, `model`, `dimension`, `version`).
3. **Pre-Retrieval Metadata Filter Guard**: Retrieval respects curriculum scope and falls back only within allowed class/subject/year/medium boundaries.
4. **Verified Source Citations**: The tutor and homework flows resolve source tags back to retrieved chunks and emit grounded citation metadata:
   ```json
   {
     "source": "Class 8 Science",
     "chapter": "Chapter 4",
     "pageNumber": 63
   }
   ```
