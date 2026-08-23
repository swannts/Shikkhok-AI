import { verifyTeacherClassOwnership } from '../shared/teacherAuthorization.middleware';

describe('Teacher Class Scoping Middleware', () => {
  it('blocks teacher from accessing a class not in managedClassIds', () => {
    const req = {
      user: {
        userId: 'teacher-1',
        role: 'TEACHER',
        managedClassIds: ['class-8-a', 'class-8-b'],
      },
      params: { classId: 'class-10-a' }, // Class 10 is unauthorized
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
    const guard = verifyTeacherClassOwnership('classId');

    guard(req, res, next);

    expect(resStatus).toBe(403);
    expect(resBody.errorCode).toBe('TEACHER_CLASS_UNAUTHORIZED');
    expect(resBody.banglaMessage).toContain('শিক্ষক নন');
    expect(next).not.toHaveBeenCalled();
  });

  it('allows teacher to access authorized class in managedClassIds', () => {
    const req = {
      user: {
        userId: 'teacher-1',
        role: 'TEACHER',
        managedClassIds: ['class-8-a', 'class-8-b'],
      },
      params: { classId: 'class-8-a' },
      query: {},
      body: {},
    } as any;

    const res = {} as any;
    const next = jest.fn();
    const guard = verifyTeacherClassOwnership('classId');

    guard(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
