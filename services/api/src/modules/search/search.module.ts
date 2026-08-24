import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { StudentsModule } from '../students/students.module';
import { Subject, SubjectSchema } from '../curriculum/schemas/subject.schema';
import { Chapter, ChapterSchema } from '../curriculum/schemas/chapter.schema';
import { Lesson, LessonSchema } from '../curriculum/schemas/lesson.schema';
import { Textbook, TextbookSchema } from '../textbooks/schemas/textbook.schema';
import {
  PracticeQuestion,
  PracticeQuestionSchema,
} from '../practice/schemas/practice-question.schema';
import { SearchQueryLog, SearchQueryLogSchema } from './schemas/search-query-log.schema';
import { SearchQueryLogRepository } from './repositories/search-query-log.repository';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';

@Module({
  imports: [
    UsersModule,
    StudentsModule,
    MongooseModule.forFeature([
      { name: Subject.name, schema: SubjectSchema },
      { name: Chapter.name, schema: ChapterSchema },
      { name: Lesson.name, schema: LessonSchema },
      { name: Textbook.name, schema: TextbookSchema },
      { name: PracticeQuestion.name, schema: PracticeQuestionSchema },
      { name: SearchQueryLog.name, schema: SearchQueryLogSchema },
    ]),
  ],
  controllers: [SearchController],
  providers: [SearchQueryLogRepository, SearchService],
  exports: [SearchService, SearchQueryLogRepository],
})
export class SearchModule {}
