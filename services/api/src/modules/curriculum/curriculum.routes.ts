import { Router } from 'express';
import { curriculumController } from './curriculum.controller';

const router = Router();

router.get('/subjects', curriculumController.getSubjects);
router.get('/subjects/:subjectId/chapters', curriculumController.getChapters);

export default router;
