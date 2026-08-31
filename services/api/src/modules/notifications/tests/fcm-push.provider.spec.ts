import { ConfigService } from '@nestjs/config';
import { FcmPushProvider } from '../providers/fcm-push.provider';

describe('FcmPushProvider', () => {
  it('should simulate successful sends in sandbox mode', async () => {
    const provider = new FcmPushProvider({
      get: jest.fn().mockReturnValue('sandbox'),
    } as unknown as ConfigService);

    const result = await provider.sendPush(['token_1', 'token_2'], {
      title: 'Homework reminder',
      body: 'A new assignment is available.',
    });

    expect(result.successfulTokens).toEqual(['token_1', 'token_2']);
    expect(result.failedTokens).toEqual([]);
    expect(result.invalidTokens).toEqual([]);
  });

  it('should refuse to mark production deliveries as successful without a live transport', async () => {
    const provider = new FcmPushProvider({
      get: jest.fn().mockReturnValue('real-server-key'),
    } as unknown as ConfigService);

    const result = await provider.sendPush(['fcm_device_token_123', 'bad'], {
      title: 'Exam update',
      body: 'The exam has been rescheduled.',
    });

    expect(result.successfulTokens).toEqual([]);
    expect(result.failedTokens).toEqual(['fcm_device_token_123']);
    expect(result.invalidTokens).toEqual(['bad']);
  });
});
