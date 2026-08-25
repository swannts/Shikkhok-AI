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
    this.subjectId,
    this.chapterId,
    this.lessonId,
    this.classLevel = 8,
    this.medium = 'bangla',
    this.curriculumYear = '2026',
    this.messageCount = 0,
    this.lastMessageAt,
    this.createdAt,
    this.updatedAt,
  });
}
