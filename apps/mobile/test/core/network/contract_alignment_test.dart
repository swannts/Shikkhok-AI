import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/api_endpoints.dart';
import 'package:mobile/features/sync/domain/entities/sync_operation_payload.dart';

void main() {
  group('Backend Contract Alignment Tests', () {
    test('ApiEndpoints notification routes match NestJS controller', () {
      expect(ApiEndpoints.notifications, '/notifications/me');
      expect(ApiEndpoints.notificationsUnreadCount,
          '/notifications/me/unread-count');
      expect(
          ApiEndpoints.notificationsMarkAllRead, '/notifications/me/read-all');
      expect(ApiEndpoints.notificationMarkRead('notif_1'),
          '/notifications/me/notif_1/read');
    });

    test(
        'LessonProgressSyncPayload serializes status and progressPercent for backend',
        () {
      const payload = LessonProgressSyncPayload(
        lessonId: 'lesson_101',
        isCompleted: true,
        progressPercent: 100,
        timeSpentSeconds: 120,
      );

      final json = payload.toJson();
      expect(json['lessonId'], 'lesson_101');
      expect(json['status'], 'completed');
      expect(json['progressPercent'], 100);
      expect(json['timeSpentMinutes'], 2);

      final deserialized = LessonProgressSyncPayload.fromJson(json);
      expect(deserialized.lessonId, 'lesson_101');
      expect(deserialized.isCompleted, true);
      expect(deserialized.progressPercent, 100);
      expect(deserialized.timeSpentSeconds, 120);
    });
  });
}
