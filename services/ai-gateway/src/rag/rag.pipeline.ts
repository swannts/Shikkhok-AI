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
   * 2. Simulated Vector Store Query: Retrieve curriculum grounded context
   */
  public retrieveCurriculumContext(
    query: string,
    filter: Partial<NctbDocumentMetadata>,
    availableChunks: CurriculumChunk[] = []
  ): CurriculumChunk[] {
    return availableChunks.filter((chunk) => {
      if (filter.class && chunk.metadata.class !== filter.class) return false;
      if (filter.subject && chunk.metadata.subject !== filter.subject) return false;
      return true;
    });
  }
}

export const ragCurriculumPipeline = new RAGCurriculumPipeline();
