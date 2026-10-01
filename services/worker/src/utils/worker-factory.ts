import { Worker, Queue, QueueEvents, Job, Processor } from 'bullmq';
import { config } from '../config';

const DLQ_JOB_TTL_SECONDS = 604800; // 7 days

export interface ManagedWorkerOptions {
  queueName: string;
  processor: Processor;
  concurrency?: number;
  maxAttempts?: number;
  removeOnComplete?: any;
}

export function classifyJobError(err: Error): string {
  const msg = err.message.toLowerCase();
  if (
    msg.includes('timeout') ||
    msg.includes('econnrefused') ||
    msg.includes('rate limit') ||
    msg.includes('network') ||
    msg.includes('socket') ||
    msg.includes('disconnect')
  ) {
    return 'retryable';
  }
  if (
    msg.includes('missing required') ||
    msg.includes('invalid') ||
    msg.includes('not found') ||
    msg.includes('not configured')
  ) {
    return 'permanent';
  }
  return 'retryable';
}

function getJobType(job: Job): string {
  const data = job.data?.data || job.data;
  return data?.jobType || data?.type || job.name || 'unknown';
}

async function logFailedJob(queueName: string, job: Job | undefined, err: Error) {
  const jobType = job ? getJobType(job) : 'unknown';
  const category = classifyJobError(err);
  const attemptInfo = {
    jobId: job?.id || 'unknown',
    jobType,
    attempt: job?.attemptsMade || 0,
    errorCategory: category as 'retryable' | 'permanent',
    errorMessage: err.message,
    failedAt: new Date().toISOString(),
  };
  console.error(`[Worker:${queueName}] Job #${job?.id || 'unknown'} failed (attempt ${job?.attemptsMade || 0}): ${err.message}`);
  console.error(JSON.stringify(attemptInfo));
}

export function createManagedWorker({
  queueName,
  processor,
  concurrency = 1,
  maxAttempts = 3,
  removeOnComplete = true,
}: ManagedWorkerOptions) {
  const connection = config.getRedisClient();

  const mainQueue = new Queue(queueName, { connection });
  const dlqQueue = new Queue(`${queueName}-dlq`, { connection });

  const worker = new Worker(queueName, processor, {
    connection,
    concurrency,
    removeOnComplete,
  });

  const events = new QueueEvents(queueName, { connection });

  events.on('failed', async ({ jobId, failedReason }) => {
    const job = await mainQueue.getJob(jobId);
    if (!job) {
      console.error(`[Worker:${queueName}] Job #${jobId} failed: ${failedReason}`);
      return;
    }
    const err = new Error(failedReason);
    await logFailedJob(queueName, job, err);

    if (job.attemptsMade >= maxAttempts) {
      await dlqQueue.add(
        `FAILED_${queueName.toUpperCase()}`,
        {
          originalJobId: job.id,
          jobType: getJobType(job),
          payload: job.data,
          error: failedReason,
          attemptsMade: job.attemptsMade,
          failedAt: new Date().toISOString(),
        },
        {
          jobId: `dlq_${job.id}`,
          removeOnComplete: { age: DLQ_JOB_TTL_SECONDS },
          removeOnFail: { age: DLQ_JOB_TTL_SECONDS },
        },
      );
      console.error(`[Worker:${queueName}] Job #${job.id} moved to DLQ after ${job.attemptsMade} attempts`);
    }
  });

  worker.on('completed', (job: Job) => {
    console.log(`[Worker:${queueName}] Job #${job.id} completed successfully`);
  });

  worker.on('failed', async (job: Job | undefined, err: Error) => {
    if (job) await logFailedJob(queueName, job, err);
  });

  return { worker, mainQueue, dlqQueue, events };
}
