class TextbookManifestDto {
  final String id;
  final String textbookId;
  final String version;
  final String packageUrl;
  final int downloadSizeBytes;
  final String checksumSha256;
  final String status;
  final String? releaseNotes;
  final DateTime? releasedAt;

  const TextbookManifestDto({
    required this.id,
    required this.textbookId,
    required this.version,
    required this.packageUrl,
    required this.downloadSizeBytes,
    required this.checksumSha256,
    required this.status,
    this.releaseNotes,
    this.releasedAt,
  });

  factory TextbookManifestDto.fromJson(Map<String, dynamic> json) {
    return TextbookManifestDto(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      textbookId: (json['textbookId'] ?? '').toString(),
      version: (json['version'] ?? '1.0.0').toString(),
      packageUrl: (json['packageUrl'] ?? '').toString(),
      downloadSizeBytes: (json['downloadSizeBytes'] as num?)?.toInt() ?? 0,
      checksumSha256: (json['checksumSha256'] ?? '').toString(),
      status: (json['status'] ?? 'ready').toString(),
      releaseNotes: json['releaseNotes']?.toString(),
      releasedAt: json['releasedAt'] != null
          ? DateTime.tryParse(json['releasedAt'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'textbookId': textbookId,
      'version': version,
      'packageUrl': packageUrl,
      'downloadSizeBytes': downloadSizeBytes,
      'checksumSha256': checksumSha256,
      'status': status,
      'releaseNotes': releaseNotes,
      'releasedAt': releasedAt?.toIso8601String(),
    };
  }
}

class TextbookItemDto {
  final String id;
  final String title;
  final String subjectId;
  final int classLevel;
  final String medium;
  final int curriculumYear;
  final String? coverImageUrl;
  final String? pdfUrl;
  final int? fileSizeBytes;
  final String? checksumSha256;
  final TextbookManifestDto? latestManifest;

  const TextbookItemDto({
    required this.id,
    required this.title,
    required this.subjectId,
    required this.classLevel,
    required this.medium,
    required this.curriculumYear,
    this.coverImageUrl,
    this.pdfUrl,
    this.fileSizeBytes,
    this.checksumSha256,
    this.latestManifest,
  });

  factory TextbookItemDto.fromJson(Map<String, dynamic> json) {
    return TextbookItemDto(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      subjectId: (json['subjectId'] ?? 'general').toString(),
      classLevel: (json['classLevel'] as num?)?.toInt() ?? 8,
      medium: (json['medium'] ?? 'bangla').toString(),
      curriculumYear: (json['curriculumYear'] as num?)?.toInt() ?? 2026,
      coverImageUrl: json['coverImageUrl']?.toString(),
      pdfUrl: json['pdfUrl']?.toString(),
      fileSizeBytes: (json['fileSizeBytes'] as num?)?.toInt(),
      checksumSha256: json['checksumSha256']?.toString(),
      latestManifest: json['manifest'] != null
          ? TextbookManifestDto.fromJson(json['manifest'] as Map<String, dynamic>)
          : (json['latestManifest'] != null
              ? TextbookManifestDto.fromJson(json['latestManifest'] as Map<String, dynamic>)
              : null),
    );
  }
}
