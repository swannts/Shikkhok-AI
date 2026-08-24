import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MongoObjectIdPipe } from '../../common/pipes/mongo-object-id.pipe';
import { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy';
import { ProgressService } from './progress.service';
import { UpsertLessonProgressDto } from './dto/upsert-lesson-progress.dto';

@ApiTags('Progress')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'progress', version: '1' })
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get('me/summary')
  @ApiOperation({ summary: 'Get authenticated learning progress summary' })
  @ApiResponse({ status: 200, description: 'Learning summary returned' })
  async getMySummary(@CurrentUser() user: AuthenticatedUser) {
    return this.progressService.getMySummary(user);
  }

  @Get('me/subjects/:subjectId')
  @ApiOperation({ summary: 'Get authenticated subject progress summary' })
  @ApiResponse({ status: 200, description: 'Subject progress returned' })
  async getMySubjectProgress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('subjectId', MongoObjectIdPipe) subjectId: string,
  ) {
    return this.progressService.getMySubjectProgress(user, subjectId);
  }

  @Get('me/lessons/:lessonId')
  @ApiOperation({ summary: 'Get authenticated lesson progress' })
  @ApiResponse({ status: 200, description: 'Lesson progress returned' })
  async getMyLessonProgress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('lessonId', MongoObjectIdPipe) lessonId: string,
  ) {
    return this.progressService.getMyLessonProgress(user, lessonId);
  }

  @Put('me/lessons/:lessonId')
  @ApiOperation({ summary: 'Create or update authenticated lesson progress' })
  @ApiResponse({ status: 200, description: 'Lesson progress saved successfully' })
  async upsertMyLessonProgress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('lessonId', MongoObjectIdPipe) lessonId: string,
    @Body() dto: UpsertLessonProgressDto,
  ) {
    return this.progressService.upsertMyLessonProgress(user, lessonId, dto);
  }
}
