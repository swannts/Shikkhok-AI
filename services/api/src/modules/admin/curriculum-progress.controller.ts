import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { InternalAuthGuard } from '../../common/guards/internal-auth.guard';
import { MongoObjectIdPipe } from '../../common/pipes/mongo-object-id.pipe';
import { AdminService } from './admin.service';

interface CurriculumProgressDto {
  status: 'processing' | 'indexed' | 'failed' | 'partially_failed';
  indexedChunkCount?: number;
  failedChunkCount?: number;
  error?: string;
}

@Controller({ path: 'internal/curriculum', version: '1' })
@UseGuards(InternalAuthGuard)
export class CurriculumProgressController {
  constructor(private readonly adminService: AdminService) {}

  @Post(':bookId/progress')
  async updateProgress(
    @Param('bookId', MongoObjectIdPipe) bookId: string,
    @Body() progress: CurriculumProgressDto,
  ): Promise<{ ok: true }> {
    await this.adminService.updateCurriculumIndexingProgress(bookId, progress);
    return { ok: true };
  }
}
