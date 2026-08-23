import { ragCurriculumPipeline, CurriculumChunk } from '../rag/rag.pipeline';

describe('AI Gateway & RAG Grounded Pipeline Tests', () => {
  const sampleChunks: CurriculumChunk[] = [
    {
      id: 'chunk-class-6-1',
      content: 'Class 6 Basic Fractions explanation...',
      metadata: {
        curriculumYear: 2026,
        class: 'Class 6',
        medium: 'bangla',
        subject: 'Mathematics',
        chapter: 'Fractions',
        language: 'bn',
        sourceBook: 'NCTB_Class_6_Math.pdf',
        pageNumber: 12,
      },
    },
    {
      id: 'chunk-class-10-1',
      content: 'Class 10 Advanced Calculus and Functions...',
      metadata: {
        curriculumYear: 2026,
        class: 'Class 10',
        medium: 'bangla',
        subject: 'Mathematics',
        chapter: 'Calculus',
        language: 'bn',
        sourceBook: 'NCTB_Class_10_Math.pdf',
        pageNumber: 104,
      },
    },
  ];

  it('RAG metadata filtering strictly isolates Class 6 student from Class 10 material', () => {
    const retrieved = ragCurriculumPipeline.retrieveCurriculumContext('Fractions question', { class: 'Class 6', subject: 'Mathematics' }, sampleChunks);

    expect(retrieved.length).toBe(1);
    expect(retrieved[0].metadata.class).toBe('Class 6');
    expect(retrieved.some((c) => c.metadata.class === 'Class 10')).toBe(false);
  });

  it('extracts verified citations without inventing non-retrieved sources', () => {
    const citations = ragCurriculumPipeline.extractVerifiedCitations([sampleChunks[0]]);

    expect(citations.length).toBe(1);
    expect(citations[0].class).toBe('Class 6');
    expect(citations[0].formattedCitation).toBe('Source: Class 6 Mathematics, Chapter: Fractions, Page: 12');
  });

  it('builds grounded prompt with verified context', () => {
    const prompt = ragCurriculumPipeline.buildGroundedPrompt('ভগ্নাংশ কী?', [sampleChunks[0]], 'Class 6', 'Mathematics');

    expect(prompt).toContain('VERIFIED NCTB CURRICULUM CONTEXT (Class 6)');
    expect(prompt).toContain('Class 6 Basic Fractions explanation');
    expect(prompt).toContain('Student Question: ভগ্নাংশ কী?');
  });
});
