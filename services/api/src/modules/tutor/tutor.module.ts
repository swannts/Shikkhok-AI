import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { StudentsModule } from '../students/students.module';
import { CurriculumModule } from '../curriculum/curriculum.module';
import { ProgressModule } from '../progress/progress.module';
import { StudyPlanModule } from '../study-plan/study-plan.module';
import { TutorConversation, TutorConversationSchema } from './schemas/tutor-conversation.schema';
import { TutorMessage, TutorMessageSchema } from './schemas/tutor-message.schema';
import { TutorConversationRepository } from './repositories/tutor-conversation.repository';
import { TutorMessageRepository } from './repositories/tutor-message.repository';
import { TutorService } from './tutor.service';
import { TutorController } from './tutor.controller';
import { TutorGatewayService } from './tutor-gateway.service';

@Module({
  imports: [
    UsersModule,
    StudentsModule,
    CurriculumModule,
    ProgressModule,
    StudyPlanModule,
    MongooseModule.forFeature([
      { name: TutorConversation.name, schema: TutorConversationSchema },
      { name: TutorMessage.name, schema: TutorMessageSchema },
    ]),
  ],
  controllers: [TutorController],
  providers: [TutorConversationRepository, TutorMessageRepository, TutorGatewayService, TutorService],
})
export class TutorModule {}
