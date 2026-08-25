class ExamModel {
  final String id;
  final String title;
  final String? description;
  final String subjectId;
  final String? subjectName;
  final int classLevel;
  final int durationMinutes;
  final int totalMarks;
  final int passingMarks;
  final int questionCount;
  final bool isPublished;

  const ExamModel({
    required this.id,
    required this.title,
    this.description,
    required this.subjectId,
    this.subjectName,
    required this.classLevel,
    this.durationMinutes = 30,
    this.totalMarks = 50,
    this.passingMarks = 20,
    this.questionCount = 25,
    this.isPublished = true,
  });
}
