class ChapterDto {
  final String id;
  final String subjectId;
  final String title;
  final String slug;
  final String? summary;
  final int order;
  final int? estimatedMinutes;
  final bool isPublished;

  const ChapterDto({
    required this.id,
    required this.subjectId,
    required this.title,
    required this.slug,
    this.summary,
    this.order = 0,
    this.estimatedMinutes,
    this.isPublished = true,
  });

  factory ChapterDto.fromJson(Map<String, dynamic> json) {
    return ChapterDto(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      subjectId: (json['subjectId'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      slug: (json['slug'] ?? '').toString(),
      summary: json['summary'] as String?,
      order: (json['order'] as num?)?.toInt() ?? 0,
      estimatedMinutes: (json['estimatedMinutes'] as num?)?.toInt(),
      isPublished: json['isPublished'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
        '_id': id,
        'subjectId': subjectId,
        'title': title,
        'slug': slug,
        'summary': summary,
        'order': order,
        'estimatedMinutes': estimatedMinutes,
        'isPublished': isPublished,
      };
}
