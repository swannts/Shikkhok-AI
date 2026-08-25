class Lesson {
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

  const Lesson({
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
}
