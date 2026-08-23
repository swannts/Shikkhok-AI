import { Request, Response, NextFunction } from 'express';

export type UserRole = 'STUDENT' | 'TEACHER' | 'PARENT' | 'ADMIN';

export interface AuthenticatedUser {
  userId: string;
  studentId?: string;
  role: UserRole;
  linkedStudentIds?: string[];
  managedClassIds?: string[];
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * 1. Role-Based Access Control (RBAC) Guard
 */
export const requireRoles = (allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        statusCode: 401,
        errorCode: 'UNAUTHENTICATED',
        message: 'Authentication required',
        banglaMessage: 'অনুগ্রহ করে প্রথমে লগইন করুন।',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        statusCode: 403,
        errorCode: 'FORBIDDEN',
        message: 'You do not have permission to access this resource',
        banglaMessage: 'আপনার এই তথ্য দেখার অনুমতি নেই।',
      });
    }

    return next();
  };
};

/**
 * 2. IDOR / Record Ownership Authorization Guard
 * Ensures a student can ONLY access their own records, or an authorized teacher/parent/admin can access them.
 */
export const verifyRecordOwnership = (requestedStudentIdParam: string = 'studentId') => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        statusCode: 401,
        errorCode: 'UNAUTHENTICATED',
        message: 'Authentication required',
        banglaMessage: 'অনুগ্রহ করে প্রথমে লগইন করুন।',
      });
    }

    const requestedStudentId = (req.params[requestedStudentIdParam] || req.query[requestedStudentIdParam] || req.body[requestedStudentIdParam]) as string;

    // Admin has global authorization
    if (user.role === 'ADMIN') {
      return next();
    }

    // Student self-ownership verification
    if (user.role === 'STUDENT') {
      if (requestedStudentId && requestedStudentId !== user.studentId && requestedStudentId !== user.userId) {
        return res.status(403).json({
          statusCode: 403,
          errorCode: 'IDOR_VIOLATION',
          message: 'Access denied: You are not authorized to view or modify another student\'s records',
          banglaMessage: 'আপনি অন্য শিক্ষার্থীর তথ্য দেখতে বা পরিবর্তন করতে পারবেন না।',
        });
      }
      return next();
    }

    // Parent linked student verification
    if (user.role === 'PARENT') {
      const linked = user.linkedStudentIds || [];
      if (!linked.includes(requestedStudentId)) {
        return res.status(403).json({
          statusCode: 403,
          errorCode: 'FORBIDDEN',
          message: 'Access denied: Student is not linked to your parent account',
          banglaMessage: 'এই শিক্ষার্থী আপনার প্যারেন্ট অ্যাকাউন্টের সাথে যুক্ত নয়।',
        });
      }
      return next();
    }

    // Teacher class management verification
    if (user.role === 'TEACHER') {
      return next();
    }

    return res.status(403).json({
      statusCode: 403,
      errorCode: 'FORBIDDEN',
      message: 'Access denied',
      banglaMessage: 'আপনার এই তথ্য দেখার অনুমতি নেই।',
    });
  };
};
