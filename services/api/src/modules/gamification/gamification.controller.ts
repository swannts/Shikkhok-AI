import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy';
import { GamificationService } from './gamification.service';
import { RecordActivityDto } from './dto/record-activity.dto';
import { LeaderboardQueryDto } from './dto/leaderboard-query.dto';
import { UserRole } from '../users/enums/user-role.enum';

@ApiTags('Gamification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'gamification', version: '1' })
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('me/summary')
  @Roles(UserRole.STUDENT)
  @ApiOperation({
    summary: 'Get current student streak, points, tier badge, and recent achievements',
  })
  @ApiResponse({ status: 200, description: 'Student gamification overview' })
  async getMySummary(@CurrentUser() user: AuthenticatedUser) {
    return this.gamificationService.getMySummary(user);
  }

  @Get('me/achievements')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'List all published achievements with student unlocked status' })
  @ApiResponse({ status: 200, description: 'List of badges and unlock progress' })
  async getMyAchievements(@CurrentUser() user: AuthenticatedUser) {
    return this.gamificationService.getMyAchievements(user);
  }

  @Post('me/streak/record')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Record daily study activity and update streak state machine' })
  @ApiResponse({ status: 200, description: 'Updated streak count, freeze days, and bonus points' })
  async recordActivity(@CurrentUser() user: AuthenticatedUser, @Body() dto: RecordActivityDto) {
    return this.gamificationService.recordActivity(user, dto);
  }

  @Get('leaderboard')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get student leaderboard ranked by total learning points' })
  @ApiResponse({ status: 200, description: 'Ranked learner leaderboard' })
  async getLeaderboard(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: LeaderboardQueryDto,
  ) {
    return this.gamificationService.getLeaderboard(user, query);
  }
}
