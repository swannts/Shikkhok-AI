import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy';
import { MongoObjectIdPipe } from '../../common/pipes/mongo-object-id.pipe';
import { UserRole } from '../users/enums/user-role.enum';
import { AdminService } from './admin.service';
import { AdminAuditService } from './admin-audit.service';
import { AiGatewayService } from '../ai-gateway/services/ai-gateway.service';
import { AdminListUsersQueryDto } from './dto/admin-list-users-query.dto';
import { AdminUpdateUserStatusDto } from './dto/admin-update-user-status.dto';
import { AdminCreateSubjectDto } from './dto/admin-create-subject.dto';
import { AdminCreateChapterDto } from './dto/admin-create-chapter.dto';
import { AdminCreateLessonDto } from './dto/admin-create-lesson.dto';
import { ContentWorkflowStatus } from '../curriculum/enums/content-workflow-status.enum';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller({ path: 'admin', version: '1' })
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly auditService: AdminAuditService,
    private readonly aiGatewayService: AiGatewayService,
  ) {}

  @Get('ai/health')
  @ApiOperation({ summary: 'Check real-time health and reachability of dedicated FastAPI AI service' })
  @ApiResponse({ status: 200, description: 'AI service health status' })
  async getAiHealth() {
    const isEnabled = this.aiGatewayService.isServiceEnabled();
    const isHealthy = await this.aiGatewayService.healthCheck();
    return {
      enabled: isEnabled,
      healthy: isHealthy,
      status: isHealthy ? 'healthy' : isEnabled ? 'unhealthy' : 'disabled',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ai/stats')
  @ApiOperation({ summary: 'Get vector store and curriculum ingestion statistics' })
  @ApiResponse({ status: 200, description: 'Vector store ingestion statistics' })
  async getAiStats() {
    return this.aiGatewayService.getIngestionStats();
  }

  @Post('ai/ingest')
  @ApiOperation({ summary: 'Ingest raw textbook content directly into AI vector store' })
  @ApiResponse({ status: 201, description: 'Content successfully ingested' })
  async ingestTextbook(
    @CurrentUser() adminUser: AuthenticatedUser,
    @Body() payload: Record<string, any>,
    @Req() req?: Request,
  ) {
    const result = await this.aiGatewayService.ingestTextbookChunk(payload);
    await this.auditService.recordAudit({
      actorUserId: adminUser.userId,
      action: 'INGEST_CURRICULUM_CHUNK',
      resourceType: 'VECTOR_STORE',
      resourceId: payload.book_id || 'unknown_book',
      metadata: { bookId: payload.book_id, pageStart: payload.page_start },
      ipAddress: req?.ip,
      userAgent: req?.headers['user-agent'] as string | undefined,
    });
    return result;
  }

  @Delete('ai/books/:bookId')
  @ApiOperation({ summary: 'Delete a textbook collection index from the AI vector store' })
  @ApiResponse({ status: 200, description: 'Book index deleted' })
  async deleteBookIndex(
    @CurrentUser() adminUser: AuthenticatedUser,
    @Param('bookId') bookId: string,
    @Req() req?: Request,
  ) {
    const result = await this.aiGatewayService.deleteBookIndex(bookId);
    await this.auditService.recordAudit({
      actorUserId: adminUser.userId,
      action: 'DELETE_CURRICULUM_BOOK_INDEX',
      resourceType: 'VECTOR_STORE',
      resourceId: bookId,
      metadata: { bookId },
      ipAddress: req?.ip,
      userAgent: req?.headers['user-agent'] as string | undefined,
    });
    return result;
  }

  @Post('ai/retrieval-test')
  @ApiOperation({ summary: 'Run a scoped retrieval test against the active curriculum index' })
  async testAiRetrieval(
    @CurrentUser() adminUser: AuthenticatedUser,
    @Body() payload: Record<string, any>,
    @Req() req?: Request,
  ) {
    const result = await this.aiGatewayService.testRetrieval(payload);
    await this.auditService.recordAudit({
      actorUserId: adminUser.userId,
      action: 'TEST_CURRICULUM_RETRIEVAL',
      resourceType: 'VECTOR_STORE',
      resourceId: payload.lesson_id || payload.book_id || 'scoped-search',
      metadata: { query: payload.query, topK: payload.top_k },
      ipAddress: req?.ip,
      userAgent: req?.headers['user-agent'] as string | undefined,
    });
    return result;
  }

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
  @ApiOperation({
    summary: 'Update user account status (active, suspended, deleted) - Self-protection enforced',
  })
  @ApiResponse({ status: 200, description: 'User status updated successfully' })
  async updateUserStatus(
    @CurrentUser() adminUser: AuthenticatedUser,
    @Param('userId', MongoObjectIdPipe) userId: string,
    @Body() dto: AdminUpdateUserStatusDto,
    @Req() req: Request,
  ) {
    return this.adminService.updateUserStatus(adminUser.userId, userId, dto, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Post('curriculum/subjects')
  @ApiOperation({ summary: 'Create a new curriculum subject' })
  @ApiResponse({ status: 201, description: 'Subject created successfully' })
  async createSubject(
    @CurrentUser() adminUser: AuthenticatedUser,
    @Body() dto: AdminCreateSubjectDto,
    @Req() req: Request,
  ) {
    return this.adminService.createSubject(adminUser.userId, dto, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Post('curriculum/chapters')
  @ApiOperation({ summary: 'Create a new chapter under a subject' })
  @ApiResponse({ status: 201, description: 'Chapter created successfully' })
  async createChapter(
    @CurrentUser() adminUser: AuthenticatedUser,
    @Body() dto: AdminCreateChapterDto,
    @Req() req: Request,
  ) {
    return this.adminService.createChapter(adminUser.userId, dto, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Post('curriculum/lessons')
  @ApiOperation({ summary: 'Create a new lesson under a chapter' })
  @ApiResponse({ status: 201, description: 'Lesson created successfully' })
  async createLesson(
    @CurrentUser() adminUser: AuthenticatedUser,
    @Body() dto: AdminCreateLessonDto,
    @Req() req: Request,
  ) {
    return this.adminService.createLesson(adminUser.userId, dto, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Put('curriculum/lessons/:lessonId/publish')
  @ApiOperation({ summary: 'Toggle lesson publication status' })
  @ApiResponse({ status: 200, description: 'Lesson publication status updated' })
  async toggleLessonPublish(
    @CurrentUser() adminUser: AuthenticatedUser,
    @Param('lessonId', MongoObjectIdPipe) lessonId: string,
    @Body('isPublished') isPublished: boolean,
    @Req() req: Request,
  ) {
    return this.adminService.toggleLessonPublish(adminUser.userId, lessonId, Boolean(isPublished), {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Get('curriculum/completeness')
  @ApiOperation({ summary: 'Return curriculum completeness and missing structured lesson content' })
  async getCurriculumCompleteness() {
    return this.adminService.getCurriculumCompleteness();
  }

  @Put('curriculum/lessons/:lessonId/workflow')
  @ApiOperation({ summary: 'Transition a lesson through the server-validated review workflow' })
  async transitionLessonWorkflow(
    @CurrentUser() adminUser: AuthenticatedUser,
    @Param('lessonId', MongoObjectIdPipe) lessonId: string,
    @Body('status') status: ContentWorkflowStatus,
    @Body('reviewComments') reviewComments: string | undefined,
    @Req() req: Request,
  ) {
    return this.adminService.transitionLessonWorkflow(
      adminUser.userId,
      lessonId,
      status,
      reviewComments,
      { ip: req.ip, userAgent: req.headers['user-agent'] },
    );
  }

  @Get('payments/pending')
  @ApiOperation({ summary: 'List manual MFS payments pending administrator verification' })
  @ApiResponse({ status: 200, description: 'List of pending manual transactions' })
  async listPendingPayments(@Query('limit') limit?: number, @Query('page') page?: number) {
    return this.adminService.listPendingPayments(
      limit ? Number(limit) : 20,
      page ? Number(page) : 1,
    );
  }

  @Post('payments/:transactionId/approve')
  @ApiOperation({ summary: 'Approve manual MFS payment and activate student subscription' })
  @ApiResponse({ status: 200, description: 'Payment approved and subscription activated' })
  async approvePayment(
    @CurrentUser() adminUser: AuthenticatedUser,
    @Param('transactionId') transactionId: string,
    @Body('verificationNote') verificationNote?: string,
    @Req() req?: Request,
  ) {
    return this.adminService.approvePayment(adminUser.userId, transactionId, verificationNote, {
      ip: req?.ip,
      userAgent: req?.headers['user-agent'],
    });
  }

  @Post('payments/:transactionId/reject')
  @ApiOperation({ summary: 'Reject manual MFS payment with rejection reason' })
  @ApiResponse({ status: 200, description: 'Payment rejected and marked failed' })
  async rejectPayment(
    @CurrentUser() adminUser: AuthenticatedUser,
    @Param('transactionId') transactionId: string,
    @Body('rejectionReason') rejectionReason?: string,
    @Req() req?: Request,
  ) {
    return this.adminService.rejectPayment(
      adminUser.userId,
      transactionId,
      rejectionReason || 'Rejected by administrator',
      {
        ip: req?.ip,
        userAgent: req?.headers['user-agent'],
      },
    );
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Query and paginate administrator audit trail logs' })
  @ApiResponse({ status: 200, description: 'List of administrative audit logs' })
  async listAuditLogs(
    @Query('action') action?: string,
    @Query('resourceType') resourceType?: string,
    @Query('actorUserId') actorUserId?: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    return this.auditService.listAuditLogs({
      action,
      resourceType,
      actorUserId,
      limit: limit ? Number(limit) : 50,
      page: page ? Number(page) : 1,
    });
  }
}
