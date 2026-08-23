import { Request, Response, NextFunction } from 'express';
import { curriculumService } from './curriculum.service';
import { getSubjectsQuerySchema, getChaptersParamsSchema } from './curriculum.schemas';

export class CurriculumController {
  async getSubjects(req: Request, res: Response, next: NextFunction) {
    try {
      const query = getSubjectsQuerySchema.parse(req.query);
      const subjects = await curriculumService.getSubjects(query.classId);
      return res.json(subjects);
    } catch (err) {
      next(err);
    }
  }

  async getChapters(req: Request, res: Response, next: NextFunction) {
    try {
      const params = getChaptersParamsSchema.parse(req.params);
      const chapters = await curriculumService.getChapters(params.subjectId);
      return res.json(chapters);
    } catch (err) {
      next(err);
    }
  }
}

export const curriculumController = new CurriculumController();
