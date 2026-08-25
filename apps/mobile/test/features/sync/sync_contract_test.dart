import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/sync/domain/entities/sync_operation_payload.dart';
import 'package:mobile/features/sync/domain/entities/sync_checkpoint.dart';
import 'package:mobile/features/sync/data/dto/sync_checkpoint_dto.dart';
import 'package:mobile/features/sync/data/mappers/sync_checkpoint_mapper.dart';

void main() {
  group('Sync Contract Alignment Tests', () {
    test('SyncOperationType exact strings match backend enums', () {
      expect(
        SyncOperationType.lessonProgressUpsert.toApiString(),
        'lesson_progress.upsert',
      );
      expect(
        SyncOperationType.studyPlanUpsert.toApiString(),
        'study_plan.upsert',
      );
      expect(
        SyncOperationType.notificationMarkRead.toApiString(),
        'notification.mark_read',
      );
    });

    test('SyncOperationType fromApiString parses valid backend strings', () {
      expect(
        SyncOperationType.fromApiString('lesson_progress.upsert'),
        SyncOperationType.lessonProgressUpsert,
      );
      expect(
        SyncOperationType.fromApiString('study_plan.upsert'),
        SyncOperationType.studyPlanUpsert,
      );
      expect(
        SyncOperationType.fromApiString('notification.mark_read'),
        SyncOperationType.notificationMarkRead,
      );
    });

    test('SyncOperationType fromApiString rejects unsupported types', () {
      expect(
        () => SyncOperationType.fromApiString('practice_attempt_submit'),
        throwsArgumentError,
      );
      expect(
        () => SyncOperationType.fromApiString('flag_question'),
        throwsArgumentError,
      );
    });

    test('LessonProgressSyncPayload serializes to exact expected JSON map', () {
      const payload = LessonProgressSyncPayload(
        lessonId: '64b8268b6cb348e3b53f9902',
        subjectId: 'sub-1',
        chapterId: 'chap-1',
        progressPercent: 75,
        isCompleted: false,
        lastPositionSeconds: 120,
        totalDurationSeconds: 200,
        timeSpentSeconds: 90,
      );

      final json = payload.toJson();
      expect(json['lessonId'], '64b8268b6cb348e3b53f9902');
      expect(json['subjectId'], 'sub-1');
      expect(json['progressPercent'], 75);
      expect(json['isCompleted'], isFalse);
    });

    test('StudyPlanSyncPayload serializes to JSON map', () {
      const payload = StudyPlanSyncPayload(
        weekStartDate: '2026-08-25',
        completedTaskIds: ['task-1', 'task-2'],
      );

      final json = payload.toJson();
      expect(json['weekStartDate'], '2026-08-25');
      expect(json['completedTaskIds'], ['task-1', 'task-2']);
    });

    test('NotificationReadSyncPayload serializes to JSON map', () {
      const payload = NotificationReadSyncPayload(
        notificationId: 'notif-1',
        readAt: '2026-08-25T12:00:00Z',
      );

      final json = payload.toJson();
      expect(json['notificationId'], 'notif-1');
      expect(json['readAt'], '2026-08-25T12:00:00Z');
    });

    test('SyncCheckpointMapper maps backend checkpoint payload correctly', () {
      const dto = SyncCheckpointDto(
        deviceId: 'device-test-1',
        lastSyncedAt: '2026-08-25T04:00:00.000Z',
        lastOperationId: 'op-99',
        lastBatchSize: 3,
        lastStatus: 'applied',
      );

      final domain = SyncCheckpointMapper.toDomain(dto);

      expect(domain.deviceId, 'device-test-1');
      expect(domain.lastOperationId, 'op-99');
      expect(domain.lastBatchSize, 3);
      expect(domain.status, SyncCheckpointStatus.applied);
      expect(domain.lastSyncedAt, isNotNull);
    });
  });
}
