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
      id: _requiredString(json, ['_id', 'id'], 'manifest id'),
      textbookId: _requiredString(json, ['textbookId'], 'textbookId'),
      version: _requiredString(json, ['version'], 'version'),
      packageUrl: _requiredString(json, ['packageUrl'], 'packageUrl'),
      downloadSizeBytes:
          _requiredInt(json, ['downloadSizeBytes'], 'downloadSizeBytes'),
      checksumSha256:
          _requiredString(json, ['checksumSha256'], 'checksumSha256'),
      status: _requiredString(json, ['status'], 'status'),
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
      id: _requiredString(json, ['_id', 'id'], 'textbook id'),
      title: _requiredString(json, ['title'], 'title'),
      subjectId: _requiredString(json, ['subjectId'], 'subjectId'),
      classLevel: _requiredInt(json, ['classLevel'], 'classLevel'),
      medium: _requiredString(json, ['medium'], 'medium'),
      curriculumYear: _requiredInt(json, ['curriculumYear'], 'curriculumYear'),
      coverImageUrl: json['coverImageUrl']?.toString(),
      pdfUrl: json['pdfUrl']?.toString(),
      fileSizeBytes: (json['fileSizeBytes'] as num?)?.toInt(),
      checksumSha256: json['checksumSha256']?.toString(),
      latestManifest: json['manifest'] != null
          ? TextbookManifestDto.fromJson(
              json['manifest'] as Map<String, dynamic>)
          : (json['latestManifest'] != null
              ? TextbookManifestDto.fromJson(
                  json['latestManifest'] as Map<String, dynamic>)
              : null),
    );
  }
}

String _requiredString(
  Map<String, dynamic> json,
  List<String> keys,
  String fieldName,
) {
  for (final key in keys) {
    final value = json[key];
    if (value != null) {
      final text = value.toString().trim();
      if (text.isNotEmpty) {
        return text;
      }
    }
  }

  throw FormatException('Missing required textbook field: $fieldName');
}

int _requiredInt(
  Map<String, dynamic> json,
  List<String> keys,
  String fieldName,
) {
  for (final key in keys) {
    final value = json[key];
    if (value is num) {
      return value.toInt();
    }
    if (value is String) {
      final parsed = int.tryParse(value.trim());
      if (parsed != null) {
        return parsed;
      }
    }
  }

  throw FormatException('Missing required textbook field: $fieldName');
}
