import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  BadRequestException,
  ForbiddenException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LiveClassroomService } from './live-classroom.service';
import { ClassroomRepository } from '../classrooms/repositories/classroom.repository';
import { ClassroomMemberRepository } from '../classrooms/repositories/classroom-member.repository';
import {
  Participant,
  ChatMessage,
  WhiteboardStroke,
  QuizQuestion,
} from './interfaces/live-classroom.interface';

const allowedOrigins = (process.env.CORS_ORIGINS ||
  'http://localhost:3000,http://localhost:4000,http://localhost:8081')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

@WebSocketGateway({
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by live-classroom CORS allowlist'));
    },
    credentials: true,
  },
  namespace: 'live-classroom',
})
export class LiveClassroomGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(LiveClassroomGateway.name);

  constructor(
    private readonly liveClassroomService: LiveClassroomService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly classroomRepository: ClassroomRepository,
    private readonly classroomMemberRepository: ClassroomMemberRepository,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '') ||
        client.handshake.query?.token;

      if (!token) {
        this.logger.warn(`Rejected anonymous live-classroom socket ${client.id}`);
        client.disconnect(true);
        return;
      }

      const secret =
        this.configService.get<string>('jwt.accessSecret') ||
        'shikkhok-development-only-access-secret-2026';
      const payload = this.jwtService.verify(token as string, { secret });
      client.data.user = payload;
      client.data.joinedClassrooms = new Set<string>();
      this.logger.log(`Authenticated live socket: ${client.id} (User: ${payload.sub || payload.id})`);
    } catch (err: any) {
      this.logger.warn(`JWT verification failed for socket ${client.id}: ${err.message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const result = this.liveClassroomService.removeParticipant(client.id);
    if (result) {
      this.logger.log(`User left classroom ${result.classroomId}: ${result.participant.name}`);
      this.server.to(result.classroomId).emit('participant_left', {
        participant: result.participant,
        roster: result.remaining,
      });
    }
  }

  @SubscribeMessage('join_classroom')
  async handleJoinClassroom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { classroomId: string; name?: string },
  ) {
    const user = this.requireAuthenticatedUser(client);
    const classroomId = this.normalizeClassroomId(data.classroomId);

    const classroom = await this.assertJoinedClassroomAccess(user, classroomId);
    const role = this.resolveParticipantRole(user, classroom.teacherId?.toString?.() ?? '');
    const name = this.sanitizeDisplayName(data.name) || (role === 'teacher' ? 'শিক্ষক' : 'শিক্ষার্থী');
    const participant: Participant = {
      socketId: client.id,
      userId: user.sub,
      name,
      role,
      joinedAt: new Date(),
    };

    client.join(classroomId);
    client.data.joinedClassrooms.add(classroomId);
    const roster = this.liveClassroomService.addParticipant(classroomId, participant);
    const whiteboardState = this.liveClassroomService.getWhiteboardState(classroomId);

    // Reply to joining user with initial room state
    client.emit('room_joined', {
      classroomId,
      participant,
      roster,
      whiteboardState,
    });

    // Broadcast to everyone else in the room
    client.to(classroomId).emit('participant_joined', {
      participant,
      roster,
    });

    this.logger.log(`Socket ${client.id} joined room ${classroomId} as ${role} (${name})`);
  }

  @SubscribeMessage('send_chat_message')
  handleChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { classroomId: string; text: string },
  ) {
    const classroomId = this.normalizeClassroomId(data.classroomId);
    const user = this.requireAuthenticatedUser(client);
    this.assertJoinedClassroom(client, classroomId);
    this.assertReadableMessage(data.text);
    const participant = this.getParticipant(client, classroomId);

    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      senderId: user.sub,
      senderName: participant.name,
      senderRole: participant.role,
      text: data.text.trim(),
      timestamp: new Date().toISOString(),
    };

    this.server.to(classroomId).emit('new_chat_message', message);
  }

  @SubscribeMessage('whiteboard_draw')
  handleWhiteboardDraw(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { classroomId: string; stroke: WhiteboardStroke },
  ) {
    const classroomId = this.normalizeClassroomId(data.classroomId);
    this.requireAuthenticatedUser(client);
    this.assertJoinedClassroom(client, classroomId);
    this.assertValidStroke(data.stroke);
    this.liveClassroomService.addStroke(classroomId, data.stroke);
    // Broadcast stroke to all other participants in the room
    client.to(classroomId).emit('whiteboard_stroke', data.stroke);
  }

  @SubscribeMessage('whiteboard_clear')
  handleWhiteboardClear(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { classroomId: string },
  ) {
    const classroomId = this.normalizeClassroomId(data.classroomId);
    this.assertTeacherAction(client, classroomId);
    this.liveClassroomService.clearWhiteboard(classroomId);
    this.server.to(classroomId).emit('whiteboard_cleared');
  }

  @SubscribeMessage('start_quiz')
  handleStartQuiz(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { classroomId: string; quiz: QuizQuestion },
  ) {
    const classroomId = this.normalizeClassroomId(data.classroomId);
    this.assertTeacherAction(client, classroomId);
    this.assertValidQuiz(data.quiz);
    this.liveClassroomService.startQuiz(classroomId, data.quiz);
    this.server.to(classroomId).emit('quiz_started', {
      id: data.quiz.id,
      questionText: data.quiz.questionText,
      options: data.quiz.options,
      timeLimitSeconds: data.quiz.timeLimitSeconds,
      startedAt: data.quiz.startedAt,
    });
  }

  @SubscribeMessage('submit_quiz_answer')
  handleSubmitQuizAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      classroomId: string;
      questionId: string;
      selectedOptionIndex: number;
    },
  ) {
    const classroomId = this.normalizeClassroomId(data.classroomId);
    const user = this.requireAuthenticatedUser(client);
    this.assertJoinedClassroom(client, classroomId);
    const participant = this.getParticipant(client, classroomId);
    if (participant.role !== 'student') {
      throw new ForbiddenException('Only students can submit quiz answers');
    }

    const submission = this.liveClassroomService.submitQuizAnswer(classroomId, {
      userId: user.sub,
      studentName: participant.name,
      questionId: data.questionId,
      selectedOptionIndex: data.selectedOptionIndex,
    });

    if (submission) {
      client.emit('quiz_answer_acknowledged', {
        questionId: data.questionId,
        isCorrect: submission.isCorrect,
      });

      // Broadcast live leaderboard to classroom
      const leaderboard = this.liveClassroomService.getQuizLeaderboard(classroomId);
      this.server.to(classroomId).emit('quiz_leaderboard_updated', leaderboard);
    }
  }

  private requireAuthenticatedUser(client: Socket): { sub: string; role: string } {
    const user = client.data.user;
    if (!user?.sub || !user?.role) {
      throw new UnauthorizedException('Authentication required for live classroom access');
    }
    return user;
  }

  private normalizeClassroomId(classroomId: string): string {
    if (!classroomId || !classroomId.trim()) {
      throw new BadRequestException('classroomId is required');
    }
    return classroomId.trim();
  }

  private sanitizeDisplayName(name?: string): string | undefined {
    const normalized = name?.trim().slice(0, 80);
    return normalized ? normalized : undefined;
  }

  private resolveParticipantRole(
    user: { sub: string; role: string },
    teacherId: string,
  ): 'teacher' | 'student' {
    if (user.role === 'admin') {
      return 'teacher';
    }
    if (user.role === 'teacher' && teacherId && teacherId === user.sub) {
      return 'teacher';
    }
    return 'student';
  }

  private async getClassroomOrThrow(classroomId: string) {
    const classroom = await this.classroomRepository.findById(classroomId);
    if (!classroom || !classroom.isActive) {
      throw new NotFoundException('Classroom not found');
    }
    return classroom;
  }

  private async assertJoinedClassroomAccess(user: { sub: string; role: string }, classroomId: string) {
    const classroom = await this.getClassroomOrThrow(classroomId);
    const teacherId = classroom.teacherId?.toString?.() ?? '';
    const isTeacherOwner = user.role === 'teacher' && teacherId === user.sub;
    const isAdmin = user.role === 'admin';

    if (isTeacherOwner || isAdmin) {
      return classroom;
    }

    const isMember = await this.classroomMemberRepository.isMember(classroomId, user.sub);
    if (!isMember) {
      throw new ForbiddenException('You are not enrolled in this classroom');
    }

    return classroom;
  }

  private assertTeacherAction(client: Socket, classroomId: string) {
    const user = this.requireAuthenticatedUser(client);
    if (user.role !== 'teacher' && user.role !== 'admin') {
      throw new ForbiddenException('Only the classroom teacher can perform this action');
    }

    const participant = this.getParticipant(client, classroomId);
    if (participant.role !== 'teacher') {
      throw new ForbiddenException('Only the classroom teacher can perform this action');
    }
  }

  private assertJoinedClassroom(client: Socket, classroomId: string): void {
    this.getParticipant(client, classroomId);
  }

  private getParticipant(client: Socket, classroomId: string): Participant {
    const participants = this.liveClassroomService.getParticipants(classroomId);
    const participant = participants.find((entry) => entry.socketId === client.id);
    if (!participant) {
      throw new ForbiddenException('Join the classroom before sending live events');
    }
    return participant;
  }

  private assertReadableMessage(text: string): void {
    const trimmed = text?.trim();
    if (!trimmed) {
      throw new BadRequestException('Chat message cannot be empty');
    }
    if (trimmed.length > 500) {
      throw new BadRequestException('Chat message must be 500 characters or fewer');
    }
  }

  private assertValidStroke(stroke: WhiteboardStroke): void {
    if (!stroke?.id || !stroke?.color || !Number.isFinite(stroke.width)) {
      throw new BadRequestException('Invalid whiteboard stroke payload');
    }
    if (!Array.isArray(stroke.points) || stroke.points.length < 2) {
      throw new BadRequestException('Whiteboard stroke must contain at least two points');
    }
  }

  private assertValidQuiz(quiz: QuizQuestion): void {
    if (!quiz?.id || !quiz?.questionText || !Array.isArray(quiz.options) || quiz.options.length < 2) {
      throw new BadRequestException('Invalid quiz payload');
    }
    if (!Number.isFinite(quiz.correctOptionIndex) || quiz.correctOptionIndex < 0) {
      throw new BadRequestException('Quiz correct option index is invalid');
    }
    if (!Number.isFinite(quiz.timeLimitSeconds) || quiz.timeLimitSeconds <= 0) {
      throw new BadRequestException('Quiz time limit must be greater than zero');
    }
  }
}
