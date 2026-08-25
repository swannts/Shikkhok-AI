import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/features/sync/data/datasources/sync_remote_data_source.dart';
import 'package:mobile/features/sync/data/dto/sync_dto.dart';
import 'package:mobile/features/sync/data/repositories/sync_repository_impl.dart';
import 'package:mobile/features/sync/domain/entities/sync_operation.dart';

class MockSyncRemoteDataSource implements SyncRemoteDataSource {
  @override
  Future<SyncBatchResponseDto> submitBatch({
    required String deviceId,
    required List<SyncOperation> operations,
  }) async {
    return const SyncBatchResponseDto(
      received: 2,
      applied: 2,
      replayed: 0,
      failed: 0,
      results: [
        SyncOperationResultDto(operationId: 'op-1', status: 'applied'),
        SyncOperationResultDto(operationId: 'op-2', status: 'applied'),
      ],
    );
  }

  @override
  Future<int> getMyCheckpoint(String deviceId) async => 5;
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('SyncRepositoryImpl Unit Tests', () {
    late SyncRepositoryImpl repository;
    late MockSyncRemoteDataSource mockDataSource;
    late ApiClient apiClient;

    setUp(() {
      mockDataSource = MockSyncRemoteDataSource();
      apiClient = ApiClient();
      repository = SyncRepositoryImpl(mockDataSource, apiClient);
    });

    test('submitBatch returns mapped SyncBatchResult', () async {
      final result = await repository.submitBatch(
        deviceId: 'device-123',
        operations: const [
          SyncOperation(
            operationId: 'op-1',
            operationType: SyncOperationType.lessonProgressUpsert,
            entityType: 'lesson_progress',
            payload: {'lessonId': 'les-1', 'completed': true},
          ),
        ],
      );

      expect(result.received, 2);
      expect(result.applied, 2);
      expect(result.failed, 0);
      expect(result.isAllSuccessful, isTrue);
    });

    test('getMyCheckpoint returns checkpoint version', () async {
      final version = await repository.getMyCheckpoint('device-123');
      expect(version, 5);
    });
  });
}
