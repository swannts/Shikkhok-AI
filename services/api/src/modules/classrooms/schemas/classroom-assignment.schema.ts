import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Classroom } from './classroom.schema';
import { User } from '../../users/schemas/user.schema';
import { AssignmentType } from '../enums/assignment-type.enum';

export type ClassroomAssignmentDocument = HydratedDocument<ClassroomAssignment>;

@Schema({
  collection: 'classroom_assignments',
  timestamps: true,
  toJSON: {
    transform(_doc: any, ret: Record<string, any>) {
      ret.classroomId = ret.classroomId?.toString?.() ?? ret.classroomId;
      ret.teacherId = ret.teacherId?.toString?.() ?? ret.teacherId;
      delete ret.__v;
      return ret;
    },
  },
})
export class ClassroomAssignment {
  @Prop({ type: Types.ObjectId, ref: Classroom.name, required: true, index: true })
  classroomId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  teacherId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({
    required: true,
    enum: Object.values(AssignmentType),
    default: AssignmentType.HOMEWORK,
  })
  assignmentType: AssignmentType;

  @Prop({ trim: true, default: null })
  referenceId?: string | null;

  @Prop({ type: Date, required: true })
  dueDate: Date;

  @Prop({ type: Number, required: true, min: 1, default: 100 })
  maxScore: number;

  @Prop({ type: Boolean, default: true, index: true })
  isPublished: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const ClassroomAssignmentSchema = SchemaFactory.createForClass(ClassroomAssignment);
ClassroomAssignmentSchema.index({ classroomId: 1, dueDate: 1 });
