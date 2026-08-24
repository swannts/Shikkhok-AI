import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RefreshSession, RefreshSessionDocument } from '../schemas/refresh-session.schema';

/**
 * RefreshSessionRepository manages refresh token sessions in MongoDB.
 * Sessions are automatically cleaned up by the TTL index on expiresAt.
 */
@Injectable()
export class RefreshSessionRepository {
  constructor(
    @InjectModel(RefreshSession.name)
    private readonly sessionModel: Model<RefreshSessionDocument>,
  ) {}

  async createSession(data: {
    userId: Types.ObjectId;
    tokenHash: string;
    deviceId?: string;
    deviceName?: string;
    expiresAt: Date;
  }): Promise<RefreshSessionDocument> {
    const session = new this.sessionModel(data);
    return session.save();
  }

  /**
   * Find a specific session that has not been revoked and has not expired.
   */
  async findActiveById(
    sessionId: string,
    userId: string,
  ): Promise<RefreshSessionDocument | null> {
    return this.sessionModel
      .findOne({
        _id: sessionId,
        userId: new Types.ObjectId(userId),
        revokedAt: null,
        expiresAt: { $gt: new Date() },
      })
      .exec();
  }

  /**
   * Revoke a single session by setting revokedAt timestamp.
   * Revoked sessions are kept for audit until TTL cleanup removes them.
   */
  async revokeSession(sessionId: string): Promise<void> {
    await this.sessionModel
      .updateOne({ _id: sessionId }, { revokedAt: new Date() })
      .exec();
  }

  /**
   * Revoke all active sessions for a user (logout-all).
   */
  async revokeAllByUserId(userId: string): Promise<void> {
    await this.sessionModel
      .updateMany(
        { userId: new Types.ObjectId(userId), revokedAt: null },
        { revokedAt: new Date() },
      )
      .exec();
  }
}
