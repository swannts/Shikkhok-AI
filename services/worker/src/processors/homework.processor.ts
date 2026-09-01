import { Job } from 'bullmq';
import crypto from 'crypto';
import { config } from '../config';

export interface HomeworkJobData {
  jobType?: string;
  submissionId: string;
  userId: string;
  classroomId?: string;
  subjectId: string;
  questionId: string;
  answerText: string;
  imageUrl?: string;
  requestId?: string;
}

interface HomeworkEvaluationResult {
  submissionId: string;
  status: 'evaluated' | 'error';
  score: number | null;
  feedback: string | null;
  evaluatedAt: string;
  durationMs: number;
  requestId?: string;
}

const JOB_IDEMPOTENCY_PREFIX = 'homework:eval:';
const JOB_RESULT_TTL_SECONDS = 86400;

function signRequest(method: string, path: string, body: string): { timestamp: string; signature: string } {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const bodyHash = crypto.createHash('sha256').update(body).digest('hex');
  const canonical = `${timestamp}\n${method.toUpperCase()}\n${path}\n${bodyHash}`;
  const signature = crypto
    .createHmac('sha256', config.aiHmacSecret)
    .update(canonical, 'utf-8')
    .digest('hex');
  return { timestamp, signature };
}

function classifyError(err: Error): 'retryable' | 'permanent' {
  const msg = err.message.toLowerCase();
  if (
    msg.includes('timeout') ||
    msg.includes('429') ||
    msg.includes('503') ||
    msg.includes('502') ||
    msg.includes('504') ||
    msg.includes('network') ||
    msg.includes('connect')
  ) {
    return 'retryable';
  }
  if (msg.includes('missing required') || msg.includes('invalid') || msg.includes('not found')) {
    return 'permanent';
  }
  return 'retryable';
}

export async function processHomeworkJob(job: Job): Promise<HomeworkEvaluationResult> {
  const data = job.data as HomeworkJobData;
  const startedAt = Date.now();
  const jobId = job.id || 'unknown';

  const idempotencyKey = `${JOB_IDEMPOTENCY_PREFIX}${data.submissionId}`;

  try {
    if (!data.submissionId || !data.userId || !data.subjectId || !data.questionId) {
      throw new Error('Missing required fields in homework job payload');
    }

    const payloadObj = {
      submission_id: data.submissionId,
      user_id: data.userId,
      subject_id: data.subjectId,
      question_id: data.questionId,
      answer_text: data.answerText,
      image_url: data.imageUrl || null,
      request_id: data.requestId || jobId,
    };

    const bodyStr = JSON.stringify(payloadObj);
    const path = '/api/v1/homework/evaluate';
    const { timestamp, signature } = signRequest('POST', path, bodyStr);
    const requestId = data.requestId || `worker_homework_${jobId}`;

    const targetUrl = `${config.aiServiceUrl}${path}`;

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Name': 'shikkhok-worker',
        'X-Service-Timestamp': timestamp,
        'X-Service-Signature': signature,
        'X-Request-Id': requestId,
      },
      body: bodyStr,
      signal: AbortSignal.timeout(30000),
    });

    const durationMs = Date.now() - startedAt;

    if (!response.ok) {
      const errorText = await response.text();
      const err = new Error(`AI Service homework evaluation failed (${response.status}): ${errorText}`);
      (err as any).category = classifyError(err);
      throw err;
    }

    const result = await response.json() as {
      score?: number;
      feedback?: string;
      evaluatedAt?: string;
      [key: string]: any;
    };

    const evaluation: HomeworkEvaluationResult = {
      submissionId: data.submissionId,
      status: 'evaluated',
      score: result.score ?? null,
      feedback: result.feedback ?? null,
      evaluatedAt: result.evaluatedAt ?? new Date().toISOString(),
      durationMs,
      requestId,
    };

    try {
      const client = config.getRedisClient();
      await client.setex(idempotencyKey, JOB_RESULT_TTL_SECONDS, JSON.stringify(evaluation));
    } catch {
      // Cache is best-effort; the MongoDB record is the source of truth
    }

    return evaluation;
  } catch (err: any) {
    const durationMs = Date.now() - startedAt;
    (err as any).category = classifyError(err);
    (err as any).durationMs = durationMs;
    throw err;
  }
}

export async function checkHomeworkResult(submissionId: string): Promise<HomeworkEvaluationResult | null> {
  const idempotencyKey = `${JOB_IDEMPOTENCY_PREFIX}${submissionId}`;
  try {
    const client = config.getRedisClient();
    const cached = await client.get(idempotencyKey);
    if (!cached) return null;
    return JSON.parse(cached) as HomeworkEvaluationResult;
  } catch {
    return null;
  }
}
