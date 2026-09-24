import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const mockAuthService = {
      logout: jest.fn(),
      logoutAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  describe('logout', () => {
    it('should revoke only the session matching the refresh token', async () => {
      const user = { userId: 'user-1', role: 'STUDENT' };
      const dto = { refreshToken: 'valid-refresh-token' };

      const result = await controller.logout(user, dto);

      expect(authService.logout).toHaveBeenCalledWith('valid-refresh-token', 'user-1');
      expect(authService.logoutAll).not.toHaveBeenCalled();
      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });

  describe('logoutAll', () => {
    it('should revoke all active sessions for the user', async () => {
      const user = { userId: 'user-1', role: 'STUDENT' };

      const result = await controller.logoutAll(user);

      expect(authService.logoutAll).toHaveBeenCalledWith('user-1');
      expect(authService.logout).not.toHaveBeenCalled();
      expect(result).toEqual({ message: 'All sessions have been revoked' });
    });
  });
});
