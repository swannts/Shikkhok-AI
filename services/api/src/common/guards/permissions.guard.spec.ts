import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { AdminPermission } from '../enums/admin-permission.enum';
import { UserRole } from '../../modules/users/enums/user-role.enum';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  function createMockExecutionContext(user: any): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('allows access if no permissions are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockExecutionContext({ role: UserRole.ADMIN });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('throws ForbiddenException if user is not authenticated', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([AdminPermission.CURRICULUM_READ]);
    const context = createMockExecutionContext(null);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException if user is not an admin', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([AdminPermission.CURRICULUM_READ]);
    const context = createMockExecutionContext({
      role: UserRole.STUDENT,
      permissions: [AdminPermission.CURRICULUM_READ],
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('allows full admin with empty permissions array (backward compatibility)', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([AdminPermission.CURRICULUM_READ]);
    const context = createMockExecutionContext({
      role: UserRole.ADMIN,
      permissions: [],
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows admin with wildcard * permission', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([AdminPermission.PAYMENTS_MANAGE]);
    const context = createMockExecutionContext({
      role: UserRole.ADMIN,
      permissions: ['*'],
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows admin when having all required permissions', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([
        AdminPermission.CURRICULUM_READ,
        AdminPermission.CURRICULUM_WRITE,
      ]);
    const context = createMockExecutionContext({
      role: UserRole.ADMIN,
      permissions: [
        AdminPermission.CURRICULUM_READ,
        AdminPermission.CURRICULUM_WRITE,
      ],
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('throws ForbiddenException when admin is missing a required permission', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([
        AdminPermission.CURRICULUM_READ,
        AdminPermission.CURRICULUM_WRITE,
      ]);
    const context = createMockExecutionContext({
      role: UserRole.ADMIN,
      permissions: [AdminPermission.CURRICULUM_READ],
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});

