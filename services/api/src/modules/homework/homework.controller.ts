import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MongoObjectIdPipe } from '../../common/pipes/mongo-object-id.pipe';
import { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy';
import { HomeworkService } from './homework.service';
import { CreateHomeworkSubmissionDto } from './dto/create-homework-submission.dto';
import { RateHomeworkFeedbackDto } from './dto/rate-homework-feedback.dto';
import { ListHomeworkQueryDto } from './dto/list-homework-query.dto';

@ApiTags('Homework')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'homework', version: '1' })
export class HomeworkController {
  constructor(private readonly homeworkService: HomeworkService) {}

  @Post('submissions')
  @ApiOperation({ summary: 'Submit homework image(s) for AI evaluation and feedback' })
  @ApiResponse({
    status: 201,
    description: 'Homework submission created and queued for processing',
  })
  async createSubmission(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateHomeworkSubmissionDto,
  ) {
    return this.homeworkService.createSubmission(user, dto);
  }

  @Get('me/submissions')
  @ApiOperation({ summary: 'List my homework submissions with pagination' })
  async getMySubmissions(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListHomeworkQueryDto,
  ) {
    return this.homeworkService.getMySubmissions(user, query);
  }

  @Get('submissions/:submissionId')
  @ApiOperation({ summary: 'Get homework submission status and details by ID' })
  async getSubmission(
    @CurrentUser() user: AuthenticatedUser,
    @Param('submissionId', MongoObjectIdPipe) submissionId: string,
  ) {
    return this.homeworkService.getSubmission(user, submissionId);
  }

  @Get('submissions/:submissionId/feedback')
  @ApiOperation({
    summary: 'Get AI feedback, corrections, and citations for a homework submission',
  })
  async getFeedback(
    @CurrentUser() user: AuthenticatedUser,
    @Param('submissionId', MongoObjectIdPipe) submissionId: string,
  ) {
    return this.homeworkService.getFeedback(user, submissionId);
  }

  @Post('submissions/:submissionId/feedback/rate')
  @ApiOperation({ summary: 'Rate homework AI feedback from 1 to 5' })
  async rateFeedback(
    @CurrentUser() user: AuthenticatedUser,
    @Param('submissionId', MongoObjectIdPipe) submissionId: string,
    @Body() dto: RateHomeworkFeedbackDto,
  ) {
    return this.homeworkService.rateFeedback(user, submissionId, dto);
  }

  @Post('submissions/:submissionId/retry')
  @ApiOperation({ summary: 'Retry processing a failed homework submission' })
  async retrySubmission(
    @CurrentUser() user: AuthenticatedUser,
    @Param('submissionId', MongoObjectIdPipe) submissionId: string,
  ) {
    return this.homeworkService.retrySubmission(user, submissionId);
  }
}
