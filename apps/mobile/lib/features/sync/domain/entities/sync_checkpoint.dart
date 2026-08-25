enum SyncCheckpointStatus {
  applied('applied'),
  partial('partial'),
  failed('failed'),
  unknown('unknown');

  final String value;
  const SyncCheckpointStatus(this.value);

  static SyncCheckpointStatus fromString(String? value) {
    for (final status in SyncCheckpointStatus.values) {
      if (status.value == value?.toLowerCase()) {
        return status;
      }
    }
    return SyncCheckpointStatus.unknown;
  }
}

class SyncCheckpoint {
  final String deviceId;
  final DateTime? lastSyncedAt;
  final String? lastOperationId;
  final int lastBatchSize;
  final SyncCheckpointStatus status;

  const SyncCheckpoint({
    required this.deviceId,
    this.lastSyncedAt,
    this.lastOperationId,
    this.lastBatchSize = 0,
    this.status = SyncCheckpointStatus.unknown,
  });
}
