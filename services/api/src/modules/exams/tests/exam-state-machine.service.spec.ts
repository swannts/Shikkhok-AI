import 'reflect-metadata';
import { BadRequestException } from '@nestjs/common';
import { ExamStateMachineService } from '../services/exam-state-machine.service';
import { ExamSessionStatus } from '../enums/exam-session-status.enum';

describe('ExamStateMachineService', () => {
  let stateMachine: ExamStateMachineService;

  beforeEach(() => {
    stateMachine = new ExamStateMachineService();
  });

  it('should allow valid transitions from ACTIVE to SUBMITTED and EXPIRED', () => {
    expect(() =>
      stateMachine.validateTransition(ExamSessionStatus.ACTIVE, ExamSessionStatus.SUBMITTED),
    ).not.toThrow();

    expect(() =>
      stateMachine.validateTransition(ExamSessionStatus.ACTIVE, ExamSessionStatus.EXPIRED),
    ).not.toThrow();
  });

  it('should reject transitions out of terminal SUBMITTED state', () => {
    expect(() =>
      stateMachine.validateTransition(ExamSessionStatus.SUBMITTED, ExamSessionStatus.ACTIVE),
    ).toThrow(BadRequestException);
  });

  it('should allow answers within grace period and reject after grace period', () => {
    const validExpiry = new Date(Date.now() + 60000); // 1 min in future
    expect(() => stateMachine.assertCanAnswer(ExamSessionStatus.ACTIVE, validExpiry)).not.toThrow();

    const expiredBeyondGrace = new Date(Date.now() - 40000); // 40s in past (> 30s grace)
    expect(() =>
      stateMachine.assertCanAnswer(ExamSessionStatus.ACTIVE, expiredBeyondGrace),
    ).toThrow(BadRequestException);
  });
});
