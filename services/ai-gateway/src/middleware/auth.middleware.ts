import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    studentId: string;
    role: string;
  };
}

export const authenticateStudent = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const secret = process.env.JWT_ACCESS_SECRET;

  if (token && secret) {
    try {
      const decoded = jwt.verify(token, secret);
      if (typeof decoded !== 'string') {
        const payload = decoded as JwtPayload & { role?: string };
        const userId = payload.sub;
        const role = payload.role?.toLowerCase();

        if (userId && role === 'student') {
          req.user = { userId, studentId: userId, role };
          return next();
        }
      }
    } catch {
      // Continue to the uniform unauthorized response below.
    }
  }

  const allowDevIdentity =
    process.env.NODE_ENV !== 'production' && process.env.AI_GATEWAY_ALLOW_DEV_IDENTITY === 'true';
  const devStudentId = req.headers['x-student-id'];
  if (allowDevIdentity && typeof devStudentId === 'string' && devStudentId.trim()) {
    req.user = {
      userId: `user-${devStudentId.trim()}`,
      studentId: devStudentId.trim(),
      role: 'student',
    };
    return next();
  }

  if (!secret) {
    return res.status(503).json({ error: 'AI gateway authentication is not configured' });
  }

  return res.status(401).json({ error: 'A valid student access token is required' });
};
