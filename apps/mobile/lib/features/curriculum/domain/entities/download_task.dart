enum DownloadStatus {
  idle,
  queued,
  downloading,
  verifying,
  completed,
  failed,
  paused,
}

class DownloadTask {
  final String textbookId;
  final String title;
  final String subjectId;
  final int classLevel;
  final String downloadUrl;
  final int totalBytes;
  final int bytesDownloaded;
  final DownloadStatus status;
  final String? localFilePath;
  final String expectedChecksumSha256;
  final String? actualChecksumSha256;
  final bool isChecksumVerified;
  final String? errorMessage;
  final DateTime? completedAt;

  const DownloadTask({
    required this.textbookId,
    required this.title,
    required this.subjectId,
    required this.classLevel,
    required this.downloadUrl,
    required this.totalBytes,
    this.bytesDownloaded = 0,
    this.status = DownloadStatus.idle,
    this.localFilePath,
    required this.expectedChecksumSha256,
    this.actualChecksumSha256,
    this.isChecksumVerified = false,
    this.errorMessage,
    this.completedAt,
  });

  double get progress {
    if (totalBytes <= 0) return 0.0;
    return (bytesDownloaded / totalBytes).clamp(0.0, 1.0);
  }

  bool get isCompleted => status == DownloadStatus.completed;

  DownloadTask copyWith({
    String? textbookId,
    String? title,
    String? subjectId,
    int? classLevel,
    String? downloadUrl,
    int? totalBytes,
    int? bytesDownloaded,
    DownloadStatus? status,
    String? localFilePath,
    String? expectedChecksumSha256,
    String? actualChecksumSha256,
    bool? isChecksumVerified,
    String? errorMessage,
    DateTime? completedAt,
  }) {
    return DownloadTask(
      textbookId: textbookId ?? this.textbookId,
      title: title ?? this.title,
      subjectId: subjectId ?? this.subjectId,
      classLevel: classLevel ?? this.classLevel,
      downloadUrl: downloadUrl ?? this.downloadUrl,
      totalBytes: totalBytes ?? this.totalBytes,
      bytesDownloaded: bytesDownloaded ?? this.bytesDownloaded,
      status: status ?? this.status,
      localFilePath: localFilePath ?? this.localFilePath,
      expectedChecksumSha256:
          expectedChecksumSha256 ?? this.expectedChecksumSha256,
      actualChecksumSha256:
          actualChecksumSha256 ?? this.actualChecksumSha256,
      isChecksumVerified: isChecksumVerified ?? this.isChecksumVerified,
      errorMessage: errorMessage ?? this.errorMessage,
      completedAt: completedAt ?? this.completedAt,
    );
  }
}
