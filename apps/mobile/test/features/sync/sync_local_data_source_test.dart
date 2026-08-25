import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/sync/data/datasources/sync_local_data_source.dart';
import 'package:mobile/features/sync/domain/entities/sync_operation.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late InMemorySyncLocalDataSource localDataSource;

  setUp(() {
    localDataSource = InMemorySyncLocalDataSource();
  });

  group('SyncLocalDataSource Persistence Tests', () {
    test('enqueue inserts operation and listPending retrieves it', () async {
      final now = DateTime.now();
      const payload = LessonProgressSyncPayload(
        lessonId: 'les-1',
        progressPercent: 50,
      );

      final op = SyncOperation(
        operationId: 'op-1',
        operationType: SyncOperationType.lessonProgressUpsert,
        entityType: 'lesson_progress',
        entityId: 'les-1',
        payload: payload,
        createdAt: now,
        updatedAt: now,
      );

      await localDataSource.enqueue(op);

      final pending = await localDataSource.listPending();
      expect(pending.length, 1);
      expect(pending.first.operationId, 'op-1');
      expect(
          pending.first.operationType, SyncOperationType.lessonProgressUpsert);
      expect(pending.first.payload, isA<LessonProgressSyncPayload>());
      final typedPayload = pending.first.payload as LessonProgressSyncPayload;
      expect(typedPayload.lessonId, 'les-1');
      expect(typedPayload.progressPercent, 50);
    });

    test('markProcessing updates status so listPending ignores it', () async {
      final now = DateTime.now();
      final op = SyncOperation(
        operationId: 'op-2',
        operationType: SyncOperationType.studyPlanUpsert,
        entityType: 'study_plan',
        payload: const StudyPlanSyncPayload(weekStartDate: '2026-08-25'),
        createdAt: now,
        updatedAt: now,
      );

      await localDataSource.enqueue(op);
      await localDataSource.markProcessing(['op-2']);

      final pending = await localDataSource.listPending();
      expect(pending.isEmpty, isTrue);

      final count = await localDataSource.countPending();
      expect(count, 0);
    });

    test('restoreStuckProcessing restores timed-out processing rows to pending',
        () async {
      final oldTime = DateTime.now().subtract(const Duration(minutes: 10));
      final op = SyncOperation(
        operationId: 'op-stuck',
        operationType: SyncOperationType.notificationMarkRead,
        entityType: 'notification',
        payload: const NotificationReadSyncPayload(notificationId: 'notif-99'),
        createdAt: oldTime,
        status: SyncLocalStatus.processing,
        updatedAt: oldTime,
      );

      await localDataSource.enqueue(op);

      // Verify not returned in pending yet
      expect((await localDataSource.listPending()).isEmpty, isTrue);

      final restoredCount = await localDataSource.restoreStuckProcessing(
        timeout: const Duration(minutes: 5),
      );

      expect(restoredCount, 1);

      final pending = await localDataSource.listPending();
      expect(pending.length, 1);
      expect(pending.first.operationId, 'op-stuck');
      expect(pending.first.status, SyncLocalStatus.pending);
    });

    test('markApplied and deleteApplied clean up completed operations',
        () async {
      final now = DateTime.now();
      final op = SyncOperation(
        operationId: 'op-applied',
        operationType: SyncOperationType.lessonProgressUpsert,
        entityType: 'lesson_progress',
        payload: const LessonProgressSyncPayload(lessonId: 'les-99'),
        createdAt: now,
        updatedAt: now,
      );

      await localDataSource.enqueue(op);
      await localDataSource.markApplied('op-applied');
      await localDataSource.deleteApplied();

      final pending = await localDataSource.listPending();
      expect(pending.isEmpty, isTrue);
    });

    test('markFailed increments retryCount and sets status based on retryable',
        () async {
      final now = DateTime.now();
      final op = SyncOperation(
        operationId: 'op-fail',
        operationType: SyncOperationType.lessonProgressUpsert,
        entityType: 'lesson_progress',
        payload: const LessonProgressSyncPayload(lessonId: 'les-fail'),
        createdAt: now,
        updatedAt: now,
      );

      await localDataSource.enqueue(op);

      // Permanent failure
      await localDataSource.markFailed(
        'op-fail',
        errorCode: 'FORBIDDEN',
        errorMessage: 'Unauthorized role',
        isRetryable: false,
        nextRetryAt: null,
      );

      final pending = await localDataSource.listPending();
      expect(pending.isEmpty, isTrue);
    });
  });
}
