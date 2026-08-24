import 'reflect-metadata';
import { BadRequestException } from '@nestjs/common';
import { PaymentStateMachineService } from '../services/payment-state-machine.service';
import { PaymentStatus } from '../enums/payment-status.enum';

describe('PaymentStateMachineService', () => {
  let stateMachine: PaymentStateMachineService;

  beforeEach(() => {
    stateMachine = new PaymentStateMachineService();
  });

  it('should allow valid transition from PENDING to PROCESSING', () => {
    expect(() =>
      stateMachine.validateTransition(PaymentStatus.PENDING, PaymentStatus.PROCESSING),
    ).not.toThrow();
  });

  it('should allow valid transition from PENDING_VERIFICATION to COMPLETED', () => {
    expect(() =>
      stateMachine.validateTransition(PaymentStatus.PENDING_VERIFICATION, PaymentStatus.COMPLETED),
    ).not.toThrow();
  });

  it('should allow valid transition from PENDING_VERIFICATION to FAILED', () => {
    expect(() =>
      stateMachine.validateTransition(PaymentStatus.PENDING_VERIFICATION, PaymentStatus.FAILED),
    ).not.toThrow();
  });

  it('should reject illegal transition from COMPLETED to PENDING', () => {
    expect(() =>
      stateMachine.validateTransition(PaymentStatus.COMPLETED, PaymentStatus.PENDING),
    ).toThrow(BadRequestException);
  });

  it('should reject illegal transition from FAILED to COMPLETED', () => {
    expect(() =>
      stateMachine.validateTransition(PaymentStatus.FAILED, PaymentStatus.COMPLETED),
    ).toThrow(BadRequestException);
  });
});
