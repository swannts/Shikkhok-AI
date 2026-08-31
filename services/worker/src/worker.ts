import { Worker, Job } from 'bullmq';
import { config } from './config';
import { processNotificationJob } from './processors/notification.processor';
import { processCurriculumJob } from './processors/curriculum.processor';
import { processAnalyticsJob } from './processors/analytics.processor';

export function startWorker() {
  console.log('⚡ Starting Shikkhok Background Worker (BullMQ + Redis)...');

  const redisUrl = new URL(config.redisUrl);
  const connection = {
    host: redisUrl.hostname || 'localhost',
    port: parseInt(redisUrl.port || '6379', 10),
    password: redisUrl.password || undefined,
    maxRetriesPerRequest: null,
  };

  // 1. Notifications Worker
  const notificationWorker = new Worker(
    'notifications',
    async (job: Job) => {
      return processNotificationJob(job);
    },
    {
      connection,
      concurrency: config.workerConcurrency,
    },
  );

  notificationWorker.on('completed', (job: Job) => {
    console.log(`[Worker:Notifications] Job #${job.id} completed successfully`);
  });

  notificationWorker.on('failed', (job: Job | undefined, err: Error) => {
    console.error(`[Worker:Notifications] Job #${job?.id || 'unknown'} failed: ${err.message}`);
  });

  // 2. Curriculum Ingestion Worker
  const curriculumWorker = new Worker(
    'curriculum',
    async (job: Job) => {
      return processCurriculumJob(job);
    },
    {
      connection,
      concurrency: 2, // limit concurrent heavy embedding requests
    },
  );

  curriculumWorker.on('completed', (job: Job) => {
    console.log(`[Worker:Curriculum] Job #${job.id} indexed into AI Service`);
  });

  curriculumWorker.on('failed', (job: Job | undefined, err: Error) => {
    console.error(`[Worker:Curriculum] Job #${job?.id || 'unknown'} failed: ${err.message}`);
  });

  // 3. Analytics Worker
  const analyticsWorker = new Worker(
    'analytics',
    async (job: Job) => {
      return processAnalyticsJob(job);
    },
    {
      connection,
      concurrency: config.workerConcurrency,
    },
  );

  analyticsWorker.on('completed', (job: Job) => {
    console.log(`[Worker:Analytics] Job #${job.id} aggregated`);
  });

  // 4. Homework Queue Worker
  const homeworkWorker = new Worker(
    'homework',
    async (job: Job) => {
      console.log(`[Worker:Homework] Processing homework submission evaluation for job #${job.id}`);
      return { status: 'EVALUATED', processedAt: new Date().toISOString() };
    },
    {
      connection,
      concurrency: config.workerConcurrency,
    },
  );

  const workers = [notificationWorker, curriculumWorker, analyticsWorker, homeworkWorker];

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}, gracefully shutting down background workers...`);
    await Promise.all(workers.map((w) => w.close()));
    console.log('✅ All workers stopped cleanly.');
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  return { workers };
}
