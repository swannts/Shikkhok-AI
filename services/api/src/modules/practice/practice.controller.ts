import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MongoObjectIdPipe } from '../../common/pipes/mongo-object-id.pipe';
import { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy';
import { PracticeService } from './practice.service';
import { SubmitPracticeAttemptDto } from './dto/submit-practice-attempt.dto';
import { PracticeDifficulty } from './enums/practice-difficulty.enum';

@ApiTags('Practice')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('practice')
export class PracticeController {
  constructor(private readonly practiceService: PracticeService) {}

  @Get('lessons/:lessonId/questions')
  @ApiOperation({ summary: 'List published practice questions for a lesson' })
  @ApiResponse({ status: 200, description: 'Practice questions returned' })
  async listQuestions(
    @CurrentUser() user: AuthenticatedUser,
    @Param('lessonId', MongoObjectIdPipe) lessonId: string,
    @Query('limit') limit?: string,
    @Query('difficulty') difficulty?: PracticeDifficulty,
  ) {
    return this.practiceService.listQuestions(
      user,
      lessonId,
      limit ? Number(limit) : 10,
      difficulty,
    );
  }

  @Post('submit')
  @ApiOperation({ summary: 'Submit a practice answer for server-side evaluation' })
  @ApiResponse({ status: 200, description: 'Practice attempt evaluated successfully' })
  async submitAttempt(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubmitPracticeAttemptDto,
  ) {
    return this.practiceService.submitAttempt(user, dto);
  }

  @Get('me/attempts')
  @ApiOperation({ summary: 'Get recent authenticated practice attempts' })
  @ApiResponse({ status: 200, description: 'Recent attempts returned' })
  async getMyRecentAttempts(@CurrentUser() user: AuthenticatedUser) {
    return this.practiceService.getMyRecentAttempts(user);
  }
}
