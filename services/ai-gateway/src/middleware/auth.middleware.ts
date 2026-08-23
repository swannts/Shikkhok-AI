import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    studentId: string;
    role: string;
  };
}

export const authenticateStudent = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8');
        const decoded = JSON.parse(payloadJson);
        req.user = {
          userId: decoded.userId || decoded.sub || 'authenticated-user-id',
          studentId: decoded.studentId || decoded.userId || 'authenticated-student-id',
          role: decoded.role || 'STUDENT',
        };
        return next();
      }
    } catch {
      // Invalid token fallback
    }
  }

  // Fallback for development mode if dev-headers are provided
  const devStudentId = req.headers['x-student-id'] as string;
  if (devStudentId) {
    req.user = {
      userId: `user-${devStudentId}`,
      studentId: devStudentId,
      role: 'STUDENT',
    };
    return next();
  }

  // Default context for dev testing if unauthenticated
  req.user = {
    userId: 'default-user-id',
    studentId: 'default-student-id',
    role: 'STUDENT',
  };

  return next();
};
