import '../../domain/entities/sync_checkpoint.dart';
import '../dto/sync_checkpoint_dto.dart';

class SyncCheckpointMapper {
  static SyncCheckpoint toDomain(SyncCheckpointDto dto) {
    return SyncCheckpoint(
      deviceId: dto.deviceId,
      lastSyncedAt: dto.lastSyncedAt != null
          ? DateTime.tryParse(dto.lastSyncedAt!)
          : null,
      lastOperationId: dto.lastOperationId,
      lastBatchSize: dto.lastBatchSize,
      status: SyncCheckpointStatus.fromString(dto.lastStatus),
    );
  }
}
