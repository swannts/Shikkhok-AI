import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface StandardApiResponse<T> {
  data: T;
  meta?: Record<string, any>;
  requestId: string;
}

@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, T | StandardApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<T | StandardApiResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const requestId = request.requestId || request.headers['x-request-id'] || '';

    return next.handle().pipe(
      map((res) => {
        // Binary/streaming responses must retain their original body and headers.
        // Wrapping a StreamableFile in the standard JSON envelope corrupts PDFs.
        if (res instanceof StreamableFile) {
          return res as unknown as T;
        }

        // If controller returned paginated shape { data, meta }
        if (res && typeof res === 'object' && 'data' in res && 'meta' in res) {
          return {
            data: res.data,
            meta: res.meta,
            requestId,
          };
        }

        // Standard payload format
        return {
          data: res,
          meta: {},
          requestId,
        };
      }),
    );
  }
}
