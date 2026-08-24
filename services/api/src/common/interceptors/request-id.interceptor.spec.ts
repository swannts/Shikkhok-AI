import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { RequestIdInterceptor } from './request-id.interceptor';

describe('RequestIdInterceptor', () => {
  let interceptor: RequestIdInterceptor;

  beforeEach(() => {
    interceptor = new RequestIdInterceptor();
  });

  it('should preserve existing incoming x-request-id', (done) => {
    const mockRequest: any = {
      headers: { 'x-request-id': 'custom-incoming-uuid-123' },
    };
    const mockResponse: any = {
      setHeader: jest.fn(),
    };

    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as ExecutionContext;

    const mockCallHandler: CallHandler = {
      handle: () => of('result'),
    };

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(() => {
      expect(mockRequest.requestId).toBe('custom-incoming-uuid-123');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('x-request-id', 'custom-incoming-uuid-123');
      done();
    });
  });

  it('should generate new UUID if no x-request-id is passed', (done) => {
    const mockRequest: any = {
      headers: {},
    };
    const mockResponse: any = {
      setHeader: jest.fn(),
    };

    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as ExecutionContext;

    const mockCallHandler: CallHandler = {
      handle: () => of('result'),
    };

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(() => {
      expect(mockRequest.requestId).toBeDefined();
      expect(typeof mockRequest.requestId).toBe('string');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('x-request-id', mockRequest.requestId);
      done();
    });
  });
});
