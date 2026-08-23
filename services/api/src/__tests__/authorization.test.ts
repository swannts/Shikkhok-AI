import { verifyRecordOwnership, requireRoles } from '../shared/authorization.middleware';

describe('Authorization & IDOR Protection Middleware', () => {
  it('blocks student A from accessing student B records (IDOR Protection)', () => {
    const req = {
      user: { userId: 'student-A-user-id', studentId: 'student-A', role: 'STUDENT' },
      params: { studentId: 'student-B' },
      query: {},
      body: {},
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

    const guard = verifyRecordOwnership('studentId');
    guard(req, res, next);

    expect(resStatus).toBe(403);
    expect(resBody.errorCode).toBe('IDOR_VIOLATION');
    expect(resBody.banglaMessage).toContain('অন্য শিক্ষার্থীর তথ্য');
    expect(next).not.toHaveBeenCalled();
  });

  it('allows student A to access their own records', () => {
    const req = {
      user: { userId: 'student-A-user-id', studentId: 'student-A', role: 'STUDENT' },
      params: { studentId: 'student-A' },
      query: {},
      body: {},
    } as any;

    const res = {} as any;
    const next = jest.fn();

    const guard = verifyRecordOwnership('studentId');
    guard(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('allows ADMIN users to bypass IDOR restrictions for management', () => {
    const req = {
      user: { userId: 'admin-user-id', role: 'ADMIN' },
      params: { studentId: 'student-B' },
      query: {},
      body: {},
    } as any;

    const res = {} as any;
    const next = jest.fn();

    const guard = verifyRecordOwnership('studentId');
    guard(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
