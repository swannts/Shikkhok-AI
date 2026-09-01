import { Worker, Job, Queue, QueueEvents, BackoffStrategy } from 'bullmq';
import { config } from './config';
import { processNotificationJob } from './processors/notification.processor';
import { processCurriculumJob } from './processors/curriculum.processor';
import { processAnalyticsJob } from './processors/analytics.processor';
import { processHomeworkJob } from './processors/homework.processor';
import { startHealthServer } from './health-server';

export interface JobAttemptInfo {
  jobId: string;
  jobType: string;
  attempt: number;
  errorCategory: 'retryable' | 'permanent' | 'unknown';
  errorMessage: string;
  failedAt: string;
}

const JOB_ATTEMPTS = 3;
const JOB_BACKOFF_DELAY = 2000;
const JOB_REMOVE_ON_COMPLETE = true;
const DLQ_JOB_TTL_SECONDS = 604800;

function createConnection() {
  const redisUrl = new URL(config.redisUrl);
  return {
    host: redisUrl.hostname || 'localhost',
    port: parseInt(redisUrl.port || '6379', 10),
    password: redisUrl.password || undefined,
    maxRetriesPerRequest: null,
  };
}

function classifyJobError(err: Error): 'retryable' | 'permanent' {
  const category = (err as any).category;
  if (category === 'retryable') return 'retryable';
  if (category === 'permanent') return 'permanent';

  const msg = err.message.toLowerCase();
  if (
    msg.includes('timeout') ||
    msg.includes('429') ||
    msg.includes('network') ||
    msg.includes('connect')
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
  const attemptInfo: JobAttemptInfo = {
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

export function startWorker() {
  console.log('⚡ Starting Shikkhok Background Worker (BullMQ + Redis)...');

  const connection = createConnection();

  // Dead-letter queues for failed jobs
  const notificationDLQ = new Queue('notifications:dlq', { connection });
  const homeworkDLQ = new Queue('homework:dlq', { connection });
  const curriculumDLQ = new Queue('curriculum:dlq', { connection });
  const analyticsDLQ = new Queue('analytics:dlq', { connection });

  // 1. Notifications Worker
  const notificationWorker = new Worker(
    'notifications',
    async (job: Job) => processNotificationJob(job),
    {
      connection,
      concurrency: config.workerConcurrency,
      settings: {
        removeOnComplete: JOB_REMOVE_ON_COMPLETE,
      },
    },
  );

  const notificationEvents = new QueueEvents('notifications', { connection });
  notificationEvents.on('failed', async ({ jobId, failedReason }) => {
    const job = await notificationWorker.getJob(jobId);
    if (!job) {
      console.error(`[Worker:Notifications] Job #${jobId} failed: ${failedReason}`);
      return;
    }
    const err = new Error(failedReason);
    await logFailedJob('Notifications', job, err);

    if (job.attemptsMade >= JOB_ATTEMPTS) {
      await notificationDLQ.add(
        'FAILED_NOTIFICATION',
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
          removeOnComplete: false,
          removeOnFail: false,
          ttl: DLQ_JOB_TTL_SECONDS,
        },
      );
      console.error(`[Worker:Notifications] Job #${job.id} moved to DLQ after ${job.attemptsMade} attempts`);
    }
  });

  notificationWorker.on('completed', (job: Job) => {
    console.log(`[Worker:Notifications] Job #${job.id} completed successfully`);
  });
  notificationWorker.on('failed', async (job: Job | undefined, err: Error) => {
    if (job) await logFailedJob('Notifications', job, err);
  });

  // 2. Curriculum Ingestion Worker
  const curriculumWorker = new Worker(
    'curriculum',
    async (job: Job) => processCurriculumJob(job),
    {
      connection,
      concurrency: 2,
      settings: {
        removeOnComplete: JOB_REMOVE_ON_COMPLETE,
      },
    },
  );

  const curriculumEvents = new QueueEvents('curriculum', { connection });
  curriculumEvents.on('failed', async ({ jobId, failedReason }) => {
    const job = await curriculumWorker.getJob(jobId);
    if (!job) {
      console.error(`[Worker:Curriculum] Job #${jobId} failed: ${failedReason}`);
      return;
    }
    const err = new Error(failedReason);
    await logFailedJob('Curriculum', job, err);

    if (job.attemptsMade >= JOB_ATTEMPTS) {
      await curriculumDLQ.add(
        'FAILED_CURRICULUM',
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
          removeOnComplete: false,
          removeOnFail: false,
          ttl: DLQ_JOB_TTL_SECONDS,
        },
      );
      console.error(`[Worker:Curriculum] Job #${job.id} moved to DLQ after ${job.attemptsMade} attempts`);
    }
  });

  curriculumWorker.on('completed', (job: Job) => {
    console.log(`[Worker:Curriculum] Job #${job.id} indexed into AI Service`);
  });
  curriculumWorker.on('failed', async (job: Job | undefined, err: Error) => {
    if (job) await logFailedJob('Curriculum', job, err);
  });

  // 3. Analytics Worker
  const analyticsWorker = new Worker(
    'analytics',
    async (job: Job) => processAnalyticsJob(job),
    {
      connection,
      concurrency: config.workerConcurrency,
      settings: {
        removeOnComplete: JOB_REMOVE_ON_COMPLETE,
      },
    },
  );

  const analyticsEvents = new QueueEvents('analytics', { connection });
  analyticsEvents.on('failed', async ({ jobId, failedReason }) => {
    const job = await analyticsWorker.getJob(jobId);
    if (!job) {
      console.error(`[Worker:Analytics] Job #${jobId} failed: ${failedReason}`);
      return;
    }
    const err = new Error(failedReason);
    await logFailedJob('Analytics', job, err);

    if (job.attemptsMade >= JOB_ATTEMPTS) {
      await analyticsDLQ.add(
        'FAILED_ANALYTICS',
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
          removeOnComplete: false,
          removeOnFail: false,
          ttl: DLQ_JOB_TTL_SECONDS,
        },
      );
      console.error(`[Worker:Analytics] Job #${job.id} moved to DLQ after ${job.attemptsMade} attempts`);
    }
  });

  analyticsWorker.on('completed', (job: Job) => {
    console.log(`[Worker:Analytics] Job #${job.id} aggregated`);
  });
  analyticsWorker.on('failed', async (job: Job | undefined, err: Error) => {
    if (job) await logFailedJob('Analytics', job, err);
  });

  // 4. Homework Evaluation Worker (REAL processor — not a stub)
  const homeworkWorker = new Worker(
    'homework',
    async (job: Job) => processHomeworkJob(job),
    {
      connection,
      concurrency: config.workerConcurrency,
      settings: {
        removeOnComplete: JOB_REMOVE_ON_COMPLETE,
      },
    },
  );

  const homeworkEvents = new QueueEvents('homework', { connection });
  homeworkEvents.on('failed', async ({ jobId, failedReason }) => {
    const job = await homeworkWorker.getJob(jobId);
    if (!job) {
      console.error(`[Worker:Homework] Job #${jobId} failed: ${failedReason}`);
      return;
    }
    const err = new Error(failedReason);
    await logFailedJob('Homework', job, err);

    if (job.attemptsMade >= JOB_ATTEMPTS) {
      await homeworkDLQ.add(
        'FAILED_HOMEWORK',
        {
          originalJobId: job.id,
          jobType: 'HOMEWORK_EVALUATION',
          payload: job.data,
          error: failedReason,
          attemptsMade: job.attemptsMade,
          failedAt: new Date().toISOString(),
        },
        {
          jobId: `dlq_${job.id}`,
          removeOnComplete: false,
          removeOnFail: false,
          ttl: DLQ_JOB_TTL_SECONDS,
        },
      );
      console.error(`[Worker:Homework] Job #${job.id} moved to DLQ after ${job.attemptsMade} attempts`);
    }
  });

  homeworkWorker.on('completed', (job: Job) => {
    console.log(`[Worker:Homework] Job #${job.id} homework evaluation completed`);
  });
  homeworkWorker.on('failed', async (job: Job | undefined, err: Error) => {
    const category = classifyJobError(err);
    console.error(
      `[Worker:Homework] Job #${job?.id || 'unknown'} failed (category: ${category}): ${err.message}`,
    );
    if (job) await logFailedJob('Homework', job, err);
  });

  const workers = [notificationWorker, curriculumWorker, analyticsWorker, homeworkWorker];

  // Health check server for Kubernetes probes
  let healthServer: any = null;
  if (config.nodeEnv !== 'test') {
    let redisReady = false;
    const redisClient = config.getRedisClient();
    redisClient.on('ready', () => {
      redisReady = true;
    });
    redisClient.on('end', () => {
      redisReady = false;
    });
    redisClient.on('error', () => {
      redisReady = false;
    });

    healthServer = startHealthServer(config.healthPort, async () => {
      try {
        await redisClient.ping();
        redisReady = true;
      } catch {
        redisReady = false;
      }
      return redisReady;
    });
    console.log(`[Worker] Health server started on port ${config.healthPort}`);
  }

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}, gracefully shutting down background workers...`);
    if (healthServer) {
      healthServer.close();
    }
    await Promise.all(workers.map((w) => w.close()));
    console.log('✅ All workers stopped cleanly.');
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  return { workers, healthServer };
}
