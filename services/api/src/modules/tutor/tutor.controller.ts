import { Body, Controller, Get, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MongoObjectIdPipe } from '../../common/pipes/mongo-object-id.pipe';
import { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy';
import { TutorService } from './tutor.service';
import { StartTutorConversationDto } from './dto/start-tutor-conversation.dto';
import { SendTutorMessageDto } from './dto/send-tutor-message.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@ApiTags('Tutor')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseGuards(ThrottlerGuard)
@Controller({ path: 'tutor', version: '1' })
export class TutorController {
  constructor(private readonly tutorService: TutorService) {}

  @Get('me/conversations')
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'List my tutor conversations' })
  async getMyConversations(@CurrentUser() user: AuthenticatedUser) {
    return this.tutorService.getMyConversations(user);
  }

  @Post('me/conversations')
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Start a tutor conversation' })
  async startConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: StartTutorConversationDto,
  ) {
    return this.tutorService.startConversation(user, dto);
  }

  @Get('me/conversations/:conversationId')
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get a tutor conversation by ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Page size, max 50' })
  @ApiQuery({ name: 'cursor', required: false, description: 'Opaque pagination cursor' })
  async getConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', MongoObjectIdPipe) conversationId: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.tutorService.getConversation(
      user,
      conversationId,
      limit ? Number(limit) : 30,
      cursor,
    );
  }

  @Get('me/conversations/:conversationId/messages')
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'List tutor messages for a conversation' })
  @ApiQuery({ name: 'limit', required: false, description: 'Page size, max 50' })
  @ApiQuery({ name: 'cursor', required: false, description: 'Opaque pagination cursor' })
  async getConversationMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', MongoObjectIdPipe) conversationId: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.tutorService.getConversationMessages(
      user,
      conversationId,
      limit ? Number(limit) : 30,
      cursor,
    );
  }

  @Post('me/conversations/:conversationId/messages')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Send a tutor message (JSON reply)' })
  @ApiResponse({ status: 200, description: 'Tutor reply returned' })
  async sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', MongoObjectIdPipe) conversationId: string,
    @Body() dto: SendTutorMessageDto,
  ) {
    return this.tutorService.sendMessage(user, conversationId, dto);
  }

  @Post('me/conversations/:conversationId/messages/stream')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Send a tutor message and stream the AI response using Server-Sent Events (SSE)',
  })
  @ApiResponse({
    status: 200,
    description: 'Server-Sent Events stream with metadata, delta, citation, and done frames',
  })
  async streamMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', MongoObjectIdPipe) conversationId: string,
    @Body() dto: SendTutorMessageDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.tutorService.streamMessage(user, conversationId, dto, res, req);
  }
}
