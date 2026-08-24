import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole } from '../enums/user-role.enum';
import { UserStatus } from '../enums/user-status.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({
  collection: 'users',
  timestamps: true,
  toJSON: {
    // Security: never expose passwordHash in JSON serialization
    transform(_doc: any, ret: Record<string, any>) {
      delete ret.passwordHash;
      delete ret.__v;
      return ret;
    },
  },
})
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({
    type: String,
    required: false,
    lowercase: true,
    trim: true,
    // Sparse: allows multiple null values while enforcing uniqueness for non-null
    index: { unique: true, sparse: true },
  })
  email?: string;

  @Prop({
    type: String,
    required: false,
    trim: true,
    // Sparse unique index — phone is optional but must be unique when provided
    index: { unique: true, sparse: true },
  })
  phone?: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({
    required: true,
    enum: Object.values(UserRole),
    default: UserRole.STUDENT,
  })
  role: UserRole;

  @Prop({
    required: true,
    enum: Object.values(UserStatus),
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  // Populated by timestamps: true
  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

/**
 * Pre-save hook: normalize Bangladeshi phone numbers to +880 prefix.
 * Strips spaces, dashes, and leading zeros to ensure consistent storage.
 */
UserSchema.pre('save', function (next) {
  if (this.isModified('phone') && this.phone) {
    let normalized = this.phone.replace(/[\s\-()]/g, '');
    // Convert local 01x format to international +880
    if (normalized.startsWith('01') && normalized.length === 11) {
      normalized = '+880' + normalized.substring(1);
    } else if (normalized.startsWith('880') && !normalized.startsWith('+880')) {
      normalized = '+' + normalized;
    }
    this.phone = normalized;
  }

  if (this.isModified('email') && this.email) {
    this.email = this.email.toLowerCase().trim();
  }

  next();
});
