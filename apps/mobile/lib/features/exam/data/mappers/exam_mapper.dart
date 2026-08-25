import '../../domain/entities/exam_model.dart';
import '../../domain/entities/exam_session.dart';
import '../../domain/entities/exam_result.dart';
import '../dto/exam_dto.dart';

class ExamMapper {
  static ExamModel toDomainExam(ExamDto dto) {
    return ExamModel(
      id: dto.id,
      title: dto.title,
      description: dto.description,
      subjectId: dto.subjectId,
      subjectName: dto.subjectName,
      classLevel: dto.classLevel,
      durationMinutes: dto.durationMinutes,
      totalMarks: dto.totalMarks,
      passingMarks: dto.passingMarks,
      questionCount: dto.questionCount,
      isPublished: dto.isPublished,
    );
  }

  static ExamSessionQuestion toDomainSessionQuestion(
      ExamSessionQuestionDto dto) {
    return ExamSessionQuestion(
      id: dto.id,
      prompt: dto.prompt,
      options: dto.options,
      marks: dto.marks,
      selectedOptionId: dto.selectedOptionId,
      isFlagged: dto.isFlagged,
    );
  }

  static ExamSession toDomainSession(ExamSessionDto dto) {
    return ExamSession(
      id: dto.id,
      examId: dto.examId,
      title: dto.title,
      durationMinutes: dto.durationMinutes,
      startedAt: DateTime.tryParse(dto.startedAt) ?? DateTime.now(),
      expiresAt: DateTime.tryParse(dto.expiresAt) ??
          DateTime.now().add(const Duration(minutes: 30)),
      questions: dto.questions.map(toDomainSessionQuestion).toList(),
      status: dto.status,
    );
  }

  static ExamResult toDomainResult(ExamResultDto dto) {
    return ExamResult(
      sessionId: dto.sessionId,
      examId: dto.examId,
      title: dto.title,
      score: dto.score,
      totalMarks: dto.totalMarks,
      percentage: dto.percentage,
      isPassed: dto.isPassed,
      totalQuestions: dto.totalQuestions,
      correctAnswers: dto.correctAnswers,
      incorrectAnswers: dto.incorrectAnswers,
      unattempted: dto.unattempted,
      timeSpentSeconds: dto.timeSpentSeconds,
    );
  }
}
