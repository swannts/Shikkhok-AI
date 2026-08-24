import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { TransformResponseInterceptor } from './transform-response.interceptor';

describe('TransformResponseInterceptor', () => {
  let interceptor: TransformResponseInterceptor<any>;

  beforeEach(() => {
    interceptor = new TransformResponseInterceptor();
  });

  it('should wrap response in standard { data, meta, requestId } structure', (done) => {
    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({ requestId: 'test-uuid-1234' }),
      }),
    } as ExecutionContext;

    const mockCallHandler: CallHandler = {
      handle: () => of({ status: 'ok', message: 'Hello Shikkhok' }),
    };

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe((result) => {
      expect(result).toEqual({
        data: { status: 'ok', message: 'Hello Shikkhok' },
        meta: {},
        requestId: 'test-uuid-1234',
      });
      done();
    });
  });
});
