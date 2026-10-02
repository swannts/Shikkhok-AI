sealed class AppFailure implements Exception {
  final String message;
  final String banglaMessage;
  final String? errorCode;
  final Map<String, dynamic>? details;
  final bool retryable;

  const AppFailure({
    required this.message,
    required this.banglaMessage,
    this.errorCode,
    this.details,
    this.retryable = false,
  });

  @override
  String toString() => 'AppFailure($errorCode): $message | $banglaMessage';
}

/// Stable server error codes translated once at the client boundary.
class AppFailureMessages {
  static String? forCode(String? code) {
    switch (code) {
      case 'AI_UNAVAILABLE':
        return 'AI শিক্ষক সেবা এই মুহূর্তে পাওয়া যাচ্ছে না। কিছুক্ষণ পর আবার চেষ্টা করুন।';
      case 'AI_DEGRADED':
        return 'AI শিক্ষক সীমিত মোডে চলছে। পাঠ্যবইয়ের উৎস যাচাই করা যাচ্ছে না।';
      case 'SYNC_CONFLICT':
        return 'এই তথ্যটি অন্য জায়গা থেকে পরিবর্তন করা হয়েছে। আবার মিলিয়ে নিন।';
      case 'STUDENT_CLASS_REQUIRED':
        return 'AI শিক্ষক ব্যবহার করতে আগে তোমার শ্রেণি নির্বাচন করো।';
      case 'RATE_LIMITED':
        return 'খুব বেশি অনুরোধ করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।';
      case 'STUDENT_NOT_FOUND':
        return 'শিক্ষার্থীর প্রোফাইল পাওয়া যায়নি।';
      default:
        return null;
    }
  }
}

class NetworkFailure extends AppFailure {
  const NetworkFailure({
    super.message = 'No internet connection available.',
    super.banglaMessage =
        'ইন্টারনেট সংযোগ পাওয়া যাচ্ছে না। সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।',
    super.errorCode = 'NETWORK_ERROR',
    super.retryable = true,
    super.details,
  });
}

class TimeoutFailure extends AppFailure {
  const TimeoutFailure({
    super.message = 'Request timed out.',
    super.banglaMessage =
        'অনুরোধের সময় পার হয়ে গেছে। নেটওয়ার্ক চেক করে আবার চেষ্টা করুন।',
    super.errorCode = 'REQUEST_TIMEOUT',
    super.retryable = true,
    super.details,
  });
}

class UnauthorizedFailure extends AppFailure {
  const UnauthorizedFailure({
    super.message = 'Unauthorized or session expired.',
    super.banglaMessage = 'আপনার সেশনের মেয়াদ শেষ হয়ে গেছে। পুনরায় লগইন করুন।',
    super.errorCode = 'UNAUTHORIZED',
    super.details,
  });
}

class ForbiddenFailure extends AppFailure {
  const ForbiddenFailure({
    super.message = 'Access denied. You do not have permission.',
    super.banglaMessage = 'আপনার এই তথ্যে অ্যাক্সেস করার অনুমতি নেই।',
    super.errorCode = 'FORBIDDEN',
    super.details,
  });
}

class ValidationFailure extends AppFailure {
  final Map<String, String>? fields;

  const ValidationFailure({
    super.message = 'Invalid request data.',
    super.banglaMessage =
        'প্রদত্ত তথ্য সঠিক নয়। অনুগ্রহ করে সব ঘর ঠিকমতো পূরণ করুন।',
    super.errorCode = 'VALIDATION_ERROR',
    super.details,
    this.fields,
  });
}

class NotFoundFailure extends AppFailure {
  const NotFoundFailure({
    super.message = 'Requested resource not found.',
    super.banglaMessage = 'অনুরোধকৃত তথ্য খুঁজে পাওয়া যায়নি।',
    super.errorCode = 'NOT_FOUND',
    super.details,
  });
}

class ConflictFailure extends AppFailure {
  const ConflictFailure({
    super.message = 'Resource already exists.',
    super.banglaMessage =
        'এই ইমেইল বা ফোন নম্বর দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট রয়েছে।',
    super.errorCode = 'CONFLICT',
    super.details,
  });
}

class RateLimitFailure extends AppFailure {
  const RateLimitFailure({
    super.message = 'Too many requests. Please slow down.',
    super.banglaMessage =
        'খুব বেশি অনুরোধ করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।',
    super.errorCode = 'RATE_LIMITED',
    super.retryable = true,
    super.details,
  });
}

class ServerFailure extends AppFailure {
  const ServerFailure({
    required super.message,
    required super.banglaMessage,
    super.errorCode = 'SERVER_ERROR',
    super.details,
  });
}

class UnknownFailure extends AppFailure {
  const UnknownFailure({
    super.message = 'An unexpected error occurred.',
    super.banglaMessage = 'একটি অপ্রত্যাশিত সমস্যা হয়েছে। আবার চেষ্টা করুন।',
    super.errorCode = 'UNKNOWN_ERROR',
    super.details,
  });
}
