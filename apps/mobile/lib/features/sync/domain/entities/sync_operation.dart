import 'sync_operation_payload.dart';

export 'sync_operation_payload.dart';

enum SyncLocalStatus {
  pending('pending'),
  processing('processing'),
  applied('applied'),
  failed('failed');

  final String value;
  const SyncLocalStatus(this.value);

  static SyncLocalStatus fromString(String value) {
    for (final s in SyncLocalStatus.values) {
      if (s.value == value) return s;
    }
    return SyncLocalStatus.pending;
  }
}

class SyncOperation {
  final int? id;
  final String operationId;
  final SyncOperationType operationType;
  final String entityType;
  final String? entityId;
  final SyncOperationPayload payload;
  final DateTime createdAt;
  final int retryCount;
  final SyncLocalStatus status;
  final String? lastErrorCode;
  final String? lastErrorMessage;
  final DateTime? nextRetryAt;
  final DateTime updatedAt;

  const SyncOperation({
    this.id,
    required this.operationId,
    required this.operationType,
    required this.entityType,
    this.entityId,
    required this.payload,
    required this.createdAt,
    this.retryCount = 0,
    this.status = SyncLocalStatus.pending,
    this.lastErrorCode,
    this.lastErrorMessage,
    this.nextRetryAt,
    required this.updatedAt,
  });

  bool get isPending => status == SyncLocalStatus.pending;
  bool get isProcessing => status == SyncLocalStatus.processing;
  bool get isApplied => status == SyncLocalStatus.applied;
  bool get isFailed => status == SyncLocalStatus.failed;

  SyncOperation copyWith({
    int? id,
    String? operationId,
    SyncOperationType? operationType,
    String? entityType,
    String? entityId,
    SyncOperationPayload? payload,
    DateTime? createdAt,
    int? retryCount,
    SyncLocalStatus? status,
    String? lastErrorCode,
    String? lastErrorMessage,
    DateTime? nextRetryAt,
    DateTime? updatedAt,
  }) {
    return SyncOperation(
      id: id ?? this.id,
      operationId: operationId ?? this.operationId,
      operationType: operationType ?? this.operationType,
      entityType: entityType ?? this.entityType,
      entityId: entityId ?? this.entityId,
      payload: payload ?? this.payload,
      createdAt: createdAt ?? this.createdAt,
      retryCount: retryCount ?? this.retryCount,
      status: status ?? this.status,
      lastErrorCode: lastErrorCode ?? this.lastErrorCode,
      lastErrorMessage: lastErrorMessage ?? this.lastErrorMessage,
      nextRetryAt: nextRetryAt ?? this.nextRetryAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
