import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PushDeliveryResult, PushPayload, PushProvider } from './push-provider.interface';

@Injectable()
export class FcmPushProvider implements PushProvider {
  readonly name = 'FCM';
  private readonly logger = new Logger(FcmPushProvider.name);
  private readonly isSandbox: boolean;

  constructor(private readonly configService: ConfigService) {
    const fcmKey = this.configService.get<string>('FCM_SERVER_KEY');
    this.isSandbox = !fcmKey || fcmKey === 'mock' || fcmKey === 'sandbox';
    if (this.isSandbox) {
      this.logger.log('FcmPushProvider initialized in SANDBOX / SIMULATION mode');
    } else {
      this.logger.warn(
        'FcmPushProvider initialized in production mode, but no live FCM transport is wired; sends will be marked as failed until a real transport is configured',
      );
    }
  }

  async sendPush(tokens: string[], payload: PushPayload): Promise<PushDeliveryResult> {
    if (!tokens.length) {
      return { successfulTokens: [], failedTokens: [], invalidTokens: [] };
    }

    if (this.isSandbox) {
      this.logger.log(
        `[Sandbox Push] Dispatched notification "${payload.title}" to ${tokens.length} device tokens`,
      );
      return {
        successfulTokens: tokens,
        failedTokens: [],
        invalidTokens: [],
      };
    }

    const successfulTokens: string[] = [];
    const failedTokens: string[] = [];
    const invalidTokens: string[] = [];

    for (const token of tokens) {
      if (!token.startsWith('fcm_') || token.length < 10) {
        invalidTokens.push(token);
      } else {
        failedTokens.push(token);
      }
    }

    if (failedTokens.length > 0) {
      this.logger.error(
        `Refusing to mark ${failedTokens.length} push token(s) as delivered without a live FCM transport`,
      );
    }

    return {
      successfulTokens,
      failedTokens,
      invalidTokens,
    };
  }
}
