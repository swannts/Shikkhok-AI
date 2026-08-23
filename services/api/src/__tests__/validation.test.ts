import { validateRequest } from '../shared/validateRequest.middleware';
import { z } from 'zod';

describe('Zod Validation Middleware & Response Schema', () => {
  const dummySchema = z.object({
    subjectId: z.string().min(3, 'subjectId must be at least 3 characters'),
  });

  it('returns consistent structured error format for invalid request data', async () => {
    const req = {
      params: { subjectId: 'ab' },
      body: {},
      query: {},
    } as any;

    let resBody: any = null;
    let resStatus: number = 0;

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

    const middleware = validateRequest({ params: dummySchema });
    await middleware(req, res, next);

    expect(resStatus).toBe(400);
    expect(resBody).toEqual({
      statusCode: 400,
      errorCode: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      banglaMessage: 'প্রদত্ত তথ্য সঠিক নয়।',
      details: {
        subjectId: ['subjectId must be at least 3 characters'],
      },
    });
    expect(next).not.toHaveBeenCalled();
  });
});

