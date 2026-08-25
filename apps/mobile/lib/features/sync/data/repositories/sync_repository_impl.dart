import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/entities/sync_operation.dart';
import '../../domain/entities/sync_batch_result.dart';
import '../../domain/repositories/sync_repository.dart';
import '../datasources/sync_remote_data_source.dart';

class SyncRepositoryImpl implements SyncRepository {
  final SyncRemoteDataSource _remoteDataSource;
  final ApiClient _apiClient;

  SyncRepositoryImpl(this._remoteDataSource, this._apiClient);

  @override
  Future<SyncBatchResult> submitBatch({
    required String deviceId,
    required List<SyncOperation> operations,
  }) async {
    try {
      final dto = await _remoteDataSource.submitBatch(
        deviceId: deviceId,
        operations: operations,
      );

      return SyncBatchResult(
        received: dto.received,
        applied: dto.applied,
        replayed: dto.replayed,
        failed: dto.failed,
        results: dto.results.map((r) {
          return SyncOperationResult(
            operationId: r.operationId,
            status: r.status,
            result: r.result,
            errorCode: r.errorCode,
            errorMessage: r.errorMessage,
          );
        }).toList(),
      );
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    }
  }

  @override
  Future<int> getMyCheckpoint(String deviceId) async {
    try {
      return await _remoteDataSource.getMyCheckpoint(deviceId);
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    }
  }
}
