import { requireRoles } from '../shared/authorization.middleware';

describe('Isolated Admin Route Authorization Guard', () => {
  it('blocks non-admin users (STUDENT / TEACHER / PARENT) from accessing admin routes', () => {
    const req = {
      user: { userId: 'student-user-1', role: 'STUDENT' },
    } as any;

    let resStatus = 0;
    let resBody: any = null;

    const res = {
      status: (code: number) => {
        resStatus = code;
        return {
          json: (data: any) => {
            resBody = data;
          },
        };
      },
    } as any;

    const next = jest.fn();
    const guard = requireRoles(['ADMIN']);

    guard(req, res, next);

    expect(resStatus).toBe(403);
    expect(resBody.errorCode).toBe('FORBIDDEN');
    expect(next).not.toHaveBeenCalled();
  });

  it('allows ADMIN users to access admin routes', () => {
    const req = {
      user: { userId: 'admin-user-1', role: 'ADMIN' },
    } as any;

    const res = {} as any;
    const next = jest.fn();
    const guard = requireRoles(['ADMIN']);

    guard(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
