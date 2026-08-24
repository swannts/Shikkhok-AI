import { Injectable } from '@nestjs/common';
import { TutorCitation } from '../types/tutor-citation.type';

@Injectable()
export class CitationValidatorService {
  validateAndSanitizeCitations(citations: any[]): TutorCitation[] {
    if (!Array.isArray(citations) || citations.length === 0) {
      return [];
    }

    const validCitations: TutorCitation[] = [];

    for (const item of citations) {
      if (!item || typeof item !== 'object') {
        continue;
      }

      const sourceBook = typeof item.sourceBook === 'string' ? item.sourceBook.trim() : '';
      if (!sourceBook) {
        continue;
      }

      let classLevel: number | undefined = undefined;
      if (item.classLevel !== undefined && item.classLevel !== null) {
        const parsedClass = Number(item.classLevel);
        if (!isNaN(parsedClass) && parsedClass >= 1 && parsedClass <= 12) {
          classLevel = parsedClass;
        }
      }

      let pageNumber: number | undefined = undefined;
      if (item.pageNumber !== undefined && item.pageNumber !== null) {
        const parsedPage = Number(item.pageNumber);
        if (!isNaN(parsedPage) && parsedPage >= 1 && parsedPage <= 2000) {
          pageNumber = parsedPage;
        }
      }

      validCitations.push({
        sourceId: typeof item.sourceId === 'string' ? item.sourceId.trim() : undefined,
        sourceBook,
        classLevel,
        subject: typeof item.subject === 'string' ? item.subject.trim() : undefined,
        chapter: typeof item.chapter === 'string' ? item.chapter.trim() : undefined,
        pageNumber,
        excerpt:
          typeof item.excerpt === 'string' ? item.excerpt.trim().substring(0, 500) : undefined,
        sourceUrl:
          typeof item.sourceUrl === 'string' && item.sourceUrl.startsWith('http')
            ? item.sourceUrl.trim()
            : undefined,
      });

      if (validCitations.length >= 5) {
        break; // Max 5 citations per response
      }
    }

    return validCitations;
  }
}
