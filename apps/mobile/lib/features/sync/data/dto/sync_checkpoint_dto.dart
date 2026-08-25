class SyncCheckpointDto {
  final String deviceId;
  final String? lastSyncedAt;
  final String? lastOperationId;
  final int lastBatchSize;
  final String? lastStatus;

  const SyncCheckpointDto({
    required this.deviceId,
    this.lastSyncedAt,
    this.lastOperationId,
    this.lastBatchSize = 0,
    this.lastStatus,
  });

  factory SyncCheckpointDto.fromJson(Map<String, dynamic> json) {
    return SyncCheckpointDto(
      deviceId: (json['deviceId'] ?? '').toString(),
      lastSyncedAt: json['lastSyncedAt']?.toString(),
      lastOperationId: json['lastOperationId']?.toString(),
      lastBatchSize: (json['lastBatchSize'] as num?)?.toInt() ?? 0,
      lastStatus: json['lastStatus']?.toString(),
    );
  }
}
