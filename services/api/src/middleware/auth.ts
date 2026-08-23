import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'shikkhok-secret-key-change-in-production';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      statusCode: 401,
      errorCode: 'UNAUTHORIZED',
      message: 'Access token required',
      banglaMessage: 'অনুগ্রহ করে লগইন করুন।',
    });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({
      statusCode: 401,
      errorCode: 'INVALID_TOKEN',
      message: 'Invalid or expired token',
      banglaMessage: 'আপনার সেশনের মেয়াদ পার হয়ে গেছে। পুনরায় লগইন করুন।',
    });
  }
}
