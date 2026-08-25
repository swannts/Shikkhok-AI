class LessonDto {
  final String id;
  final String chapterId;
  final String title;
  final String slug;
  final String? summary;
  final String? textbookReference;
  final int order;
  final int? pageStart;
  final int? pageEnd;
  final bool isPublished;

  const LessonDto({
    required this.id,
    required this.chapterId,
    required this.title,
    required this.slug,
    this.summary,
    this.textbookReference,
    this.order = 0,
    this.pageStart,
    this.pageEnd,
    this.isPublished = true,
  });

  factory LessonDto.fromJson(Map<String, dynamic> json) {
    return LessonDto(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      chapterId: (json['chapterId'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      slug: (json['slug'] ?? '').toString(),
      summary: json['summary'] as String?,
      textbookReference: json['textbookReference'] as String?,
      order: (json['order'] as num?)?.toInt() ?? 0,
      pageStart: (json['pageStart'] as num?)?.toInt(),
      pageEnd: (json['pageEnd'] as num?)?.toInt(),
      isPublished: json['isPublished'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
        '_id': id,
        'chapterId': chapterId,
        'title': title,
        'slug': slug,
        'summary': summary,
        'textbookReference': textbookReference,
        'order': order,
        'pageStart': pageStart,
        'pageEnd': pageEnd,
        'isPublished': isPublished,
      };
}
