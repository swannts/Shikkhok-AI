import { Router } from 'express';
import { progressController } from './progress.controller';
import { authenticateToken } from '../../middleware/auth';

const router = Router();

router.get('/summary', authenticateToken, progressController.getSummary);
router.post('/lesson/:lessonId/complete', authenticateToken, progressController.markLessonComplete);
router.get('/lesson/:lessonId', authenticateToken, progressController.getLessonProgress);

export default router;
