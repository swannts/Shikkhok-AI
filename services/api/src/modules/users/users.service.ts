import { Injectable, Logger } from '@nestjs/common';
import { UserRepository } from './repositories/user.repository';
import { UserDocument } from './schemas/user.schema';

/**
 * UsersService provides read-only user operations for other modules.
 * Authentication logic (register, login) lives in AuthService, not here.
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly userRepository: UserRepository) {}

  async findById(id: string): Promise<UserDocument | null> {
    return this.userRepository.findById(id);
  }

  /**
   * Look up a user by email or phone number.
   * Used by AuthService during login to support both identifiers.
   */
  async findByEmailOrPhone(identifier: string): Promise<UserDocument | null> {
    // Simple heuristic: if it contains @ it's an email, otherwise treat as phone
    if (identifier.includes('@')) {
      return this.userRepository.findByEmail(identifier);
    }
    return this.userRepository.findByPhone(identifier);
  }
}
