class Subject {
  final String id;
  final String classId;
  final String bnName;
  final String enName;
  final String icon;
  final int chapterCount;
  final int lessonCount;
  final double progress;
  final String colorBg;

  Subject({
    required this.id,
    required this.classId,
    required this.bnName,
    required this.enName,
    required this.icon,
    required this.chapterCount,
    required this.lessonCount,
    required this.progress,
    required this.colorBg,
  });

  factory Subject.fromJson(Map<String, dynamic> json) {
    return Subject(
      id: json['id'] ?? '',
      classId: json['classId'] ?? 'class-8',
      bnName: json['bnName'] ?? '',
      enName: json['enName'] ?? '',
      icon: json['icon'] ?? '📖',
      chapterCount: json['chapterCount'] ?? 0,
      lessonCount: json['lessonCount'] ?? 0,
      progress: (json['progress'] ?? 0.0).toDouble(),
      colorBg: json['colorBg'] ?? '#EEF2FF',
    );
  }
}
