import { Worker, Job, Queue } from 'bullmq';
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });

export type WorkerJobType =
  | 'PDF_EXTRACTION'
  | 'CURRICULUM_CHUNKING'
  | 'EMBEDDING_GENERATION'
  | 'NOTIFICATIONS'
  | 'ANALYTICS_AGGREGATION'
  | 'REPORT_GENERATION'
  | 'EMAIL'
  | 'SMS'
  | 'PUSH_NOTIFICATION';

export interface WorkerJobPayload {
  jobType: WorkerJobType;
  data: Record<string, any>;
}

export const workerQueue = new Queue<WorkerJobPayload>('shikkhok-background-jobs', { connection });

export function startWorker() {
  console.log('⚡ Starting Shikkhok Background Worker (BullMQ + Redis)...');

  const worker = new Worker<WorkerJobPayload>(
    'shikkhok-background-jobs',
    async (job: Job<WorkerJobPayload>) => {
      console.log(`[Worker Processing] Job ID: ${job.id} | Type: ${job.data.jobType}`);

      switch (job.data.jobType) {
        case 'PDF_EXTRACTION':
          console.log(`[PDF Extraction] Processing file: ${job.data.data.sourceBook}`);
          break;

        case 'CURRICULUM_CHUNKING':
          console.log(`[Curriculum Chunking] Chunking class ${job.data.data.classLevel} subject ${job.data.data.subject}`);
          break;

        case 'EMBEDDING_GENERATION':
          console.log(`[Embedding Generation] Generating vector embeddings for ${job.data.data.chunkCount || 10} chunks`);
          break;

        case 'NOTIFICATIONS':
        case 'PUSH_NOTIFICATION':
          console.log(`[Push Notification] Sending push alert to student: ${job.data.data.studentId}`);
          break;

        case 'ANALYTICS_AGGREGATION':
          console.log(`[Analytics] Aggregating daily study time and accuracy stats`);
          break;

        case 'REPORT_GENERATION':
          console.log(`[Report] Generating weekly progress report PDF for student ${job.data.data.studentId}`);
          break;

        case 'EMAIL':
        case 'SMS':
          console.log(`[SMS/Email] Dispatching OTP / Notification message to ${job.data.data.recipient}`);
          break;

        default:
          console.log(`[Worker] Unhandled job type: ${job.data.jobType}`);
      }

      return { status: 'COMPLETED', processedAt: new Date() };
    },
    { connection }
  );

  worker.on('completed', (job) => {
    console.log(`✅ [Job Completed] ID: ${job.id} | Type: ${job.data.jobType}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ [Job Failed] ID: ${job?.id} | Error:`, err);
  });
}
