import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Classroom } from './classroom.schema';
import { User } from '../../users/schemas/user.schema';
import { ClassroomRole } from '../enums/classroom-role.enum';

export type ClassroomMemberDocument = HydratedDocument<ClassroomMember>;

@Schema({
  collection: 'classroom_members',
  timestamps: true,
  toJSON: {
    transform(_doc: any, ret: Record<string, any>) {
      ret.classroomId = ret.classroomId?.toString?.() ?? ret.classroomId;
      ret.studentId = ret.studentId?.toString?.() ?? ret.studentId;
      delete ret.__v;
      return ret;
    },
  },
})
export class ClassroomMember {
  @Prop({ type: Types.ObjectId, ref: Classroom.name, required: true, index: true })
  classroomId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  studentId: Types.ObjectId;

  @Prop({
    required: true,
    enum: Object.values(ClassroomRole),
    default: ClassroomRole.STUDENT,
  })
  role: ClassroomRole;

  @Prop({ type: Date, default: () => new Date() })
  joinedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const ClassroomMemberSchema = SchemaFactory.createForClass(ClassroomMember);
ClassroomMemberSchema.index({ classroomId: 1, studentId: 1 }, { unique: true });
ClassroomMemberSchema.index({ studentId: 1, joinedAt: -1 });
