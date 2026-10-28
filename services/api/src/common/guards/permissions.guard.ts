import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { AdminPermission } from '../enums/admin-permission.enum';
import { UserRole } from '../../modules/users/enums/user-role.enum';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<AdminPermission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no @RequirePermissions() decorator is present, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied. Authentication required.');
    }

    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Access denied. Admin role required.');
    }

    const userPermissions: string[] = user.permissions || [];

    // Full admin without granular restrictions or wildcard '*' has full access
    if (userPermissions.length === 0 || userPermissions.includes('*')) {
      return true;
    }

    const missing = requiredPermissions.filter(
      (perm) => !userPermissions.includes(perm),
    );

    if (missing.length > 0) {
      throw new ForbiddenException(
        `Access denied. Missing required permission(s): ${missing.join(', ')}`,
      );
    }

    return true;
  }
}

