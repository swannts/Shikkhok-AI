import '../../domain/entities/chapter_progress.dart';

class ChapterProgressDto {
  final String chapterId;
  final String? title;
  final int totalLessons;
  final int completedLessons;
  final num completionRate;
  final num averageMastery;

  const ChapterProgressDto({
    required this.chapterId,
    this.title,
    this.totalLessons = 0,
    this.completedLessons = 0,
    this.completionRate = 0,
    this.averageMastery = 0,
  });

  factory ChapterProgressDto.fromJson(Map<String, dynamic> json) {
    return ChapterProgressDto(
      chapterId: (json['chapterId'] ?? json['_id'] ?? '').toString(),
      title: json['title'] as String?,
      totalLessons: (json['totalLessons'] as num?)?.toInt() ?? 0,
      completedLessons: (json['completedLessons'] as num?)?.toInt() ?? 0,
      completionRate: (json['completionRate'] as num?) ?? 0,
      averageMastery: (json['averageMastery'] as num?) ?? 0,
    );
  }

  ChapterProgress toDomain() {
    return ChapterProgress(
      chapterId: chapterId,
      title: title,
      totalLessons: totalLessons,
      completedLessons: completedLessons,
      completionRate: completionRate.toDouble(),
      averageMastery: averageMastery.toDouble(),
    );
  }
}
