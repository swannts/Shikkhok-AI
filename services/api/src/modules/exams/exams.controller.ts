import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MongoObjectIdPipe } from '../../common/pipes/mongo-object-id.pipe';
import { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy';
import { ExamsService } from './exams.service';
import { ListExamsQueryDto } from './dto/list-exams-query.dto';
import { SaveExamAnswerDto } from './dto/save-exam-answer.dto';
import { FlagExamQuestionDto } from './dto/flag-exam-question.dto';

@ApiTags('Exams')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'exams', version: '1' })
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Get()
  @ApiOperation({ summary: 'List published exams matching student curriculum criteria' })
  async listExams(@CurrentUser() user: AuthenticatedUser, @Query() query: ListExamsQueryDto) {
    return this.examsService.listExams(user, query);
  }

  @Get(':examId')
  @ApiOperation({ summary: 'Get exam metadata details by ID' })
  async getExam(
    @CurrentUser() user: AuthenticatedUser,
    @Param('examId', MongoObjectIdPipe) examId: string,
  ) {
    return this.examsService.getExam(user, examId);
  }

  @Post(':examId/start')
  @ApiOperation({ summary: 'Start a timed exam session with sanitized questions' })
  @ApiResponse({
    status: 201,
    description: 'Exam session created or existing active session returned',
  })
  async startSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('examId', MongoObjectIdPipe) examId: string,
  ) {
    return this.examsService.startSession(user, examId);
  }

  @Get('sessions/:sessionId')
  @ApiOperation({ summary: 'Get active or expired exam session state with sanitized questions' })
  async getSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sessionId', MongoObjectIdPipe) sessionId: string,
  ) {
    return this.examsService.getSession(user, sessionId);
  }

  @Put('sessions/:sessionId/answers/:questionId')
  @ApiOperation({
    summary: 'Save or update student answer for a question in an active exam session',
  })
  async saveAnswer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sessionId', MongoObjectIdPipe) sessionId: string,
    @Param('questionId', MongoObjectIdPipe) questionId: string,
    @Body() dto: SaveExamAnswerDto,
  ) {
    return this.examsService.saveAnswer(user, sessionId, questionId, dto);
  }

  @Post('sessions/:sessionId/flag/:questionId')
  @ApiOperation({ summary: 'Toggle flagged status for review on an exam question' })
  async flagQuestion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sessionId', MongoObjectIdPipe) sessionId: string,
    @Param('questionId', MongoObjectIdPipe) questionId: string,
    @Body() dto: FlagExamQuestionDto,
  ) {
    return this.examsService.flagQuestion(user, sessionId, questionId, dto);
  }

  @Post('sessions/:sessionId/submit')
  @ApiOperation({ summary: 'Submit an exam session, grade answers, and calculate final score' })
  async submitSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sessionId', MongoObjectIdPipe) sessionId: string,
  ) {
    return this.examsService.submitSession(user, sessionId);
  }

  @Get('sessions/:sessionId/result')
  @ApiOperation({ summary: 'Get summary score and pass/fail result for a submitted exam session' })
  async getSessionResult(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sessionId', MongoObjectIdPipe) sessionId: string,
  ) {
    return this.examsService.getSessionResult(user, sessionId);
  }

  @Get('sessions/:sessionId/review')
  @ApiOperation({
    summary: 'Get full question-by-question review with correct answer keys after submission',
  })
  async getSessionReview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sessionId', MongoObjectIdPipe) sessionId: string,
  ) {
    return this.examsService.getSessionReview(user, sessionId);
  }
}
