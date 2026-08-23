import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticateToken } from '../../middleware/auth';
import { rateLimiters } from '../../shared/rateLimiter.middleware';

const router = Router();

router.post('/signup', rateLimiters.signup, authController.signup);
router.post('/verify-otp', rateLimiters.otpVerify, authController.verifyOtp);
router.post('/resend-otp', rateLimiters.otpResend, authController.resendOtp);
router.post('/forgot-password', rateLimiters.passwordReset, authController.forgotPassword);
router.post('/reset-password', rateLimiters.passwordReset, authController.resetPassword);
router.post('/login', rateLimiters.login, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticateToken, authController.me);

export default router;

