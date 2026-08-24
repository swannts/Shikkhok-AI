import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/http_client.dart';
import 'package:mobile/models/user.dart';

void main() {
  test('StudentProfile model JSON serialization test', () {
    final profile = StudentProfile(
      id: 'student-1',
      userId: 'user-1',
      name: 'রাফি আহমেদ',
      classId: 'class-8',
      className: 'Class 8',
      language: 'bn',
    );

    final json = profile.toJson();
    expect(json['name'], 'রাফি আহমেদ');
    expect(json['classId'], 'class-8');

    const rawJson = {
      'id': 'student-2',
      'userId': 'user-2',
      'name': 'হাসান রিফাত',
      'classId': 'class-9',
      'className': 'Class 9',
      'language': 'bn',
    };
    final deserialized = StudentProfile.fromJson(rawJson);
    expect(deserialized.name, 'হাসান রিফাত');
    expect(deserialized.classId, 'class-9');
  });

  test('ApiError structured format test', () {
    final error = ApiError(
      statusCode: 401,
      errorCode: 'UNAUTHORIZED',
      message: 'Invalid credentials',
      banglaMessage: 'ভুল লগইন তথ্য',
    );

    expect(error.statusCode, 401);
    expect(error.errorCode, 'UNAUTHORIZED');
    expect(error.banglaMessage, 'ভুল লগইন তথ্য');
  });
}
