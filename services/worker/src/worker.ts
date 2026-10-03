import { Job } from 'bullmq';
import { config } from './config';
import { processNotificationJob } from './processors/notification.processor';
import { processCurriculumJob } from './processors/curriculum.processor';
import { processAnalyticsJob } from './processors/analytics.processor';
import { processHomeworkJob } from './processors/homework.processor';
import { startHealthServer } from './health-server';
import { createManagedWorker } from './utils/worker-factory';

const JOB_ATTEMPTS = 3;
const JOB_REMOVE_ON_COMPLETE = { age: 3600, count: 1000 };

export function startWorker() {
  console.log('⚡ Starting Shikkhok Background Worker (BullMQ + Redis)...');

  const notificationManaged = createManagedWorker({
    queueName: 'notifications',
    processor: async (job: Job) => processNotificationJob(job),
    concurrency: config.workerConcurrency,
    maxAttempts: JOB_ATTEMPTS,
    removeOnComplete: JOB_REMOVE_ON_COMPLETE,
  });

  const curriculumManaged = createManagedWorker({
    queueName: 'curriculum',
    processor: async (job: Job) => processCurriculumJob(job),
    // Bengali OCR is CPU/memory intensive. Process one textbook at a time so
    // the AI service does not drop concurrent multipart requests.
    concurrency: 1,
    maxAttempts: JOB_ATTEMPTS,
    removeOnComplete: JOB_REMOVE_ON_COMPLETE,
  });

  const analyticsManaged = createManagedWorker({
    queueName: 'analytics',
    processor: async (job: Job) => processAnalyticsJob(job),
    concurrency: config.workerConcurrency,
    maxAttempts: JOB_ATTEMPTS,
    removeOnComplete: JOB_REMOVE_ON_COMPLETE,
  });

  const homeworkManaged = createManagedWorker({
    queueName: 'homework',
    processor: async (job: Job) => processHomeworkJob(job),
    concurrency: config.workerConcurrency,
    maxAttempts: JOB_ATTEMPTS,
    removeOnComplete: JOB_REMOVE_ON_COMPLETE,
  });

  const managedNodes = [notificationManaged, curriculumManaged, analyticsManaged, homeworkManaged];
  const workers = managedNodes.map(m => m.worker);
  const queues = managedNodes.flatMap(m => [m.mainQueue, m.dlqQueue]);

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
    await Promise.all(queues.map((q) => q.close()));
    console.log('✅ All workers stopped cleanly.');
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  return { workers, queues, healthServer };
}
