import express from 'express';
import cors from 'cors';
import { ZodError } from 'zod';
import authRoutes from './modules/auth/auth.routes';
import curriculumRoutes from './modules/curriculum/curriculum.routes';
import practiceRoutes from './routes/practice';
import progressRoutes from './routes/progress';
import studyPlanRoutes from './routes/studyPlan';
import homeworkRoutes from './routes/homework';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Shikkhok AI Main API', timestamp: new Date() });
});

// Modular Monolith Domain API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/curriculum', curriculumRoutes);
app.use('/api/v1/practice', practiceRoutes);
app.use('/api/v1/progress', progressRoutes);
app.use('/api/v1/study-plan', studyPlanRoutes);
app.use('/api/v1/homework', homeworkRoutes);

// Structured Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      statusCode: 400,
      errorCode: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      banglaMessage: 'প্রদত্ত তথ্য সঠিক নয়।',
      details: err.flatten().fieldErrors,
    });
  }

  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected error occurred';
  const banglaMessage = err.banglaMessage || 'একটি কারিগরি ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।';

  if (statusCode === 500) {
    console.error('[Internal Error]:', err);
  }

  res.status(statusCode).json({
    statusCode,
    errorCode,
    message,
    banglaMessage,
    details: err.details || undefined,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Shikkhok AI Main API running on http://localhost:${PORT}`);
});
