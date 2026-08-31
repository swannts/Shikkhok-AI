import crypto from 'crypto';
import { Job } from 'bullmq';
import { config } from '../config';

export interface CurriculumJobData {
  text: string;
  sourceBook: string;
  bookId: string;
  classLevel: number;
  subjectId: string;
  subjectTitle?: string;
  chapterId?: string;
  chapterTitle?: string;
  curriculumVersion?: string;
  academicYear?: number;
  pageStart?: number;
  pageEnd?: number;
  chunkSize?: number;
  chunkOverlap?: number;
}

function generateHmacSignature(payload: string, secret: string): { signature: string; timestamp: string } {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`)
    .digest('hex');
  return { signature, timestamp };
}

export async function processCurriculumJob(job: Job): Promise<Record<string, any>> {
  const jobName = job.name || job.data?.jobType || 'CURRICULUM_CHUNKING';
  const data = (job.data?.data || job.data) as CurriculumJobData;

  console.log(`[CurriculumProcessor] Ingesting chapter/chunk for book: ${data.bookId} (${jobName})`);

  const payloadObj = {
    text: data.text,
    source_book: data.sourceBook,
    book_id: data.bookId,
    class_level: data.classLevel,
    subject_id: data.subjectId,
    subject_title: data.subjectTitle || data.subjectId,
    chapter_id: data.chapterId || 'intro',
    chapter_title: data.chapterTitle || data.chapterId,
    curriculum_version: data.curriculumVersion || '2024-NCTB',
    academic_year: data.academicYear || 2026,
    page_start: data.pageStart || 1,
    page_end: data.pageEnd || 1,
    chunk_size: data.chunkSize || 300,
    chunk_overlap: data.chunkOverlap || 50,
  };

  const bodyStr = JSON.stringify(payloadObj);
  const { signature, timestamp } = generateHmacSignature(bodyStr, config.aiHmacSecret);

  const targetUrl = `${config.aiServiceUrl}/api/v1/ingestion/text`;

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': signature,
        'X-Timestamp': timestamp,
      },
      body: bodyStr,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI Service ingestion failed (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log(`[CurriculumProcessor] Successfully indexed chunks for ${data.bookId}`);
    return {
      status: 'INDEXED',
      bookId: data.bookId,
      result,
      indexedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    console.error(`[CurriculumProcessor] Error communicating with AI service at ${targetUrl}: ${err.message}`);
    throw err;
  }
}
