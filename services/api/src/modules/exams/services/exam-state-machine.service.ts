import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ExamSessionStatus } from '../enums/exam-session-status.enum';

@Injectable()
export class ExamStateMachineService {
  private readonly logger = new Logger(ExamStateMachineService.name);
  private readonly GRACE_PERIOD_MS = 30000; // 30 seconds network grace period

  private readonly allowedTransitions: Record<ExamSessionStatus, ExamSessionStatus[]> = {
    [ExamSessionStatus.ACTIVE]: [ExamSessionStatus.SUBMITTED, ExamSessionStatus.EXPIRED],
    [ExamSessionStatus.EXPIRED]: [ExamSessionStatus.SUBMITTED],
    [ExamSessionStatus.SUBMITTED]: [],
  };

  validateTransition(
    currentStatus: ExamSessionStatus,
    targetStatus: ExamSessionStatus,
    sessionId?: string,
  ): void {
    if (currentStatus === targetStatus) {
      return;
    }

    const allowed = this.allowedTransitions[currentStatus] || [];
    if (!allowed.includes(targetStatus)) {
      const message = `Invalid exam session transition from ${currentStatus} to ${targetStatus}${
        sessionId ? ` for session ${sessionId}` : ''
      }`;
      this.logger.error(message);
      throw new BadRequestException(message);
    }
  }

  isSessionExpired(expiresAt: Date, withGracePeriod = false): boolean {
    const threshold = expiresAt.getTime() + (withGracePeriod ? this.GRACE_PERIOD_MS : 0);
    return Date.now() > threshold;
  }

  assertCanAnswer(sessionStatus: ExamSessionStatus, expiresAt: Date): void {
    if (sessionStatus !== ExamSessionStatus.ACTIVE) {
      throw new BadRequestException(
        `Cannot save answers on an exam session with status: ${sessionStatus}`,
      );
    }

    if (this.isSessionExpired(expiresAt, true)) {
      throw new BadRequestException(
        'EXAM_EXPIRED: Exam time limit (including grace period) has been exceeded',
      );
    }
  }
}
