import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { UserStatus } from '../enums/user-status.enum';

/**
 * UserRepository encapsulates all direct Mongoose operations for the users collection.
 * Controllers and other services must never access the User model directly.
 */
@Injectable()
export class UserRepository {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  async createUser(data: {
    name: string;
    email?: string;
    phone?: string;
    passwordHash: string;
    role: string;
  }): Promise<UserDocument> {
    const user = new this.userModel(data);
    return user.save();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  async findByPhone(phone: string): Promise<UserDocument | null> {
    // Normalize phone before query to match stored format
    let normalized = phone.replace(/[\s\-()]/g, '');
    if (normalized.startsWith('01') && normalized.length === 11) {
      normalized = '+880' + normalized.substring(1);
    } else if (normalized.startsWith('880') && !normalized.startsWith('+880')) {
      normalized = '+' + normalized;
    }
    return this.userModel.findOne({ phone: normalized }).exec();
  }

  async updateStatus(userId: string, status: UserStatus): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(userId, { status }, { new: true }).exec();
  }

  async updatePasswordHash(userId: string, passwordHash: string): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(userId, { passwordHash }, { new: true }).exec();
  }
}
