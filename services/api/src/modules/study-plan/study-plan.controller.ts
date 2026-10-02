import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy';
import { StudyPlanService } from './study-plan.service';
import { UpsertStudyPlanDto } from './dto/upsert-study-plan.dto';
import { UserRole } from '../users/enums/user-role.enum';

@ApiTags('Study Plan')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'study-plan', version: '1' })
export class StudyPlanController {
  constructor(private readonly studyPlanService: StudyPlanService) {}

  @Get('me/current')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get the authenticated student study plan' })
  @ApiResponse({ status: 200, description: 'Study plan returned' })
  async getMyCurrentPlan(@CurrentUser() user: AuthenticatedUser) {
    return this.studyPlanService.getMyCurrentPlan(user);
  }

  @Get('me/history')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get study plan history' })
  @ApiResponse({ status: 200, description: 'Study plan history returned' })
  async getMyHistory(@CurrentUser() user: AuthenticatedUser) {
    return this.studyPlanService.getMyHistory(user);
  }

  @Put('me/current')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Create or update the current study plan' })
  @ApiResponse({ status: 200, description: 'Study plan saved successfully' })
  async upsertMyCurrentPlan(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpsertStudyPlanDto,
  ) {
    return this.studyPlanService.upsertMyCurrentPlan(user, dto);
  }

  @Post('me/generate')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Generate a recommended study plan from progress' })
  @ApiResponse({ status: 200, description: 'Recommended study plan generated' })
  async generateRecommendedPlan(@CurrentUser() user: AuthenticatedUser) {
    return this.studyPlanService.generateRecommendedPlan(user);
  }
}
