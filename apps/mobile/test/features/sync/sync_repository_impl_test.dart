import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/features/sync/data/datasources/sync_local_data_source.dart';
import 'package:mobile/features/sync/data/datasources/sync_remote_data_source.dart';
import 'package:mobile/features/sync/data/dto/sync_dto.dart';
import 'package:mobile/features/sync/data/dto/sync_checkpoint_dto.dart';
import 'package:mobile/features/sync/data/repositories/sync_repository_impl.dart';
import 'package:mobile/features/sync/domain/entities/sync_operation.dart';
import 'package:mobile/features/sync/domain/entities/sync_checkpoint.dart';

class FakeSyncLocalDataSource implements SyncLocalDataSource {
  final Map<String, SyncOperation> _store = {};

  @override
  Future<void> enqueue(SyncOperation operation) async {
    _store[operation.operationId] = operation;
  }

  @override
  Future<List<SyncOperation>> listPending({int limit = 50}) async {
    return _store.values
        .where((op) => op.status == SyncLocalStatus.pending)
        .take(limit)
        .toList();
  }

  @override
  Future<void> markProcessing(List<String> operationIds) async {
    for (final id in operationIds) {
      if (_store.containsKey(id)) {
        _store[id] = _store[id]!.copyWith(status: SyncLocalStatus.processing);
      }
    }
  }

  @override
  Future<void> markApplied(String operationId) async {
    if (_store.containsKey(operationId)) {
      _store[operationId] =
          _store[operationId]!.copyWith(status: SyncLocalStatus.applied);
    }
  }

  @override
  Future<void> markFailed(
    String operationId, {
    required String errorCode,
    required String errorMessage,
    required bool isRetryable,
    required DateTime? nextRetryAt,
  }) async {
    if (_store.containsKey(operationId)) {
      _store[operationId] = _store[operationId]!.copyWith(
        status: isRetryable ? SyncLocalStatus.pending : SyncLocalStatus.failed,
        retryCount: _store[operationId]!.retryCount + 1,
        lastErrorCode: errorCode,
        lastErrorMessage: errorMessage,
        nextRetryAt: nextRetryAt,
      );
    }
  }

  @override
  Future<void> incrementRetry(
    String operationId, {
    required DateTime nextRetryAt,
    required String errorMessage,
  }) async {
    if (_store.containsKey(operationId)) {
      _store[operationId] = _store[operationId]!.copyWith(
        status: SyncLocalStatus.pending,
        retryCount: _store[operationId]!.retryCount + 1,
        lastErrorMessage: errorMessage,
        nextRetryAt: nextRetryAt,
      );
    }
  }

  @override
  Future<void> deleteApplied() async {
    _store.removeWhere((_, op) => op.status == SyncLocalStatus.applied);
  }

  @override
  Future<int> restoreStuckProcessing(
      {Duration timeout = const Duration(minutes: 5)}) async {
    int restored = 0;
    for (final id in _store.keys) {
      if (_store[id]?.status == SyncLocalStatus.processing) {
        _store[id] = _store[id]!.copyWith(status: SyncLocalStatus.pending);
        restored++;
      }
    }
    return restored;
  }

  @override
  Future<int> countPending() async {
    return _store.values
        .where((op) => op.status == SyncLocalStatus.pending)
        .length;
  }
}

class FakeSyncRemoteDataSource implements SyncRemoteDataSource {
  @override
  Future<SyncBatchResponseDto> submitBatch({
    required String deviceId,
    required List<SyncOperation> operations,
  }) async {
    return SyncBatchResponseDto(
      received: operations.length,
      applied: operations.length,
      replayed: 0,
      failed: 0,
      results: operations
          .map((op) => SyncOperationResultDto(
              operationId: op.operationId, status: 'applied'))
          .toList(),
    );
  }

  @override
  Future<SyncCheckpointDto> getMyCheckpoint(String deviceId) async {
    return SyncCheckpointDto(
      deviceId: deviceId,
      lastSyncedAt: DateTime.now().toIso8601String(),
      lastOperationId: 'op-1',
      lastBatchSize: 1,
      lastStatus: 'applied',
    );
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('SyncRepositoryImpl Coordination Tests', () {
    late SyncRepositoryImpl repository;
    late FakeSyncLocalDataSource localDataSource;
    late FakeSyncRemoteDataSource remoteDataSource;
    late ApiClient apiClient;

    setUp(() {
      localDataSource = FakeSyncLocalDataSource();
      remoteDataSource = FakeSyncRemoteDataSource();
      apiClient = ApiClient();
      repository = SyncRepositoryImpl(
        localDataSource,
        remoteDataSource,
        apiClient,
      );
    });

    test('enqueueOperation persists into local datasource', () async {
      final now = DateTime.now();
      final op = SyncOperation(
        operationId: 'op-1',
        operationType: SyncOperationType.lessonProgressUpsert,
        entityType: 'lesson_progress',
        payload: const LessonProgressSyncPayload(lessonId: 'les-1'),
        createdAt: now,
        updatedAt: now,
      );

      await repository.enqueueOperation(op);

      final pending = await repository.listPending();
      expect(pending.length, 1);
      expect(pending.first.operationId, 'op-1');
    });

    test('flushPending sends batch, marks applied, and deletes completed',
        () async {
      final now = DateTime.now();
      final op = SyncOperation(
        operationId: 'op-1',
        operationType: SyncOperationType.lessonProgressUpsert,
        entityType: 'lesson_progress',
        payload: const LessonProgressSyncPayload(lessonId: 'les-1'),
        createdAt: now,
        updatedAt: now,
      );

      await repository.enqueueOperation(op);
      final batchResult = await repository.flushPending(deviceId: 'dev-1');

      expect(batchResult.applied, 1);
      expect(batchResult.failed, 0);

      final remaining = await repository.listPending();
      expect(remaining.isEmpty, isTrue);
    });

    test('getCheckpoint returns mapped SyncCheckpoint domain entity', () async {
      final checkpoint = await repository.getCheckpoint('dev-1');

      expect(checkpoint.deviceId, 'dev-1');
      expect(checkpoint.lastBatchSize, 1);
      expect(checkpoint.status, SyncCheckpointStatus.applied);
    });
  });
}
