class Chapter {
  final String id;
  final String subjectId;
  final String title;
  final String slug;
  final String? summary;
  final int order;
  final int? estimatedMinutes;
  final bool isPublished;

  const Chapter({
    required this.id,
    required this.subjectId,
    required this.title,
    required this.slug,
    this.summary,
    this.order = 0,
    this.estimatedMinutes,
    this.isPublished = true,
  });
}
