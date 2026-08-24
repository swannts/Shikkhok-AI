import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ClassroomAssignment } from './classroom-assignment.schema';
import { Classroom } from './classroom.schema';
import { User } from '../../users/schemas/user.schema';
import { SubmissionStatus } from '../enums/submission-status.enum';

export type ClassroomSubmissionDocument = HydratedDocument<ClassroomSubmission>;

@Schema({
  collection: 'classroom_submissions',
  timestamps: true,
  toJSON: {
    transform(_doc: any, ret: Record<string, any>) {
      ret.assignmentId = ret.assignmentId?.toString?.() ?? ret.assignmentId;
      ret.classroomId = ret.classroomId?.toString?.() ?? ret.classroomId;
      ret.studentId = ret.studentId?.toString?.() ?? ret.studentId;
      delete ret.__v;
      return ret;
    },
  },
})
export class ClassroomSubmission {
  @Prop({ type: Types.ObjectId, ref: ClassroomAssignment.name, required: true, index: true })
  assignmentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Classroom.name, required: true, index: true })
  classroomId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  studentId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  content: string;

  @Prop({ type: [String], default: [] })
  attachmentUrls: string[];

  @Prop({ type: Date, default: () => new Date() })
  submittedAt: Date;

  @Prop({
    required: true,
    enum: Object.values(SubmissionStatus),
    default: SubmissionStatus.SUBMITTED,
    index: true,
  })
  status: SubmissionStatus;

  @Prop({ type: Number, min: 0, default: null })
  score?: number | null;

  @Prop({ trim: true, default: null })
  teacherFeedback?: string | null;

  @Prop({ type: Date, default: null })
  gradedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export const ClassroomSubmissionSchema = SchemaFactory.createForClass(ClassroomSubmission);
ClassroomSubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });
ClassroomSubmissionSchema.index({ classroomId: 1, status: 1 });
