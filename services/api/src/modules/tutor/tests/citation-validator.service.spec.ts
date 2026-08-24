import 'reflect-metadata';
import { CitationValidatorService } from '../services/citation-validator.service';

describe('CitationValidatorService', () => {
  let service: CitationValidatorService;

  beforeEach(() => {
    service = new CitationValidatorService();
  });

  it('should return empty array for non-array inputs', () => {
    expect(service.validateAndSanitizeCitations(null as any)).toEqual([]);
    expect(service.validateAndSanitizeCitations('not an array' as any)).toEqual([]);
  });

  it('should validate and sanitize valid NCTB citations', () => {
    const raw = [
      {
        sourceBook: 'NCTB Class 9 Physics',
        classLevel: 9,
        chapter: 'Chapter 2: Motion',
        pageNumber: 42,
        excerpt: 'গতির সমীকরণ এবং তাৎক্ষণিক দ্রুতি।',
        sourceUrl: 'https://nctb.gov.bd/book/physics9',
      },
    ];

    const result = service.validateAndSanitizeCitations(raw);
    expect(result).toHaveLength(1);
    expect(result[0].sourceBook).toBe('NCTB Class 9 Physics');
    expect(result[0].classLevel).toBe(9);
    expect(result[0].pageNumber).toBe(42);
  });

  it('should discard entries without sourceBook and limit maximum citations', () => {
    const raw = [
      { sourceBook: '' },
      { sourceBook: 'Book 1' },
      { sourceBook: 'Book 2' },
      { sourceBook: 'Book 3' },
      { sourceBook: 'Book 4' },
      { sourceBook: 'Book 5' },
      { sourceBook: 'Book 6' },
    ];

    const result = service.validateAndSanitizeCitations(raw);
    expect(result).toHaveLength(5); // capped at 5
    expect(result[0].sourceBook).toBe('Book 1');
  });
});
