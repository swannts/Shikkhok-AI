import { Router } from 'express';
import { curriculumController } from './curriculum.controller';
import { validateRequest } from '../../shared/validateRequest.middleware';
import { getSubjectsQuerySchema, getChaptersParamsSchema } from './curriculum.schemas';

const router = Router();

router.get('/subjects', validateRequest({ query: getSubjectsQuerySchema }), curriculumController.getSubjects);
router.get('/subjects/:subjectId/chapters', validateRequest({ params: getChaptersParamsSchema }), curriculumController.getChapters);

export default router;

