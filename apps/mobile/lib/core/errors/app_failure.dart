abstract class AppFailure implements Exception {
  final String message;
  final String banglaMessage;
  final String? errorCode;

  const AppFailure({
    required this.message,
    required this.banglaMessage,
    this.errorCode,
  });

  @override
  String toString() => 'AppFailure($errorCode): $message | $banglaMessage';
}

class NetworkFailure extends AppFailure {
  const NetworkFailure({
    super.message = 'No internet connection available.',
    super.banglaMessage = 'ইন্টারনেট সংযোগ পাওয়া যাচ্ছে না। সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।',
    super.errorCode = 'NETWORK_ERROR',
  });
}

class TimeoutFailure extends AppFailure {
  const TimeoutFailure({
    super.message = 'Request timed out.',
    super.banglaMessage = 'অনুরোধের সময় পার হয়ে গেছে। নেটওয়ার্ক চেক করে আবার চেষ্টা করুন।',
    super.errorCode = 'REQUEST_TIMEOUT',
  });
}

class UnauthorizedFailure extends AppFailure {
  const UnauthorizedFailure({
    super.message = 'Unauthorized or session expired.',
    super.banglaMessage = 'আপনার সেশনের মেয়াদ পার হয়ে গেছে। পুনরায় লগইন করুন।',
    super.errorCode = 'UNAUTHORIZED',
  });
}

class ValidationFailure extends AppFailure {
  final Map<String, String>? fields;

  const ValidationFailure({
    super.message = 'Invalid request data.',
    super.banglaMessage = 'প্রদত্ত তথ্য সঠিক নয়। অনুগ্রহ করে সব ঘর ঠিকমতো পূরণ করুন।',
    super.errorCode = 'VALIDATION_ERROR',
    this.fields,
  });
}

class ServerFailure extends AppFailure {
  const ServerFailure({
    required super.message,
    required super.banglaMessage,
    super.errorCode = 'SERVER_ERROR',
  });
}
