class ChapterProgress {
  final String chapterId;
  final String? title;
  final int totalLessons;
  final int completedLessons;
  final double completionRate;
  final double averageMastery;

  const ChapterProgress({
    required this.chapterId,
    this.title,
    this.totalLessons = 0,
    this.completedLessons = 0,
    this.completionRate = 0.0,
    this.averageMastery = 0.0,
  });
}
