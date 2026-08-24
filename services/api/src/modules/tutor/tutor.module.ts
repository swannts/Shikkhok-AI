import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { StudentsModule } from '../students/students.module';
import { CurriculumModule } from '../curriculum/curriculum.module';
import { ProgressModule } from '../progress/progress.module';
import { StudyPlanModule } from '../study-plan/study-plan.module';
import { TutorConversation, TutorConversationSchema } from './schemas/tutor-conversation.schema';
import { TutorConversationRepository } from './repositories/tutor-conversation.repository';
import { TutorService } from './tutor.service';
import { TutorController } from './tutor.controller';

@Module({
  imports: [
    UsersModule,
    StudentsModule,
    CurriculumModule,
    ProgressModule,
    StudyPlanModule,
    MongooseModule.forFeature([{ name: TutorConversation.name, schema: TutorConversationSchema }]),
  ],
  controllers: [TutorController],
  providers: [TutorConversationRepository, TutorService],
})
export class TutorModule {}
