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
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LiveClassroomService } from './live-classroom.service';
import {
  Participant,
  ChatMessage,
  WhiteboardStroke,
  QuizQuestion,
} from './interfaces/live-classroom.interface';

@WebSocketGateway({
  cors: {
    origin: '*',
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
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '') ||
        client.handshake.query?.token;

      if (!token) {
        this.logger.debug(`Anonymous connection: ${client.id}`);
        return;
      }

      const secret = this.configService.get<string>('jwt.accessSecret') || 'shikkhok-development-only-access-secret-2026';
      const payload = this.jwtService.verify(token as string, { secret });
      client.data.user = payload;
      this.logger.log(`Authenticated live socket: ${client.id} (User: ${payload.sub || payload.id})`);
    } catch (err: any) {
      this.logger.warn(`JWT verification failed for socket ${client.id}: ${err.message}`);
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
  handleJoinClassroom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { classroomId: string; name?: string; role?: 'teacher' | 'student' },
  ) {
    const user = client.data.user;
    const userId = user?.sub || user?.id || `guest_${client.id.slice(0, 6)}`;
    const role = data.role || user?.role || 'student';
    const name = data.name || user?.name || (role === 'teacher' ? 'শিক্ষক' : 'শিক্ষার্থী');

    const participant: Participant = {
      socketId: client.id,
      userId,
      name,
      role,
      joinedAt: new Date(),
    };

    client.join(data.classroomId);
    const roster = this.liveClassroomService.addParticipant(data.classroomId, participant);
    const whiteboardState = this.liveClassroomService.getWhiteboardState(data.classroomId);

    // Reply to joining user with initial room state
    client.emit('room_joined', {
      classroomId: data.classroomId,
      participant,
      roster,
      whiteboardState,
    });

    // Broadcast to everyone else in the room
    client.to(data.classroomId).emit('participant_joined', {
      participant,
      roster,
    });

    this.logger.log(`Socket ${client.id} joined room ${data.classroomId} as ${role} (${name})`);
  }

  @SubscribeMessage('send_chat_message')
  handleChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { classroomId: string; text: string },
  ) {
    const user = client.data.user;
    const senderId = user?.sub || user?.id || client.id;
    const senderName = user?.name || (user?.role === 'teacher' ? 'শিক্ষক' : 'শিক্ষার্থী');
    const senderRole = (user?.role === 'teacher' ? 'teacher' : 'student') as 'teacher' | 'student';

    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      senderId,
      senderName,
      senderRole,
      text: data.text,
      timestamp: new Date().toISOString(),
    };

    this.server.to(data.classroomId).emit('new_chat_message', message);
  }

  @SubscribeMessage('whiteboard_draw')
  handleWhiteboardDraw(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { classroomId: string; stroke: WhiteboardStroke },
  ) {
    this.liveClassroomService.addStroke(data.classroomId, data.stroke);
    // Broadcast stroke to all other participants in the room
    client.to(data.classroomId).emit('whiteboard_stroke', data.stroke);
  }

  @SubscribeMessage('whiteboard_clear')
  handleWhiteboardClear(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { classroomId: string },
  ) {
    this.liveClassroomService.clearWhiteboard(data.classroomId);
    this.server.to(data.classroomId).emit('whiteboard_cleared');
  }

  @SubscribeMessage('start_quiz')
  handleStartQuiz(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { classroomId: string; quiz: QuizQuestion },
  ) {
    this.liveClassroomService.startQuiz(data.classroomId, data.quiz);
    this.server.to(data.classroomId).emit('quiz_started', {
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
    const user = client.data.user;
    const userId = user?.sub || user?.id || client.id;
    const studentName = user?.name || 'শিক্ষার্থী';

    const submission = this.liveClassroomService.submitQuizAnswer(data.classroomId, {
      userId,
      studentName,
      questionId: data.questionId,
      selectedOptionIndex: data.selectedOptionIndex,
    });

    if (submission) {
      client.emit('quiz_answer_acknowledged', {
        questionId: data.questionId,
        isCorrect: submission.isCorrect,
      });

      // Broadcast live leaderboard to classroom
      const leaderboard = this.liveClassroomService.getQuizLeaderboard(data.classroomId);
      this.server.to(data.classroomId).emit('quiz_leaderboard_updated', leaderboard);
    }
  }
}
