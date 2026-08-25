import '../entities/sync_operation.dart';
import '../entities/sync_batch_result.dart';
import '../entities/sync_checkpoint.dart';

abstract class SyncRepository {
  Future<void> enqueueOperation(SyncOperation operation);

  Future<SyncBatchResult> flushPending({
    required String deviceId,
    int limit = 50,
  });

  Future<SyncCheckpoint> getCheckpoint(String deviceId);

  Future<int> restoreStuckProcessing({
    Duration timeout = const Duration(minutes: 5),
  });

  Future<int> countPending();

  Future<List<SyncOperation>> listPending();
}
