import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'shikkhok-secret-key-change-in-production';

// Mock DB store fallback for instant execution without live database
const mockUser = {
  id: 'student-1',
  phoneOrEmail: 'user@example.com',
  passwordHash: '$2a$10$e8w8GgH1uA1Uu/jM0fL/z.P8jLp0z.P8jLp0z.P8jLp0z.P8jLp0',
  name: 'রাফি আহমেদ',
  classId: 'class-8',
  className: 'Class 8',
  language: 'bn' as const,
};

router.post('/login', async (req: Request, res: Response) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({
      statusCode: 400,
      errorCode: 'MISSING_FIELDS',
      message: 'Identifier and password are required',
      banglaMessage: 'ইমেইল বা ফোন নম্বর এবং পাসওয়ার্ড প্রদান করুন।',
    });
  }

  const token = jwt.sign({ userId: mockUser.id, role: 'STUDENT' }, JWT_SECRET, { expiresIn: '7d' });

  return res.json({
    token,
    user: {
      id: mockUser.id,
      name: mockUser.name,
      classId: mockUser.classId,
      className: mockUser.className,
      language: mockUser.language,
    },
  });
});

router.post('/signup', async (req: Request, res: Response) => {
  const { name, phoneOrEmail, password, classId } = req.body;

  if (!name || !phoneOrEmail || !password) {
    return res.status(400).json({
      statusCode: 400,
      errorCode: 'MISSING_FIELDS',
      message: 'Name, phoneOrEmail, and password are required',
    });
  }

  return res.json({
    status: 'OTP_SENT',
    message: 'OTP code sent to ' + phoneOrEmail,
    referenceId: 'ref-12345',
  });
});

router.post('/verify-otp', async (req: Request, res: Response) => {
  const { otp } = req.body;

  if (!otp || otp.length !== 6) {
    return res.status(400).json({
      statusCode: 400,
      errorCode: 'INVALID_OTP',
      message: 'Invalid 6-digit OTP code',
      banglaMessage: '৬ সংখ্যার সঠিক ওটিপি কোড প্রবেশ করুন।',
    });
  }

  const token = jwt.sign({ userId: mockUser.id, role: 'STUDENT' }, JWT_SECRET, { expiresIn: '7d' });

  return res.json({
    token,
    user: {
      id: mockUser.id,
      name: mockUser.name,
      classId: mockUser.classId,
      className: mockUser.className,
      language: mockUser.language,
    },
  });
});

export default router;
