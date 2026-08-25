import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/sync/domain/entities/sync_operation.dart';
import 'package:mobile/features/sync/domain/entities/sync_batch_result.dart';
import 'package:mobile/features/sync/domain/repositories/sync_repository.dart';
import 'package:mobile/features/sync/presentation/controllers/sync_controller.dart';

class FakeSyncRepository implements SyncRepository {
  @override
  Future<SyncBatchResult> submitBatch({
    required String deviceId,
    required List<SyncOperation> operations,
  }) async {
    return SyncBatchResult(
      received: operations.length,
      applied: operations.length,
      failed: 0,
      results: operations
          .map((op) => SyncOperationResult(
                operationId: op.operationId,
                status: 'applied',
              ))
          .toList(),
    );
  }

  @override
  Future<int> getMyCheckpoint(String deviceId) async => 1;
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('SyncController Unit Tests', () {
    late SyncController controller;
    late FakeSyncRepository repository;

    setUp(() {
      repository = FakeSyncRepository();
      controller = SyncController(repository);
    });

    test('Initial state is SyncInitial and queue is empty', () {
      expect(controller.state, isA<SyncInitial>());
      expect(controller.pendingOperations.isEmpty, isTrue);
    });

    test('enqueueOperation adds operation to pending queue', () {
      controller.enqueueOperation(const SyncOperation(
        operationId: 'op-1',
        operationType: SyncOperationType.lessonProgressUpsert,
        entityType: 'lesson_progress',
        payload: {'lessonId': 'les-1'},
      ));

      expect(controller.pendingOperations.length, 1);
    });

    test('flushQueue sends batch and empties queue on success', () async {
      controller.enqueueOperation(const SyncOperation(
        operationId: 'op-1',
        operationType: SyncOperationType.lessonProgressUpsert,
        entityType: 'lesson_progress',
        payload: {'lessonId': 'les-1'},
      ));

      final result = await controller.flushQueue(deviceId: 'device-1');

      expect(result, isNotNull);
      expect(result!.applied, 1);
      expect(controller.state, isA<SyncSuccess>());
      expect(controller.pendingOperations.isEmpty, isTrue);
    });
  });
}
