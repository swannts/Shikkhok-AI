import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/sync/domain/entities/sync_operation.dart';
import 'package:mobile/features/sync/domain/entities/sync_batch_result.dart';
import 'package:mobile/features/sync/domain/entities/sync_checkpoint.dart';
import 'package:mobile/features/sync/domain/repositories/sync_repository.dart';
import 'package:mobile/features/sync/presentation/controllers/sync_controller.dart';

class FakeSyncRepository implements SyncRepository {
  final List<SyncOperation> _queue = [];

  @override
  Future<void> enqueueOperation(SyncOperation operation) async {
    _queue.add(operation);
  }

  @override
  Future<SyncBatchResult> flushPending({
    required String deviceId,
    int limit = 50,
  }) async {
    final count = _queue.length;
    final results = _queue
        .map((op) =>
            SyncOperationResult(operationId: op.operationId, status: 'applied'))
        .toList();
    _queue.clear();
    return SyncBatchResult(
      received: count,
      applied: count,
      failed: 0,
      results: results,
    );
  }

  @override
  Future<SyncCheckpoint> getCheckpoint(String deviceId) async {
    return SyncCheckpoint(
      deviceId: deviceId,
      lastSyncedAt: DateTime.now(),
      lastOperationId: 'op-1',
      lastBatchSize: 1,
      status: SyncCheckpointStatus.applied,
    );
  }

  @override
  Future<int> restoreStuckProcessing(
          {Duration timeout = const Duration(minutes: 5)}) async =>
      0;

  @override
  Future<int> countPending() async => _queue.length;

  @override
  Future<List<SyncOperation>> listPending() async => List.unmodifiable(_queue);
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('SyncController Tests', () {
    late SyncController controller;
    late FakeSyncRepository repository;

    setUp(() {
      repository = FakeSyncRepository();
      controller = SyncController(repository);
    });

    test('Initial state is SyncInitial', () {
      expect(controller.state, isA<SyncInitial>());
    });

    test('enqueueLessonProgress queues typed operation', () async {
      await controller.enqueueLessonProgress(const LessonProgressSyncPayload(
        lessonId: 'les-1',
        progressPercent: 100,
        isCompleted: true,
      ));

      expect(await repository.countPending(), 1);
      final pending = await repository.listPending();
      expect(
          pending.first.operationType, SyncOperationType.lessonProgressUpsert);
      expect(pending.first.entityType, 'lesson_progress');
    });

    test('flushQueue sends batch and sets SyncSuccess state', () async {
      await controller.enqueueStudyPlan(const StudyPlanSyncPayload(
        weekStartDate: '2026-08-25',
      ));

      final result = await controller.flushQueue(deviceId: 'dev-1');

      expect(result, isNotNull);
      expect(result!.applied, 1);
      expect(controller.state, isA<SyncSuccess>());
      final success = controller.state as SyncSuccess;
      expect(success.checkpoint?.deviceId, 'dev-1');
      expect(await repository.countPending(), 0);
    });
  });
}
