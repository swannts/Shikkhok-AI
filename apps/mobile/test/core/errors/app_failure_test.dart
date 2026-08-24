import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/errors/app_failure.dart';

void main() {
  group('AppFailure Tests', () {
    test('NetworkFailure provides default Bangla message', () {
      const failure = NetworkFailure();
      expect(failure.errorCode, 'NETWORK_ERROR');
      expect(failure.banglaMessage, contains('ইন্টারনেট সংযোগ'));
    });

    test('ValidationFailure contains field errors if provided', () {
      const failure = ValidationFailure(
        message: 'Validation failed',
        banglaMessage: 'প্রদত্ত তথ্য সঠিক নয়।',
        fields: {'phone': 'Invalid phone number'},
      );
      expect(failure.fields?['phone'], 'Invalid phone number');
      expect(failure.errorCode, 'VALIDATION_ERROR');
    });

    test('ConflictFailure returns 409 conflict meaning', () {
      const failure = ConflictFailure(
        message: 'Email exists',
        banglaMessage: 'এই ইমেইল দিয়ে ইতোমধ্যে অ্যাকাউন্ট রয়েছে।',
      );
      expect(failure.errorCode, 'CONFLICT');
      expect(failure.banglaMessage, contains('ইমেইল'));
    });
  });
}
