import { verifyRecordOwnership } from '../shared/authorization.middleware';

describe('Parent Linked Student Authorization Guard', () => {
  it('blocks parent from accessing unlinked student records', () => {
    const req = {
      user: {
        userId: 'parent-user-1',
        role: 'PARENT',
        linkedStudentIds: ['student-child-101'], // Parent is only linked to student-child-101
      },
      params: { studentId: 'student-stranger-999' }, // Unrelated student
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
    expect(resBody.errorCode).toBe('FORBIDDEN');
    expect(resBody.banglaMessage).toContain('প্যারেন্ট অ্যাকাউন্টের সাথে যুক্ত নয়');
    expect(next).not.toHaveBeenCalled();
  });

  it('allows parent to access weekly progress & analytics for linked student', () => {
    const req = {
      user: {
        userId: 'parent-user-1',
        role: 'PARENT',
        linkedStudentIds: ['student-child-101'],
      },
      params: { studentId: 'student-child-101' },
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
