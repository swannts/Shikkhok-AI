import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type ParentProfileDocument = HydratedDocument<ParentProfile>;

@Schema({
  collection: 'parent_profiles',
  timestamps: true,
  toJSON: {
    transform(_doc: any, ret: Record<string, any>) {
      ret.userId = ret.userId?.toString?.() ?? ret.userId;
      ret.linkedStudentIds = (ret.linkedStudentIds ?? []).map((id: any) => id?.toString?.() ?? id);
      delete ret.__v;
      return ret;
    },
  },
})
export class ParentProfile {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ trim: true })
  displayName?: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true })
  homeDistrict?: string;

  @Prop({ trim: true })
  relationNote?: string;

  @Prop({ type: [Types.ObjectId], ref: User.name, default: [] })
  linkedStudentIds: Types.ObjectId[];

  createdAt: Date;
  updatedAt: Date;
}

export const ParentProfileSchema = SchemaFactory.createForClass(ParentProfile);
