class TutorConversation {
  final String id;
  final String title;
  final String? subjectId;
  final String? chapterId;
  final String? lessonId;
  final int classLevel;
  final String? medium;
  final String curriculumYear;
  final int messageCount;
  final DateTime? lastMessageAt;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const TutorConversation({
    required this.id,
    required this.title,
    required this.subjectId,
    required this.chapterId,
    required this.lessonId,
    required this.classLevel,
    required this.medium,
    required this.curriculumYear,
    required this.messageCount,
    required this.lastMessageAt,
    required this.createdAt,
    required this.updatedAt,
  });
}
