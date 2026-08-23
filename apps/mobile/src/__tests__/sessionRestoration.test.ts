import { useAuthStore } from '../store/useAuthStore';
import { tokenStorage } from '../services/tokenStorage';

describe('Mobile Session Restoration Flow', () => {
  beforeEach(async () => {
    await tokenStorage.clearTokens();
    useAuthStore.setState({ status: 'unknown', user: null });
  });

  test('restoreSession sets unauthenticated when no access token exists', async () => {
    await useAuthStore.getState().restoreSession();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(useAuthStore.getState().user).toBeNull();
  });

  test('restoreSession performs GET /auth/me and hydrates user when valid token exists', async () => {
    await tokenStorage.setAccessToken('mock-valid-access-token');
    await useAuthStore.getState().restoreSession();

    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(useAuthStore.getState().user?.name).toBe('রাফি আহমেদ');
  });

  test('setUnauthenticated clears secure storage and resets status', async () => {
    await tokenStorage.setAccessToken('mock-access-token');
    await tokenStorage.setRefreshToken('mock-refresh-token');

    await useAuthStore.getState().setUnauthenticated();

    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(useAuthStore.getState().user).toBeNull();

    const token = await tokenStorage.getAccessToken();
    expect(token).toBeNull();
  });
});
