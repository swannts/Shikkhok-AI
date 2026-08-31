import { Injectable } from '@nestjs/common';
import {
  Participant,
  ChatMessage,
  WhiteboardStroke,
  QuizQuestion,
  QuizSubmission,
} from './interfaces/live-classroom.interface';

@Injectable()
export class LiveClassroomService {
  // Map of classroomId -> Map of socketId -> Participant
  private readonly rooms = new Map<string, Map<string, Participant>>();

  // Map of classroomId -> List of WhiteboardStroke
  private readonly whiteboards = new Map<string, WhiteboardStroke[]>();

  // Map of classroomId -> Current Active QuizQuestion
  private readonly activeQuizzes = new Map<string, QuizQuestion>();

  // Map of classroomId -> List of QuizSubmission
  private readonly quizSubmissions = new Map<string, QuizSubmission[]>();

  addParticipant(classroomId: string, participant: Participant): Participant[] {
    if (!this.rooms.has(classroomId)) {
      this.rooms.set(classroomId, new Map());
    }
    this.rooms.get(classroomId)!.set(participant.socketId, participant);
    return this.getParticipants(classroomId);
  }

  removeParticipant(
    socketId: string,
  ): { classroomId: string; participant: Participant; remaining: Participant[] } | null {
    for (const [classroomId, participants] of this.rooms.entries()) {
      if (participants.has(socketId)) {
        const participant = participants.get(socketId)!;
        participants.delete(socketId);
        if (participants.size === 0) {
          this.rooms.delete(classroomId);
          this.whiteboards.delete(classroomId);
          this.activeQuizzes.delete(classroomId);
          this.quizSubmissions.delete(classroomId);
        }
        return {
          classroomId,
          participant,
          remaining: this.getParticipants(classroomId),
        };
      }
    }
    return null;
  }

  getParticipants(classroomId: string): Participant[] {
    const room = this.rooms.get(classroomId);
    if (!room) return [];
    return Array.from(room.values());
  }

  // Whiteboard State
  addStroke(classroomId: string, stroke: WhiteboardStroke): void {
    if (!this.whiteboards.has(classroomId)) {
      this.whiteboards.set(classroomId, []);
    }
    this.whiteboards.get(classroomId)!.push(stroke);
  }

  clearWhiteboard(classroomId: string): void {
    this.whiteboards.set(classroomId, []);
  }

  getWhiteboardState(classroomId: string): WhiteboardStroke[] {
    return this.whiteboards.get(classroomId) || [];
  }

  // Quiz Engine
  startQuiz(classroomId: string, quiz: QuizQuestion): void {
    this.activeQuizzes.set(classroomId, quiz);
    this.quizSubmissions.set(classroomId, []);
  }

  submitQuizAnswer(
    classroomId: string,
    submission: { userId: string; studentName: string; questionId: string; selectedOptionIndex: number },
  ): QuizSubmission | null {
    const activeQuiz = this.activeQuizzes.get(classroomId);
    if (!activeQuiz || activeQuiz.id !== submission.questionId) {
      return null;
    }

    const isCorrect = submission.selectedOptionIndex === activeQuiz.correctOptionIndex;
    const score = isCorrect ? 100 : 0;

    const fullSubmission: QuizSubmission = {
      ...submission,
      submittedAt: new Date().toISOString(),
      isCorrect,
      score,
    };

    if (!this.quizSubmissions.has(classroomId)) {
      this.quizSubmissions.set(classroomId, []);
    }

    // Replace if already submitted
    const list = this.quizSubmissions.get(classroomId)!;
    const existingIndex = list.findIndex((s) => s.userId === submission.userId);
    if (existingIndex >= 0) {
      list[existingIndex] = fullSubmission;
    } else {
      list.push(fullSubmission);
    }

    return fullSubmission;
  }

  getQuizLeaderboard(classroomId: string): { studentName: string; score: number; isCorrect: boolean }[] {
    const list = this.quizSubmissions.get(classroomId) || [];
    return list
      .map((s) => ({ studentName: s.studentName, score: s.score, isCorrect: s.isCorrect }))
      .sort((a, b) => b.score - a.score);
  }
}
