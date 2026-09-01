import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../core/redis/redis.service';
import {
  Participant,
  WhiteboardStroke,
  QuizQuestion,
  QuizSubmission,
} from './interfaces/live-classroom.interface';

const ROOM_TTL_SECONDS = 1800;
const WHITEBOARD_MAX_STROKES = 1000;

interface CleanupResult {
  classroomId: string;
  participant: Participant;
  remaining: Participant[];
}

@Injectable()
export class LiveClassroomService {
  private readonly logger = new Logger(LiveClassroomService.name);

  constructor(private readonly redisService: RedisService) {}

  private participantsKey(classroomId: string): string {
    return `live:classroom:${classroomId}:participants`;
  }

  private whiteboardKey(classroomId: string): string {
    return `live:classroom:${classroomId}:whiteboard`;
  }

  private quizKey(classroomId: string): string {
    return `live:classroom:${classroomId}:quiz`;
  }

  private quizSubmissionsKey(classroomId: string): string {
    return `live:classroom:${classroomId}:quiz_submissions`;
  }

  private socketToClassroomKey(socketId: string): string {
    return `live:socket:${socketId}:classroom`;
  }

  async addParticipant(classroomId: string, participant: Participant): Promise<Participant[]> {
    const client = this.redisService.getClient();
    const key = this.participantsKey(classroomId);
    await client.hset(key, participant.socketId, JSON.stringify(participant));
    await client.expire(key, ROOM_TTL_SECONDS);

    await client.setex(
      this.socketToClassroomKey(participant.socketId),
      ROOM_TTL_SECONDS,
      classroomId,
    );

    return this.getParticipants(classroomId);
  }

  async removeParticipant(socketId: string): Promise<CleanupResult | null> {
    const client = this.redisService.getClient();
    const classroomId = await client.get(this.socketToClassroomKey(socketId));
    if (!classroomId) return null;

    const partKey = this.participantsKey(classroomId);
    const participantJson = await client.hget(partKey, socketId);
    if (!participantJson) {
      await client.del(this.socketToClassroomKey(socketId));
      return null;
    }

    const participant: Participant = JSON.parse(participantJson);
    await client.hdel(partKey, socketId);
    await client.del(this.socketToClassroomKey(socketId));

    const count = await client.hlen(partKey);
    if (count === 0) {
      await this.cleanupRoom(classroomId);
    }

    const remaining = await this.getParticipants(classroomId);
    return { classroomId, participant, remaining };
  }

  async getParticipants(classroomId: string): Promise<Participant[]> {
    const client = this.redisService.getClient();
    const key = this.participantsKey(classroomId);
    const entries = await client.hgetall(key);
    return Object.values(entries).map((json) => JSON.parse(json) as Participant);
  }

  async addStroke(classroomId: string, stroke: WhiteboardStroke): Promise<void> {
    const client = this.redisService.getClient();
    const key = this.whiteboardKey(classroomId);
    await client.rpush(key, JSON.stringify(stroke));
    await client.ltrim(key, -WHITEBOARD_MAX_STROKES, -1);
    await client.expire(key, ROOM_TTL_SECONDS);
  }

  async clearWhiteboard(classroomId: string): Promise<void> {
    const client = this.redisService.getClient();
    await client.del(this.whiteboardKey(classroomId));
  }

  async getWhiteboardState(classroomId: string): Promise<WhiteboardStroke[]> {
    const client = this.redisService.getClient();
    const strokes = await client.lrange(this.whiteboardKey(classroomId), 0, -1);
    return strokes.map((json) => JSON.parse(json) as WhiteboardStroke);
  }

  async startQuiz(classroomId: string, quiz: QuizQuestion): Promise<void> {
    const client = this.redisService.getClient();
    const quizKey = this.quizKey(classroomId);
    const submissionsKey = this.quizSubmissionsKey(classroomId);
    await client.set(quizKey, JSON.stringify(quiz));
    await client.del(submissionsKey);
    await client.expire(quizKey, ROOM_TTL_SECONDS);
    await client.expire(submissionsKey, ROOM_TTL_SECONDS);
  }

  async submitQuizAnswer(
    classroomId: string,
    submission: {
      userId: string;
      studentName: string;
      questionId: string;
      selectedOptionIndex: number;
    },
  ): Promise<QuizSubmission | null> {
    const client = this.redisService.getClient();
    const quizJson = await client.get(this.quizKey(classroomId));
    if (!quizJson) return null;

    const activeQuiz: QuizQuestion = JSON.parse(quizJson);
    if (activeQuiz.id !== submission.questionId) return null;
    if (
      !Number.isInteger(submission.selectedOptionIndex) ||
      submission.selectedOptionIndex < 0 ||
      submission.selectedOptionIndex >= activeQuiz.options.length
    ) {
      throw new BadRequestException('Quiz answer option is invalid');
    }

    const startedAt = Date.parse(activeQuiz.startedAt);
    if (Number.isNaN(startedAt) || Date.now() > startedAt + activeQuiz.timeLimitSeconds * 1000) {
      throw new BadRequestException('Quiz has expired');
    }

    const isCorrect = submission.selectedOptionIndex === activeQuiz.correctOptionIndex;
    const score = isCorrect ? 100 : 0;

    const fullSubmission: QuizSubmission = {
      ...submission,
      submittedAt: new Date().toISOString(),
      isCorrect,
      score,
    };

    const accepted = await client.hsetnx(
      this.quizSubmissionsKey(classroomId),
      submission.userId,
      JSON.stringify(fullSubmission),
    );
    return accepted === 1 ? fullSubmission : null;
  }

  async getQuizLeaderboard(
    classroomId: string,
  ): Promise<{ studentName: string; score: number; isCorrect: boolean }[]> {
    const client = this.redisService.getClient();
    const entries = await client.hgetall(this.quizSubmissionsKey(classroomId));
    const submissions: QuizSubmission[] = Object.values(entries).map((json) => JSON.parse(json));
    return submissions
      .map((s) => ({ studentName: s.studentName, score: s.score, isCorrect: s.isCorrect }))
      .sort((a, b) => b.score - a.score);
  }

  private async cleanupRoom(classroomId: string): Promise<void> {
    const client = this.redisService.getClient();
    await client.del(
      this.participantsKey(classroomId),
      this.whiteboardKey(classroomId),
      this.quizKey(classroomId),
      this.quizSubmissionsKey(classroomId),
    );
  }
}
