import { deliverPushNotifications, FcmDeliveryResult } from './fcm-delivery';
import admin from 'firebase-admin';

jest.mock('firebase-admin', () => {
  const mockSendEach = jest.fn();
  const mockMessaging = jest.fn(() => ({
    sendEach: mockSendEach,
  }));
  return {
    credential: { cert: jest.fn() },
    messaging: mockMessaging,
    apps: [],
    app: { App: jest.fn() },
    _mockSendEach: mockSendEach,
  };
});

const mockedAdmin = admin as any;

describe('FCM Delivery', () => {
  let mockSendEach: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSendEach = mockedAdmin._mockSendEach;
    process.env.FIREBASE_PROJECT_ID = 'test-project';
    process.env.FIREBASE_CLIENT_EMAIL = 'test@test-project.iam.gserviceaccount.com';
    process.env.FIREBASE_PRIVATE_KEY =
      '-----BEGIN PRIVATE KEY-----\nFAKE_KEY\n-----END PRIVATE KEY-----\n';
  });

  afterEach(() => {
    jest.resetModules();
  });

  function mockBatchResponse(responses: Array<{ success: boolean; error?: { code: string; message: string } }>) {
    mockSendEach.mockResolvedValue({
      responses,
      successCount: responses.filter((r) => r.success).length,
      failureCount: responses.filter((r) => !r.success).length,
    });
  }

  it('should deliver notifications to valid tokens', async () => {
    mockBatchResponse([{ success: true, error: undefined }]);

    const result = await deliverPushNotifications(
      ['token_1'],
      'Test Title',
      'Test Body',
    );

    expect(result.delivered).toEqual(['token_1']);
    expect(result.failed).toHaveLength(0);
    expect(result.invalid).toHaveLength(0);
    expect(mockSendEach).toHaveBeenCalledTimes(1);
  });

  it('should classify unregistered tokens as invalid', async () => {
    mockBatchResponse([
      {
        success: false,
        error: {
          code: 'messaging/registration-token-not-registered',
          message: 'Token is not registered',
        },
      },
    ]);

    const result = await deliverPushNotifications(
      ['bad_token'],
      'Test',
      'Body',
    );

    expect(result.invalid).toEqual(['bad_token']);
    expect(result.failed).toHaveLength(0);
  });

  it('should classify invalid-argument tokens as invalid', async () => {
    mockBatchResponse([
      {
        success: false,
        error: {
          code: 'messaging/invalid-argument',
          message: 'Invalid argument',
        },
      },
    ]);

    const result = await deliverPushNotifications(['bad_token'], 'Test', 'Body');

    expect(result.invalid).toEqual(['bad_token']);
    expect(result.failed).toHaveLength(0);
  });

  it('should classify server-unavailable errors as retryable (failed)', async () => {
    mockBatchResponse([
      {
        success: false,
        error: {
          code: 'messaging/server-unavailable',
          message: 'Server unavailable',
        },
      },
    ]);

    const result = await deliverPushNotifications(['retry_token'], 'Test', 'Body');

    expect(result.failed).toEqual(['retry_token']);
    expect(result.invalid).toHaveLength(0);
    expect(result.errors[0].error).toContain('messaging/server-unavailable');
  });

  it('should classify internal-error as retryable (failed)', async () => {
    mockBatchResponse([
      {
        success: false,
        error: {
          code: 'messaging/internal-error',
          message: 'Internal error',
        },
      },
    ]);

    const result = await deliverPushNotifications(['retry_token'], 'Test', 'Body');

    expect(result.failed).toEqual(['retry_token']);
    expect(result.invalid).toHaveLength(0);
  });

  it('should classify unknown errors as permanent (failed)', async () => {
    mockBatchResponse([
      {
        success: false,
        error: {
          code: 'messaging/unknown-error',
          message: 'Unknown error',
        },
      },
    ]);

    const result = await deliverPushNotifications(['perm_token'], 'Test', 'Body');

    expect(result.failed).toEqual(['perm_token']);
    expect(result.invalid).toHaveLength(0);
  });

  it('should handle multi-token partial success', async () => {
    mockBatchResponse([
      { success: true, error: undefined },
      {
        success: false,
        error: {
          code: 'messaging/registration-token-not-registered',
          message: 'Unregistered',
        },
      },
      {
        success: false,
        error: {
          code: 'messaging/server-unavailable',
          message: 'Server unavailable',
        },
      },
    ]);

    const result = await deliverPushNotifications(
      ['token_a', 'token_b', 'token_c'],
      'Multi',
      'Body',
    );

    expect(result.delivered).toEqual(['token_a']);
    expect(result.invalid).toEqual(['token_b']);
    expect(result.failed).toEqual(['token_c']);
  });

  it('should skip empty or invalid tokens as invalid', async () => {
    mockBatchResponse([{ success: true, error: undefined }]);

    const result = await deliverPushNotifications(
      ['', 'valid_token'],
      'Test',
      'Body',
    );

    expect(result.invalid).toContain('');
    expect(result.delivered).toContain('valid_token');
  });

  it('should convert non-string data payload values to strings', async () => {
    mockBatchResponse([{ success: true, error: undefined }]);

    await deliverPushNotifications(
      ['token_1'],
      'Test',
      'Body',
      { count: 42, active: true, name: 'test' },
      'channel_1',
    );

    expect(mockSendEach).toHaveBeenCalledTimes(1);
  });

  it('should batch tokens in groups of 500', async () => {
    const tokens: string[] = Array.from({ length: 501 }, (_, i) => `token_${i}`);
    mockBatchResponse(tokens.map(() => ({ success: true, error: undefined })));

    const result = await deliverPushNotifications(tokens, 'Batch', 'Body');

    expect(mockSendEach).toHaveBeenCalledTimes(2);
    expect(result.delivered).toHaveLength(501);
  });
});
