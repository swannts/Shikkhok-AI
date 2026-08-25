import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/entities/sync_operation.dart';
import '../../domain/entities/sync_batch_result.dart';
import '../../domain/entities/sync_checkpoint.dart';
import '../../domain/repositories/sync_repository.dart';
import '../datasources/sync_local_data_source.dart';
import '../datasources/sync_remote_data_source.dart';
import '../mappers/sync_checkpoint_mapper.dart';

class SyncRepositoryImpl implements SyncRepository {
  final SyncLocalDataSource _localDataSource;
  final SyncRemoteDataSource _remoteDataSource;
  final ApiClient _apiClient;

  static const int _maxRetries = 5;

  SyncRepositoryImpl(
    this._localDataSource,
    this._remoteDataSource,
    this._apiClient,
  );

  @override
  Future<void> enqueueOperation(SyncOperation operation) async {
    await _localDataSource.enqueue(operation);
  }

  @override
  Future<SyncBatchResult> flushPending({
    required String deviceId,
    int limit = 50,
  }) async {
    final pendingOps = await _localDataSource.listPending(limit: limit);
    if (pendingOps.isEmpty) {
      return const SyncBatchResult();
    }

    final operationIds = pendingOps.map((op) => op.operationId).toList();
    await _localDataSource.markProcessing(operationIds);

    try {
      final dto = await _remoteDataSource.submitBatch(
        deviceId: deviceId,
        operations: pendingOps,
      );

      final results = <SyncOperationResult>[];

      for (final res in dto.results) {
        final op = pendingOps.firstWhere(
          (o) => o.operationId == res.operationId,
          orElse: () => pendingOps.first,
        );

        final resultEntity = SyncOperationResult(
          operationId: res.operationId,
          status: res.status,
          result: res.result,
          errorCode: res.errorCode,
          errorMessage: res.errorMessage,
        );
        results.add(resultEntity);

        if (res.status == 'applied' || res.status == 'replayed') {
          await _localDataSource.markApplied(res.operationId);
        } else if (res.status == 'processing') {
          // Keep in queue for next check without advancing retry failure count
          final nextRetry = _calculateBackoff(op.retryCount);
          await _localDataSource.incrementRetry(
            res.operationId,
            nextRetryAt: DateTime.now().add(nextRetry),
            errorMessage: 'Operation is currently being processed remotely',
          );
        } else {
          // Failed operation
          final isPermanent = _isPermanentError(res.errorCode);
          final willRetry = !isPermanent && op.retryCount < _maxRetries;
          final nextRetryAt = willRetry
              ? DateTime.now().add(_calculateBackoff(op.retryCount))
              : null;

          await _localDataSource.markFailed(
            res.operationId,
            errorCode: res.errorCode ?? 'SYNC_OPERATION_FAILED',
            errorMessage: res.errorMessage ?? 'Sync operation failed',
            isRetryable: willRetry,
            nextRetryAt: nextRetryAt,
          );
        }
      }

      await _localDataSource.deleteApplied();

      return SyncBatchResult(
        received: dto.received,
        applied: dto.applied,
        replayed: dto.replayed,
        failed: dto.failed,
        results: results,
      );
    } on DioException catch (dioErr) {
      // Entire batch failed due to network / gateway error
      const nextRetry = Duration(seconds: 5);
      for (final op in pendingOps) {
        final willRetry = op.retryCount < _maxRetries;
        await _localDataSource.markFailed(
          op.operationId,
          errorCode: dioErr.response?.statusCode?.toString() ?? 'NETWORK_ERROR',
          errorMessage: dioErr.message ?? 'Network connection failure',
          isRetryable: willRetry,
          nextRetryAt: willRetry ? DateTime.now().add(nextRetry) : null,
        );
      }
      throw _apiClient.mapDioException(dioErr);
    }
  }

  @override
  Future<SyncCheckpoint> getCheckpoint(String deviceId) async {
    try {
      final dto = await _remoteDataSource.getMyCheckpoint(deviceId);
      return SyncCheckpointMapper.toDomain(dto);
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    }
  }

  @override
  Future<int> restoreStuckProcessing({
    Duration timeout = const Duration(minutes: 5),
  }) async {
    return _localDataSource.restoreStuckProcessing(timeout: timeout);
  }

  @override
  Future<int> countPending() async {
    return _localDataSource.countPending();
  }

  @override
  Future<List<SyncOperation>> listPending() async {
    return _localDataSource.listPending();
  }

  Duration _calculateBackoff(int retryCount) {
    switch (retryCount) {
      case 0:
        return const Duration(seconds: 2);
      case 1:
        return const Duration(seconds: 5);
      case 2:
        return const Duration(seconds: 15);
      case 3:
        return const Duration(seconds: 30);
      default:
        return const Duration(seconds: 60);
    }
  }

  bool _isPermanentError(String? errorCode) {
    if (errorCode == null) return false;
    final upper = errorCode.toUpperCase();
    return upper == 'FORBIDDEN' ||
        upper == 'BAD_REQUEST' ||
        upper == 'UNSUPPORTED_OPERATION' ||
        upper == '400' ||
        upper == '403';
  }
}
