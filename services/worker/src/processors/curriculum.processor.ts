import crypto from 'crypto';
import { readFile } from 'fs/promises';
import { Job } from 'bullmq';
import { config } from '../config';

export interface CurriculumJobData {
  jobType?: string;
  text: string;
  sourceBook: string;
  bookId: string;
  classLevel: number;
  subjectId: string;
  subjectTitle?: string;
  chapterId?: string;
  chapterTitle?: string;
  curriculumVersion: string;
  academicYear: number;
  pageStart?: number;
  pageEnd?: number;
  chunkSize?: number;
  chunkOverlap?: number;
  filePath?: string;
}

function signRequest(method: string, path: string, body: string | Uint8Array): { timestamp: string; signature: string } {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const bodyHash = crypto.createHash('sha256').update(body).digest('hex');
  const canonical = `${timestamp}\n${method.toUpperCase()}\n${path}\n${bodyHash}`;
  const signature = crypto
    .createHmac('sha256', config.aiHmacSecret)
    .update(canonical, 'utf-8')
    .digest('hex');
  return { timestamp, signature };
}

async function reportProgress(
  bookId: string,
  status: 'processing' | 'indexed' | 'failed' | 'partially_failed',
  fields: { indexedChunkCount?: number; failedChunkCount?: number; error?: string } = {},
): Promise<void> {
  const path = `/api/v1/internal/curriculum/${bookId}/progress`;
  const body = JSON.stringify({ status, ...fields });
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const bodyHash = crypto.createHash('sha256').update(body).digest('hex');
  const canonical = `${timestamp}\nPOST\n${path}\n${bodyHash}`;
  const signature = crypto
    .createHmac('sha256', config.aiHmacSecret)
    .update(canonical, 'utf-8')
    .digest('hex');
  try {
    await fetch(`${config.apiServiceUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Name': 'shikkhok-worker',
        'X-Service-Timestamp': timestamp,
        'X-Service-Signature': signature,
        'X-Request-Id': `worker_curriculum_${bookId}_${Date.now()}`,
      },
      body,
      signal: AbortSignal.timeout(5000),
    });
  } catch (error) {
    console.warn(`[CurriculumProcessor] Progress callback failed for ${bookId}: ${(error as Error).message}`);
  }
}

export async function processCurriculumJob(job: Job): Promise<Record<string, any>> {
  const jobName = job.name || job.data?.jobType || 'CURRICULUM_CHUNKING';
  const data = (job.data?.data || job.data) as CurriculumJobData;

  if (data.filePath) {
    return processCurriculumPdfJob(data);
  }

  console.log(`[CurriculumProcessor] Ingesting chapter/chunk for book: ${data.bookId} (${jobName})`);

  if (!data.text || !data.bookId || !data.subjectId || !data.curriculumVersion || !data.academicYear) {
    throw new Error(
      'Missing required curriculum job fields: text, bookId, subjectId, curriculumVersion, academicYear',
    );
  }

  await reportProgress(data.bookId, 'processing');

  const payloadObj = {
    text: data.text,
    source_book: data.sourceBook,
    book_id: data.bookId,
    class_level: data.classLevel,
    subject_id: data.subjectId,
    subject_title: data.subjectTitle || data.subjectId,
    chapter_id: data.chapterId || 'intro',
    chapter_title: data.chapterTitle || data.chapterId,
    curriculum_version: data.curriculumVersion,
    academic_year: data.academicYear,
    page_start: data.pageStart || 1,
    page_end: data.pageEnd || 1,
    chunk_size: data.chunkSize || 300,
    chunk_overlap: data.chunkOverlap || 50,
  };

  const bodyStr = JSON.stringify(payloadObj);
  const path = '/api/v1/ingestion/text';
  const { timestamp, signature } = signRequest('POST', path, bodyStr);

  const targetUrl = `${config.aiServiceUrl}${path}`;

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Name': 'shikkhok-worker',
        'X-Service-Timestamp': timestamp,
        'X-Service-Signature': signature,
        'X-Request-Id': `worker_ingest_${job.id || Date.now()}`,
      },
      body: bodyStr,
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI Service ingestion failed (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    const indexedChunkCount = Number(result.vectors_generated ?? result.chunk_count ?? 0);
    await reportProgress(data.bookId, indexedChunkCount > 0 ? 'indexed' : 'partially_failed', {
      indexedChunkCount,
      failedChunkCount: indexedChunkCount > 0 ? 0 : 1,
    });
    console.log(`[CurriculumProcessor] Successfully indexed chunks for ${data.bookId}`);
    return {
      status: 'INDEXED',
      bookId: data.bookId,
      result,
      indexedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    await reportProgress(data.bookId, 'failed', {
      error: err instanceof Error ? err.message : 'Curriculum indexing failed',
    });
    console.error(`[CurriculumProcessor] Error communicating with AI service at ${targetUrl}: ${err.message}`);
    throw err;
  }
}

async function processCurriculumPdfJob(data: CurriculumJobData): Promise<Record<string, any>> {
  const pdf = await readFile(data.filePath!);
  const form = new FormData();
  form.append('file', new Blob([pdf], { type: 'application/pdf' }), data.sourceBook || 'textbook.pdf');
  form.append('class_level', String(data.classLevel));
  form.append('subject_id', data.subjectId);
  form.append('subject_title', data.subjectTitle || data.subjectId);
  form.append('source_book', data.sourceBook || data.bookId);
  form.append('medium', 'bangla');
  const path = '/api/v1/ingestion/pdf';
  const request = new Request(`${config.aiServiceUrl}${path}`, { method: 'POST', body: form });
  const requestBody = new Uint8Array(await request.arrayBuffer());
  const signed = signRequest('POST', path, requestBody);
  const response = await fetch(`${config.aiServiceUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': request.headers.get('content-type') || 'application/octet-stream',
      'X-Service-Name': 'shikkhok-worker',
      'X-Service-Timestamp': signed.timestamp,
      'X-Service-Signature': signed.signature,
    },
    body: requestBody,
    signal: AbortSignal.timeout(120000),
  });
  if (!response.ok) throw new Error(`AI PDF ingestion failed (${response.status})`);
  return { status: 'INDEXED', bookId: data.bookId, result: await response.json() };
}
