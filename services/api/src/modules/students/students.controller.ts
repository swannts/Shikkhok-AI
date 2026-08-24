import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MongoObjectIdPipe } from '../../common/pipes/mongo-object-id.pipe';
import { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy';
import { UserRole } from '../users/enums/user-role.enum';
import { StudentsService } from './students.service';
import { UpsertStudentProfileDto } from './dto/upsert-student-profile.dto';

@ApiTags('Students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the authenticated student profile' })
  @ApiResponse({ status: 200, description: 'Student profile returned' })
  @ApiResponse({ status: 404, description: 'Student profile not found' })
  async getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.studentsService.getMyProfile(user.userId);
  }

  @Put('me')
  @ApiOperation({ summary: 'Create or update the authenticated student profile' })
  @ApiResponse({ status: 200, description: 'Student profile saved successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or invalid student account' })
  async upsertMyProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpsertStudentProfileDto,
  ) {
    return this.studentsService.upsertMyProfile(user, dto);
  }

  @Get(':userId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get a student profile by user ID' })
  @ApiResponse({ status: 200, description: 'Student profile returned' })
  @ApiResponse({ status: 404, description: 'Student profile not found' })
  async getProfileByUserId(@Param('userId', MongoObjectIdPipe) userId: string) {
    return this.studentsService.getProfileByUserId(userId);
  }
}
