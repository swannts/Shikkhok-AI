enum SyncOperationType {
  lessonProgressUpsert,
  practiceAttemptSubmit,
  flagQuestion;

  static SyncOperationType fromString(String? value) {
    switch (value?.toLowerCase()) {
      case 'practice_attempt_submit':
        return SyncOperationType.practiceAttemptSubmit;
      case 'flag_question':
        return SyncOperationType.flagQuestion;
      case 'lesson_progress_upsert':
      default:
        return SyncOperationType.lessonProgressUpsert;
    }
  }

  String toApiString() {
    switch (this) {
      case SyncOperationType.practiceAttemptSubmit:
        return 'practice_attempt_submit';
      case SyncOperationType.flagQuestion:
        return 'flag_question';
      case SyncOperationType.lessonProgressUpsert:
        return 'lesson_progress_upsert';
    }
  }
}

class SyncOperation {
  final String operationId;
  final SyncOperationType operationType;
  final String entityType;
  final String? entityId;
  final Map<String, dynamic> payload;

  const SyncOperation({
    required this.operationId,
    required this.operationType,
    required this.entityType,
    this.entityId,
    required this.payload,
  });
}
