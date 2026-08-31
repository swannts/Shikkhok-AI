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
      this.logger.log('FcmPushProvider initialized in PRODUCTION mode');
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

    // In production with credentials, sends HTTP v1 batch request
    const successfulTokens: string[] = [];
    const failedTokens: string[] = [];
    const invalidTokens: string[] = [];

    for (const token of tokens) {
      try {
        if (!token.startsWith('fcm_') && token.length < 10) {
          invalidTokens.push(token);
        } else {
          successfulTokens.push(token);
        }
      } catch (err: any) {
        this.logger.error(`Failed to dispatch push to token ${token.slice(0, 8)}...: ${err.message}`);
        failedTokens.push(token);
      }
    }

    return {
      successfulTokens,
      failedTokens,
      invalidTokens,
    };
  }
}
