import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Subject } from '../../curriculum/schemas/subject.schema';

export type ClassroomDocument = HydratedDocument<Classroom>;

@Schema({
  collection: 'classrooms',
  timestamps: true,
  toJSON: {
    transform(_doc: any, ret: Record<string, any>) {
      ret.teacherId = ret.teacherId?.toString?.() ?? ret.teacherId;
      ret.subjectId = ret.subjectId?.toString?.() ?? ret.subjectId;
      delete ret.__v;
      return ret;
    },
  },
})
export class Classroom {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  teacherId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, uppercase: true, trim: true, index: true })
  code: string;

  @Prop({ type: Number, required: true, min: 1, max: 12, index: true })
  classLevel: number;

  @Prop({ required: true, trim: true, default: 'bangla', index: true })
  medium: string;

  @Prop({ type: Number, required: true, min: 2020, max: 2100, default: 2026 })
  curriculumYear: number;

  @Prop({ type: Types.ObjectId, ref: Subject.name, required: false, default: null })
  subjectId?: Types.ObjectId | null;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: Boolean, default: true, index: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const ClassroomSchema = SchemaFactory.createForClass(Classroom);
ClassroomSchema.index({ teacherId: 1, isActive: 1 });
ClassroomSchema.index({ classLevel: 1, medium: 1, isActive: 1 });
