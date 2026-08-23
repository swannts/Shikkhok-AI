import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import curriculumRoutes from './routes/curriculum';
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

// API Routes Namespace
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/curriculum', curriculumRoutes);
app.use('/api/v1/practice', practiceRoutes);
app.use('/api/v1/progress', progressRoutes);
app.use('/api/v1/study-plan', studyPlanRoutes);
app.use('/api/v1/homework', homeworkRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[API Error]:', err);
  res.status(500).json({
    statusCode: 500,
    errorCode: 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected error occurred',
    banglaMessage: 'একটি কারিগরি ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Shikkhok AI Main API running on http://localhost:${PORT}`);
});
