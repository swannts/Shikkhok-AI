import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PaymentStatus } from '../enums/payment-status.enum';

@Injectable()
export class PaymentStateMachineService {
  private readonly logger = new Logger(PaymentStateMachineService.name);

  private readonly allowedTransitions: Record<PaymentStatus, PaymentStatus[]> = {
    [PaymentStatus.PENDING]: [
      PaymentStatus.PROCESSING,
      PaymentStatus.PENDING_VERIFICATION,
      PaymentStatus.COMPLETED,
      PaymentStatus.CANCELLED,
      PaymentStatus.EXPIRED,
      PaymentStatus.FAILED,
    ],
    [PaymentStatus.PROCESSING]: [
      PaymentStatus.COMPLETED,
      PaymentStatus.FAILED,
      PaymentStatus.CANCELLED,
    ],
    [PaymentStatus.PENDING_VERIFICATION]: [
      PaymentStatus.COMPLETED,
      PaymentStatus.FAILED,
      PaymentStatus.CANCELLED,
    ],
    [PaymentStatus.COMPLETED]: [PaymentStatus.REFUNDED],
    [PaymentStatus.FAILED]: [],
    [PaymentStatus.CANCELLED]: [],
    [PaymentStatus.EXPIRED]: [],
    [PaymentStatus.REFUNDED]: [],
  };

  validateTransition(
    currentStatus: PaymentStatus,
    targetStatus: PaymentStatus,
    transactionId?: string,
  ): void {
    if (currentStatus === targetStatus) {
      return;
    }

    const allowed = this.allowedTransitions[currentStatus] || [];
    if (!allowed.includes(targetStatus)) {
      const message = `Invalid payment status transition from ${currentStatus} to ${targetStatus}${
        transactionId ? ` for transaction ${transactionId}` : ''
      }`;
      this.logger.error(message);
      throw new BadRequestException(message);
    }
  }

  isTerminal(status: PaymentStatus): boolean {
    return (
      status === PaymentStatus.COMPLETED ||
      status === PaymentStatus.FAILED ||
      status === PaymentStatus.CANCELLED ||
      status === PaymentStatus.EXPIRED ||
      status === PaymentStatus.REFUNDED
    );
  }
}
