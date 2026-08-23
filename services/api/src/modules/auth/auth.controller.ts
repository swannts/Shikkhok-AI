import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { signupSchema, verifyOtpSchema, loginSchema, refreshTokenSchema } from './auth.schemas';
import { AuthenticatedRequest } from '../../middleware/auth';

export class AuthController {
  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const input = signupSchema.parse(req.body);
      const result = await authService.signup(input);
      return res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const input = verifyOtpSchema.parse(req.body);
      const result = await authService.verifyOtp(input);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const input = loginSchema.parse(req.body);
      const result = await authService.login(input);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const input = refreshTokenSchema.parse(req.body);
      const result = await authService.refreshToken(input.refreshToken);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body || {};
      const result = await authService.logout(refreshToken);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async me(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ statusCode: 401, errorCode: 'UNAUTHORIZED', message: 'Unauthorized' });
      }
      const user = await authService.getCurrentUser(userId);
      return res.json(user);
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
