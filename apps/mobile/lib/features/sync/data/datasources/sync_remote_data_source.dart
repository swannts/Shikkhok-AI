import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_endpoints.dart';
import '../dto/sync_dto.dart';
import '../../domain/entities/sync_operation.dart';

abstract class SyncRemoteDataSource {
  Future<SyncBatchResponseDto> submitBatch({
    required String deviceId,
    required List<SyncOperation> operations,
  });

  Future<int> getMyCheckpoint(String deviceId);
}

class SyncRemoteDataSourceImpl implements SyncRemoteDataSource {
  final ApiClient _apiClient;

  SyncRemoteDataSourceImpl([ApiClient? client])
      : _apiClient = client ?? apiClient;

  @override
  Future<SyncBatchResponseDto> submitBatch({
    required String deviceId,
    required List<SyncOperation> operations,
  }) async {
    final response = await _apiClient.dio.post(
      ApiEndpoints.syncBatches,
      data: {
        'deviceId': deviceId,
        'operations': operations.map((op) {
          return {
            'operationId': op.operationId,
            'operationType': op.operationType.toApiString(),
            'entityType': op.entityType,
            if (op.entityId != null) 'entityId': op.entityId,
            'payload': op.payload,
          };
        }).toList(),
      },
    );

    final raw = response.data;
    final map = raw is Map<String, dynamic> && raw.containsKey('data')
        ? raw['data'] as Map<String, dynamic>
        : raw as Map<String, dynamic>;

    return SyncBatchResponseDto.fromJson(map);
  }

  @override
  Future<int> getMyCheckpoint(String deviceId) async {
    final response =
        await _apiClient.dio.get(ApiEndpoints.syncCheckpoint(deviceId));
    final raw = response.data;
    final map = raw is Map<String, dynamic> && raw.containsKey('data')
        ? raw['data'] as Map<String, dynamic>
        : raw as Map<String, dynamic>;

    return (map['checkpointVersion'] as num?)?.toInt() ?? 0;
  }
}
