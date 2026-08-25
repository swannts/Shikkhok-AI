import '../entities/sync_operation.dart';
import '../entities/sync_batch_result.dart';

abstract class SyncRepository {
  Future<SyncBatchResult> submitBatch({
    required String deviceId,
    required List<SyncOperation> operations,
  });

  Future<int> getMyCheckpoint(String deviceId);
}
