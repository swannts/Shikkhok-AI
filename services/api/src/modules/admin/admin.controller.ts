import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { MongoObjectIdPipe } from '../../common/pipes/mongo-object-id.pipe';
import { UserRole } from '../users/enums/user-role.enum';
import { AdminService } from './admin.service';
import { AdminListUsersQueryDto } from './dto/admin-list-users-query.dto';
import { AdminUpdateUserStatusDto } from './dto/admin-update-user-status.dto';
import { AdminCreateSubjectDto } from './dto/admin-create-subject.dto';
import { AdminCreateChapterDto } from './dto/admin-create-chapter.dto';
import { AdminCreateLessonDto } from './dto/admin-create-lesson.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller({ path: 'admin', version: '1' })
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('metrics/overview')
  @ApiOperation({
    summary: 'Get global system overview, active users, academic completions, and revenue',
  })
  @ApiResponse({ status: 200, description: 'Platform metrics overview returned' })
  async getMetricsOverview() {
    return this.adminService.getMetricsOverview();
  }

  @Get('users')
  @ApiOperation({
    summary: 'Search and paginate all registered users with role and status filtering',
  })
  @ApiResponse({ status: 200, description: 'List of users' })
  async listUsers(@Query() query: AdminListUsersQueryDto) {
    return this.adminService.listUsers(query);
  }

  @Put('users/:userId/status')
  @ApiOperation({ summary: 'Update user account status (active, suspended, deleted)' })
  @ApiResponse({ status: 200, description: 'User status updated successfully' })
  async updateUserStatus(
    @Param('userId', MongoObjectIdPipe) userId: string,
    @Body() dto: AdminUpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(userId, dto);
  }

  @Post('curriculum/subjects')
  @ApiOperation({ summary: 'Create a new curriculum subject' })
  @ApiResponse({ status: 201, description: 'Subject created successfully' })
  async createSubject(@Body() dto: AdminCreateSubjectDto) {
    return this.adminService.createSubject(dto);
  }

  @Post('curriculum/chapters')
  @ApiOperation({ summary: 'Create a new chapter under a subject' })
  @ApiResponse({ status: 201, description: 'Chapter created successfully' })
  async createChapter(@Body() dto: AdminCreateChapterDto) {
    return this.adminService.createChapter(dto);
  }

  @Post('curriculum/lessons')
  @ApiOperation({ summary: 'Create a new lesson under a chapter' })
  @ApiResponse({ status: 201, description: 'Lesson created successfully' })
  async createLesson(@Body() dto: AdminCreateLessonDto) {
    return this.adminService.createLesson(dto);
  }

  @Put('curriculum/lessons/:lessonId/publish')
  @ApiOperation({ summary: 'Toggle lesson publication status' })
  @ApiResponse({ status: 200, description: 'Lesson publication status updated' })
  async toggleLessonPublish(
    @Param('lessonId', MongoObjectIdPipe) lessonId: string,
    @Body('isPublished') isPublished: boolean,
  ) {
    return this.adminService.toggleLessonPublish(lessonId, Boolean(isPublished));
  }
}
