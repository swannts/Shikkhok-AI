import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../modules/users/enums/user-role.enum';

export const ROLES_KEY = 'roles';

/**
 * Decorator to restrict endpoint access to specific user roles.
 * Usage: @Roles(UserRole.ADMIN, UserRole.TEACHER)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
