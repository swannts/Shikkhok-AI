export interface NctbDocumentMetadata {
  curriculumYear: number;
  class: string;        // e.g. 'Class 8'
  medium: string;       // e.g. 'bangla'
  subject: string;      // e.g. 'Mathematics'
  chapter: string;      // e.g. 'Algebraic Expressions'
  lesson?: string;      // e.g. 'Linear Equations'
  language: string;     // e.g. 'bn'
  sourceBook: string;   // e.g. 'NCTB_Class_8_Math.pdf'
  pageNumber: number;
}

export interface CurriculumChunk {
  id: string;
  content: string;
  metadata: NctbDocumentMetadata;
  embedding?: number[];
}

export class RAGCurriculumPipeline {
  /**
   * 1. Ingestion Pipeline: Process raw text from NCTB PDF into clean curriculum chunks
   */
  public processRawNctbText(
    rawText: string,
    metadata: Omit<NctbDocumentMetadata, 'pageNumber'>,
    pageNumber: number = 1,
    chunkSize: number = 300
  ): CurriculumChunk[] {
    // Clean raw text (normalize whitespace, strip non-printable characters)
    const cleanedText = rawText.replace(/\s+/g, ' ').trim();
    if (!cleanedText) return [];

    const chunks: CurriculumChunk[] = [];
    let startIndex = 0;
    let chunkCount = 1;

    while (startIndex < cleanedText.length) {
      const contentChunk = cleanedText.slice(startIndex, startIndex + chunkSize);
      chunks.push({
        id: `${metadata.sourceBook}-p${pageNumber}-c${chunkCount++}`,
        content: contentChunk,
        metadata: {
          ...metadata,
          pageNumber,
        },
      });
      startIndex += chunkSize - 50; // 50 char overlap
    }

    return chunks;
  }

  /**
   * 2. Metadata-Grounded Vector Store Query: Strict metadata filter enforcement
   * Ensures a Class 6 student NEVER retrieves Class 10 materials for the same topic.
   */
  public retrieveCurriculumContext(
    query: string,
    filter: Partial<NctbDocumentMetadata>,
    availableChunks: CurriculumChunk[] = []
  ): CurriculumChunk[] {
    return availableChunks.filter((chunk) => {
      // MANDATORY METADATA GUARD: Strict class level isolation
      if (filter.class && chunk.metadata.class.toLowerCase() !== filter.class.toLowerCase()) {
        return false;
      }
      // MANDATORY METADATA GUARD: Subject isolation
      if (filter.subject && chunk.metadata.subject.toLowerCase() !== filter.subject.toLowerCase()) {
        return false;
      }
      // Optional chapter/medium filter
      if (filter.medium && chunk.metadata.medium.toLowerCase() !== filter.medium.toLowerCase()) {
        return false;
      }
      return true;
    });
  }

  /**
   * 3. Construct Context-Injected Grounded System Prompt
   */
  public buildGroundedPrompt(
    userQuestion: string,
    retrievedChunks: CurriculumChunk[],
    studentClass: string,
    subject: string
  ): string {
    const contextText = retrievedChunks
      .map(
        (chunk, idx) =>
          `[Source ${idx + 1}: ${chunk.metadata.sourceBook}, Chapter: ${chunk.metadata.chapter}, Page: ${chunk.metadata.pageNumber}]\n${chunk.content}`
      )
      .join('\n\n');

    return (
      `You are Shikkhok AI (শিক্ষক এআই), a trusted NCTB tutor for ${studentClass} ${subject}.\n` +
      `Answer the student's question strictly using the verified NCTB curriculum context below.\n\n` +
      `=== VERIFIED NCTB CURRICULUM CONTEXT (${studentClass}) ===\n` +
      `${contextText || 'No specific textbook context found for this topic.'}\n` +
      `============================================================\n\n` +
      `Student Question: ${userQuestion}\n\n` +
      `Instructions: Explain in clear Bengali. Do not cite higher-grade materials.`
    );
  }
  /**
   * 4. Verified Source Citation Extractor
   * Strictly extracts citations from retrieved curriculum chunks. NEVER fabricates non-retrieved sources.
   */
  public extractVerifiedCitations(retrievedChunks: CurriculumChunk[]): Array<{
    sourceBook: string;
    class: string;
    subject: string;
    chapter: string;
    pageNumber: number;
    formattedCitation: string;
  }> {
    if (!retrievedChunks || retrievedChunks.length === 0) {
      return [];
    }

    const citationsMap = new Map<string, any>();

    for (const chunk of retrievedChunks) {
      const { sourceBook, class: className, subject, chapter, pageNumber } = chunk.metadata;
      const key = `${className}-${subject}-${chapter}-${pageNumber}`;

      if (!citationsMap.has(key)) {
        citationsMap.set(key, {
          sourceBook,
          class: className,
          subject,
          chapter,
          pageNumber,
          formattedCitation: `Source: ${className} ${subject}, Chapter: ${chapter}, Page: ${pageNumber}`,
        });
      }
    }

    return Array.from(citationsMap.values());
  }
}

export const ragCurriculumPipeline = new RAGCurriculumPipeline();


