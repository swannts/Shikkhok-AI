import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MongoObjectIdPipe } from '../../common/pipes/mongo-object-id.pipe';
import { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy';
import { ClassroomsService } from './classrooms.service';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { JoinClassroomDto } from './dto/join-classroom.dto';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';
import { GradeAssignmentDto } from './dto/grade-assignment.dto';

@ApiTags('Classrooms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'classrooms', version: '1' })
export class ClassroomsController {
  constructor(private readonly classroomsService: ClassroomsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new teacher classroom with auto-generated 6-character join code',
  })
  @ApiResponse({ status: 201, description: 'Classroom created successfully' })
  async createClassroom(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateClassroomDto) {
    return this.classroomsService.createClassroom(user, dto);
  }

  @Get('me/teaching')
  @ApiOperation({ summary: 'List all classrooms taught by the current teacher' })
  @ApiResponse({ status: 200, description: 'List of teaching classrooms' })
  async listTeaching(@CurrentUser() user: AuthenticatedUser) {
    return this.classroomsService.listTeaching(user);
  }

  @Get('me/enrolled')
  @ApiOperation({ summary: 'List all classrooms the student has joined' })
  @ApiResponse({ status: 200, description: 'List of enrolled classrooms' })
  async listEnrolled(@CurrentUser() user: AuthenticatedUser) {
    return this.classroomsService.listEnrolled(user);
  }

  @Post('join')
  @ApiOperation({ summary: 'Join a classroom using a 6-character code' })
  @ApiResponse({ status: 200, description: 'Joined classroom successfully' })
  async joinClassroom(@CurrentUser() user: AuthenticatedUser, @Body() dto: JoinClassroomDto) {
    return this.classroomsService.joinClassroom(user, dto);
  }

  @Get(':classroomId')
  @ApiOperation({ summary: 'Get classroom details, member count, and assignments' })
  @ApiResponse({ status: 200, description: 'Classroom overview returned' })
  async getClassroom(
    @CurrentUser() user: AuthenticatedUser,
    @Param('classroomId', MongoObjectIdPipe) classroomId: string,
  ) {
    return this.classroomsService.getClassroom(user, classroomId);
  }

  @Post(':classroomId/assignments')
  @ApiOperation({ summary: 'Create a new classroom homework or practice assignment' })
  @ApiResponse({ status: 201, description: 'Assignment created successfully' })
  async createAssignment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('classroomId', MongoObjectIdPipe) classroomId: string,
    @Body() dto: CreateAssignmentDto,
  ) {
    return this.classroomsService.createAssignment(user, classroomId, dto);
  }

  @Get(':classroomId/assignments')
  @ApiOperation({ summary: 'List all published assignments for the classroom' })
  @ApiResponse({ status: 200, description: 'List of assignments' })
  async listAssignments(
    @CurrentUser() user: AuthenticatedUser,
    @Param('classroomId', MongoObjectIdPipe) classroomId: string,
  ) {
    return this.classroomsService.listAssignments(user, classroomId);
  }

  @Post(':classroomId/assignments/:assignmentId/submit')
  @ApiOperation({ summary: 'Submit student work for a classroom assignment' })
  @ApiResponse({ status: 200, description: 'Assignment submitted successfully' })
  async submitAssignment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('classroomId', MongoObjectIdPipe) classroomId: string,
    @Param('assignmentId', MongoObjectIdPipe) assignmentId: string,
    @Body() dto: SubmitAssignmentDto,
  ) {
    return this.classroomsService.submitAssignment(user, classroomId, assignmentId, dto);
  }

  @Get(':classroomId/assignments/:assignmentId/submissions')
  @ApiOperation({ summary: 'List all student submissions for an assignment (teacher only)' })
  @ApiResponse({ status: 200, description: 'List of student submissions' })
  async listSubmissions(
    @CurrentUser() user: AuthenticatedUser,
    @Param('classroomId', MongoObjectIdPipe) classroomId: string,
    @Param('assignmentId', MongoObjectIdPipe) assignmentId: string,
  ) {
    return this.classroomsService.listSubmissions(user, classroomId, assignmentId);
  }

  @Put(':classroomId/assignments/:assignmentId/submissions/:submissionId/grade')
  @ApiOperation({ summary: 'Grade a student submission with score and teacher feedback' })
  @ApiResponse({ status: 200, description: 'Submission graded successfully' })
  async gradeSubmission(
    @CurrentUser() user: AuthenticatedUser,
    @Param('classroomId', MongoObjectIdPipe) classroomId: string,
    @Param('assignmentId', MongoObjectIdPipe) assignmentId: string,
    @Param('submissionId', MongoObjectIdPipe) submissionId: string,
    @Body() dto: GradeAssignmentDto,
  ) {
    return this.classroomsService.gradeSubmission(
      user,
      classroomId,
      assignmentId,
      submissionId,
      dto,
    );
  }
}
