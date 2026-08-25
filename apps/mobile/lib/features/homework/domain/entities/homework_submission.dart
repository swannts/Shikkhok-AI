class HomeworkSubmission {
  final String id;
  final String userId;
  final List<String> imageUrls;
  final String? prompt;
  final String? subjectId;
  final String status; // queued, processing, completed, failed
  final DateTime createdAt;

  const HomeworkSubmission({
    required this.id,
    required this.userId,
    required this.imageUrls,
    this.prompt,
    this.subjectId,
    this.status = 'queued',
    required this.createdAt,
  });

  bool get isCompleted => status == 'completed';
  bool get isProcessing => status == 'processing' || status == 'queued';
  bool get isFailed => status == 'failed';
}
