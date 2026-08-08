export interface ApiErrorResponse {
  statusCode: number;
  errorCode: string;
  message: string;
  banglaMessage?: string;
  details?: Record<string, unknown>;
}

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly banglaMessage: string;
  public readonly details?: Record<string, unknown>;

  constructor(res: ApiErrorResponse) {
    super(res.message);
    this.name = 'ApiError';
    this.statusCode = res.statusCode;
    this.errorCode = res.errorCode;
    this.banglaMessage = res.banglaMessage || 'একটি অপ্রত্যাশিত সমস্যা হয়েছে। আবার চেষ্টা করুন।';
    this.details = res.details;
  }

  static fromUnknown(error: unknown): ApiError {
    if (error instanceof ApiError) return error;

    if (error instanceof Error) {
      return new ApiError({
        statusCode: 500,
        errorCode: 'INTERNAL_ERROR',
        message: error.message,
        banglaMessage: 'নেটওয়ার্ক বা সার্ভারে সমস্যা হয়েছে।',
      });
    }

    return new ApiError({
      statusCode: 500,
      errorCode: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      banglaMessage: 'একটি অজানা সমস্যা হয়েছে।',
    });
  }
}
