import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RabbitMqService } from '../../core/queue/rabbitmq.service';
import { HomeworkService } from './homework.service';

@Injectable()
export class HomeworkProcessor implements OnModuleInit {
  private readonly logger = new Logger(HomeworkProcessor.name);

  constructor(private readonly queue: RabbitMqService, private readonly homework: HomeworkService) {}

  async onModuleInit(): Promise<void> {
    await this.queue.consume('homework', async (job) => {
      const payload = job.data as { submissionId?: string };
      if (!payload?.submissionId) throw new Error('Missing homework submissionId');
      this.logger.log(`Processing homework submission job ${job.id}`);
      await this.homework.processSubmission(payload.submissionId);
    }, 2);
  }
}
