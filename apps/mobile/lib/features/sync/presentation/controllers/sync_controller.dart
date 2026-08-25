import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/errors/app_failure.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/entities/sync_operation.dart';
import '../../domain/entities/sync_batch_result.dart';
import '../../domain/repositories/sync_repository.dart';
import '../../data/datasources/sync_remote_data_source.dart';
import '../../data/repositories/sync_repository_impl.dart';

final syncRemoteDataSourceProvider = Provider<SyncRemoteDataSource>((ref) {
  return SyncRemoteDataSourceImpl(apiClient);
});

final syncRepositoryProvider = Provider<SyncRepository>((ref) {
  final remoteDataSource = ref.watch(syncRemoteDataSourceProvider);
  return SyncRepositoryImpl(remoteDataSource, apiClient);
});

sealed class SyncState {
  const SyncState();
}

class SyncInitial extends SyncState {
  const SyncInitial();
}

class SyncInProgress extends SyncState {
  final int pendingCount;
  const SyncInProgress(this.pendingCount);
}

class SyncSuccess extends SyncState {
  final SyncBatchResult result;
  const SyncSuccess(this.result);
}

class SyncFailureState extends SyncState {
  final String message;
  const SyncFailureState(this.message);
}

class SyncController extends StateNotifier<SyncState> {
  final SyncRepository _repository;
  final List<SyncOperation> _offlineQueue = [];

  SyncController(this._repository) : super(const SyncInitial());

  List<SyncOperation> get pendingOperations => List.unmodifiable(_offlineQueue);

  void enqueueOperation(SyncOperation operation) {
    _offlineQueue.add(operation);
  }

  Future<SyncBatchResult?> flushQueue({required String deviceId}) async {
    if (_offlineQueue.isEmpty) {
      return const SyncBatchResult();
    }

    final operationsToSync = List<SyncOperation>.from(_offlineQueue);
    state = SyncInProgress(operationsToSync.length);

    try {
      final result = await _repository.submitBatch(
        deviceId: deviceId,
        operations: operationsToSync,
      );

      // Remove successfully processed operations from queue
      final successfulOpIds = result.results
          .where((r) => r.isSuccessful)
          .map((r) => r.operationId)
          .toSet();

      _offlineQueue
          .removeWhere((op) => successfulOpIds.contains(op.operationId));

      state = SyncSuccess(result);
      return result;
    } on AppFailure catch (failure) {
      state = SyncFailureState(failure.message);
      return null;
    } catch (_) {
      state = const SyncFailureState('অফলাইন সিঙ্ক সম্পন্ন করা যায়নি');
      return null;
    }
  }
}

final syncControllerProvider =
    StateNotifierProvider<SyncController, SyncState>((ref) {
  final repository = ref.watch(syncRepositoryProvider);
  return SyncController(repository);
});
