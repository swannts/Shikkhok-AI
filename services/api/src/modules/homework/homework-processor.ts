import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { HomeworkService } from './homework.service';

@Processor('homework')
export class HomeworkProcessor extends WorkerHost {
  private readonly logger = new Logger(HomeworkProcessor.name);

  constructor(private readonly homeworkService: HomeworkService) {
    super();
  }

  async process(job: Job<{ submissionId: string }>): Promise<any> {
    this.logger.log(
      `Processing homework submission job ${job.id} for submission ${job.data.submissionId}`,
    );
    return this.homeworkService.processSubmission(job.data.submissionId);
  }
}
