class SyncOperationResult {
  final String operationId;
  final String status; // applied, replayed, processing, failed
  final Map<String, dynamic>? result;
  final String? errorCode;
  final String? errorMessage;

  const SyncOperationResult({
    required this.operationId,
    required this.status,
    this.result,
    this.errorCode,
    this.errorMessage,
  });

  bool get isSuccessful => status == 'applied' || status == 'replayed';
}

class SyncBatchResult {
  final int received;
  final int applied;
  final int replayed;
  final int failed;
  final List<SyncOperationResult> results;

  const SyncBatchResult({
    this.received = 0,
    this.applied = 0,
    this.replayed = 0,
    this.failed = 0,
    this.results = const [],
  });

  bool get isAllSuccessful => failed == 0;
}
