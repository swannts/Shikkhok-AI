import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CurriculumController } from './curriculum.controller';
import { CurriculumService } from './curriculum.service';
import { Subject, SubjectSchema } from './schemas/subject.schema';
import { Chapter, ChapterSchema } from './schemas/chapter.schema';
import { Lesson, LessonSchema } from './schemas/lesson.schema';
import { SubjectRepository } from './repositories/subject.repository';
import { ChapterRepository } from './repositories/chapter.repository';
import { LessonRepository } from './repositories/lesson.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subject.name, schema: SubjectSchema },
      { name: Chapter.name, schema: ChapterSchema },
      { name: Lesson.name, schema: LessonSchema },
    ]),
  ],
  controllers: [CurriculumController],
  providers: [SubjectRepository, ChapterRepository, LessonRepository, CurriculumService],
  exports: [CurriculumService, SubjectRepository, ChapterRepository, LessonRepository],
})
export class CurriculumModule {}
