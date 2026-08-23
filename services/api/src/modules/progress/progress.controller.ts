import { Response, NextFunction } from 'express';
import { progressService } from './progress.service';
import { completeLessonParamsSchema, completeLessonBodySchema } from './progress.schemas';
import { AuthenticatedRequest } from '../../middleware/auth';

export class ProgressController {
  async getSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const studentId = req.user?.userId || 'student-1';
      const summary = await progressService.getSummary(studentId);
      return res.json(summary);
    } catch (err) {
      next(err);
    }
  }

  async markLessonComplete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const studentId = req.user?.userId || 'student-1';
      const params = completeLessonParamsSchema.parse(req.params);
      const body = completeLessonBodySchema.parse(req.body);
      const result = await progressService.markLessonComplete(studentId, params.lessonId, body.progress);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getLessonProgress(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const studentId = req.user?.userId || 'student-1';
      const params = completeLessonParamsSchema.parse(req.params);
      const result = await progressService.getLessonProgress(studentId, params.lessonId);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const progressController = new ProgressController();
