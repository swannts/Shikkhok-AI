import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './authorization.middleware';

/**
 * 3. Class-Scoped Teacher Authorization Guard
 * Ensures a teacher can ONLY access classes/students within their authorized `managedClassIds`.
 */
export const verifyTeacherClassOwnership = (requestedClassIdParam: string = 'classId') => {
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

    // Admins bypass class scoping
    if (user.role === 'ADMIN') {
      return next();
    }

    if (user.role !== 'TEACHER') {
      return res.status(403).json({
        statusCode: 403,
        errorCode: 'FORBIDDEN',
        message: 'Access denied: Requires teacher authorization',
        banglaMessage: 'শুধুমাত্র শিক্ষকদের জন্য এই সুবিধা প্রযোজ্য।',
      });
    }

    const requestedClassId = (req.params[requestedClassIdParam] || req.query[requestedClassIdParam] || req.body[requestedClassIdParam]) as string;
    const managedClasses = user.managedClassIds || [];

    if (requestedClassId && !managedClasses.includes(requestedClassId)) {
      return res.status(403).json({
        statusCode: 403,
        errorCode: 'TEACHER_CLASS_UNAUTHORIZED',
        message: 'Access denied: You are not authorized to manage or view this class',
        banglaMessage: 'আপনি এই ক্লাসের দায়িত্বপ্রাপ্ত শিক্ষক নন।',
        details: {
          requestedClassId,
          managedClasses,
        },
      });
    }

    return next();
  };
};
