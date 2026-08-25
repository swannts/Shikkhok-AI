class SyncOperationResultDto {
  final String operationId;
  final String status;
  final Map<String, dynamic>? result;
  final String? errorCode;
  final String? errorMessage;

  const SyncOperationResultDto({
    required this.operationId,
    required this.status,
    this.result,
    this.errorCode,
    this.errorMessage,
  });

  factory SyncOperationResultDto.fromJson(Map<String, dynamic> json) {
    return SyncOperationResultDto(
      operationId: (json['operationId'] ?? '').toString(),
      status: (json['status'] ?? 'applied').toString(),
      result: json['result'] as Map<String, dynamic>?,
      errorCode: json['errorCode']?.toString(),
      errorMessage: json['errorMessage']?.toString(),
    );
  }
}

class SyncBatchResponseDto {
  final int received;
  final int applied;
  final int replayed;
  final int failed;
  final List<SyncOperationResultDto> results;

  const SyncBatchResponseDto({
    this.received = 0,
    this.applied = 0,
    this.replayed = 0,
    this.failed = 0,
    this.results = const [],
  });

  factory SyncBatchResponseDto.fromJson(Map<String, dynamic> json) {
    final summary = json['summary'] as Map<String, dynamic>? ?? {};
    final list = (json['results'] as List<dynamic>?)
            ?.map((e) =>
                SyncOperationResultDto.fromJson(e as Map<String, dynamic>))
            .toList() ??
        const [];

    return SyncBatchResponseDto(
      received: (summary['received'] as num?)?.toInt() ?? 0,
      applied: (summary['applied'] as num?)?.toInt() ?? 0,
      replayed: (summary['replayed'] as num?)?.toInt() ?? 0,
      failed: (summary['failed'] as num?)?.toInt() ?? 0,
      results: list,
    );
  }
}
