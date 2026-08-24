import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { StudentMedium } from '../enums/student-medium.enum';
import { User } from '../../users/schemas/user.schema';

export type StudentProfileDocument = HydratedDocument<StudentProfile>;

@Schema({
  collection: 'student_profiles',
  timestamps: true,
  toJSON: {
    transform(_doc: any, ret: Record<string, any>) {
      ret.userId = ret.userId?.toString?.() ?? ret.userId;
      delete ret.__v;
      return ret;
    },
  },
})
export class StudentProfile {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 12 })
  classLevel: number;

  @Prop({ required: true, enum: Object.values(StudentMedium) })
  medium: StudentMedium;

  @Prop({ required: true, min: 2020, max: 2100 })
  curriculumYear: number;

  @Prop({ trim: true })
  schoolName?: string;

  @Prop({ trim: true })
  district?: string;

  @Prop({ trim: true })
  upazila?: string;

  @Prop({ trim: true })
  board?: string;

  @Prop({ trim: true })
  academicStream?: string;

  @Prop({ trim: true })
  guardianPhone?: string;

  @Prop({ type: [String], default: [] })
  preferredSubjects: string[];

  @Prop({ type: [String], default: [] })
  learningGoals: string[];

  @Prop()
  dateOfBirth?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const StudentProfileSchema = SchemaFactory.createForClass(StudentProfile);
