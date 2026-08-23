import { authService } from '../modules/auth/auth.service';

describe('AuthService Production Verification', () => {
  test('signup generates reference ID for OTP verification', async () => {
    const res = await authService.signup({
      name: 'হাসান রিফাত',
      phoneOrEmail: '01711223344',
      password: 'password123',
      classId: 'class-8',
    });

    expect(res.status).toBe('OTP_SENT');
    expect(res.referenceId).toBeDefined();
    expect(res.referenceId.startsWith('ref-')).toBe(true);
  });

  test('verifyOtp succeeds with correct OTP code', async () => {
    const signupRes = await authService.signup({
      name: 'হাসান রিফাত',
      phoneOrEmail: '01711223355',
      password: 'password123',
      classId: 'class-8',
    });

    const verifyRes = await authService.verifyOtp({
      referenceId: signupRes.referenceId,
      otp: '123456',
    });

    expect(verifyRes.token).toBeDefined();
    expect(verifyRes.refreshToken).toBeDefined();
    expect(verifyRes.user.name).toBe('হাসান রিফাত');
  });

  test('verifyOtp throws error with incorrect OTP code', async () => {
    const signupRes = await authService.signup({
      name: 'হাসান রিফাত',
      phoneOrEmail: '01711223366',
      password: 'password123',
      classId: 'class-8',
    });

    await expect(
      authService.verifyOtp({
        referenceId: signupRes.referenceId,
        otp: '999999',
      })
    ).rejects.toMatchObject({
      errorCode: 'INVALID_OTP',
    });
  });
});
