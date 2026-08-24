import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { StudentProfile, StudentProfileSchema } from './schemas/student-profile.schema';
import { StudentProfileRepository } from './repositories/student-profile.repository';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([{ name: StudentProfile.name, schema: StudentProfileSchema }]),
  ],
  controllers: [StudentsController],
  providers: [StudentProfileRepository, StudentsService],
  exports: [StudentsService, StudentProfileRepository],
})
export class StudentsModule {}
