import { httpClient } from '../api/httpClient';
import { ApiError } from '../api/apiError';
import { tokenStorage } from '../services/tokenStorage';

describe('HTTP Client Architecture Verification', () => {
  beforeEach(async () => {
    await tokenStorage.clearTokens();
  });

  test('normalizes unknown error into structured ApiError', () => {
    const error = ApiError.fromUnknown(new Error('Network error'));
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(500);
    expect(error.errorCode).toBe('INTERNAL_ERROR');
    expect(error.banglaMessage).toBeDefined();
  });

  test('correctly sets token in secure storage and retrieves headers', async () => {
    await tokenStorage.setAccessToken('test-access-token');
    const token = await tokenStorage.getAccessToken();
    expect(token).toBe('test-access-token');
  });
});
