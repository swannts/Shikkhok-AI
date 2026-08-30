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
import { AiModerationService } from './services/ai-moderation.service';
import { OutputSafetyService } from './services/output-safety.service';
import { CitationValidatorService } from './services/citation-validator.service';
import { AiMetricsService } from './services/ai-metrics.service';

import { AiGatewayModule } from '../ai-gateway/ai-gateway.module';

@Module({
  imports: [
    AiGatewayModule,
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
  providers: [
    TutorConversationRepository,
    TutorMessageRepository,
    AiModerationService,
    OutputSafetyService,
    CitationValidatorService,
    AiMetricsService,
    TutorGatewayService,
    TutorService,
  ],
  exports: [
    AiModerationService,
    OutputSafetyService,
    CitationValidatorService,
    AiMetricsService,
    TutorGatewayService,
    TutorService,
  ],
})
export class TutorModule {}
